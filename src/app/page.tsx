// src/app/page.tsx
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "dotaciones.cl — Calculadora de dotación de personal para Chile",
  description:
    "Calcula la dotación óptima de tu equipo. Mix de contratos, cobertura por día y análisis IA. Gratis, sin registro. Retail, servicios y hospitales.",
  alternates: { canonical: "https://dotaciones.cl" },
};

export default function Home() {
  return (
    <main
      className="min-h-screen bg-[#F7F6F2]"
      style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,700;1,9..40,300&family=DM+Mono:wght@400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; }
        .mono { font-family: 'DM Mono', monospace; }
        .tag {
          display: inline-block;
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          padding: 3px 10px;
          border-radius: 100px;
          border: 1px solid currentColor;
        }
        .btn-primary {
          display: inline-flex; align-items: center; gap: 8px;
          background: #111; color: #fff;
          padding: 13px 24px; border-radius: 8px;
          font-size: 14px; font-weight: 500; text-decoration: none;
          transition: background 0.15s;
        }
        .btn-primary:hover { background: #333; }
        .btn-secondary {
          display: inline-flex; align-items: center; gap: 8px;
          background: transparent; color: #111;
          padding: 12px 24px; border-radius: 8px;
          font-size: 14px; font-weight: 500; text-decoration: none;
          border: 1px solid #ccc;
          transition: border-color 0.15s;
        }
        .btn-secondary:hover { border-color: #999; }
        .card {
          background: #fff;
          border: 1px solid #E8E6DF;
          border-radius: 12px;
          padding: 28px;
        }
        .stat-num {
          font-size: 36px; font-weight: 700;
          letter-spacing: -0.03em;
          color: #111;
          font-family: 'DM Mono', monospace;
        }
        .stat-label {
          font-size: 11px; letter-spacing: 0.08em;
          text-transform: uppercase; color: #999;
          margin-top: 4px;
        }
        .sector-num {
          font-size: 11px; font-weight: 500;
          letter-spacing: 0.08em; color: #bbb;
          text-transform: uppercase;
          margin-bottom: 10px;
        }
        .testimonial-quote {
          font-size: 15px; color: #333;
          line-height: 1.65; font-style: italic;
          margin-bottom: 16px;
        }
        .testimonial-author { font-size: 12px; color: #999; }
        .faq-q { font-size: 14px; font-weight: 500; color: #111; margin-bottom: 6px; }
        .faq-a { font-size: 13px; color: #666; line-height: 1.6; }
        .divider { height: 1px; background: #E8E6DF; }
      `}</style>

      {/* NAV */}
      <nav style={{
        borderBottom: "1px solid #E8E6DF", background: "#F7F6F2",
        padding: "0 32px", height: 52,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        position: "sticky", top: 0, zIndex: 50,
      }}>
        <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: "-0.02em", color: "#111" }}
          className="mono">
          dotaciones<span style={{ color: "#2563EB" }}>.cl</span>
        </span>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <Link href="/blog" style={{ fontSize: 13, color: "#666", textDecoration: "none", padding: "6px 12px" }}>Blog</Link>
          <Link href="/contacto" style={{ fontSize: 13, color: "#666", textDecoration: "none", padding: "6px 12px" }}>Contacto</Link>
          <Link href="/calculadora" className="btn-primary" style={{ padding: "8px 16px", fontSize: 13 }}>
            Calculadora →
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ padding: "80px 32px 64px", maxWidth: 900, margin: "0 auto" }}>

        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 28 }}>
          <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#22c55e" }} />
          <span style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "#888", fontWeight: 500 }}>
            Herramienta gratuita para RRHH · Chile
          </span>
        </div>

        <h1 style={{
          fontSize: "clamp(36px, 6vw, 64px)",
          fontWeight: 700,
          lineHeight: 1.08,
          letterSpacing: "-0.03em",
          color: "#0F0F0D",
          marginBottom: 24,
          maxWidth: 700,
        }}>
          Calcula la dotación<br />
          óptima de tu equipo.
        </h1>

        <p style={{ fontSize: 17, color: "#666", lineHeight: 1.65, maxWidth: 520, marginBottom: 40 }}>
          Mix de contratos, cobertura por día y análisis IA.<br />
          Sin registro, sin costo.
        </p>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Link href="/calculadora" className="btn-primary">
            Calculadora Retail / Servicios
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
          <Link href="/san" className="btn-secondary">
            Calculadora SAN Hospitalaria
            <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </section>

      {/* STATS */}
      <section style={{
        borderTop: "1px solid #E8E6DF", borderBottom: "1px solid #E8E6DF",
        background: "#fff", padding: "0 32px",
      }}>
        <div style={{
          maxWidth: 900, margin: "0 auto",
          display: "grid", gridTemplateColumns: "repeat(4, 1fr)",
        }}>
          {[
            { num: "+500", label: "Cálculos realizados" },
            { num: "2", label: "Sectores cubiertos" },
            { num: "100%", label: "Gratis, sin registro" },
            { num: ".xlsx", label: "Exportación incluida" },
          ].map((s, i) => (
            <div key={i} style={{
              padding: "28px 0",
              borderRight: i < 3 ? "1px solid #E8E6DF" : "none",
              paddingLeft: i > 0 ? 32 : 0,
            }}>
              <div className="stat-num">{s.num}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* SECTORES */}
      <section style={{ padding: "72px 32px 0", maxWidth: 900, margin: "0 auto" }}>
        <p style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "#999", fontWeight: 500, marginBottom: 28 }}>
          Para quién es dotaciones.cl
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 0, border: "1px solid #E8E6DF", borderRadius: 12, overflow: "hidden" }}>
          {[
            {
              n: "01",
              title: "Retail y servicios",
              desc: "Tiendas, supermercados, call centers, restaurantes. Dotación por tramo horario y mix de jornadas óptimo.",
              accent: "#111",
              href: "/calculadora",
            },
            {
              n: "02",
              title: "Hospitales y clínicas",
              desc: "Normativa SAN MINSAL. RTD, RCD y factores de complejidad integrados en tres etapas.",
              accent: "#2563EB",
              href: "/san",
            },
            {
              n: "03",
              title: "Consultoría RRHH",
              desc: "Resultados con respaldo de cálculo exportable. Defendibles ante gerencia o directorio.",
              accent: "#666",
              href: "/calculadora",
            },
          ].map((s, i) => (
            <Link key={i} href={s.href} style={{
              display: "block", padding: 28, textDecoration: "none",
              borderLeft: i > 0 ? "1px solid #E8E6DF" : "none",
              borderTop: `3px solid ${s.accent}`,
              background: i === 1 ? "#FAFAF8" : "#fff",
              transition: "background 0.15s",
            }}>
              <div className="sector-num">{s.n}</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#111", marginBottom: 8 }}>{s.title}</div>
              <div style={{ fontSize: 13, color: "#777", lineHeight: 1.55 }}>{s.desc}</div>
            </Link>
          ))}
        </div>
      </section>

      {/* IA SECTION */}
      <section style={{ padding: "72px 32px 0", maxWidth: 900, margin: "0 auto" }}>
        <div style={{
          background: "#111", borderRadius: 12, padding: "48px",
          display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48, alignItems: "center",
        }}>
          <div>
            <span className="tag" style={{ color: "#888", borderColor: "#333", marginBottom: 20, display: "inline-block" }}>
              Nuevo — IA incluida
            </span>
            <h2 style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.02em", color: "#fff", lineHeight: 1.2, marginBottom: 16 }}>
              Análisis IA de tu dotación, gratis.
            </h2>
            <p style={{ fontSize: 14, color: "#888", lineHeight: 1.65, marginBottom: 28 }}>
              Después de calcular, deja tu email y recibes un análisis ejecutivo con alertas legales del
              Código del Trabajo y cómo presentarlo ante gerencia. Generado por Nexwork SpA.
            </p>
            <Link href="/calculadora" className="btn-primary" style={{ background: "#fff", color: "#111" }}>
              Probar ahora →
            </Link>
          </div>
          <div style={{ background: "#1a1a1a", borderRadius: 8, padding: 24, border: "1px solid #222" }}>
            <div style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "#555", marginBottom: 16 }}>
              Ejemplo de análisis
            </div>
            <p style={{ fontSize: 13, color: "#aaa", lineHeight: 1.7, fontStyle: "italic" }}>
              "El mix recomendado de 7 personas — 6 contratos de 42h en jornada 6×1 más 1 contrato de 20h PT
              fin de semana — cubre las 265h semanales ajustadas con una holgura del 4%..."
            </p>
            <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid #222" }}>
              <div style={{ fontSize: 10, color: "#444", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Nexwork SpA · Powered by Claude
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIOS */}
      <section style={{ padding: "72px 32px 0", maxWidth: 900, margin: "0 auto" }}>
        <p style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "#999", fontWeight: 500, marginBottom: 28 }}>
          Lo que dicen quienes lo usan
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
          {[
            {
              q: "Antes tardábamos horas en Excel. Con Dotaciones.cl lo resolvemos en minutos con respaldo defendible.",
              role: "Jefa de RRHH",
              org: "Cadena retail, Santiago",
            },
            {
              q: "La calculadora SAN nos ayudó a justificar la dotación ante el directorio con números claros y auditables.",
              role: "Subdirector de Gestión de Personas",
              org: "Hospital regional, Chile",
            },
            {
              q: "Sencilla, rápida y el Excel exportado es exactamente lo que necesitábamos para la valorización.",
              role: "Consultora de RRHH",
              org: "Independiente",
            },
          ].map((t, i) => (
            <div key={i} className="card" style={{ borderLeft: "2px solid #E8E6DF" }}>
              <p className="testimonial-quote">"{t.q}"</p>
              <div className="testimonial-author">
                <span style={{ color: "#555", fontWeight: 500 }}>{t.role}</span><br />
                {t.org}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section style={{ padding: "72px 32px 0", maxWidth: 900, margin: "0 auto" }}>
        <p style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "#999", fontWeight: 500, marginBottom: 28 }}>
          Preguntas frecuentes
        </p>
        <div style={{ background: "#fff", border: "1px solid #E8E6DF", borderRadius: 12, overflow: "hidden" }}>
          {[
            {
              q: "¿Para qué sirve la calculadora de dotación?",
              a: "Para determinar cuántas personas necesitas, en qué jornadas y con qué contrato, considerando la demanda real hora por hora. El resultado es un mix óptimo y defendible.",
            },
            {
              q: "¿Necesito registrarme?",
              a: "No. Todas las calculadoras son de acceso libre y gratuito. El email solo es necesario si quieres recibir el análisis IA.",
            },
            {
              q: "¿Qué incluye el Excel exportado?",
              a: "Todas las combinaciones válidas de contratos ordenadas por eficiencia, con horas, holgura y costo si ingresaste precios. Listo para presentar.",
            },
            {
              q: "¿La calculadora SAN cumple la normativa vigente?",
              a: "Sí. Incorpora los parámetros RTD/RCD de la OT-SAN MINSAL 2025 y calcula la dotación mínima normativa como punto de partida.",
            },
          ].map((f, i, arr) => (
            <div key={i} style={{
              padding: "20px 28px",
              borderBottom: i < arr.length - 1 ? "1px solid #E8E6DF" : "none",
            }}>
              <div className="faq-q">{f.q}</div>
              <div className="faq-a">{f.a}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA GUÍA */}
      <section style={{ padding: "72px 32px 0", maxWidth: 900, margin: "0 auto" }}>
        <div style={{
          background: "#fff", border: "1px solid #E8E6DF", borderRadius: 12,
          padding: "40px 48px",
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 32, flexWrap: "wrap",
        }}>
          <div>
            <h3 style={{ fontSize: 18, fontWeight: 600, color: "#111", letterSpacing: "-0.01em", marginBottom: 6 }}>
              Recibe la guía de dotación óptima
            </h3>
            <p style={{ fontSize: 13, color: "#888" }}>
              PDF práctico: cómo calcular, justificar y presentar tu dotación ante gerencia.
            </p>
          </div>
          <div style={{ display: "flex", gap: 0, border: "1px solid #ccc", borderRadius: 8, overflow: "hidden" }}>
            <input
              type="email"
              placeholder="tu@empresa.cl"
              style={{
                border: "none", outline: "none", padding: "11px 16px",
                fontSize: 13, background: "#fff", color: "#111", width: 220,
                fontFamily: "'DM Sans', system-ui, sans-serif",
              }}
            />
            <button style={{
              padding: "11px 18px", background: "#111", color: "#fff",
              fontSize: 13, fontWeight: 500, border: "none", cursor: "pointer",
              fontFamily: "'DM Sans', system-ui, sans-serif",
              borderLeft: "1px solid #ccc",
            }}>
              Quiero la guía
            </button>
          </div>
        </div>
      </section>

      {/* BLOG PREVIEW */}
      <section style={{ padding: "72px 32px 0", maxWidth: 900, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
          <p style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "#999", fontWeight: 500 }}>
            Últimos artículos
          </p>
          <Link href="/blog" style={{ fontSize: 12, color: "#666", textDecoration: "none" }}>Ver todos →</Link>
        </div>
        <div style={{ borderTop: "1px solid #E8E6DF" }}>
          {[
            { tag: "Retail", date: "Abr 2026", title: "Jornada 6×1 en retail: cuándo conviene y cómo calcular la dotación", href: "/blog/jornada-6x1-retail-chile" },
            { tag: "Metodología", date: "Abr 2026", title: "Factor de reemplazo: el cálculo que más se omite al dimensionar dotación", href: "/blog/factor-reemplazo-dotacion-chile" },
            { tag: "Casos prácticos", date: "May 2026", title: "¿Cuántas personas necesita un supermercado en Chile?", href: "/blog/dotacion-supermercado-chile" },
          ].map((a, i) => (
            <Link key={i} href={a.href} style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "18px 0", borderBottom: "1px solid #E8E6DF",
              textDecoration: "none", gap: 16,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16, flex: 1 }}>
                <span style={{
                  fontSize: 10, fontWeight: 500, letterSpacing: "0.08em",
                  textTransform: "uppercase", color: "#888", whiteSpace: "nowrap",
                  background: "#F7F6F2", border: "1px solid #E8E6DF",
                  borderRadius: 100, padding: "2px 10px",
                }}>
                  {a.tag}
                </span>
                <span style={{ fontSize: 14, fontWeight: 500, color: "#111" }}>{a.title}</span>
              </div>
              <span style={{ fontSize: 12, color: "#bbb", whiteSpace: "nowrap" }}>{a.date} →</span>
            </Link>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{
        borderTop: "1px solid #E8E6DF", padding: "28px 32px",
        marginTop: 72,
        display: "flex", justifyContent: "space-between", alignItems: "center",
        flexWrap: "wrap", gap: 12,
      }}>
        <span style={{ fontSize: 12, color: "#aaa" }}>
          © {new Date().getFullYear()} dotaciones.cl ·{" "}
          <span style={{ color: "#888", fontWeight: 500 }}>Nexwork SpA</span>
        </span>
        <div style={{ display: "flex", gap: 20 }}>
          {[
            { label: "Calculadora", href: "/calculadora" },
            { label: "SAN", href: "/san" },
            { label: "Blog", href: "/blog" },
            { label: "Contacto", href: "/contacto" },
            { label: "Privacidad", href: "/privacidad" },
          ].map((l) => (
            <Link key={l.href} href={l.href} style={{ fontSize: 12, color: "#aaa", textDecoration: "none" }}>
              {l.label}
            </Link>
          ))}
        </div>
      </footer>
    </main>
  );
}