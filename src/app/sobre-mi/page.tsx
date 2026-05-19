// src/app/sobre-mi/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: "Sobre mí — Juan Alegría · dotaciones.cl",
  description:
    "15 años en workforce management en Chile. De 50 millones en ahorro de HH.EE. a 14 millones de dólares en 4 años. Esta es mi historia.",
  alternates: { canonical: "https://dotaciones.cl/sobre-mi" },
  openGraph: {
    title: "Sobre mí — Juan Alegría · dotaciones.cl",
    description:
      "15 años en workforce management en Chile. De 50 millones en ahorro de HH.EE. a 14 millones de dólares en 4 años. Esta es mi historia.",
    url: "https://dotaciones.cl/sobre-mi",
    type: "profile",
  },
};

const S = `
  @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Geist:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');
  *,*::before,*::after { box-sizing:border-box; margin:0; padding:0; }
  body {
    font-family:'Geist',system-ui,sans-serif;
    background:#0D1B2A; color:#E8ECEF;
    -webkit-font-smoothing:antialiased;
  }
  a { text-decoration:none; color:inherit; }
  ::selection { background:#0F6E56; color:#E8ECEF; }

  /* ── Layout ── */
  .page-wrap { background:#0D1B2A; min-height:100vh; }
  .container { max-width:1280px; margin:0 auto; padding:0 40px; }

  /* ── Hero ── */
  .hero { padding:80px 40px 96px; max-width:1280px; margin:0 auto; }
  .hero-label {
    font-family:'JetBrains Mono',monospace;
    font-size:11px; letter-spacing:.18em; text-transform:uppercase;
    color:#0F6E56; display:flex; align-items:center; gap:10px;
    margin-bottom:32px;
  }
  .hero-label::before {
    content:""; display:inline-block; width:24px; height:1px;
    background:#0F6E56;
  }
  .hero-h1 {
    font-family:'Instrument Serif',serif;
    font-size:clamp(52px,7vw,100px);
    font-weight:400; line-height:.97; letter-spacing:-.02em;
    color:#E8ECEF; margin-bottom:4px;
  }
  .hero-h1-teal {
    font-family:'Instrument Serif',serif;
    font-size:clamp(52px,7vw,100px);
    font-weight:400; line-height:.97; letter-spacing:-.02em;
    color:#0F6E56; font-style:italic; display:block;
    margin-bottom:28px;
  }
  .hero-sub {
    font-size:17px; color:#7A8895; line-height:1.6;
    max-width:52ch; font-weight:300;
  }

  /* ── Bio grid ── */
  .bio-section {
    border-top:1px solid rgba(232,236,239,0.10);
    padding:80px 40px;
    max-width:1280px; margin:0 auto;
  }
  .bio-grid {
    display:grid; grid-template-columns:1fr 1.6fr;
    gap:64px; align-items:start;
  }

  /* Foto */
  .photo-wrap { position:relative; }
  .photo-frame {
    aspect-ratio:1; width:100%;
    border:1px solid rgba(232,236,239,0.14);
    overflow:hidden; position:relative; background:#0F2436;
  }
  .photo-frame img { width:100%; height:100%; object-fit:cover; object-position:top; }
  .photo-corner-tl,
  .photo-corner-br {
    position:absolute; width:14px; height:14px;
    border-color:#7A8895; border-style:solid; pointer-events:none;
  }
  .photo-corner-tl { top:-1px; left:-1px; border-width:1px 0 0 1px; }
  .photo-corner-br { bottom:-1px; right:-1px; border-width:0 1px 1px 0; }
  .photo-label-tl {
    position:absolute; top:12px; right:12px;
    font-family:'JetBrains Mono',monospace;
    font-size:10px; color:rgba(232,236,239,0.4);
    letter-spacing:.12em;
  }
  .photo-label-br {
    position:absolute; bottom:12px; left:12px;
    font-family:'JetBrains Mono',monospace;
    font-size:10px; color:rgba(232,236,239,0.4);
    letter-spacing:.12em;
  }
  .photo-caption {
    margin-top:14px;
    font-family:'JetBrains Mono',monospace;
    font-size:10.5px; color:#7A8895;
    letter-spacing:.10em; text-transform:uppercase;
    line-height:1.6;
  }
  .social-links {
    display:flex; gap:10px; margin-top:14px; flex-wrap:wrap;
  }
  .social-btn {
    display:inline-flex; align-items:center; gap:7px;
    font-family:'JetBrains Mono',monospace;
    font-size:11px; letter-spacing:.10em; text-transform:uppercase;
    color:rgba(232,236,239,0.55); padding:8px 14px;
    border:1px solid rgba(232,236,239,0.14); border-radius:2px;
    transition:color .2s ease, border-color .2s ease, background .2s ease;
  }
  .social-btn:hover {
    color:#E8ECEF; background:rgba(232,236,239,0.05);
    border-color:rgba(232,236,239,0.28);
  }

  /* Bio texto */
  .bio-text { display:flex; flex-direction:column; gap:0; }
  .bio-p {
    font-size:16px; color:rgba(232,236,239,0.78);
    line-height:1.78; font-weight:300; margin-bottom:22px;
  }
  .bio-declaration {
    font-family:'Instrument Serif',serif;
    font-size:clamp(22px,2.8vw,30px);
    color:#E8ECEF; line-height:1.15;
    margin:8px 0 28px; font-style:normal;
  }
  .bio-teal { color:#0F6E56; font-weight:600; }

  /* ── Stats ── */
  .stats-section {
    border-top:1px solid rgba(232,236,239,0.10);
    padding:0 40px;
    max-width:1280px; margin:0 auto;
  }
  .stats-grid {
    display:grid; grid-template-columns:repeat(3,1fr);
    border-left:1px solid rgba(232,236,239,0.10);
  }
  .stat-item {
    padding:48px 32px; border-right:1px solid rgba(232,236,239,0.10);
    border-bottom:1px solid rgba(232,236,239,0.10);
    border-top:1px solid rgba(232,236,239,0.10);
  }
  .stat-num {
    font-family:'Instrument Serif',serif;
    font-size:clamp(40px,5vw,64px);
    color:#E8ECEF; line-height:1; margin-bottom:12px;
  }
  .stat-desc {
    font-family:'JetBrains Mono',monospace;
    font-size:10.5px; color:#7A8895;
    text-transform:uppercase; letter-spacing:.14em;
    line-height:1.55;
  }
  .stat-period {
    margin-top:6px; font-size:10px; color:rgba(122,136,149,.6);
  }

  /* ── CTA ── */
  .cta-section {
    background:#0F2436;
    border-top:1px solid rgba(232,236,239,0.10);
    border-bottom:1px solid rgba(232,236,239,0.10);
  }
  .cta-inner {
    max-width:1280px; margin:0 auto;
    padding:80px 40px;
    display:grid; grid-template-columns:1fr auto;
    gap:48px; align-items:center;
  }
  .cta-h {
    font-family:'Instrument Serif',serif;
    font-size:clamp(26px,3.5vw,44px);
    color:#E8ECEF; line-height:1.1; font-weight:400;
  }
  .cta-h em {
    color:#0F6E56; font-style:italic; display:block;
  }
  .cta-btns { display:flex; flex-direction:column; gap:10px; min-width:200px; }
  .btn-primary {
    display:inline-flex; align-items:center; justify-content:center; gap:6px;
    background:#0F6E56; color:#F5F1E8;
    padding:13px 24px; border-radius:2px;
    font-family:'JetBrains Mono',monospace;
    font-size:12px; font-weight:500; letter-spacing:.10em;
    white-space:nowrap; transition:background .2s ease;
  }
  .btn-primary:hover { background:#168A6C; }
  .btn-ghost {
    display:inline-flex; align-items:center; justify-content:center; gap:6px;
    background:transparent;
    border:1px solid rgba(232,236,239,0.14);
    color:rgba(232,236,239,0.75);
    padding:12px 24px; border-radius:2px;
    font-family:'JetBrains Mono',monospace;
    font-size:12px; font-weight:400; letter-spacing:.10em;
    white-space:nowrap;
    transition:background .2s ease, border-color .2s ease, color .2s ease;
  }
  .btn-ghost:hover {
    background:rgba(232,236,239,0.05);
    border-color:rgba(232,236,239,0.28);
    color:#E8ECEF;
  }

  /* ── Responsive ── */
  @media (max-width:900px) {
    .bio-grid { grid-template-columns:1fr; gap:40px; }
    .stats-grid { grid-template-columns:1fr; }
    .stat-item { border-right:none; }
    .cta-inner { grid-template-columns:1fr; gap:32px; }
    .cta-btns { flex-direction:row; flex-wrap:wrap; }
  }
  @media (max-width:640px) {
    .hero,.bio-section,.stats-section,.cta-inner { padding-left:20px; padding-right:20px; }
    .hero { padding-top:56px; padding-bottom:64px; }
    .bio-section { padding-top:56px; padding-bottom:56px; }
    .stat-item { padding:32px 20px; }
    .cta-btns { flex-direction:column; }
  }
`;

