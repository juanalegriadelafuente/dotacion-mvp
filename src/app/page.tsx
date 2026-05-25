"use client";

import { useState, useEffect } from "react";

/* ─────────────────────────────────────────
   TOKENS
───────────────────────────────────────── */
const ACCENT   = "#0F6E56";
const ACCENT2  = "#168A6C";
const INK      = "#0D1B2A";
const INK2     = "#0F2436";
const LINE     = "#1E3650";
const FOG      = "#7A8895";
const BONE     = "#E8ECEF";
const PAPER    = "#F5F1E8";

/* ─────────────────────────────────────────
   TYPES
───────────────────────────────────────── */
interface BlogPost {
  id:       string;
  n:        string;   // "012"
  title:    string;
  slug:     string;
  excerpt:  string;
  category: string;
  readTime: string;
  date:     string;   // "26 may 2026"
}

/* ─────────────────────────────────────────
   GLOBAL STYLES (animations + resets)
───────────────────────────────────────── */
const GLOBAL_CSS = `
  @keyframes blink { 0%,49%{opacity:1} 50%,100%{opacity:0} }
  .blink { animation: blink 1.05s steps(1,end) infinite; }

  .hairline       { border-color: rgba(232,236,239,0.08); }
  .hairline-strong{ border-color: rgba(232,236,239,0.14); }

  .grain {
    background-color: #0F2436;
    background-image:
      repeating-linear-gradient(45deg,rgba(255,255,255,.025) 0 1px,transparent 1px 7px),
      radial-gradient(120% 80% at 30% 20%,rgba(15,110,86,.12),transparent 60%),
      radial-gradient(80% 60% at 80% 90%,rgba(255,255,255,.04),transparent 60%);
  }

  .ticks::before,.ticks::after {
    content:""; position:absolute; width:14px; height:14px;
    border-color:#7A8895; border-style:solid;
  }
  .ticks::before { top:-1px;    left:-1px;  border-width:1px 0 0 1px; }
  .ticks::after  { bottom:-1px; right:-1px; border-width:0 1px 1px 0; }

  .ulink { position:relative; }
  .ulink::after {
    content:""; position:absolute; left:0; right:0; bottom:-3px; height:1px;
    background:currentColor; transform:scaleX(0); transform-origin:left;
    transition:transform .35s cubic-bezier(.2,.7,.2,1);
  }
  .ulink:hover::after { transform:scaleX(1); }

  .card-hover { transition:background-color .3s ease,border-color .3s ease; }
  .card-hover:hover { background:#102a40; border-color:rgba(232,236,239,.18); }

  .field {
    background:transparent; border:0;
    border-bottom:1px solid rgba(232,236,239,.18);
    color:#E8ECEF; padding:10px 2px; outline:none; width:100%;
    font-family:var(--font-geist-sans,inherit); font-size:16px;
    transition:border-color .2s ease;
  }
  .field::placeholder { color:#7A8895; }
  .field:focus        { border-color:#0F6E56; }

  .tag {
    border:1px solid rgba(232,236,239,.14); color:#E8ECEF;
    padding:2px 8px; border-radius:2px;
    font-family:var(--font-jetbrains-mono,monospace);
    font-size:10px; text-transform:uppercase; letter-spacing:.08em;
  }

  .noise::before {
    content:""; position:absolute; inset:0; pointer-events:none;
    background-image:radial-gradient(rgba(255,255,255,.04) 1px,transparent 1px);
    background-size:3px 3px; mix-blend-mode:overlay; opacity:.5;
  }

  .btn {
    display:inline-flex; align-items:center; gap:.6rem;
    padding:.7rem 1.1rem; font-size:14px;
    border:1px solid rgba(232,236,239,.16);
    color:#E8ECEF; background:transparent;
    transition:background-color .25s ease,border-color .25s ease,color .25s ease;
    cursor:pointer; text-decoration:none; font-family:inherit;
  }
  .btn:hover { background:#102a40; border-color:rgba(232,236,239,.28); }
  .btn-primary { background:#0F6E56; border-color:#0F6E56; color:#F5F1E8; }
  .btn-primary:hover { background:#168A6C; border-color:#168A6C; }
  .btn:disabled { opacity:.55; cursor:not-allowed; }
`;

