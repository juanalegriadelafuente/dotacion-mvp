"use client";

import { useState } from "react";
import { medir } from "@/lib/medir";

type Estado = "listo" | "enviando" | "enviado" | "error";

export default function Formulario() {
  const [correo, setCorreo] = useState("");
  const [acepta, setAcepta] = useState(false);
  const [sitio, setSitio] = useState("");
  const [estado, setEstado] = useState<Estado>("listo");

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setEstado("enviando");
    try {
      const res = await fetch("/api/lista-revision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ correo, acepta, sitio }),
      });
      if (!res.ok) throw new Error(String(res.status));
      medir("suscripcion", "/lista-revision");
      setEstado("enviado");
    } catch {
      setEstado("error");
    }
  }

  if (estado === "enviado") {
    return (
      <output className="mt-8 block max-w-[520px]">
        <p className="text-[19px] font-semibold text-[#2BB58D]">
          Listo, revisa tu correo.
        </p>
        <p className="mt-2 text-[15px] leading-relaxed text-[#9AA8B6]">
          La lista debería llegar en unos minutos. Si no aparece, mira en spam.
        </p>
      </output>
    );
  }

  return (
    <form
      onSubmit={enviar}
      className="mt-8 flex max-w-[520px] flex-col gap-3.5"
    >
      <label htmlFor="correo-lista" className="text-[15px] font-medium">
        Tu correo
      </label>
      <div className="flex flex-wrap gap-2.5">
        <input
          id="correo-lista"
          type="email"
          required
          maxLength={180}
          autoComplete="email"
          placeholder="nombre@tuempresa.cl"
          value={correo}
          onChange={(e) => setCorreo(e.target.value)}
          className="h-[50px] min-w-0 flex-[1_1_240px] rounded-lg border border-[#5D6D7D] bg-[#12222F] px-3.5 text-[16px] text-[#EEF1F4] placeholder:text-[#9AA8B6]"
        />
        <button
          type="submit"
          disabled={estado === "enviando"}
          className="h-[50px] flex-none rounded-lg bg-[#2BB58D] px-5 text-[16px] font-semibold text-[#06140F] disabled:opacity-60"
        >
          {estado === "enviando" ? "Enviando…" : "Enviármela"}
        </button>
      </div>
      {/* Una persona no ve este campo; un bot lo llena. */}
      <input
        type="text"
        name="sitio"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        value={sitio}
        onChange={(e) => setSitio(e.target.value)}
        className="absolute left-[-9999px] h-0 w-0 opacity-0"
      />
      <label className="flex items-start gap-2.5 text-[14px] leading-snug text-[#C3CCD5]">
        <input
          type="checkbox"
          required
          checked={acepta}
          onChange={(e) => setAcepta(e.target.checked)}
          className="mt-0.5 h-5 w-5 flex-none"
        />
        <span>
          Acepto que me envíen la lista y dos correos más con consejos y una
          oferta. Puedo darme de baja con un clic.
        </span>
      </label>
      {estado === "error" && (
        <p role="alert" className="text-[14px] text-[#FF8A8A]">
          No pudimos enviarla. Espera un momento y vuelve a intentarlo.
        </p>
      )}
    </form>
  );
}