export default function SobreMiPage() {
  return (
    <div className="page-wrap">
      <style dangerouslySetInnerHTML={{ __html: S }} />
      <SiteNav />

      {/* ── HERO ── */}
      <section>
        <div className="hero">
          <div className="hero-label">§ 00 · Sobre mí</div>
          <h1 className="hero-h1">
            No somos un costo.
            <em className="hero-h1-teal">Somos rentabilidad.</em>
          </h1>
          <p className="hero-sub">
            Esa convicción me lleva 15 años trabajando en workforce management en Chile.
          </p>
        </div>
      </section>

      {/* ── FOTO + BIO ── */}
      <section>
        <div className="bio-section">
          <div className="bio-grid">

            {/* Columna izquierda — foto */}
            <div className="photo-wrap">
              <div className="photo-frame">
                <img
                  src="/juan-alegria.jpg"
                  alt="Juan Alegría"
                />
                <span className="photo-label-tl">CL</span>
                <span className="photo-label-br">JA — 46</span>
                <div className="photo-corner-tl" />
                <div className="photo-corner-br" />
              </div>
              <p className="photo-caption">
                Juan Alegría · Product Manager<br />
                Santiago, Chile
              </p>
              <div className="social-links">
                <a
                  href="https://linkedin.com/in/juanalegria"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="social-btn"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z"/>
                    <circle cx="4" cy="4" r="2"/>
                  </svg>
                  LinkedIn
                </a>
                <a
                  href="https://youtube.com/@juanalegria"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="social-btn"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.54 6.42a2.78 2.78 0 00-1.95-1.97C18.88 4 12 4 12 4s-6.88 0-8.59.45A2.78 2.78 0 001.46 6.42 29 29 0 001 12a29 29 0 00.46 5.58 2.78 2.78 0 001.95 1.97C5.12 20 12 20 12 20s6.88 0 8.59-.45a2.78 2.78 0 001.95-1.97A29 29 0 0023 12a29 29 0 00-.46-5.58z"/>
                    <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="#0D1B2A"/>
                  </svg>
                  YouTube
                </a>
              </div>
            </div>

            {/* Columna derecha — bio */}
            <div className="bio-text">
              <p className="bio-p">
                Empecé en esto cuando RRHH todavía se medía en carpetas y planillas Excel.
                Nadie hablaba de optimización, de eficiencia operativa, de impacto en el
                resultado del negocio. Las dotaciones eran &quot;el área que contrata y despide&quot;
                — y punto.
              </p>

              <p className="bio-declaration">
                Yo lo vi diferente desde el principio.
              </p>

              <p className="bio-p">
                En mis primeros años, trabajando en el sector de casino y entretenimiento,
                logré reducir el gasto en horas extra en más de 50 millones de pesos — no
                con tecnología cara ni consultores externos, sino analizando los datos que
                ya existían y tomando mejores decisiones con ellos.
              </p>
              <p className="bio-p">
                Años después, ya con más experiencia y equipos más grandes, ese mismo enfoque
                se tradujo en más de 14 millones de dólares en ahorro acumulado en cuatro
                años en una empresa de servicios de alimentación masiva.
              </p>

              <p className="bio-p">
                Eso me convenció de algo que no he dejado de defender desde entonces:
                la gestión de dotaciones bien hecha no es un gasto.{" "}
                <strong className="bio-teal">
                  Es una palanca de rentabilidad.
                </strong>
              </p>

              <p className="bio-p">
                Desde entonces he trabajado en retail, aeropuertos, salud, alimentación
                masiva y tecnología. En cada industria, el problema de fondo es el mismo —
                las empresas no saben exactamente cuántas personas necesitan, cuándo las
                necesitan, ni si las están usando bien.
              </p>
              <p className="bio-p">
                Hoy soy Product Manager en Vigatec, construyendo productos de control de
                asistencia y gestión de turnos. Y fundé dotaciones.cl para que esta
                conversación sea pública — porque en Chile hay muy pocas voces que hablen
                de workforce management con experiencia operativa real.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section>
        <div className="stats-section">
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-num">50M+</div>
              <div className="stat-desc">en reducción de HH.EE.</div>
              <div className="stat-period stat-desc">primeros años · casinos</div>
            </div>
            <div className="stat-item">
              <div className="stat-num">14M USD</div>
              <div className="stat-desc">en ahorro acumulado</div>
              <div className="stat-period stat-desc">4 años · alimentación masiva</div>
            </div>
            <div className="stat-item">
              <div className="stat-num">15</div>
              <div className="stat-desc">años en operaciones</div>
              <div className="stat-period stat-desc">Chile</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="cta-section">
        <div className="cta-inner">
          <h2 className="cta-h">
            Si trabajas en RRHH, operaciones o tecnología
            y tienes un problema de dotaciones sin resolver —
            <em>escríbeme. No muerdo.</em>
          </h2>
          <div className="cta-btns">
            <Link href="/contacto" className="btn-primary">
              Ir al contacto →
            </Link>
            <Link href="/calculadora" className="btn-ghost">
              Ver calculadoras →
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
