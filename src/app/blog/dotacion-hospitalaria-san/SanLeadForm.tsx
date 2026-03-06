"use client";

import { useState } from "react";

export function SanLeadForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setStatus("loading");
    try {
      const r = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source: "blog-san", role: null }),
      });
      const data = await r.json();
      setStatus(data.ok ? "ok" : "error");
    } catch {
      setStatus("error");
    }
  }

  if (status === "ok") {
    return (
      <p className="text-white font-semibold text-sm bg-blue-500 rounded-lg px-6 py-3 inline-block">
        ✅ ¡Listo! Te avisamos cuando esté disponible.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-sm">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="tu@correo.cl"
        className="flex-1 px-4 py-2.5 rounded-lg text-slate-900 text-sm focus:outline-none"
      />
      <button
        type="submit"
        disabled={status === "loading"}
        className="bg-blue-500 hover:bg-blue-400 text-white font-bold px-5 py-2.5 rounded-lg text-sm transition-colors disabled:opacity-60"
      >
        {status === "loading" ? "Enviando…" : "Avisarme"}
      </button>
      {status === "error" && (
        <p className="text-red-300 text-xs mt-1">Error al enviar. Intenta de nuevo.</p>
      )}
    </form>
  );
}