/* ─────────────────────────────────────────
   ATOMS
───────────────────────────────────────── */
function Dot({ color = ACCENT }: { color?: string }) {
  return (
    <span
      className="inline-block align-middle"
      style={{ width: 6, height: 6, background: color, borderRadius: 1 }}
    />
  );
}

function MonoLabel({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={"font-mono uppercase tracking-[0.16em] text-[10.5px] " + className}
      style={{ color: FOG }}
    >
      {children}
    </span>
  );
}

function SectionRule({
  label,
  idx,
  right,
}: {
  label: string;
  idx: string;
  right?: string;
}) {
  return (
    <div className="flex items-end justify-between border-b hairline-strong pb-3 mb-10">
      <div className="flex items-baseline gap-3">
        <span className="font-mono text-[11px]" style={{ color: FOG }}>
          {idx}
        </span>
        <h2 className="font-serif text-[clamp(28px,3.4vw,44px)] leading-none">
          {label}
        </h2>
      </div>
      {right && (
        <div
          className="font-mono text-[11px] uppercase tracking-[0.16em]"
          style={{ color: FOG }}
        >
          {right}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────
   STATUS BAR
───────────────────────────────────────── */
function StatusBar() {
  const [time, setTime] = useState(() => new Date());

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const hh = String(time.getHours()).padStart(2, "0");
  const mm = String(time.getMinutes()).padStart(2, "0");
  const ss = String(time.getSeconds()).padStart(2, "0");

  return (
    <div className="border-b hairline font-mono text-[11px]" style={{ color: FOG }}>
      <div className="max-w-[1280px] mx-auto px-8 h-9 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <span className="flex items-center gap-2">
            <Dot /> EN LÍNEA · SANTIAGO
          </span>
          <span className="hidden md:inline">LAT −33.45 · LON −70.66</span>
        </div>
        <div className="flex items-center gap-6">
          <span className="hidden md:inline">v. 04 · ed. mayo 2026</span>
          <span>
            {hh}:{mm}
            <span style={{ opacity: 0.6 }}>:{ss}</span> CLT
          </span>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   NAV
   — "Blog" ahora apunta a /blog (página independiente)
   — "#calc" y "#contacto" siguen siendo anchors locales
───────────────────────────────────────── */
function Nav() {
  const links = [
    { label: "Blog",         href: "/blog"      }, // ← CAMBIADO de #blog a /blog
    { label: "Sobre mí",     href: "/sobre-mi"  },
    { label: "Calculadoras", href: "#calc"       },
    { label: "Contacto",     href: "#contacto"   },
  ];

  return (
    <nav
      className="border-b hairline sticky top-0 z-30 backdrop-blur"
      style={{ background: `${INK}D9` }}
    >
      <div className="max-w-[1280px] mx-auto px-8 h-[68px] flex items-center justify-between">
        <a href="#" className="flex items-baseline gap-2 group">
          <span className="font-serif text-[22px] tracking-tight">dotaciones</span>
          <span className="font-mono text-[11px]" style={{ color: FOG }}>.cl</span>
        </a>

        <div className="flex items-center gap-8">
          {links.map((l, i) => (
            <a
              key={l.label}
              href={l.href}
              className="ulink text-[14px]"
              style={{ color: `${BONE}CC` }}
              onMouseEnter={(e) =>
                ((e.target as HTMLElement).style.color = BONE)
              }
              onMouseLeave={(e) =>
                ((e.target as HTMLElement).style.color = `${BONE}CC`)
              }
            >
              <span className="font-mono mr-2 text-[11px]" style={{ color: FOG }}>
                0{i + 1}
              </span>
              {l.label}
            </a>
          ))}
        </div>
      </div>
    </nav>
  );
}

/* ─────────────────────────────────────────
   HERO — AVATAR
───────────────────────────────────────── */
function AvatarBlock() {
  const [imgError, setImgError] = useState(false);

  return (
    <div className="relative ticks">
      <div
        className="aspect-square w-full border hairline-strong relative overflow-hidden"
      >
        {!imgError ? (
          <img
            src="/juan-alegria.jpg"
            alt="Juan Alegría"
            className="w-full h-full object-cover object-top"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="grain w-full h-full" />
        )}

        {/* overlay labels (always visible) */}
        <div
          className="absolute bottom-3 left-3 font-mono text-[10px] tracking-[0.16em]"
          style={{ color: FOG }}
        >
          JA — 46
        </div>
        <div
          className="absolute top-3 right-3 font-mono text-[10px]"
          style={{ color: FOG }}
        >
          CL
        </div>
      </div>

      <div
        className="mt-3 flex items-center justify-between font-mono text-[10.5px] uppercase tracking-[0.14em]"
        style={{ color: FOG }}
      >
        <span>Santiago, CL</span>
        <span>2026/05</span>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   HERO
   — articleCount viene del fetch centralizado en Home
───────────────────────────────────────── */
function Hero({ articleCount }: { articleCount: number }) {
  return (
    <section className="relative noise overflow-hidden">
      <div className="max-w-[1280px] mx-auto px-8 pt-20 pb-24 relative">

        {/* meta strip */}
        <div
          className="grid grid-cols-12 mb-14 font-mono text-[11px] uppercase tracking-[0.18em]"
          style={{ color: FOG }}
        >
          <div className="col-span-3">Edición · 04</div>
          <div className="col-span-3">Workforce · HRTech</div>
          <div className="col-span-3">Independiente</div>
          <div className="col-span-3 text-right">Chile</div>
        </div>

        {/* grid */}
        <div className="grid grid-cols-12 gap-10 items-start">

          {/* avatar col */}
          <div className="col-span-12 md:col-span-4">
            <AvatarBlock />
          </div>

          {/* headline col */}
          <div className="col-span-12 md:col-span-8">
            <div className="flex items-center gap-3 mb-8">
              <Dot />
              <MonoLabel>El sitio de Juan Alegría</MonoLabel>
            </div>

            <h1 className="font-serif text-[clamp(44px,7vw,108px)] leading-[0.95] tracking-[-0.02em]">
              Workforce
              <br />
              management en
              <br />
              Chile,{" "}
              <em className="italic" style={{ color: ACCENT }}>
                sin humo
              </em>
              .
              <span
                className="blink ml-1 inline-block"
                style={{
                  width: "0.55ch",
                  height: "0.85em",
                  background: ACCENT,
                  verticalAlign: "-0.05em",
                }}
              />
            </h1>

            <div
              className="mt-10 max-w-[58ch] text-[18px] leading-[1.55]"
              style={{ color: `${BONE}D9` }}
            >
              <p>
                Llevo 15 años dimensionando dotaciones, optimizando turnos y
                peleando con planillas en retail, casinos, aeropuertos y salud.
                Aquí escribo lo que realmente funciona — y lo que se vende caro
                y no sirve.
              </p>
            </div>

            <div className="mt-12 flex flex-wrap items-center gap-3">
              <a
                href="https://linkedin.com/in/juanalegriadelafuente"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary font-mono text-[13px] tracking-[0.06em]"
              >
                LinkedIn →
              </a>
              <a
                href="https://youtube.com/@soyjuanalegria"
                target="_blank"
                rel="noopener noreferrer"
                className="btn font-mono text-[13px] tracking-[0.06em]"
              >
                YouTube →
              </a>
              <span
                className="font-mono text-[11px] ml-2 hidden md:inline"
                style={{ color: FOG }}
              >
                · 1.014 seguidores LinkedIn · canal YouTube en construcción
              </span>
            </div>
          </div>
        </div>

        {/* stats — el contador de artículos viene de Notion en tiempo real */}
        <div className="mt-24 grid grid-cols-2 md:grid-cols-3 border-t hairline-strong">
          {[
            ["15", "años en operaciones"],
            [articleCount > 0 ? String(articleCount) : "—", "artículos publicados"],
            ["3",  "calculadoras gratuitas"],
          ].map(([n, l], i) => (
            <div
              key={i}
              className={"py-6 px-1 " + (i > 0 ? "md:border-l hairline" : "")}
            >
              <div className="font-serif text-[44px] leading-none">{n}</div>
              <div
                className="font-mono text-[11px] uppercase tracking-[0.14em] mt-3"
                style={{ color: FOG }}
              >
                {l}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────
   CALCULADORAS
───────────────────────────────────────── */
function CalcCard({
  idx,
  title,
  sub,
  inputs,
  output,
  href,
}: {
  idx: string;
  title: string;
  sub: string;
  inputs: [string, string][];
  output: [string, string];
  href: string;
}) {
  return (
    <a
      href={href}
      className="card-hover group block border hairline-strong p-7 relative overflow-hidden"
      style={{ background: `${INK2}66` }}
    >
      <div className="flex items-center justify-between mb-10">
        <span className="font-mono text-[11px] tracking-[0.18em]" style={{ color: FOG }}>
          CALC · {idx}
        </span>
        <span
          className="font-mono text-[11px] transition-colors"
          style={{ color: FOG }}
          onMouseEnter={(e) => ((e.target as HTMLElement).style.color = BONE)}
          onMouseLeave={(e) => ((e.target as HTMLElement).style.color = FOG)}
        >
          ABRIR →
        </span>
      </div>

      <h3 className="font-serif text-[28px] leading-[1.05] mb-2">{title}</h3>
      <p className="text-[13.5px] leading-snug max-w-[34ch]" style={{ color: `${BONE}B3` }}>
        {sub}
      </p>

      <div className="mt-8 border-t hairline pt-5 space-y-2.5">
        {inputs.map((it, i) => (
          <div key={i} className="flex items-center justify-between font-mono text-[12px]">
            <span style={{ color: FOG }}>{it[0]}</span>
            <span style={{ color: `${BONE}E6` }}>{it[1]}</span>
          </div>
        ))}
        <div className="flex items-baseline justify-between pt-4 mt-3 border-t hairline">
          <span
            className="font-mono text-[10.5px] uppercase tracking-[0.16em]"
            style={{ color: FOG }}
          >
            {output[0]}
          </span>
          <span className="font-serif text-[28px]" style={{ color: ACCENT }}>
            {output[1]}
          </span>
        </div>
      </div>
    </a>
  );
}

function Calculadoras() {
  const cards = [
    {
      idx: "01",
      title: "Dotación Retail",
      sub: "Calcula cuánta gente realmente necesitas según demanda, niveles de servicio y ausentismo.",
      inputs: [
        ["Llamadas/día", "4.200"],
        ["SLA objetivo", "80/20"],
        ["Shrinkage",    "32%"],
      ] as [string, string][],
      output: ["Headcount sugerido", "47"] as [string, string],
      href: "/calculadora/retail",
    },
    {
      idx: "02",
      title: "Dotación SAN",
      sub: "Número adecuado para cubrir turnos continuos 24/7 incluyendo factor de ausentismo y reemplazo.",
      inputs: [
        ["Puestos/turno",   "12"],
        ["Turnos/día",      "3"],
        ["Factor SAN",      "1.229"],
      ] as [string, string][],
      output: ["Dotación base", "44"] as [string, string],
      href: "/calculadora/san",
    },
    {
      idx: "03",
      title: "Finiquito",
      sub: "Estima el costo completo de un finiquito: indemnización, feriados, gratificación proporcional.",
      inputs: [
        ["Sueldo base",  "$780.000"],
        ["Antigüedad",   "4 años"],
        ["Causal",       "Art. 161"],
      ] as [string, string][],
      output: ["Costo estimado", "$3,12M"] as [string, string],
      href: "/calculadora/finiquito",
    },
  ];

  return (
    <section id="calc" className="border-t hairline-strong">
      <div className="max-w-[1280px] mx-auto px-8 py-24">
        <SectionRule
          idx="§ 01"
          label="Calculadoras"
          right="Herramientas gratis · sin login"
        />
        <p
          className="font-serif text-[22px] italic max-w-[60ch] mb-12"
          style={{ color: `${BONE}CC` }}
        >
          Hojas de cálculo de verdad, no demos de SaaS. Las uso yo todas las
          semanas.
        </p>
        <div
          className="grid md:grid-cols-3 gap-px"
          style={{ background: LINE }}
        >
          {cards.map((c) => (
            <CalcCard key={c.idx} {...c} />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────
   BLOG — ARTICLE ROW
───────────────────────────────────────── */
function Article({
  n,
  kicker,
  title,
  dek,
  date,
  read,
  big,
  href,
}: {
  n: string;
  kicker: string;
  title: string;
  dek?: string;
  date: string;
  read: string;
  big?: boolean;
  href: string;
}) {
  return (
    <a href={href} className="group block border-b hairline py-8">
      <div className="grid grid-cols-12 gap-6 items-baseline">

        {/* index + date */}
        <div className="col-span-12 md:col-span-2">
          <div
            className="font-mono text-[11px] uppercase tracking-[0.16em]"
            style={{ color: FOG }}
          >
            N° {n}
          </div>
          <div
            className="font-mono text-[11px] mt-1"
            style={{ color: FOG }}
          >
            {date}
          </div>
        </div>

        {/* main content */}
        <div className="col-span-12 md:col-span-7">
          <div className="flex items-center gap-2 mb-3">
            <span className="tag">{kicker}</span>
          </div>

          <h3
            className={
              "font-serif leading-[1.05] tracking-[-0.01em] " +
              (big ? "text-[clamp(30px,3.8vw,44px)]" : "text-[30px]")
            }
          >
            <span className="group-hover:underline decoration-[1px] underline-offset-[6px]">
              {title}
            </span>
          </h3>

          {dek && (
            <p
              className="mt-3 text-[15px] leading-snug max-w-[56ch]"
              style={{ color: `${BONE}BF` }}
            >
              {dek}
            </p>
          )}

          <div
            className="mt-4 flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.14em]"
            style={{ color: FOG }}
          >
            <span className="inline-flex items-center gap-2">
              <span className="inline-block w-5 h-5 grain border hairline" />
              Juan Alegría
            </span>
            <span>·</span>
            <span>{read} lectura</span>
          </div>
        </div>

        {/* cta */}
        <div className="col-span-12 md:col-span-3 md:text-right">
          <span
            className="font-mono text-[11px] uppercase tracking-[0.14em] transition-colors"
            style={{ color: FOG }}
          >
            Leer ensayo
            <span className="ml-2" style={{ color: ACCENT }}>
              →
            </span>
          </span>
        </div>
      </div>
    </a>
  );
}

/* ─────────────────────────────────────────
   BLOG SECTION
   — Recibe posts y total desde el fetch centralizado en Home
   — Sin hardcode: cada artículo nuevo en Notion aparece automáticamente
───────────────────────────────────────── */
function Blog({
  posts,
  total,
  loading,
}: {
  posts: BlogPost[];
  total: number;
  loading: boolean;
}) {
  return (
    <section id="blog" className="border-t hairline-strong">
      <div className="max-w-[1280px] mx-auto px-8 py-24">
        <SectionRule
          idx="§ 02"
          label="Blog"
          right="Ensayos, no thought-leadership"
        />

        <div>
          {loading ? (
            /* Skeleton — mantiene la altura mientras carga */
            [0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="border-b hairline py-8 animate-pulse"
              >
                <div className="grid grid-cols-12 gap-6">
                  <div className="col-span-2">
                    <div
                      className="h-3 w-12 rounded"
                      style={{ background: `${FOG}30` }}
                    />
                    <div
                      className="h-3 w-16 rounded mt-2"
                      style={{ background: `${FOG}20` }}
                    />
                  </div>
                  <div className="col-span-7 space-y-3">
                    <div
                      className="h-3 w-16 rounded"
                      style={{ background: `${FOG}20` }}
                    />
                    <div
                      className={
                        "rounded " + (i === 0 ? "h-8 w-3/4" : "h-6 w-2/3")
                      }
                      style={{ background: `${FOG}25` }}
                    />
                  </div>
                </div>
              </div>
            ))
          ) : posts.length === 0 ? (
            <p
              className="py-16 font-mono text-[12px] text-center"
              style={{ color: FOG }}
            >
              No hay artículos disponibles.
            </p>
          ) : (
            posts.map((a, i) => (
              <Article
                key={a.id}
                n={a.n}
                kicker={a.category}
                date={a.date}
                read={a.readTime}
                title={a.title}
                dek={i === 0 ? a.excerpt : undefined}
                big={i === 0}
                href={`/blog/${a.slug}`}
              />
            ))
          )}
        </div>

        <div className="mt-10 flex items-center justify-between">
          <span
            className="font-mono text-[11px] uppercase tracking-[0.16em]"
            style={{ color: FOG }}
          >
            {loading
              ? "Cargando..."
              : `${total} artículo${total !== 1 ? "s" : ""} · archivo desde abril 2026`}
          </span>
          <a
            href="/blog"
            className="ulink font-mono text-[12px] uppercase tracking-[0.16em]"
            style={{ color: ACCENT }}
          >
            Ver archivo completo →
          </a>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────
   CONTACTO
───────────────────────────────────────── */
type FormStatus = "idle" | "sending" | "ok" | "error";

function Contacto() {
  const [nombre,  setNombre]  = useState("");
  const [email,   setEmail]   = useState("");
  const [mensaje, setMensaje] = useState("");
  const [status,  setStatus]  = useState<FormStatus>("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (status === "sending") return;
    setStatus("sending");

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre,
          email,
          empresa: "",
          cargo: "",
          fuente:  "contacto",
          source:  "contacto",
          mensaje,
        }),
      });
      if (!res.ok) throw new Error("Error");
      setStatus("ok");
    } catch {
      setStatus("error");
    }
  }

  return (
    <section id="contacto" className="border-t hairline-strong">
      <div className="max-w-[1280px] mx-auto px-8 py-24">
        <div className="grid grid-cols-12 gap-10 items-start">

          {/* left — heading */}
          <div className="col-span-12 md:col-span-6">
            <MonoLabel className="block mb-6">§ 03 · Contacto</MonoLabel>

            <h2 className="font-serif text-[clamp(34px,5vw,68px)] leading-[1.02] tracking-[-0.01em]">
              ¿Tienes un problema
              <br />
              de dotaciones?
              <br />
              <em className="italic" style={{ color: ACCENT }}>
                Escríbeme.
              </em>
            </h2>

            <p
              className="mt-6 text-[16px] leading-relaxed max-w-[46ch]"
              style={{ color: `${BONE}B3` }}
            >
              Sin formularios largos. Solo cuéntame el problema y te respondo
              en 24 horas.
            </p>
          </div>

          {/* right — form */}
          <div className="col-span-12 md:col-span-5 md:col-start-8">
            {status === "ok" ? (
              <div className="border hairline-strong p-8">
                <p
                  className="font-mono text-[13px] leading-relaxed"
                  style={{ color: BONE }}
                >
                  Mensaje enviado.
                  <br />
                  Te respondo en 24 horas.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* nombre */}
                <div>
                  <label
                    className="block font-mono text-[10.5px] uppercase tracking-[0.16em] mb-2"
                    style={{ color: FOG }}
                  >
                    Nombre
                  </label>
                  <input
                    className="field"
                    type="text"
                    placeholder="Tu nombre"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    required
                    disabled={status === "sending"}
                  />
                </div>

                {/* email */}
                <div>
                  <label
                    className="block font-mono text-[10.5px] uppercase tracking-[0.16em] mb-2"
                    style={{ color: FOG }}
                  >
                    Email
                  </label>
                  <input
                    className="field"
                    type="email"
                    placeholder="nombre@empresa.cl"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={status === "sending"}
                  />
                </div>

                {/* mensaje */}
                <div>
                  <label
                    className="block font-mono text-[10.5px] uppercase tracking-[0.16em] mb-2"
                    style={{ color: FOG }}
                  >
                    Mensaje
                  </label>
                  <textarea
                    className="field resize-none"
                    rows={4}
                    placeholder="¿En qué te puedo ayudar?"
                    value={mensaje}
                    onChange={(e) => setMensaje(e.target.value)}
                    required
                    disabled={status === "sending"}
                  />
                </div>

                {/* error inline */}
                {status === "error" && (
                  <p className="font-mono text-[12px]" style={{ color: "#F87171" }}>
                    Hubo un error. Escríbeme a juan@dotaciones.cl
                  </p>
                )}

                <button
                  type="submit"
                  className="btn btn-primary font-mono text-[13px] tracking-[0.06em]"
                  disabled={status === "sending"}
                >
                  {status === "sending" ? "Enviando..." : "Enviar →"}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────
   FOOTER
───────────────────────────────────────── */
function Footer() {
  function scrollTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <footer className="border-t hairline-strong">
      <div className="max-w-[1280px] mx-auto px-8 py-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <span className="font-serif text-[22px]">dotaciones.cl</span>
        </div>
        <div
          className="font-mono text-[11px] uppercase tracking-[0.16em]"
          style={{ color: FOG }}
        >
          dotaciones.cl · Juan Alegría · 2026
        </div>
      </div>

      <div className="border-t hairline">
        <div
          className="max-w-[1280px] mx-auto px-8 py-3 font-mono text-[10.5px] flex justify-between"
          style={{ color: FOG }}
        >
          <span>Hecho con cuaderno cuadriculado, Excel y café.</span>
          <button
            onClick={scrollTop}
            className="hover:text-[#E8ECEF] transition-colors cursor-pointer bg-transparent border-0 p-0 font-mono text-[10.5px]"
            style={{ color: FOG }}
          >
            ↑ volver arriba
          </button>
        </div>
      </div>
    </footer>
  );
}

/* ─────────────────────────────────────────
   PAGE (default export)
   — Un solo fetch centralizado para blog posts
   — Pasa datos a Hero (contador) y Blog (artículos)
───────────────────────────────────────── */
export default function Home() {
  // Blog data — fetch único, compartido entre Hero y Blog
  const [posts,   setPosts]   = useState<BlogPost[]>([]);
  const [total,   setTotal]   = useState(0);
  const [loading, setLoading] = useState(true);

  // Force dark background on html/body regardless of globals.css
  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    const prev = {
      htmlBg:    root.style.background,
      htmlColor: root.style.color,
      bodyBg:    body.style.background,
      bodyColor: body.style.color,
    };
    root.style.background = INK;
    root.style.color      = BONE;
    body.style.background = INK;
    body.style.color      = BONE;
    return () => {
      root.style.background = prev.htmlBg;
      root.style.color      = prev.htmlColor;
      body.style.background = prev.bodyBg;
      body.style.color      = prev.bodyColor;
    };
  }, []);

  // Fetch blog posts desde la API route (que lee Notion)
  useEffect(() => {
    fetch("/api/blog-posts")
      .then((r) => r.json())
      .then((d) => {
        setPosts(d.articles ?? []);
        setTotal(d.total   ?? 0);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      {/* inject global styles + override html/body for SSR */}
      <style dangerouslySetInnerHTML={{
        __html: GLOBAL_CSS + `
          html, body {
            background: ${INK} !important;
            color: ${BONE} !important;
          }
        `
      }} />

      {/* full-page wrapper guarantees dark bg even before hydration */}
      <div style={{ background: INK, color: BONE, minHeight: "100vh" }}>
        <StatusBar />
        <Nav />

        <main>
          <Hero articleCount={total} />
          <Calculadoras />
          <Blog posts={posts} total={total} loading={loading} />
          <Contacto />
        </main>

        <Footer />
      </div>
    </>
  );
}