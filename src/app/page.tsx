// src/app/page.tsx
import Link from "next/link";
import type { Metadata } from "next";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: "dotaciones.cl — Calculadora de dotación de personal para Chile",
  description: "Calcula la dotación óptima de tu equipo. Mix de contratos, cobertura por día y análisis IA. Gratis, sin registro. Para retail, servicios y hospitales en Chile.",
  alternates: { canonical: "https://dotaciones.cl" },
};

const S = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;600;700;800&family=DM+Mono:wght@400;500&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
  body{font-family:'Sora',sans-serif;background:#FAFAF7;}
  a{text-decoration:none;color:inherit;}
  :root{
    --g:#0C1F15;--gm:#2D6A4F;--gl:#52B788;--gp:#D8F3DC;
    --ink:#111810;--mu:#6B7280;--bd:#E5E3DB;--wh:#FFFFFF;--cr:#FAFAF7;
  }
  .mono{font-family:'DM Mono',monospace;}

  /* HERO */
  .hero{background:var(--g);padding:72px 40px 80px;position:relative;overflow:hidden;}
  .hero::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse at 80% 50%,rgba(82,183,136,.15) 0%,transparent 60%);pointer-events:none;}
  .hero-in{max-width:960px;margin:0 auto;display:grid;grid-template-columns:1fr 420px;gap:48px;align-items:center;position:relative;}
  .eyebrow{display:inline-flex;align-items:center;gap:7px;font-size:11px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:var(--gl);margin-bottom:24px;}
  .edot{width:5px;height:5px;border-radius:50%;background:var(--gl);animation:pulse 2s infinite;}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
  .h1{font-size:clamp(36px,5.5vw,60px);font-weight:800;line-height:1.02;letter-spacing:-.04em;color:#fff;margin-bottom:20px;}
  .h1 .ac{color:var(--gl);display:block;}
  .hsub{font-size:16px;color:rgba(255,255,255,.55);line-height:1.65;font-weight:300;margin-bottom:36px;}
  .hbtns{display:flex;gap:10px;flex-wrap:wrap;}
  .bp{display:inline-flex;align-items:center;gap:8px;background:var(--gl);color:var(--g);padding:14px 26px;border-radius:9px;font-size:14px;font-weight:700;}
  .bs{display:inline-flex;align-items:center;gap:8px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.14);color:rgba(255,255,255,.8);padding:13px 22px;border-radius:9px;font-size:14px;font-weight:500;}

  /* Hero card */
  .hcard{background:#12291A;border:1px solid rgba(82,183,136,.2);border-radius:16px;overflow:hidden;}
  .hch{padding:14px 18px;border-bottom:1px solid rgba(255,255,255,.06);display:flex;align-items:center;justify-content:space-between;}
  .hcht{font-size:10px;font-weight:600;color:rgba(255,255,255,.35);letter-spacing:.07em;text-transform:uppercase;}
  .hchb{background:rgba(82,183,136,.15);color:var(--gl);border:1px solid rgba(82,183,136,.3);font-size:10px;font-weight:700;padding:3px 10px;border-radius:100px;letter-spacing:.06em;text-transform:uppercase;}
  .hcb{padding:18px;}
  .hcrow{display:flex;justify-content:space-between;align-items:baseline;padding:9px 0;border-bottom:1px solid rgba(255,255,255,.05);}
  .hcrow:last-child{border-bottom:none;}
  .hcl{font-size:12px;color:rgba(255,255,255,.35);}
  .hcv{font-size:13px;font-weight:600;color:#fff;font-family:'DM Mono',monospace;}
  .hcg{color:var(--gl);}
  .hmix{margin-top:10px;background:rgba(82,183,136,.08);border:1px solid rgba(82,183,136,.15);border-radius:10px;padding:12px 14px;}
  .hmixl{font-size:10px;color:rgba(255,255,255,.3);text-transform:uppercase;letter-spacing:.08em;margin-bottom:8px;}
  .hmixr{display:flex;justify-content:space-between;font-size:12px;padding:3px 0;}
  .hmixn{color:rgba(255,255,255,.55);}
  .hmixc{font-weight:700;color:var(--gl);font-family:'DM Mono',monospace;}

  /* STATS */
  .sbar{background:#0F2319;border-top:1px solid rgba(255,255,255,.05);border-bottom:1px solid rgba(255,255,255,.05);}
  .sin{max-width:960px;margin:0 auto;display:grid;grid-template-columns:repeat(4,1fr);}
  .st{padding:24px 0;text-align:center;border-right:1px solid rgba(255,255,255,.05);}
  .st:last-child{border-right:none;}
  .stn{font-size:28px;font-weight:800;color:#fff;font-family:'DM Mono',monospace;letter-spacing:-.03em;}
  .stl{font-size:10px;color:rgba(255,255,255,.35);letter-spacing:.07em;text-transform:uppercase;margin-top:3px;}

  /* SECTIONS */
  .sec{padding:72px 40px;max-width:960px;margin:0 auto;}
  .sel{font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--gm);margin-bottom:10px;}
  .set{font-size:clamp(26px,3.5vw,38px);font-weight:800;color:var(--ink);letter-spacing:-.03em;line-height:1.1;margin-bottom:10px;}
  .ses{font-size:15px;color:var(--mu);font-weight:300;line-height:1.6;max-width:480px;}

  /* SECTOR CARDS */
  .sgrid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-top:36px;}
  .scard{background:var(--wh);border:1.5px solid var(--bd);border-radius:14px;padding:28px;display:block;position:relative;overflow:hidden;transition:border-color .2s,transform .2s,box-shadow .2s;}
  .scard:hover{border-color:var(--gl);transform:translateY(-3px);box-shadow:0 8px 24px rgba(12,31,21,.1);}
  .scbar{position:absolute;top:0;left:0;right:0;height:3px;}
  .sicon{font-size:26px;margin-bottom:14px;}
  .stitle{font-size:15px;font-weight:700;color:var(--ink);margin-bottom:7px;}
  .sdesc{font-size:13px;color:var(--mu);line-height:1.6;}
  .slink{font-size:12px;font-weight:700;color:var(--gm);margin-top:14px;display:inline-flex;align-items:center;gap:3px;}

  /* IA */
  .ia{background:#111;padding:72px 40px;}
  .iain{max-width:960px;margin:0 auto;display:grid;grid-template-columns:1fr 1fr;gap:48px;align-items:center;}
  .iae{font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--gl);margin-bottom:16px;}
  .iah{font-size:clamp(24px,3vw,34px);font-weight:800;color:#fff;letter-spacing:-.03em;line-height:1.1;margin-bottom:14px;}
  .ias{font-size:14px;color:rgba(255,255,255,.45);line-height:1.75;font-weight:300;margin-bottom:28px;}
  .iabtn{display:inline-flex;align-items:center;gap:8px;background:var(--gl);color:var(--g);padding:13px 24px;border-radius:9px;font-size:14px;font-weight:700;}
  .iamock{background:#1A1A1A;border:1px solid #222;border-radius:12px;padding:20px;}
  .iaml{font-size:10px;color:#444;letter-spacing:.08em;text-transform:uppercase;margin-bottom:12px;}
  .iamt{font-size:13px;color:#777;line-height:1.75;font-style:italic;}
  .iamf{margin-top:14px;padding-top:12px;border-top:1px solid #222;font-size:10px;color:#333;}

  /* TESTIMONIOS */
  .tgrid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-top:36px;}
  .tcard{background:var(--wh);border:1.5px solid var(--bd);border-radius:14px;padding:24px;}
  .tq{font-size:14px;color:var(--ink);line-height:1.7;font-style:italic;font-weight:300;margin-bottom:16px;}
  .tq::before{content:'"';color:var(--gl);font-size:22px;font-style:normal;line-height:0;vertical-align:-7px;margin-right:2px;}
  .ta{font-size:12px;font-weight:700;color:var(--ink);}
  .to{font-size:11px;color:var(--mu);margin-top:2px;}

  /* BLOG LIST */
  .blist{border-top:1.5px solid var(--bd);margin-top:32px;}
  .bitem{display:flex;align-items:center;gap:14px;padding:18px 0;border-bottom:1.5px solid var(--bd);}
  .btag{font-size:10px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;padding:4px 11px;border-radius:100px;border:1.5px solid;white-space:nowrap;flex-shrink:0;}
  .btitle{font-size:14px;font-weight:600;color:var(--ink);flex:1;}
  .bdate{font-size:12px;color:var(--mu);white-space:nowrap;}

  /* GUÍA */
  .guia{background:var(--gp);border:1.5px solid rgba(82,183,136,.3);border-radius:18px;padding:44px 52px;display:flex;align-items:center;justify-content:space-between;gap:28px;flex-wrap:wrap;max-width:960px;margin:0 auto 72px;}
  .guiah{font-size:20px;font-weight:800;color:var(--g);letter-spacing:-.01em;margin-bottom:5px;}
  .guias{font-size:14px;color:var(--gm);font-weight:300;}
  .guiaform{display:flex;border:1.5px solid rgba(27,67,50,.25);border-radius:9px;overflow:hidden;}
  .guiainput{border:none;outline:none;padding:11px 16px;font-size:13px;background:#fff;color:var(--ink);width:210px;font-family:'Sora',sans-serif;}
  .guiabtn{background:var(--g);color:#fff;padding:11px 18px;border:none;cursor:pointer;font-size:13px;font-weight:700;font-family:'Sora',sans-serif;border-left:1.5px solid rgba(27,67,50,.25);}

  /* FAQ */
  .flist{background:var(--wh);border:1.5px solid var(--bd);border-radius:14px;overflow:hidden;margin-top:36px;}
  .fitem{padding:20px 26px;border-bottom:1px solid var(--bd);}
  .fitem:last-child{border-bottom:none;}
  .fq{font-size:14px;font-weight:700;color:var(--ink);margin-bottom:5px;}
  .fa{font-size:13px;color:var(--mu);line-height:1.6;font-weight:300;}

  @media(max-width:768px){
    .hero-in,.iain{grid-template-columns:1fr;}
    .hcard{display:none;}
    .sin,.sgrid,.tgrid{grid-template-columns:1fr;}
    .sec,.hero,.ia{padding-left:20px;padding-right:20px;}
    .guia{padding:28px 22px;margin:0 20px 56px;}
    .bitem{flex-wrap:wrap;}
  }
`;

export default function Home() {
  return (
    <div style={{ fontFamily: "'Sora', sans-serif", background: "#FAFAF7" }}>
      <style dangerouslySetInnerHTML={{ __html: S }} />
      <SiteNav />

      {/* HERO */}
      <div className="hero">
        <div className="hero-in">
          <div>
            <div className="eyebrow"><div className="edot" />Herramienta gratuita · Chile</div>
            <h1 className="h1">
              Calcula cuánta<br />gente necesitas.
              <span className="ac">De verdad.</span>
            </h1>
            <p className="hsub">Mix de contratos, cobertura por día<br />y análisis IA. Sin registro, sin costo.</p>
            <div className="hbtns">
              <Link href="/calculadora" className="bp">
                Calculadora Retail →
              </Link>
              <Link href="/san" className="bs">
                Calculadora SAN
              </Link>
            </div>
          </div>

          {/* Mockup resultado */}
          <div className="hcard">
            <div className="hch">
              <span className="hcht">Resultado del cálculo</span>
              <span className="hchb">✓ Óptimo</span>
            </div>
            <div className="hcb">
              {[
                { l: "Horas demanda", v: "280h/sem" },
                { l: "FTE a contratar", v: "7.4", g: true },
                { l: "Factor reemplazo", v: "×1.12" },
                { l: "Cobertura domingo", v: "✓ Cubierto", g: true },
              ].map((r, i) => (
                <div key={i} className="hcrow">
                  <span className="hcl">{r.l}</span>
                  <span className={`hcv${r.g ? " hcg" : ""}`}>{r.v}</span>
                </div>
              ))}
              <div className="hmix">
                <div className="hmixl">Mix sugerido</div>
                <div className="hmixr"><span className="hmixn">42h · Jornada 6×1</span><span className="hmixc">×6</span></div>
                <div className="hmixr"><span className="hmixn">20h · PT fin de semana</span><span className="hmixc">×1</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* STATS */}
      <div className="sbar">
        <div className="sin">
          {[
            { n: "+500", l: "Cálculos realizados" },
            { n: "2", l: "Sectores cubiertos" },
            { n: "100%", l: "Gratis, sin registro" },
            { n: ".xlsx", l: "Exportación incluida" },
          ].map((s, i) => (
            <div key={i} className="st">
              <div className="stn mono">{s.n}</div>
              <div className="stl">{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTORES */}
      <div className="sec">
        <div className="sel">Para quién es</div>
        <h2 className="set">Una herramienta,<br />tres realidades.</h2>
        <p className="ses">Retail, hospitales o consultoría — el motor se adapta a tu operación y genera resultados que puedes presentar a gerencia.</p>
        <div className="sgrid">
          {[
            { icon: "🏪", bar: "#1B4332", title: "Retail y servicios", desc: "Tiendas, supermercados, call centers, restaurantes. Dotación por tramo horario y mix de jornadas óptimo.", href: "/calculadora" },
            { icon: "🏥", bar: "#1E40AF", title: "Hospitales y clínicas", desc: "Normativa SAN MINSAL 2025. RTD, RCD y factores de complejidad integrados en tres etapas.", href: "/san" },
            { icon: "📊", bar: "#92400E", title: "Consultoría RRHH", desc: "Resultados con respaldo de cálculo exportable a Excel. Defendibles ante gerencia o directorio.", href: "/calculadora" },
          ].map((s, i) => (
            <Link key={i} href={s.href} className="scard">
              <div className="scbar" style={{ background: s.bar }} />
              <div className="sicon">{s.icon}</div>
              <div className="stitle">{s.title}</div>
              <div className="sdesc">{s.desc}</div>
              <div className="slink">Calcular ahora →</div>
            </Link>
          ))}
        </div>
      </div>

      {/* IA */}
      <div className="ia">
        <div className="iain">
          <div>
            <div className="iae">✦ Nuevo — IA incluida</div>
            <h2 className="iah">Tu dotación analizada<br />por IA. Gratis.</h2>
            <p className="ias">Calcula → deja tu email → recibes un análisis ejecutivo con alertas legales del Código del Trabajo y cómo presentarlo ante gerencia.</p>
            <Link href="/calculadora" className="iabtn">Probar ahora →</Link>
          </div>
          <div className="iamock">
            <div className="iaml">Ejemplo de análisis</div>
            <p className="iamt">"El mix de 7 personas — 6 contratos 42h en 6×1 más 1 PT fin de semana — cubre 265h/sem con holgura del 4%. Sin riesgo de descubierto dominical según Art. 38 CT..."</p>
            <div className="iamf">Nexwork SpA · Claude · dotaciones.cl</div>
          </div>
        </div>
      </div>

      {/* TESTIMONIOS */}
      <div className="sec" style={{ paddingTop: 0 }}>
        <div className="sel">Lo que dicen quienes lo usan</div>
        <h2 className="set">Resultados reales,<br />en minutos.</h2>
        <div className="tgrid">
          {[
            { q: "Antes tardábamos horas en Excel. Con Dotaciones.cl lo resolvemos en minutos con respaldo defendible.", a: "Jefa de RRHH", o: "Cadena retail, Santiago" },
            { q: "La calculadora SAN nos ayudó a justificar la dotación ante el directorio con números claros y auditables.", a: "Subdirector de Gestión de Personas", o: "Hospital regional, Chile" },
            { q: "Sencilla, rápida y el Excel exportado es exactamente lo que necesitábamos para la valorización.", a: "Consultora de RRHH", o: "Independiente" },
          ].map((t, i) => (
            <div key={i} className="tcard">
              <p className="tq">{t.q}</p>
              <div className="ta">{t.a}</div>
              <div className="to">{t.o}</div>
            </div>
          ))}
        </div>
      </div>

      {/* GUÍA */}
      <div className="guia">
        <div>
          <h3 className="guiah">Recibe la guía de dotación óptima</h3>
          <p className="guias">PDF práctico: calcular, justificar y presentar ante gerencia.</p>
        </div>
        <div className="guiaform">
          <input type="email" placeholder="tu@empresa.cl" className="guiainput" />
          <button className="guiabtn">Quiero la guía</button>
        </div>
      </div>

      {/* BLOG */}
      <div className="sec" style={{ paddingTop: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div className="sel">Recursos gratuitos</div>
            <h2 className="set">Últimos artículos</h2>
          </div>
          <Link href="/blog" style={{ fontSize: 13, fontWeight: 600, color: "#2D6A4F" }}>Ver todos →</Link>
        </div>
        <div className="blist">
          {[
            { tag: "Retail", tc: "#1B4332", tb: "#D8F3DC", date: "Abr 2026", title: "Jornada 6×1 en retail: cuándo conviene y cómo calcular la dotación", href: "/blog/jornada-6x1-retail-chile" },
            { tag: "Metodología", tc: "#1E40AF", tb: "#DBEAFE", date: "Abr 2026", title: "Factor de reemplazo: el cálculo que más se omite al dimensionar dotación", href: "/blog/factor-reemplazo-dotacion-chile" },
            { tag: "Casos prácticos", tc: "#92400E", tb: "#FEF3C7", date: "May 2026", title: "¿Cuántas personas necesita un supermercado en Chile?", href: "/blog/dotacion-supermercado-chile" },
          ].map((a, i) => (
            <Link key={i} href={a.href} className="bitem" style={{ textDecoration: "none" }}>
              <span className="btag" style={{ color: a.tc, borderColor: a.tc, background: a.tb }}>{a.tag}</span>
              <span className="btitle">{a.title}</span>
              <span className="bdate">{a.date} →</span>
            </Link>
          ))}
        </div>
      </div>

      {/* FAQ */}
      <div className="sec" style={{ paddingTop: 0 }}>
        <div className="sel">Preguntas frecuentes</div>
        <h2 className="set">Todo lo que necesitas saber</h2>
        <div className="flist">
          {[
            { q: "¿Para qué sirve la calculadora de dotación?", a: "Para determinar cuántas personas necesitas, en qué jornadas y con qué contrato, considerando la demanda real hora a hora. El resultado es un mix óptimo con respaldo de cálculo." },
            { q: "¿Necesito registrarme?", a: "No. Todas las calculadoras son de acceso libre y gratuito. Solo necesitas email si quieres recibir el análisis IA." },
            { q: "¿Qué incluye el Excel exportado?", a: "Todas las combinaciones válidas ordenadas por eficiencia, con horas, holgura y costo si ingresaste precios. Listo para presentar a gerencia." },
            { q: "¿La calculadora SAN cumple la normativa vigente?", a: "Sí. Incorpora los parámetros RTD/RCD de la OT-SAN MINSAL 2025 y calcula la dotación mínima normativa como punto de partida." },
          ].map((f, i) => (
            <div key={i} className="fitem">
              <div className="fq">{f.q}</div>
              <div className="fa">{f.a}</div>
            </div>
          ))}
        </div>
      </div>

      <SiteFooter />
    </div>
  );
}