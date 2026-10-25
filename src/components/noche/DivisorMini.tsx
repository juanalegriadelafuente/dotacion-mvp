"use client";
// src/components/noche/DivisorMini.tsx
// El divisor de turnos en miniatura: 24 horas desde las 08:00, en 2 a 6 turnos.
// Usa la misma aritmética que la herramienta completa (`lib/divisor.ts`).
import { useState } from "react";
import { aHora, dividir, duracionTexto } from "@/lib/divisor";

export default function DivisorMini() {
  const [n, setN] = useState(3);
  const tramos = dividir(8 * 60, 8 * 60, n, 30);
  return (
    <div>
      <div className="barra">
        {tramos.map((t, i) => (
          <div key={t.inicio} className={`seg s${i}`}>
            {aHora(t.inicio)}
            <small>{duracionTexto(t.fin - t.inicio)}</small>
          </div>
        ))}
      </div>
      <div className="control">
        <label htmlFor="cuantos-turnos">Turnos</label>
        <input
          id="cuantos-turnos"
          type="range"
          min={2}
          max={6}
          step={1}
          value={n}
          onChange={(e) => setN(Number(e.target.value))}
        />
        <b aria-live="polite">{n}</b>
      </div>
    </div>
  );
}
