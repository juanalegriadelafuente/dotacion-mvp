"use client";
// src/app/kit-turnos/Compra.tsx
//
// La caja de compra del Kit (D-PAG-3). Pide lo mínimo para entregar: un correo.
// El aviso de retracto se muestra destacado y se acepta aparte (D-PAG-4): sin
// las dos casillas, Kaden no crea el pago. Pagar es en Flow: esta página no ve
// ninguna tarjeta.

import Link from "next/link";
import { useState } from "react";
import { medir } from "@/lib/medir";
import { comprar, ErrorTienda, enPesos, type Producto } from "@/lib/tienda";

function utm(): string | undefined {
  try {
    const u = new URLSearchParams(location.search).get("utm_source");
    return u ? u.toLowerCase().slice(0, 40) : undefined;
  } catch {
    return undefined;
  }
}

export default function Compra({ producto }: { producto: Producto | null }) {
  const [email, setEmail] = useState("");
  const [terminos, setTerminos] = useState(false);
  const [retracto, setRetracto] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!producto?.disponible) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-[17px] font-semibold">Disponible muy pronto</p>
        <p className="text-[15px] leading-relaxed text-[#9AA8B6]">
          Estamos terminando la entrega. Mientras tanto, revisa gratis tu turno
          en el verificador.
        </p>
      </div>
    );
  }

  const codigo = producto.codigo;

  async function pagar(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setError(null);
    medir("kit_comprar");
    try {
      const url = await comprar(codigo, {
        email,
        acepta_terminos: terminos,
        acepta_sin_retracto: retracto,
        origen: utm(),
      });
      window.location.assign(url);
    } catch (err) {
      setError(
        err instanceof ErrorTienda
          ? err.message
          : "No pudimos conectarnos. Intenta de nuevo en un momento.",
      );
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={pagar} className="flex flex-col gap-3">
      <p className="titular text-[52px] leading-none">
        {enPesos(producto.precio)}{" "}
        <span className="font-sans text-[14px] tracking-normal text-[#9AA8B6]">
          IVA incluido · pago único
        </span>
      </p>
      <label className="flex flex-col gap-1.5 text-[14px] text-[#C3CCD5]">
        Correo para enviarte el enlace
        <input
          type="email"
          required
          maxLength={180}
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="nombre@empresa.cl"
          className="min-h-[46px] rounded border border-white/25 bg-[#0B1724] px-3.5 text-[16px] text-[#EEF1F4] outline-none focus:border-[#2BB58D]"
        />
      </label>
      <label className="flex items-start gap-2.5 text-[13px] leading-snug text-[#C3CCD5]">
        <input
          type="checkbox"
          checked={retracto}
          onChange={(e) => setRetracto(e.target.checked)}
          className="mt-0.5 h-[18px] w-[18px] shrink-0 accent-[#2BB58D]"
        />
        <span>
          Leí el aviso: esta compra no tiene derecho a retracto, porque la
          descarga es inmediata.
        </span>
      </label>
      <label className="flex items-start gap-2.5 text-[13px] leading-snug text-[#C3CCD5]">
        <input
          type="checkbox"
          checked={terminos}
          onChange={(e) => setTerminos(e.target.checked)}
          className="mt-0.5 h-[18px] w-[18px] shrink-0 accent-[#2BB58D]"
        />
        <span>
          Acepto los{" "}
          <Link href="/kit-turnos/terminos" className="underline">
            términos de compra
          </Link>{" "}
          y la{" "}
          <Link href="/privacidad" className="underline">
            política de privacidad
          </Link>
          .
        </span>
      </label>
      {error && (
        <p className="text-[14px] text-[#FF6B6B]" role="alert">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={enviando || !terminos || !retracto}
        className="min-h-[48px] rounded bg-[#2BB58D] px-6 text-[16px] font-semibold text-[#06231A] transition hover:bg-[#3FCFA4] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {enviando ? "Abriendo el pago…" : "Pagar con Flow"}
      </button>
      <p className="text-[12px] text-[#9AA8B6]">
        Pagas con tarjeta en Flow. Vende Nexwork SpA.
      </p>
    </form>
  );
}
