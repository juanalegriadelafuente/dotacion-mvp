// src/app/page.tsx
import Link from "next/link";
import type { Metadata } from "next";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: "Calculadora de dotación laboral Chile | dotaciones.cl",
  description:
    "Calcula cuánta gente necesitas para cubrir tus turnos. Retail, hospitales y finiquito. Gratis, sin registro.",
};

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;700;800&family=DM+Mono:wght@400;500&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
  body{font-family:'Sora',sans-serif;}
  a{text-decoration:none;color:inherit;}

  /* ── Hero ── */
  .hero{background:#0d1f14;padding:56px 40px 0;display:grid;grid-template-columns:1fr 320px;gap:36px;align-items:end;max-width:1160px;margin:0 auto;}
  .hero-left{padding-bottom:52px;}
  .hero-tag{font-size:10px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#52B788;margin-bottom:20px;display:flex;align-items:center;gap:7px;}
  .hero-tag::before{content:'';width:6px;height:6px;border-radius:50%;background:#52B788;flex-shrink:0;}
  .hero-h1{font-size:clamp(36px,4.5vw,52px);font-weight:800;line-height:1.02;letter-spacing:-.04em;color:#fff;margin-bottom:16px;}
  .hero-h1 em{color:#52B788;font-style:normal;display:block;}
  .hero-sub{font-size:15px;color:rgba(255,255,255,.4);line-height:1.7;font-weight:300;max-width:400px;margin-bottom:32px;}
  .hero-btns{display:flex;gap:10px;flex-wrap:wrap;align-items:center;}
  .btn-p{background:#52B788;color:#0d1f14;padding:12px 22px;border-radius:8px;font-size:13px;font-weight:700;display:inline-flex;align-items:center;gap:5px;transition:opacity .15s;}
  .btn-p:hover{opacity:.88;}
  .btn-s{background:rgba(255,255,255,.07);color:rgba(255,255,255,.65);border:1px solid rgba(255,255,255,.12);padding:12px 22px;border-radius:8px;font-size:13px;font-weight:500;transition:background .15s;}
  .btn-s:hover{background:rgba(255,255,255,.12);}
  .btn-g{color:rgba(255,255,255,.35);font-size:12px;padding:12px 4px;display:inline-flex;align-items:center;gap:4px;transition:color .15s;}
  .btn-g:hover{color:rgba(255,255,255,.6);}

  /* ── Hero card ── */
  .hero-card{background:#0f2a1b;border:1px solid #1e3d29;border-radius:14px 14px 0 0;padding:20px;align-self:end;}
  .hc-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;}
  .hc-label{font-size:9px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#5a8070;}
  .hc-badge{background:#0f3320;color:#52B788;border:1px solid #1e5a35;border-radius:99px;padding:3px 10px;font-size:9px;font-weight:700;}
  .hc-row{display:flex;justify-content:space-between;align-items:baseline;padding:8px 0;border-bottom:1px solid #1a3326;}
  .hc-row:last-of-type{border-bottom:none;}
  .hc-k{font-size:12px;color:#8aab96;}
  .hc-v{font-size:13px;font-weight:700;color:#e8f5e9;}
  .hc-v.g{color:#52B788;}
  .hc-v.big{font-size:24px;letter-spacing:-.03em;}
  .hc-sub{background:#07160d;border-radius:8px;padding:12px;margin-top:12px;}
  .hcs-l{font-size:9px;color:#3d6050;font-weight:700;letter-spacing:.08em;margin-bottom:8px;}
  .hcs-r{display:flex;justify-content:space-between;align-items:center;padding:3px 0;}
  .hcs-k{font-size:11px;color:#8aab96;}
  .hcs-t{background:#0f2a1b;border:1px solid #1e3d29;color:#52B788;font-size:9px;font-weight:700;padding:2px 8px;border-radius:4px;}

  /* ── Stats ── */
  .stats-wrap{background:#0d1f14;border-top:1px solid #1a3326;}
  .stats{display:grid;grid-template-columns:repeat(4,1fr);max-width:1160px;margin:0 auto;}
  .stat{padding:20px 40px;border-right:1px solid #1a3326;}
  .stat:last-child{border-right:none;}
  .stat-n{font-size:26px;font-weight:800;color:#52B788;letter-spacing:-.03em;line-height:1;}
  .stat-l{font-size:9px;color:#3d6050;text-transform:uppercase;letter-spacing:.08em;margin-top:4px;font-weight:600;}

  /* ── Calculadoras ── */
  .section{padding:56px 40px;background:#f5f3ee;}
  .section-inner{max-width:1160px;margin:0 auto;}
  .sk{font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#2D6A4F;margin-bottom:8px;}
  .sh{font-size:clamp(22px,3vw,28px);font-weight:800;color:#111;letter-spacing:-.03em;line-height:1.15;margin-bottom:8px;}
  .ss{font-size:13px;color:#6B7280;font-weight:300;line-height:1.65;max-width:480px;}

  .calcs{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-top:32px;}
  .calc{background:#fff;border:1.5px solid #E8E6E0;border-radius:14px;padding:24px;display:flex;flex-direction:column;gap:12px;transition:border-color .2s,transform .18s;}
  .calc:hover{border-color:#52B788;transform:translateY(-2px);}
  .calc.feat{border-color:#d4a849;background:#fffdf5;}
  .c-icon{width:34px;height:34px;border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
  .c-icon.g{background:#e8f5e9;color:#2D6A4F;}
  .c-icon.b{background:#e8f0fb;color:#1a5c9e;}
  .c-icon.a{background:#fff8e1;color:#856a0b;}
  .c-top{display:flex;justify-content:space-between;align-items:flex-start;}
  .c-new{font-size:9px;font-weight:700;background:#fff8e1;color:#856a0b;border:1px solid #e8d06a;border-radius:99px;padding:2px 9px;letter-spacing:.06em;text-transform:uppercase;}
  .c-ey{font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;}
  .c-ey.g{color:#2D6A4F;}.c-ey.b{color:#1a5c9e;}.c-ey.a{color:#856a0b;}
  .c-ti{font-size:17px;font-weight:800;color:#111;letter-spacing:-.02em;line-height:1.2;}
  .c-de{font-size:12px;color:#6B7280;line-height:1.65;font-weight:300;flex:1;}
  .c-lk{font-size:12px;font-weight:700;display:inline-flex;align-items:center;gap:3px;transition:opacity .15s;}
  .c-lk:hover{opacity:.75;}
  .c-lk.g{color:#2D6A4F;}.c-lk.b{color:#1a5c9e;}.c-lk.a{color:#856a0b;}

  /* ── Blog ── */
  .blog-section{background:#fff;padding:56px 40px;}
  .blog-inner{max-width:1160px;margin:0 auto;}
  .blog-head{display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:12px;}
  .blog-see{font-size:12px;font-weight:700;color:#2D6A4F;display:inline-flex;align-items:center;gap:3px;transition:opacity .15s;}
  .blog-see:hover{opacity:.75;}

  .cats{display:flex;gap:7px;flex-wrap:wrap;margin-bottom:28px;margin-top:16px;}
  .cat{font-size:10px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;padding:5px 12px;border-radius:99px;border:1.5px solid;}
  .cat.tc{color:#2D6A4F;border-color:#b7dfc8;background:#f0faf4;}
  .cat.op{color:#7c3aed;border-color:#c4b5fd;background:#f5f3ff;}
  .cat.no{color:#92400E;border-color:#fcd34d;background:#fffbeb;}
  .cat.ca{color:#1a5c9e;border-color:#bdd3ef;background:#f0f5fb;}
  .cat.te{color:#0f6e56;border-color:#9FE1CB;background:#e1f5ee;}
  .cat.em{color:#6B21A8;border-color:#d8b4fe;background:#faf5ff;}

  .blog-grid{display:grid;grid-template-columns:5fr 3fr;gap:16px;}

  .post-feat{background:#0d1f14;border-radius:14px;padding:28px;display:flex;flex-direction:column;gap:10px;min-height:210px;transition:opacity .18s;}
  .post-feat:hover{opacity:.92;}
  .pf-type{font-size:9px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;padding:3px 9px;border-radius:99px;display:inline-flex;align-items:center;gap:4px;width:fit-content;}
  .pf-type.guia{background:#0f3320;color:#52B788;border:1px solid #1e5a35;}
  .pf-type.op{background:#2d1f4a;color:#c4b5fd;border:1px solid #4c3a8a;}
  .pf-title{font-size:clamp(16px,2vw,20px);font-weight:800;color:#fff;letter-spacing:-.02em;line-height:1.25;flex:1;}
  .pf-meta{font-size:11px;color:#5a8070;}
  .pf-link{font-size:12px;font-weight:700;color:#52B788;display:inline-flex;align-items:center;gap:3px;}

  .op-strip{background:#1a0f38;border-radius:12px;padding:18px 20px;display:flex;align-items:center;gap:14px;transition:opacity .18s;}
  .op-strip:hover{opacity:.9;}
  .op-ico{width:38px;height:38px;border-radius:9px;background:#2d1f4a;border:1px solid #4c3a8a;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
  .op-kicker{font-size:9px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#c4b5fd;margin-bottom:5px;}
  .op-title{font-size:14px;font-weight:700;color:#fff;line-height:1.35;}
  .op-link{font-size:11px;font-weight:700;color:#c4b5fd;display:inline-flex;align-items:center;gap:3px;margin-top:8px;}

  .posts-col{display:flex;flex-direction:column;gap:10px;}
  .post-sm{background:#f5f3ee;border:1.5px solid #E8E6E0;border-radius:13px;padding:18px;display:flex;flex-direction:column;gap:7px;flex:1;transition:border-color .18s;}
  .post-sm:hover{border-color:#52B788;}
  .ps-type{font-size:9px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;padding:2px 8px;border-radius:99px;border:1px solid;display:inline-flex;width:fit-content;}
  .ps-type.guia{color:#2D6A4F;border-color:#b7dfc8;background:#f0faf4;}
  .ps-type.op{color:#7c3aed;border-color:#c4b5fd;background:#f5f3ff;}
  .ps-type.no{color:#92400E;border-color:#fcd34d;background:#fffbeb;}
  .ps-type.te{color:#0f6e56;border-color:#9FE1CB;background:#e1f5ee;}
  .ps-type.em{color:#6B21A8;border-color:#d8b4fe;background:#faf5ff;}
  .ps-title{font-size:14px;font-weight:700;color:#111;letter-spacing:-.01em;line-height:1.35;flex:1;}
  .ps-link{font-size:11px;font-weight:700;color:#2D6A4F;display:inline-flex;align-items:center;gap:2px;}

  @media(max-width:960px){
    .hero{grid-template-columns:1fr;padding:48px 24px 0;}
    .hero-card{border-radius:12px;margin-bottom:0;}
    .hero-left{padding-bottom:32px;}
    .calcs{grid-template-columns:1fr;}
    .blog-grid{grid-template-columns:1fr;}
    .stats{grid-template-columns:repeat(2,1fr);}
    .stat{border-right:none;border-bottom:1px solid #1a3326;}
    .section,.blog-section{padding:44px 24px;}
  }
  @media(max-width:600px){
    .hero-h1{font-size:34px;}
    .stats{grid-template-columns:repeat(2,1fr);}
  }
`;

export default function Home() {
  return (
    <div style={{ background: "#0d1f14" }}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <SiteNav />

      {/* ── Hero ── */}
      <div style={{ background: "#0d1f14" }}>
        <div className="hero">
          <div className="hero-left">
            <div className="hero-tag">Herramienta gratuita · Chile</div>
            <h1 className="hero-h1">
              Calcula cuánta<br />
              gente necesitas.<br />
              <em>De verdad.</em>
            </h1>
            <p className="hero-sub">
              Mix de contratos, cobertura por día y análisis de dotación.
              Sin registro, sin costo.
            </p>
            <div className="hero-btns">
              <Link href="/calculadora" className="btn-p">Calculadora Retail →</Link>
              <Link href="/san" className="btn-s">Calculadora SAN</Link>
              <Link href="/calculadora/finiquito" className="btn-g">Calcular finiquito ↗</Link>
            </div>
          </div>

          <div className="hero-card">
            <div className="hc-head">
              <span className="hc-label">Resultado del cálculo</span>
              <span className="hc-badge">✓ Óptimo</span>
            </div>
            <div className="hc-row">
              <span className="hc-k">FTE a contratar</span>
              <span className="hc-v g big">7.4</span>
            </div>
            <div className="hc-row">
              <span className="hc-k">Horas demanda</span>
              <span className="hc-v">280h/sem</span>
            </div>
            <div className="hc-row">
              <span className="hc-k">Factor reemplazo</span>
              <span className="hc-v">×1.12</span>
            </div>
            <div className="hc-row">
              <span className="hc-k">Cobertura domingo</span>
              <span className="hc-v g">✓ Cubierto</span>
            </div>
            <div className="hc-sub">
              <div className="hcs-l">Mix sugerido</div>
              <div className="hcs-r">
                <span className="hcs-k">42h · Jornada 6×1</span>
                <span className="hcs-t">×6</span>
              </div>
              <div className="hcs-r">
                <span className="hcs-k">20h · PT fin de semana</span>
                <span className="hcs-t">×1</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="stats-wrap">
        <div className="stats">
          {[
            { n: "+500", l: "Cálculos realizados" },
            { n: "3",    l: "Sectores cubiertos" },
            { n: "100%", l: "Gratis, sin registro" },
            { n: ".xlsx",l: "Exportación incluida" },
          ].map((s) => (
            <div key={s.n} className="stat">
              <div className="stat-n">{s.n}</div>
              <div className="stat-l">{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Calculadoras ── */}
      <div className="section">
        <div className="section-inner">
          <div className="sk">Para quién es</div>
          <h2 className="sh">Una herramienta,<br />tres realidades.</h2>
          <p className="ss">
            Retail, hospitales o tu finiquito — el motor se adapta y genera
            resultados que puedes presentar a gerencia o usar para negociar.
          </p>

          <div className="calcs">
            <Link href="/calculadora" className="calc">
              <div className="c-top">
                <div className="c-icon g">
                  <svg width="17" height="17" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
                    <rect x="2" y="3" width="16" height="14" rx="2"/><path d="M2 8h16M7 3v5"/>
                  </svg>
                </div>
              </div>
              <div className="c-ey g">Retail y servicios</div>
              <div className="c-ti">Calculadora Retail</div>
              <p className="c-de">Tiendas, supermercados, call centers, restaurantes. Dotación por tramo horario y mix de contratos optimizado.</p>
              <span className="c-lk g">Calcular ahora →</span>
            </Link>

            <Link href="/san" className="calc">
              <div className="c-top">
                <div className="c-icon b">
                  <svg width="17" height="17" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
                    <circle cx="10" cy="10" r="7"/><path d="M10 6v8M6 10h8"/>
                  </svg>
                </div>
              </div>
              <div className="c-ey b">Hospitales y clínicas</div>
              <div className="c-ti">Calculadora SAN</div>
              <p className="c-de">Normativa SAN MINSAL 2025. RTD, RCD y factores de complejidad integrados en tres pasos.</p>
              <span className="c-lk b">Calcular ahora →</span>
            </Link>

            <Link href="/calculadora/finiquito" className="calc feat">
              <div className="c-top">
                <div className="c-icon a">
                  <svg width="17" height="17" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
                    <rect x="3" y="3" width="14" height="14" rx="2"/><path d="M7 10h6M7 13h4"/>
                  </svg>
                </div>
                <span className="c-new">Nuevo</span>
              </div>
              <div className="c-ey a">Para trabajadores</div>
              <div className="c-ti">Calculadora de Finiquito</div>
              <p className="c-de">Indemnización, aviso previo, feriado proporcional y generador de reserva de derechos.</p>
              <span className="c-lk a">Calcular mi finiquito →</span>
            </Link>
          </div>
        </div>
      </div>

      {/* ── Blog ── */}
      <div className="blog-section">
        <div className="blog-inner">
          <div className="blog-head">
            <div>
              <div className="sk">Blog</div>
              <h2 className="sh" style={{ fontSize: "clamp(20px,2.5vw,24px)", marginBottom: 0 }}>
                Recursos, análisis y opinión<br />sobre el mundo del trabajo.
              </h2>
            </div>
            <Link href="/blog" className="blog-see">Ver todo →</Link>
          </div>

          <div className="cats">
            {[
              { cls: "tc", label: "Guías técnicas" },
              { cls: "op", label: "Opinión" },
              { cls: "no", label: "Normativa" },
              { cls: "ca", label: "Casos prácticos" },
              { cls: "te", label: "Tendencias RRHH" },
              { cls: "em", label: "Empresa y gestión" },
            ].map((c) => (
              <Link key={c.cls} href={`/blog?cat=${c.cls}`} className={`cat ${c.cls}`}>
                {c.label}
              </Link>
            ))}
          </div>

          <div className="blog-grid">
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <Link href="/blog/dotacion-hospitalaria-san" className="post-feat">
                <span className="pf-type guia">Guía técnica</span>
                <div className="pf-title">
                  Cómo calcular dotación hospitalaria según la norma SAN MINSAL 2025
                </div>
                <div className="pf-meta">8 min · Artículo destacado</div>
                <span className="pf-link">Leer artículo →</span>
              </Link>

              <Link href="/blog/dotacion-headcount-chile" className="op-strip">
                <div className="op-ico">
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="#c4b5fd" strokeWidth="1.5">
                    <path d="M10 3c0 0-5 3-5 8a5 5 0 0 0 10 0c0-5-5-8-5-8z"/>
                    <path d="M10 9v3M10 13.5v.5"/>
                  </svg>
                </div>
                <div>
                  <div className="op-kicker">Opinión · Juan Alegría</div>
                  <div className="op-title">
                    ¿Por qué en Chile seguimos confundiendo dotación con headcount?
                  </div>
                  <div className="op-link">Leer columna →</div>
                </div>
              </Link>
            </div>

            <div className="posts-col">
              {BLOG_LATERAL.map((p) => (
                <Link key={p.slug} href={`/blog/${p.slug}`} className="post-sm">
                  <span className={`ps-type ${p.tipo}`}>{p.tipoLabel}</span>
                  <div className="ps-title">{p.title}</div>
                  <span className="ps-link">Leer →</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      <SiteFooter />
    </div>
  );
}

const BLOG_LATERAL = [
  {
    slug: "dictamen-253-21-jornadas-trabajo",
    tipo: "no",
    tipoLabel: "Normativa",
    title: "Dictamen 253/21: lo que cambió en las jornadas de trabajo",
  },
  {
    slug: "jornada-6x1-retail-rrhh",
    tipo: "te",
    tipoLabel: "Tendencias",
    title: "Jornada 6×1 en retail: qué significa para los equipos de RRHH",
  },
  {
    slug: "mix-contratos-jornada-parcial-chile",
    tipo: "guia",
    tipoLabel: "Guía",
    title: "Mix de contratos y jornada parcial: cuándo conviene y cuándo no",
  },
];