"use client";
// src/app/kit-turnos/gracias/Estado.tsx
//
// Kaden devuelve al comprador con el enlace en el fragmento (`#token`): el
// navegador no lo manda a ningún servidor, así que no queda en ningún registro.
// Mientras Flow no confirma, se vuelve a preguntar unas cuantas veces.

import { useEffect, useState } from "react";
import { medir } from "@/lib/medir";
import { type Compra, ErrorTienda, urlDescarga, verCompra } from "@/lib/tienda";

const ESPERA_MS = 2500;
const INTENTOS = 12;

type Vista =
  | { tipo: "cargando" }
  | { tipo: "compra"; token: string; compra: Compra }
  | { tipo: "error"; mensaje: string };

function fecha(aaaammdd: string): string {
  const [a, m, d] = aaaammdd.split("-");
  return `${d}-${m}-${a}`;
}

export default function Estado() {
  const [vista, setVista] = useState<Vista>({ tipo: "cargando" });

  useEffect(() => {
    const token = location.hash.slice(1);
    if (!token || token === "no-encontrado") {
      setVista({
        tipo: "error",
        mensaje:
          "No encontramos tu compra. Si pagaste, revisa tu correo: ahí te llega el enlace. Si no está, escríbenos a hola@kaden.cl.",
      });
      return;
    }
    let vivo = true;
    let intentos = 0;
    let reloj: ReturnType<typeof setTimeout>;

    async function consultar() {
      try {
        const compra = await verCompra(token);
        if (!vivo) return;
        setVista({ tipo: "compra", token, compra });
        if (compra.estado === "pagado") medir("kit_pagado", undefined, true);
        if (compra.estado === "pendiente" && ++intentos < INTENTOS)
          reloj = setTimeout(consultar, ESPERA_MS);
      } catch (err) {
        if (!vivo) return;
        setVista({
          tipo: "error",
          mensaje:
            err instanceof ErrorTienda
              ? err.message
              : "No pudimos conectarnos. Recarga la página en un momento.",
        });
      }
    }
    consultar();
    return () => {
      vivo = false;
      clearTimeout(reloj);
    };
  }, []);

  if (vista.tipo === "cargando")
    return <p className="text-[#C3CCD5]">Buscando tu compra…</p>;

  if (vista.tipo === "error")
    return (
      <p className="text-[17px] leading-relaxed text-[#C3CCD5]" role="alert">
        {vista.mensaje}
      </p>
    );

  const { compra, token } = vista;

  if (compra.estado === "rechazado")
    return (
      <div className="flex flex-col gap-4">
        <h1 className="titular text-[clamp(34px,5vw,48px)] leading-tight">
          El pago no se completó
        </h1>
        <p className="text-[17px] leading-relaxed text-[#C3CCD5]">
          Flow no aprobó el pago y no se hizo ningún cobro.
        </p>
        <a
          href="/kit-turnos#comprar"
          className="inline-flex min-h-[48px] w-fit items-center rounded bg-[#2BB58D] px-6 font-semibold !text-[#06231A]"
        >
          Intentar de nuevo
        </a>
      </div>
    );

  if (compra.estado === "pendiente")
    return (
      <div className="flex flex-col gap-4" aria-live="polite">
        <h1 className="titular text-[clamp(34px,5vw,48px)] leading-tight">
          Esperando la confirmación de Flow
        </h1>
        <p className="text-[17px] leading-relaxed text-[#C3CCD5]">
          Suele tardar unos segundos. Si en un rato no aparece la descarga, el
          enlace igual te llega al correo apenas Flow confirme.
        </p>
      </div>
    );

  return (
    <div className="flex flex-col gap-5" aria-live="polite">
      <p className="text-[15px] font-medium text-[#2BB58D]">
        Compra N.º {compra.numero}
      </p>
      <h1 className="titular text-[clamp(34px,5vw,48px)] leading-tight">
        Listo: tu {compra.producto}
      </h1>
      <a
        href={urlDescarga(token)}
        className="inline-flex min-h-[52px] w-fit items-center rounded bg-[#2BB58D] px-7 text-[17px] font-semibold !text-[#06231A] hover:bg-[#3FCFA4]"
      >
        Descargar el kit (.zip)
      </a>
      <p className="leading-relaxed text-[#C3CCD5]">
        Te mandamos el mismo enlace al correo. Funciona hasta el{" "}
        {fecha(compra.vence)} y te quedan {compra.descargas_restantes}{" "}
        {compra.descargas_restantes === 1 ? "descarga" : "descargas"}. Guarda
        los archivos en tu computador.
      </p>
      <p className="leading-relaxed text-[#9AA8B6]">
        Parte por el capítulo 10 de la guía: explica cómo llenar la planilla.
      </p>
    </div>
  );
}
