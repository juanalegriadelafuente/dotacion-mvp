"use client";
// src/app/dividir-turnos/Divisor.tsx
import { useMemo, useState } from "react";
import {
  aHora,
  aMinutos,
  aPlanilla,
  dividir,
  duracionTexto,
  largoDelHorario,
  minutosPorPersona,
  repartir,
} from "@/lib/divisor";
import { URL_REVISAR } from "@/lib/sitio";

const PASOS = [
  { valor: 1, texto: "al minuto" },
  { valor: 5, texto: "a 5 minutos" },
  { valor: 15, texto: "a 15 minutos" },
  { valor: 30, texto: "a 30 minutos" },
];

function hoyIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** `2026-11-03` → «mar 03-11». */
function fechaCorta(iso: string): string {
  const [a, m, d] = iso.split("-").map(Number);
  const dia = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"][
    new Date(Date.UTC(a, m - 1, d)).getUTCDay()
  ];
  return `${dia} ${String(d).padStart(2, "0")}-${String(m).padStart(2, "0")}`;
}

const campo =
  "w-full rounded-xl border border-white/20 bg-[#112538] px-3 py-2.5 text-[16px] text-[#EEF1F4] outline-none focus:border-[#2BB58D] focus:ring-2 focus:ring-[#2BB58D]/20";
const etiqueta = "mb-1.5 block text-[13px] font-semibold text-[#C9D2DB]";

