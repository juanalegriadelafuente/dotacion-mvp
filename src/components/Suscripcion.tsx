"use client";
// src/components/Suscripcion.tsx
// Suscripción al blog. Va a /api/leads (Notion + aviso interno); no le manda
// correo al suscriptor, así que no puede usarse para llenar la casilla de otro.
import { useState } from "react";
import { medir } from "@/lib/medir";

export default function Suscripcion({ oscuro = false }: { oscuro?: boolean }) {
  const [email, setEmail] = useState("");
  const [estado, setEstado] = useState<"" | "enviando" | "ok" | "error">("");

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setEstado("enviando");
    try {
      const r = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source: "blog" }),
      });
      const data = await r.json();
      setEstado(data.ok ? "ok" : "error");
      if (data.ok) medir("suscripcion");
    } catch {
      setEstado("error");
    }
  }

  if (estado === "ok") {
    return (
      <p
        className={`text-[15px] font-semibold ${oscuro ? "text-white" : "text-[#2BB58D]"}`}
      >
        Listo. Te escribiremos cuando publiquemos algo nuevo.
      </p>
    );
  }

  return (
    <form
      onSubmit={enviar}
      className="flex w-full max-w-md flex-col gap-2 sm:flex-row"
    >
      <label className="sr-only" htmlFor="correo-suscripcion">
        Tu correo
      </label>
      <input
        id="correo-suscripcion"
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="tu@correo.cl"
        className={`flex-1 rounded-full px-5 py-3 text-[15px] outline-none ${
          oscuro
            ? "bg-[#112538]/15 text-white placeholder:text-white/60 focus:bg-[#112538]/25"
            : "bg-[#112538] text-[#EEF1F4] ring-1 ring-white/20 focus:ring-2 focus:ring-[#2BB58D]"
        }`}
      />
      <button
        type="submit"
        disabled={estado === "enviando"}
        className={`rounded-full px-6 py-3 text-[15px] font-bold disabled:opacity-60 ${
          oscuro ? "bg-[#EEF1F4] text-[#0B1724]" : "bg-[#0B1724] text-white"
        }`}
      >
        {estado === "enviando" ? "Enviando…" : "Suscribirme"}
      </button>
      {estado === "error" && (
        <p className={`text-[13px] ${oscuro ? "text-white" : "text-rose-600"}`}>
          No se pudo enviar. Intenta de nuevo.
        </p>
      )}
    </form>
  );
}
