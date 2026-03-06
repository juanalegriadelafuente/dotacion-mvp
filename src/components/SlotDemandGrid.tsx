"use client";

import { useState, useRef, useCallback, useEffect } from "react";

// ─── Tipos ──────────────────────────────────────────────────────────────────

type SlotDemandGridProps = {
  /** 48 valores (tramos de 30 min), cada uno = personas requeridas en ese tramo */
  values: number[];
  onChange: (values: number[]) => void;
  /** Máximo de personas configurable (default 10) */
  maxPeople?: number;
  /** Hora de inicio para mostrar en eje X (default 0) */
  startHour?: number;
};

// ─── Helpers ────────────────────────────────────────────────────────────────

const SLOT_COUNT = 48;

function slotLabel(slot: number, startHour = 0) {
  const totalMinutes = (startHour * 60 + slot * 30) % (24 * 60);
  const h = Math.floor(totalMinutes / 60).toString().padStart(2, "0");
  const m = totalMinutes % 60 === 0 ? "00" : "30";
  return `${h}:${m}`;
}

function computeStats(values: number[]) {
  const peak = Math.max(...values, 0);
  const openSlots = values.filter((v) => v > 0).length;
  const hoursOpen = openSlots * 0.5;
  const personHours = values.reduce((s, v) => s + v * 0.5, 0);
  return { peak, hoursOpen, personHours };
}

// ─── Componente ─────────────────────────────────────────────────────────────