export default function Divisor() {
  const [desde, setDesde] = useState("08:00");
  const [hasta, setHasta] = useState("08:00");
  const [n, setN] = useState(3);
  const [paso, setPaso] = useState(15);
  const [nombres, setNombres] = useState("");
  const [inicio, setInicio] = useState(hoyIso);
  const [dias, setDias] = useState(7);
  const [copiado, setCopiado] = useState<"" | "copiado" | "error">("");

  const d = aMinutos(desde);
  const h = aMinutos(hasta);
  const valido = d !== null && h !== null && n >= 2 && n <= 12;
  const tramos = useMemo(
    () => (valido ? dividir(d, h, n, paso) : []),
    [valido, d, h, n, paso],
  );
  const total = valido ? largoDelHorario(d, h) : 0;

  const personas = useMemo(
    () =>
      [
        ...new Set(
          nombres
            .split("\n")
            .map((x) => x.trim())
            .filter(Boolean),
        ),
      ].slice(0, 40),
    [nombres],
  );
  const diasOk = Math.min(Math.max(dias || 1, 1), 31);
  const asignaciones = useMemo(
    () =>
      valido && personas.length > 0
        ? repartir(personas, n, inicio, diasOk)
        : [],
    [valido, personas, n, inicio, diasOk],
  );
  const planilla = useMemo(
    () => (asignaciones.length ? aPlanilla(asignaciones, tramos) : null),
    [asignaciones, tramos],
  );
  const horas = useMemo(
    () => minutosPorPersona(asignaciones, tramos),
    [asignaciones, tramos],
  );
  const fechas = [...new Set(asignaciones.map((a) => a.fecha))];

  async function copiar(abrir: boolean) {
    if (!planilla) return;
    // La pestaña se abre ANTES del await: si no, el navegador la bloquea por no
    // venir directo de un clic.
    const ventana = abrir
      ? window.open(URL_REVISAR, "_blank", "noopener")
      : null;
    try {
      await navigator.clipboard.writeText(planilla.texto);
      setCopiado("copiado");
    } catch {
      setCopiado("error");
      ventana?.close();
    }
  }

  return (
    <div className="rounded-3xl bg-[#112538] p-5 ring-1 ring-white/10 shadow-[0_40px_80px_-40px_rgba(0,0,0,.8)] sm:p-8">
      {/* ── 1 · El horario ── */}
      <h2 className="text-[18px] font-semibold">
        1. ¿Qué horario hay que cubrir?
      </h2>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <label>
          <span className={etiqueta}>Desde</span>
          <input
            type="time"
            className={campo}
            value={desde}
            onChange={(e) => setDesde(e.target.value)}
          />
        </label>
        <label>
          <span className={etiqueta}>Hasta</span>
          <input
            type="time"
            className={campo}
            value={hasta}
            onChange={(e) => setHasta(e.target.value)}
          />
        </label>
        <label>
          <span className={etiqueta}>Número de turnos</span>
          <input
            type="number"
            min={2}
            max={12}
            className={campo}
            value={n}
            onChange={(e) =>
              setN(Math.min(Math.max(Number(e.target.value) || 2, 2), 12))
            }
          />
        </label>
        <label>
          <span className={etiqueta}>Redondear</span>
          <select
            className={campo}
            value={paso}
            onChange={(e) => setPaso(Number(e.target.value))}
          >
            {PASOS.map((p) => (
              <option key={p.valor} value={p.valor}>
                {p.texto}
              </option>
            ))}
          </select>
        </label>
      </div>
      <p className="mt-2 text-[13px] text-[#9AA8B6]">
        Si «hasta» es antes que «desde», el horario cruza la medianoche. Si son
        iguales, son 24 horas.
      </p>

      {valido && (
        <div className="mt-6">
          <p className="text-[15px] text-[#C9D2DB]">
            {duracionTexto(total)} en {n} turnos de unas{" "}
            <strong className="text-[#EEF1F4]">
              {duracionTexto(Math.round(total / n))}
            </strong>
            :
          </p>
          <ol className="mt-3 grid gap-2 sm:grid-cols-2">
            {tramos.map((t, i) => (
              <li
                key={`${t.inicio}-${t.fin}`}
                className="flex items-baseline justify-between rounded-md border border-white/10 bg-[#0F2133] px-4 py-3"
              >
                <span className="text-[14px] text-[#9AA8B6]">
                  Turno {i + 1}
                </span>
                <span className="font-mono text-[17px] font-semibold">
                  {aHora(t.inicio)} a {aHora(t.fin)}
                </span>
                <span className="text-[13px] text-[#9AA8B6]">
                  {duracionTexto(t.fin - t.inicio)}
                </span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* ── 2 · Repartir ── */}
      <h2 className="mt-10 text-[18px] font-semibold">
        2. Repartir entre personas{" "}
        <span className="font-normal text-[#9AA8B6]">(opcional)</span>
      </h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-[2fr_1fr_1fr]">
        <label>
          <span className={etiqueta}>Nombres, uno por línea</span>
          <textarea
            className={`${campo} h-[118px] resize-y`}
            placeholder={"Ana\nBeto\nCarla\nDaniel"}
            value={nombres}
            onChange={(e) => setNombres(e.target.value)}
          />
        </label>
        <label>
          <span className={etiqueta}>Desde el día</span>
          <input
            type="date"
            className={campo}
            value={inicio}
            onChange={(e) => e.target.value && setInicio(e.target.value)}
          />
        </label>
        <label>
          <span className={etiqueta}>Cuántos días</span>
          <input
            type="number"
            min={1}
            max={31}
            className={campo}
            value={dias}
            onChange={(e) => setDias(Number(e.target.value))}
          />
        </label>
      </div>
      <p className="mt-2 text-[13px] text-[#9AA8B6]">
        Los turnos se reparten en rueda: cada día la rotación sigue donde quedó
        el anterior. Los nombres no se envían a ningún lado: todo se calcula en
        tu navegador.
      </p>

      {planilla && (
        <div className="mt-6">
          {planilla.dobles > 0 && (
            <p className="mb-4 rounded-md border border-[#f59e0b]/40 bg-[#f59e0b]/10 px-4 py-3 text-[14px]">
              Hay menos personas que turnos: alguien quedaría con dos turnos el
              mismo día. Agrega personas o reduce los turnos.
            </p>
          )}
          <div className="overflow-x-auto rounded-md border border-white/10">
            <table className="w-full min-w-[420px] text-left text-[14px]">
              <thead className="bg-[#0F2133] text-[12px] uppercase tracking-[0.08em] text-[#9AA8B6]">
                <tr>
                  <th className="px-3 py-2.5 font-semibold">Día</th>
                  {tramos.map((t) => (
                    <th
                      key={t.inicio}
                      className="px-3 py-2.5 font-mono font-semibold normal-case tracking-normal"
                    >
                      {aHora(t.inicio)}–{aHora(t.fin)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {fechas.map((f) => (
                  <tr key={f} className="border-t border-white/5">
                    <td className="whitespace-nowrap px-3 py-2 text-[#9AA8B6]">
                      {fechaCorta(f)}
                    </td>
                    {tramos.map((t, i) => (
                      <td key={t.inicio} className="px-3 py-2">
                        {
                          asignaciones.find(
                            (a) => a.fecha === f && a.turno === i,
                          )?.persona
                        }
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className="mt-4 flex flex-wrap gap-2 text-[13px]">
            {Object.entries(horas).map(([p, m]) => (
              <li
                key={p}
                className="rounded-full border border-white/10 px-3 py-1"
              >
                {p}: <strong>{duracionTexto(m)}</strong> en {diasOk}{" "}
                {diasOk === 1 ? "día" : "días"}
              </li>
            ))}
          </ul>

          {/* ── 3 · Revisar ── */}
          <div className="mt-8 rounded-2xl border border-[#2BB58D]/40 bg-[#2BB58D]/10 p-5">
            <h2 className="text-[18px] font-semibold">
              3. ¿Este reparto cumple la ley?
            </h2>
            <p className="mt-2 text-[14.5px] leading-relaxed text-[#9AA8B6]">
              Dividir parejo no asegura que sea legal: los días seguidos, el
              descanso entre jornadas, los domingos libres y las horas semanales
              se revisan aparte. Copia la planilla y pégala en la revisión
              gratuita: te marca persona por persona lo que no cumple.
            </p>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => copiar(true)}
                className="bg-[#117A5E] rounded-full px-6 py-3 text-[15px] font-bold text-white shadow-lg shadow-black/40"
              >
                Copiar y revisar si es legal
              </button>
              <button
                type="button"
                onClick={() => copiar(false)}
                className="rounded-md border border-white/20 px-5 py-3 text-[15px] font-semibold hover:bg-[#112538]/5"
              >
                Solo copiar la planilla
              </button>
            </div>
            {copiado === "copiado" && (
              <output className="mt-3 block text-[14px] text-[#2BB58D]">
                Copiada. En la página de revisión, pégala con Ctrl+V (en el
                celular, mantén presionado y elige «Pegar»).
              </output>
            )}
            {copiado === "error" && (
              <output className="mt-3 block text-[14px] text-[#F5D547]">
                Tu navegador no dejó copiar. Selecciona la tabla, cópiala y
                pégala en la revisión.
              </output>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
