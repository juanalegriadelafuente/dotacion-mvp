// src/app/api/calculate/route.ts
import { NextResponse } from "next/server";
import { calculate } from "@/lib/engine";

// ====== Rate limit simple en memoria (MVP) ======
type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

function getClientIp(req: Request) {
  // Vercel/Proxies suelen mandar x-forwarded-for
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  const xrip = req.headers.get("x-real-ip");
  if (xrip) return xrip.trim();
  return "unknown";
}

function rateLimit(ip: string, limit = 60, windowMs = 60_000) {
  const now = Date.now();
  const b = buckets.get(ip);
  if (!b || now > b.resetAt) {
    buckets.set(ip, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1, resetAt: now + windowMs };
  }
  if (b.count >= limit) return { ok: false, remaining: 0, resetAt: b.resetAt };
  b.count += 1;
  buckets.set(ip, b);
  return { ok: true, remaining: limit - b.count, resetAt: b.resetAt };
}

// ====== Validación básica de payload (MVP) ======
function isFiniteNumber(x: any) {
  return typeof x === "number" && Number.isFinite(x);
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function badRequest(message: string) {
  return NextResponse.json({ ok: false, error: message }, { status: 400 });
}

export async function POST(req: Request) {
  // 1) Rate limit
  const ip = getClientIp(req);
  const rl = rateLimit(ip, 80, 60_000); // 80 req/min (ajustable)
  if (!rl.ok) {
    return NextResponse.json(
      { ok: false, error: "Demasiadas solicitudes. Intenta nuevamente en 1 minuto." },
      { status: 429, headers: { "Retry-After": "60" } }
    );
  }

  // 2) Parse seguro + límite de tamaño
  let body: any;
  try {
    // Si alguien manda algo gigante, esto igual puede explotar antes.
    // MVP: asumimos payload chico; igual validamos estructura.
    body = await req.json();
  } catch {
    return badRequest("JSON inválido.");
  }

  // 3) Validación estructura mínima
  const requiredTop = ["fullHoursPerWeek", "fullTimeThresholdHours", "fullTimeSundayAvailability", "partTimeSundayAvailability", "days", "contracts"];
  for (const k of requiredTop) {
    if (!(k in body)) return badRequest(`Falta campo: ${k}`);
  }

  // 4) Validación numérica + rangos razonables
  const fullHoursPerWeek = Number(body.fullHoursPerWeek);
  const fullTimeThresholdHours = Number(body.fullTimeThresholdHours);
  const fullTimeSundayAvailability = Number(body.fullTimeSundayAvailability);
  const partTimeSundayAvailability = Number(body.partTimeSundayAvailability);

  if (!isFiniteNumber(fullHoursPerWeek) || fullHoursPerWeek <= 0) return badRequest("fullHoursPerWeek inválido.");
  if (!isFiniteNumber(fullTimeThresholdHours) || fullTimeThresholdHours <= 0) return badRequest("fullTimeThresholdHours inválido.");
  if (!isFiniteNumber(fullTimeSundayAvailability)) return badRequest("fullTimeSundayAvailability inválido.");
  if (!isFiniteNumber(partTimeSundayAvailability)) return badRequest("partTimeSundayAvailability inválido.");

  // “Clamps” para evitar valores locos
  body.fullHoursPerWeek = clamp(fullHoursPerWeek, 1, 60);
  body.fullTimeThresholdHours = clamp(fullTimeThresholdHours, 1, 60);
  body.fullTimeSundayAvailability = clamp(fullTimeSundayAvailability, 0, 1);
  body.partTimeSundayAvailability = clamp(partTimeSundayAvailability, 0, 1);

  // 5) Validación days
  const dayKeys = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
  const days = body.days;
  if (typeof days !== "object" || !days) return badRequest("days inválido.");

  for (const d of dayKeys) {
    const row = days[d];
    if (!row) return badRequest(`days.${d} faltante.`);
    const fields = ["open", "hoursOpen", "requiredPeople", "shiftsPerDay", "overlapMinutes", "breakMinutes"];
    for (const f of fields) {
      if (!(f in row)) return badRequest(`Falta days.${d}.${f}`);
    }
    // Rango razonable
    row.hoursOpen = clamp(Number(row.hoursOpen), 0, 24);
    row.requiredPeople = clamp(Number(row.requiredPeople), 0, 200);
    row.shiftsPerDay = clamp(Number(row.shiftsPerDay), 1, 6);
    row.overlapMinutes = clamp(Number(row.overlapMinutes), 0, 240);
    row.breakMinutes = clamp(Number(row.breakMinutes), 0, 240);
    row.open = Boolean(row.open);
  }

  // 6) Validación contracts
  const contracts = body.contracts;
  if (!Array.isArray(contracts) || contracts.length === 0) return badRequest("contracts inválido.");
  if (contracts.length > 20) return badRequest("Demasiados contratos (máx 20).");

  for (const c of contracts) {
    if (!c || typeof c !== "object") return badRequest("Contrato inválido.");
    if (typeof c.name !== "string" || c.name.trim().length === 0) return badRequest("Contrato sin nombre.");
    c.name = c.name.slice(0, 30);
    c.hoursPerWeek = clamp(Number(c.hoursPerWeek), 1, 60);
  }

  // 7) Calcular
  try {
    const result = calculate(body);
    return NextResponse.json(
      { ok: true, result },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
          "X-RateLimit-Remaining": String(rl.remaining),
        },
      }
    );
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Error al calcular." },
      { status: 500 }
    );
  }
}