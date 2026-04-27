// src/app/page.tsx
import Link from "next/link";
import type { Metadata } from "next";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: "Calculadora de dotación laboral Chile | dotaciones.cl",
  description:
    "Calcula la dotación óptima para tu equipo: retail, hospitales y finiquito laboral. Gratis, sin registro.",
};

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;600;700;800&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
  body{font-family:'Sora',sans-serif;background:#0C1F15;}
  a{text-decoration:none;color:inherit;}

  /* ── Hero ── */
  .hero{padding:88px 40px 80px;position:relative;overflow:hidden;max-width:1100px;margin:0 auto;}
  .eyebrow{font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#52B788;margin-bottom:20px;display:flex;align-items:center;gap:8px;}
  .eyebrow::before{content:'●';font-size:8px;}
  .h1{font-size:clamp(38px,6vw,68px);font-weight:800;line-height:1.04;letter-spacing:-.04em;color:#fff;margin-bottom:16px;}
  .h1 em{color:#52B788;font-style:normal;}
  .hsub{font-size:17px;color:rgba(255,255,255,.45);font-weight:300;line-height:1.65;max-width:520px;margin-bottom:44px;}

  /* ── Calculadoras grid ── */
  .calcs{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;max-width:1100px;margin:0 auto;padding:0 40px 80px;}
  .calc-card{background:#0f2b1a;border:1.5px solid #1e3d29;border-radius:16px;padding:28px;display:flex;flex-direction:column;gap:16px;transition:border-color .2s,transform .18s;}
  .calc-card:hover{border-color:#52B788;transform:translateY(-3px);}
  .calc-card.accent{border-color:#52B788;background:#0d2a1a;}
  .cc-badge{font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;padding:4px 10px;border-radius:99px;display:inline-flex;align-items:center;gap:5px;width:fit-content;}
  .cc-badge.green{background:#0f3320;color:#52B788;border:1px solid #1e5a35;}
  .cc-badge.new{background:#1a2a0f;color:#86efac;border:1px solid #2a5a1a;}
  .cc-title{font-size:20px;font-weight:800;color:#e8f5e9;letter-spacing:-.02em;line-height:1.2;}
  .cc-desc{font-size:13px;color:#5a8070;line-height:1.65;font-weight:300;flex:1;}
  .cc-link{font-size:13px;font-weight:700;color:#52B788;display:inline-flex;align-items:center;gap:5px;margin-top:4px;}
  .cc-link-btn{background:#52B788;color:#0C1F15;padding:11px 18px;border-radius:8px;font-size:13px;font-weight:700;display:inline-flex;align-items:center;gap:5px;width:fit-content;transition:opacity .15s;}
  .cc-link-btn:hover{opacity:.88;}

  /* ── Divider ── */
  .divider{height:1px;background:#1e3d29;max-width:1100px;margin:0 auto 64px;padding:0 40px;}
  .divider-inner{height:1px;background:#1e3d29;}

  /* ── Blog strip ── */
  .blog-strip{max-width:1100px;margin:0 auto;padding:0 40px 88px;}
  .sec-row{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:24px;}
  .sec-label{font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#52B788;}
  .sec-link{font-size:13px;font-weight:600;color:#5a8070;transition:color .15s;}
  .sec-link:hover{color:#52B788;}
  .blog-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;}
  .bcard{background:#0f2b1a;border:1.5px solid #1e3d29;border-radius:14px;padding:24px;display:block;transition:border-color .2s,transform .18s;}
  .bcard:hover{border-color:#52B788;transform:translateY(-2px);}
  .bc-cat{font-size:10px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;color:#52B788;margin-bottom:10px;}
  .bc-title{font-size:15px;font-weight:700;color:#e8f5e9;line-height:1.35;margin-bottom:8px;}
  .bc-excerpt{font-size:12px;color:#5a8070;line-height:1.6;font-weight:300;}
  .bc-link{font-size:12px;font-weight:700;color:#52B788;margin-top:14px;display:inline-flex;align-items:center;gap:3px;}
  .blog-cta{margin-top:20px;text-align:center;}
  .blog-cta-btn{display:inline-flex;align-items:center;gap:6px;border:1.5px solid #1e3d29;color:#5a8070;padding:11px 24px;border-radius:8px;font-size:13px;font-weight:600;transition:all .15s;font-family:'Sora',sans-serif;}
  .blog-cta-btn:hover{border-color:#52B788;color:#52B788;}

  /* ── Stats bar ── */
  .stats{display:flex;justify-content:center;gap:48px;padding:48px 40px;border-top:1px solid #1e3d29;border-bottom:1px solid #1e3d29;margin-bottom:64px;}
  .stat-num{font-size:28px;font-weight:800;color:#52B788;letter-spacing:-.03em;}
  .stat-lab{font-size:11px;color:#5a8070;font-weight:400;letter-spacing:.06em;text-transform:uppercase;margin-top:4px;}

  @media(max-width:900px){
    .calcs,.blog-grid{grid-template-columns:1fr;}
    .hero,.calcs,.blog-strip{padding-left:20px;padding-right:20px;}
    .stats{flex-wrap:wrap;gap:28px;}
  }
  @media(max-width:600px){
    .hero{padding-top:56px;padding-bottom:48px;}
    .stats{padding:32px 20px;}
  }
`;

export default function Home() {
  return (
    <div style={{ background: "#0C1F15", minHeight: "100vh" }}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <SiteNav />

      {/* ── Hero ── */}
      <div className="hero">
        <div className="eyebrow">Herramienta gratuita · Chile</div>
        <h1 className="h1">
          Calcula cuánta<br />
          gente necesitas.<br />
          <em>De verdad.</em>
        </h1>
        <p className="hsub">
          Mix de contratos, cobertura por día y análisis de dotación.
          Sin registro, sin costo.
        </p>
      </div>

      {/* ── Stats ── */}
      <div className="stats">
        {[
          { num: "+500", lab: "Cálculos realizados" },
          { num: "3",    lab: "Calculadoras disponibles" },
          { num: "100%", lab: "Gratis, sin registro" },
          { num: ".xlsx",lab: "Exportación incluida" },
        ].map((s) => (
          <div key={s.num} style={{ textAlign: "center" }}>
            <div className="stat-num">{s.num}</div>
            <div className="stat-lab">{s.lab}</div>
          </div>
        ))}
      </div>

      {/* ── Calculadoras ── */}
      <div className="calcs">

        {/* Retail */}
        <Link href="/calculadora" className="calc-card">
          <div className="cc-badge green">Retail y servicios</div>
          <div className="cc-title">Calculadora<br />Retail</div>
          <p className="cc-desc">
            Tiendas, supermercados, call centers, restaurantes.
            Dotación por tramo horario y mix de contratos optimizado.
          </p>
          <div className="cc-link">Calcular ahora →</div>
        </Link>

        {/* SAN */}
        <Link href="/san" className="calc-card">
          <div className="cc-badge green">Hospitales y clínicas</div>
          <div className="cc-title">Calculadora<br />SAN</div>
          <p className="cc-desc">
            Normativa SAN MINSAL 2025. RTD, RCD y factores de
            complejidad integrados en tres pasos.
          </p>
          <div className="cc-link">Calcular ahora →</div>
        </Link>

        {/* Finiquito — NUEVO */}
        <Link href="/calculadora/finiquito" className="calc-card accent">
          <div className="cc-badge new">● Nuevo</div>
          <div className="cc-title">Calculadora<br />Finiquito</div>
          <p className="cc-desc">
            Calcula tu finiquito paso a paso: indemnización por años,
            aviso previo y feriado proporcional. Para trabajadores.
          </p>
          <div className="cc-link-btn">
            Calcular mi finiquito →
          </div>
        </Link>

      </div>

      {/* ── Blog ── */}
      <div className="blog-strip">
        <div className="sec-row">
          <div className="sec-label">📖 Desde el blog</div>
          <Link href="/blog" className="sec-link">Ver todos los artículos →</Link>
        </div>

        <div className="blog-grid">
          {BLOG_PREVIEW.map((p) => (
            <Link key={p.slug} href={`/blog/${p.slug}`} className="bcard">
              <div className="bc-cat">{p.cat}</div>
              <div className="bc-title">{p.title}</div>
              <div className="bc-excerpt">{p.excerpt}</div>
              <div className="bc-link">Leer →</div>
            </Link>
          ))}
        </div>

        <div className="blog-cta">
          <Link href="/blog" className="blog-cta-btn">
            Ver todos los artículos del blog →
          </Link>
        </div>
      </div>

      <SiteFooter />
    </div>
  );
}

/* Posts estáticos de preview — reemplazar con fetch a Notion si quieres dinamismo */
const BLOG_PREVIEW = [
  {
    slug: "dotacion-hospitalaria-san",
    cat: "Normativa",
    title: "Cómo calcular dotación hospitalaria según la norma SAN",
    excerpt:
      "Guía práctica del cálculo RTD y RCD con los factores de complejidad MINSAL 2025.",
  },
  {
    slug: "mix-contratos-jornada-parcial-chile",
    cat: "Planificación",
    title: "Mix de contratos y jornada parcial en retail chileno",
    excerpt:
      "Cuándo conviene combinar contratos de 30h, 20h y part-time para optimizar costos.",
  },
  {
    slug: "planificador-turnos-chile",
    cat: "Metodología",
    title: "Planificador de turnos en Chile: cómo armarlo bien",
    excerpt:
      "Errores frecuentes al armar turnos y qué considerar antes de publicar el horario.",
  },
];
