// src/app/blog/page.tsx
import Link from "next/link";
import { getBlogPosts, type BlogPost } from "@/lib/notion-blog";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";

export const revalidate = 3600;

const catColors: Record<string, { c: string; b: string }> = {
  "Metodología":      { c: "#1E40AF", b: "#DBEAFE" },
  "Planificación":    { c: "#065F46", b: "#D1FAE5" },
  "Normativa":        { c: "#92400E", b: "#FEF3C7" },
  "Retail":           { c: "#1B4332", b: "#D8F3DC" },
  "Salud":            { c: "#991B1B", b: "#FEE2E2" },
  "Casos prácticos":  { c: "#6B21A8", b: "#F3E8FF" },
};

const S = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;600;700;800&family=DM+Mono:wght@400;500&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
  body{font-family:'Sora',sans-serif;background:#FAFAF7;}
  a{text-decoration:none;color:inherit;}

  .hero{background:#0C1F15;padding:64px 40px 72px;position:relative;overflow:hidden;}
  .hero::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse at 70% 50%,rgba(82,183,136,.12) 0%,transparent 60%);pointer-events:none;}
  .hero-in{max-width:960px;margin:0 auto;position:relative;}
  .eyebrow{font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#52B788;margin-bottom:18px;}
  .h1{font-size:clamp(32px,5vw,52px);font-weight:800;line-height:1.06;letter-spacing:-.04em;color:#fff;margin-bottom:14px;}
  .h1 span{color:#52B788;}
  .hsub{font-size:16px;color:rgba(255,255,255,.5);font-weight:300;line-height:1.6;max-width:500px;}

  .body{max-width:960px;margin:0 auto;padding:64px 40px;}
  .sec-label{font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#2D6A4F;margin-bottom:16px;}

  /* Featured */
  .featured-card{background:#fff;border:1.5px solid #E5E3DB;border-radius:16px;overflow:hidden;display:flex;margin-bottom:56px;}
  .fc-bar{width:4px;background:#1B4332;flex-shrink:0;}
  .fc-body{padding:36px 40px;flex:1;}
  .fc-meta{display:flex;align-items:center;gap:10px;margin-bottom:16px;}
  .fc-tag{font-size:10px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;padding:4px 12px;border-radius:100px;border:1.5px solid;}
  .fc-time{font-size:12px;color:#9CA3AF;}
  .fc-title{font-size:clamp(20px,3vw,28px);font-weight:800;color:#111;letter-spacing:-.02em;line-height:1.2;margin-bottom:10px;}
  .fc-excerpt{font-size:14px;color:#6B7280;line-height:1.65;font-weight:300;margin-bottom:20px;max-width:600px;}
  .fc-link{font-size:13px;font-weight:700;color:#2D6A4F;display:inline-flex;align-items:center;gap:4px;}

  /* Grid */
  .grid{display:grid;grid-template-columns:repeat(2,1fr);gap:16px;}
  .gcard{background:#fff;border:1.5px solid #E5E3DB;border-radius:14px;padding:28px;display:block;transition:border-color .2s,transform .2s;}
  .gcard:hover{border-color:#52B788;transform:translateY(-2px);}
  .gc-meta{display:flex;align-items:center;gap:8px;margin-bottom:12px;}
  .gc-title{font-size:16px;font-weight:700;color:#111;line-height:1.35;margin-bottom:8px;}
  .gc-excerpt{font-size:13px;color:#6B7280;line-height:1.6;font-weight:300;}
  .gc-link{font-size:12px;font-weight:700;color:#2D6A4F;margin-top:14px;display:inline-flex;align-items:center;gap:3px;}

  /* CTA */
  .cta{background:#0C1F15;border-radius:16px;padding:44px 48px;text-align:center;margin-top:64px;}
  .cta-h{font-size:22px;font-weight:800;color:#fff;margin-bottom:8px;}
  .cta-s{font-size:14px;color:rgba(255,255,255,.5);font-weight:300;margin-bottom:24px;}
  .cta-form{display:flex;max-width:380px;margin:0 auto;border:1.5px solid rgba(255,255,255,.15);border-radius:9px;overflow:hidden;}
  .cta-input{flex:1;border:none;outline:none;padding:12px 16px;font-size:13px;background:rgba(255,255,255,.06);color:#fff;font-family:'Sora',sans-serif;}
  .cta-input::placeholder{color:rgba(255,255,255,.3);}
  .cta-btn{background:#52B788;color:#0C1F15;padding:12px 18px;border:none;cursor:pointer;font-size:13px;font-weight:700;font-family:'Sora',sans-serif;}

  @media(max-width:768px){
    .hero,.body{padding-left:20px;padding-right:20px;}
    .featured-card{flex-direction:column;}
    .fc-bar{width:100%;height:4px;}
    .grid{grid-template-columns:1fr;}
    .cta{padding:32px 20px;}
  }
`;

export default async function BlogIndex() {
  const posts = await getBlogPosts();
  const featured = posts.find(p => p.featured) ?? posts[0];
  const rest = posts.filter(p => p.id !== featured?.id);

  return (
    <div style={{ fontFamily: "'Sora', sans-serif", background: "#FAFAF7" }}>
      <style dangerouslySetInnerHTML={{ __html: S }} />
      <SiteNav />

      {/* HERO */}
      <div className="hero">
        <div className="hero-in">
          <div className="eyebrow">Recursos gratuitos</div>
          <h1 className="h1">Guías de dotación para<br /><span>RRHH en Chile</span></h1>
          <p className="hsub">Metodologías, normativa y casos prácticos para jefes de RRHH, consultores y directivos en retail, salud y servicios.</p>
        </div>
      </div>

      <div className="body">

        {posts.length === 0 && (
          <p style={{ textAlign: "center", color: "#9CA3AF", padding: "80px 0" }}>No hay artículos publicados todavía.</p>
        )}

        {/* Artículo destacado */}
        {featured && (
          <div>
            <div className="sec-label">Artículo destacado</div>
            <Link href={`/blog/${featured.slug}`} className="featured-card">
              <div className="fc-bar" />
              <div className="fc-body">
                <div className="fc-meta">
                  <span className="fc-tag" style={{
                    color: catColors[featured.category]?.c ?? "#374151",
                    borderColor: catColors[featured.category]?.c ?? "#D1D5DB",
                    background: catColors[featured.category]?.b ?? "#F9FAFB",
                  }}>
                    {featured.category}
                  </span>
                  <span className="fc-time">{featured.readTime} de lectura</span>
                </div>
                <h2 className="fc-title">{featured.title}</h2>
                <p className="fc-excerpt">{featured.excerpt}</p>
                <div className="fc-link">Leer artículo →</div>
              </div>
            </Link>
          </div>
        )}

        {/* Resto */}
        {rest.length > 0 && (
          <div>
            <div className="sec-label">Más artículos</div>
            <div className="grid">
              {rest.map((post: BlogPost) => {
                const cc = catColors[post.category];
                return (
                  <Link key={post.id} href={`/blog/${post.slug}`} className="gcard">
                    <div className="gc-meta">
                      <span className="fc-tag" style={{
                        color: cc?.c ?? "#374151",
                        borderColor: cc?.c ?? "#D1D5DB",
                        background: cc?.b ?? "#F9FAFB",
                        fontSize: "10px", fontWeight: 700, letterSpacing: ".07em",
                        textTransform: "uppercase", padding: "3px 10px",
                        borderRadius: "100px", border: "1.5px solid",
                      }}>
                        {post.category}
                      </span>
                      <span style={{ fontSize: 12, color: "#9CA3AF" }}>{post.readTime}</span>
                    </div>
                    <div className="gc-title">{post.title}</div>
                    <div className="gc-excerpt">{post.excerpt}</div>
                    <div className="gc-link">Leer →</div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="cta">
          <h2 className="cta-h">¿Quieres más guías como estas?</h2>
          <p className="cta-s">Nuevos artículos, plantillas y novedades normativas directo en tu correo. Sin spam.</p>
          <div className="cta-form">
            <input type="email" placeholder="tu@correo.cl" className="cta-input" />
            <button className="cta-btn">Suscribirme</button>
          </div>
        </div>
      </div>

      <SiteFooter />
    </div>
  );
}