export function SlotDemandGrid({
  values,
  onChange,
  maxPeople = 10,
  startHour = 0,
}: SlotDemandGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const dragValue = useRef<number>(0); // valor que estamos "pintando"

  // ── Calcular el valor deseado a partir de la posición Y dentro de una celda ──
  const valueFromY = useCallback(
    (cellEl: Element, clientY: number): number => {
      const rect = cellEl.getBoundingClientRect();
      const ratio = 1 - (clientY - rect.top) / rect.height;
      return Math.round(Math.max(0, Math.min(maxPeople, ratio * maxPeople)));
    },
    [maxPeople]
  );

  // ── Pintar un slot ──
  const paintSlot = useCallback(
    (index: number, newValue: number) => {
      if (values[index] === newValue) return;
      const next = [...values];
      next[index] = newValue;
      onChange(next);
    },
    [values, onChange]
  );

  // ── Handlers de mouse ──
  const handleMouseDown = useCallback(
    (e: React.MouseEvent, index: number) => {
      e.preventDefault();
      isDragging.current = true;
      const newVal = valueFromY(e.currentTarget, e.clientY);
      dragValue.current = newVal;
      paintSlot(index, newVal);
    },
    [valueFromY, paintSlot]
  );

  const handleMouseEnter = useCallback(
    (e: React.MouseEvent, index: number) => {
      if (!isDragging.current) return;
      const newVal = valueFromY(e.currentTarget, e.clientY);
      paintSlot(index, dragValue.current); // mantiene valor del inicio del drag
    },
    [valueFromY, paintSlot]
  );

  // ── Touch support ──
  const handleTouchStart = useCallback(
    (e: React.TouchEvent, index: number) => {
      isDragging.current = true;
      const touch = e.touches[0];
      const newVal = valueFromY(e.currentTarget, touch.clientY);
      dragValue.current = newVal;
      paintSlot(index, newVal);
    },
    [valueFromY, paintSlot]
  );

  useEffect(() => {
    const stop = () => { isDragging.current = false; };
    window.addEventListener("mouseup", stop);
    window.addEventListener("touchend", stop);
    return () => {
      window.removeEventListener("mouseup", stop);
      window.removeEventListener("touchend", stop);
    };
  }, []);

  // ── Atajos ──
  const fillAll = (v: number) => onChange(Array(SLOT_COUNT).fill(v));
  const clearAll = () => onChange(Array(SLOT_COUNT).fill(0));
  const fillRange = (fromSlot: number, toSlot: number, v: number) => {
    const next = [...values];
    for (let i = fromSlot; i <= toSlot; i++) next[i] = v;
    onChange(next);
  };

  const stats = computeStats(values);

  // ── Etiquetas del eje X (cada 2 horas = cada 4 slots) ──
  const xLabels: { slot: number; label: string }[] = [];
  for (let s = 0; s < SLOT_COUNT; s += 4) {
    xLabels.push({ slot: s, label: slotLabel(s, startHour) });
  }

  // Altura de la barra para cada slot
  const barHeightPct = (v: number) => (maxPeople > 0 ? (v / maxPeople) * 100 : 0);

  // Color según nivel de ocupación
  const barColor = (v: number) => {
    if (v === 0) return "bg-slate-100";
    const ratio = v / maxPeople;
    if (ratio <= 0.4) return "bg-blue-200";
    if (ratio <= 0.7) return "bg-blue-400";
    if (ratio <= 0.9) return "bg-blue-600";
    return "bg-blue-700";
  };

  return (
    <div className="select-none">
      {/* ── Atajos rápidos ── */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <span className="text-xs text-slate-400 shrink-0">Relleno rápido:</span>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            onClick={() => fillAll(n)}
            className="text-xs px-2 py-1 rounded border border-slate-200 text-slate-600 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 transition-colors font-medium"
          >
            {n} pers.
          </button>
        ))}
        <button
          onClick={clearAll}
          className="text-xs px-2 py-1 rounded border border-slate-200 text-slate-400 hover:border-red-200 hover:text-red-500 hover:bg-red-50 transition-colors"
        >
          Limpiar
        </button>
      </div>

      {/* ── Eje Y + Grilla ── */}
      <div className="flex gap-2">
        {/* Eje Y */}
        <div className="flex flex-col justify-between text-right pr-1" style={{ width: 20, height: 80 }}>
          {Array.from({ length: 4 }, (_, i) => {
            const v = Math.round(maxPeople * (1 - i / 3));
            return (
              <span key={i} className="text-[10px] text-slate-400 font-mono leading-none">
                {v}
              </span>
            );
          })}
        </div>

        {/* Barras */}
        <div
          ref={containerRef}
          className="flex-1 relative"
          style={{ height: 80 }}
        >
          {/* Líneas guía horizontales */}
          <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="border-t border-slate-100 w-full" />
            ))}
          </div>

          {/* Columnas de slots */}
          <div className="absolute inset-0 flex gap-px">
            {values.map((v, i) => (
              <div
                key={i}
                className="flex-1 flex flex-col justify-end cursor-crosshair relative group"
                onMouseDown={(e) => handleMouseDown(e, i)}
                onMouseEnter={(e) => handleMouseEnter(e, i)}
                onTouchStart={(e) => handleTouchStart(e, i)}
              >
                {/* Barra */}
                <div
                  className={`w-full rounded-t-sm transition-all duration-75 ${barColor(v)}`}
                  style={{ height: `${barHeightPct(v)}%`, minHeight: v > 0 ? 3 : 0 }}
                />
                {/* Tooltip */}
                {v > 0 && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 bg-slate-900 text-white text-[10px] px-1.5 py-0.5 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 font-mono">
                    {slotLabel(i, startHour)}: {v}p
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Eje X ── */}
      <div className="flex ml-[24px] mt-1">
        <div className="flex-1 relative" style={{ height: 14 }}>
          {xLabels.map(({ slot, label }) => (
            <span
              key={slot}
              className="absolute text-[10px] text-slate-400 font-mono -translate-x-1/2"
              style={{ left: `${(slot / (SLOT_COUNT - 1)) * 100}%` }}
            >
              {label}
            </span>
          ))}
        </div>
      </div>

      {/* ── Stats derivados ── */}
      <div className="flex gap-4 mt-3 pt-3 border-t border-slate-100">
        <div>
          <p className="text-[10px] text-slate-400 uppercase tracking-wide">Peak</p>
          <p className="text-sm font-bold text-slate-800 font-mono">{stats.peak} pers.</p>
        </div>
        <div>
          <p className="text-[10px] text-slate-400 uppercase tracking-wide">Horas abiertas</p>
          <p className="text-sm font-bold text-slate-800 font-mono">{stats.hoursOpen}h</p>
        </div>
        <div>
          <p className="text-[10px] text-slate-400 uppercase tracking-wide">Horas‑persona</p>
          <p className="text-sm font-bold text-blue-700 font-mono">{stats.personHours}h</p>
        </div>
        <div className="ml-auto self-end">
          <p className="text-[10px] text-slate-400">
            {values.filter((v) => v > 0).length} tramos activos
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Exportar también computeStats para usar en el motor ────────────────────
export { computeStats };
