// src/app/blog/[slug]/page.tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getBlogPost, getBlogSlugs, type NotionBlock } from "@/lib/notion-blog";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";

export const revalidate = 3600;

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPost(slug);
  if (!post) return { title: "Artículo no encontrado" };
  return {
    title: `${post.title} — dotaciones.cl`,
    description: post.metaDescription,
    alternates: { canonical: `https://dotaciones.cl/blog/${slug}` },
    openGraph: {
      title: post.title, description: post.metaDescription,
      url: `https://dotaciones.cl/blog/${slug}`, type: "article",
      authors: ["https://dotaciones.cl"],
    },
  };
}

export async function generateStaticParams() {
  const slugs = await getBlogSlugs();
  return slugs.map((slug) => ({ slug }));
}

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

  .art-hero{background:#0C1F15;padding:56px 40px 64px;}
  .art-hero-in{max-width:760px;margin:0 auto;}
  .back{display:inline-flex;align-items:center;gap:6px;font-size:12px;color:rgba(255,255,255,.45);margin-bottom:28px;}
  .back:hover{color:rgba(255,255,255,.8);}
  .art-tag{font-size:10px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;padding:4px 12px;border-radius:100px;border:1.5px solid;display:inline-block;margin-bottom:16px;}
  .art-h1{font-size:clamp(26px,4vw,44px);font-weight:800;color:#fff;letter-spacing:-.03em;line-height:1.08;margin-bottom:16px;}
  .art-meta{font-size:12px;color:rgba(255,255,255,.4);display:flex;gap:10px;align-items:center;}
  .art-dot{width:3px;height:3px;border-radius:50%;background:rgba(255,255,255,.25);}

  .art-body{max-width:760px;margin:0 auto;padding:56px 40px;}

  /* CTA top */
  .cta-top{background:#0C1F15;border-radius:12px;padding:18px 22px;display:flex;align-items:center;justify-content:space-between;gap:16px;margin-bottom:48px;flex-wrap:wrap;}
  .cta-top-t{font-size:13px;font-weight:600;color:#fff;}
  .cta-top-s{font-size:12px;color:rgba(255,255,255,.45);margin-top:2px;}
  .cta-top-btn{background:#52B788;color:#0C1F15;padding:10px 20px;border-radius:8px;font-size:13px;font-weight:700;white-space:nowrap;}

  /* Content */
  .prose h2{font-size:clamp(18px,2.5vw,24px);font-weight:800;color:#111;letter-spacing:-.02em;margin:48px 0 14px;}
  .prose h3{font-size:18px;font-weight:700;color:#111;margin:36px 0 10px;}
  .prose h4{font-size:16px;font-weight:700;color:#111;margin:28px 0 8px;}
  .prose p{font-size:16px;color:#374151;line-height:1.75;margin:14px 0;font-weight:300;}
  .prose ul,.prose ol{padding-left:24px;margin:14px 0;}
  .prose li{font-size:15px;color:#374151;line-height:1.7;margin:6px 0;font-weight:300;}
  .prose blockquote{border-left:3px solid #52B788;padding-left:18px;margin:20px 0;color:#6B7280;font-style:italic;}
  .prose code{background:#F3F4F6;padding:2px 7px;border-radius:5px;font-size:13px;font-family:'DM Mono',monospace;color:#111;}
  .prose pre{background:#111;border-radius:10px;overflow:hidden;margin:20px 0;}
  .prose pre .lang{padding:8px 16px;background:#1A1A1A;font-size:11px;color:#555;font-family:'DM Mono',monospace;}
  .prose pre code{background:none;padding:16px;display:block;font-size:13px;color:#ddd;line-height:1.65;}
  .prose hr{border:none;border-top:1.5px solid #E5E3DB;margin:36px 0;}
  .prose .callout{background:#F0FDF4;border:1px solid #BBF7D0;border-radius:10px;padding:16px 20px;margin:20px 0;font-size:14px;color:#166534;line-height:1.65;}
  .prose strong{font-weight:700;color:#111;}
  .prose a{color:#2D6A4F;text-decoration:underline;text-underline-offset:3px;}

  /* CTA bottom */
  .cta-bot{background:#0C1F15;border-radius:16px;padding:40px;margin-top:56px;}
  .cta-bot-h{font-size:20px;font-weight:800;color:#fff;margin-bottom:8px;}
  .cta-bot-s{font-size:13px;color:rgba(255,255,255,.45);font-weight:300;margin-bottom:24px;}
  .cta-bot-btns{display:flex;gap:10px;flex-wrap:wrap;}
  .cta-bot-p{display:inline-flex;align-items:center;gap:6px;background:#52B788;color:#0C1F15;padding:12px 22px;border-radius:8px;font-size:13px;font-weight:700;}
  .cta-bot-s2{display:inline-flex;align-items:center;gap:6px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.14);color:rgba(255,255,255,.8);padding:11px 18px;border-radius:8px;font-size:13px;font-weight:500;}

  @media(max-width:768px){
    .art-hero,.art-body{padding-left:20px;padding-right:20px;}
    .cta-top{flex-direction:column;align-items:flex-start;}
  }
`;

// ── Renderizador de texto con formato ─────────────────────────────────────────

function RichText({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\)|`[^`]+`)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**"))
          return <strong key={i}>{part.slice(2, -2)}</strong>;
        if (part.startsWith("`") && part.endsWith("`"))
          return <code key={i}>{part.slice(1, -1)}</code>;
        const lm = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
        if (lm) return <a key={i} href={lm[2]}>{lm[1]}</a>;
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

// ── Tipos de agrupación ───────────────────────────────────────────────────────

type ListGroup  = { kind: "list"; type: "bullet" | "numbered"; items: NotionBlock[] };
type SingleBlock = { kind: "block"; block: NotionBlock };
type GroupEntry  = ListGroup | SingleBlock;

// ── Contenido Notion ──────────────────────────────────────────────────────────

function NotionContent({ blocks }: { blocks: NotionBlock[] }) {
  const groups: GroupEntry[] = [];
  for (const block of blocks) {
    if (block.type === "bullet" || block.type === "numbered") {
      const last = groups[groups.length - 1];
      if (last && last.kind === "list" && last.type === block.type) {
        last.items.push(block);
      } else {
        groups.push({ kind: "list", type: block.type, items: [block] });
      }
    } else {
      groups.push({ kind: "block", block });
    }
  }

  return (
    <div className="prose">
      {groups.map((entry, i) => {
        if (entry.kind === "list") {
          if (entry.type === "bullet") {
            return (
              <ul key={i}>
                {entry.items.map((item, j) => (
                  <li key={j}><RichText text={item.text ?? ""} /></li>
                ))}
              </ul>
            );
          }
          return (
            <ol key={i}>
              {entry.items.map((item, j) => (
                <li key={j}><RichText text={item.text ?? ""} /></li>
              ))}
            </ol>
          );
        }

        const { block } = entry;
        switch (block.type) {
          case "heading":
            if (block.level === 1) return <h2 key={i}>{block.text}</h2>;
            if (block.level === 2) return <h3 key={i}>{block.text}</h3>;
            return <h4 key={i}>{block.text}</h4>;
          case "paragraph":
            if (!block.text?.trim()) return null;
            return <p key={i}><RichText text={block.text} /></p>;
          case "code":
            return (
              <pre key={i}>
                <div className="lang">{block.language}</div>
                <code>{block.text}</code>
              </pre>
            );
          case "quote":
            return <blockquote key={i}>{block.text}</blockquote>;
          case "callout":
            return <div key={i} className="callout"><RichText text={block.text ?? ""} /></div>;
          case "divider":
            return <hr key={i} />;
          case "image":
            return (
              <figure key={i} style={{ margin: "24px 0" }}>
                <img src={block.url} alt={block.caption ?? ""} style={{ width: "100%", borderRadius: 10, border: "1px solid #E5E3DB" }} />
                {block.caption && <figcaption style={{ textAlign: "center", fontSize: 12, color: "#9CA3AF", marginTop: 8 }}>{block.caption}</figcaption>}
              </figure>
            );
          default:
            return null;
        }
      })}
    </div>
  );
}

// ── Página ────────────────────────────────────────────────────────────────────

export default async function BlogArticle(
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const post = await getBlogPost(slug);
  if (!post) notFound();

  const cc = catColors[post.category];
  const jsonLd = {
    "@context": "https://schema.org", "@type": "Article",
    headline: post.title, description: post.metaDescription,
    datePublished: post.date,
    author: { "@type": "Organization", name: "dotaciones.cl — Nexwork SpA", url: "https://dotaciones.cl" },
    publisher: { "@type": "Organization", name: "dotaciones.cl", url: "https://dotaciones.cl" },
    mainEntityOfPage: { "@type": "WebPage", "@id": `https://dotaciones.cl/blog/${slug}` },
  };

  return (
    <div style={{ fontFamily: "'Sora', sans-serif", background: "#FAFAF7" }}>
      <style dangerouslySetInnerHTML={{ __html: S }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <SiteNav />

      {/* HERO del artículo */}
      <div className="art-hero">
        <div className="art-hero-in">
          <Link href="/blog" className="back">
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Volver al blog
          </Link>
          <span className="art-tag" style={{
            color: cc?.c ?? "#D8F3DC",
            borderColor: cc?.c ?? "#52B788",
            background: "rgba(82,183,136,0.1)",
          }}>
            {post.category}
          </span>
          <h1 className="art-h1">{post.title}</h1>
          <div className="art-meta">
            <span>{post.date}</span>
            <div className="art-dot" />
            <span>{post.readTime} de lectura</span>
          </div>
        </div>
      </div>

      {/* CUERPO */}
      <div className="art-body">

        {/* Excerpt como lead */}
        <p style={{ fontSize: 18, color: "#374151", lineHeight: 1.65, fontWeight: 300, marginBottom: 32, borderBottom: "1.5px solid #E5E3DB", paddingBottom: 32 }}>
          {post.excerpt}
        </p>

        {/* CTA top */}
        <div className="cta-top">
          <div>
            <div className="cta-top-t">¿Prefieres calcularlo directo?</div>
            <div className="cta-top-s">Sin registro. El resultado en segundos.</div>
          </div>
          <Link href="/calculadora" className="cta-top-btn">Ir a la calculadora →</Link>
        </div>

        {/* Contenido desde Notion */}
        <NotionContent blocks={post.content} />

        {/* CTA bottom */}
        <div className="cta-bot">
          <h3 className="cta-bot-h">Calcula tu dotación ahora — es gratis</h3>
          <p className="cta-bot-s">Sin registro. El motor propone todas las combinaciones válidas de contratos en segundos.</p>
          <div className="cta-bot-btns">
            <Link href="/calculadora" className="cta-bot-p">Calculadora Retail / Servicios →</Link>
            <Link href="/san" className="cta-bot-s2">Calculadora SAN →</Link>
          </div>
        </div>

        {/* Nav inferior */}
        <div style={{ borderTop: "1.5px solid #E5E3DB", paddingTop: 28, marginTop: 28 }}>
          <Link href="/blog" style={{ fontSize: 13, fontWeight: 600, color: "#2D6A4F", display: "inline-flex", alignItems: "center", gap: 6 }}>
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Ver todos los artículos
          </Link>
        </div>
      </div>

      <SiteFooter />
    </div>
  );
}