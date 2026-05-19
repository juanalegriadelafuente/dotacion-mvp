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

// Paleta por categoría (acento teal para las legales, hueso para las demás)
const catColors: Record<string, { c: string; b: string }> = {
  "Normativa":        { c: "#0F6E56", b: "rgba(15,110,86,0.35)"  },
  "Jurisprudencia":   { c: "#0F6E56", b: "rgba(15,110,86,0.35)"  },
  "Planificación":    { c: "#E8ECEF", b: "rgba(232,236,239,0.18)" },
  "Metodología":      { c: "#E8ECEF", b: "rgba(232,236,239,0.18)" },
  "Retail":           { c: "#E8ECEF", b: "rgba(232,236,239,0.18)" },
  "Salud":            { c: "#E8ECEF", b: "rgba(232,236,239,0.18)" },
  "Casos prácticos":  { c: "#E8ECEF", b: "rgba(232,236,239,0.18)" },
};

const S = `
  @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Geist:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');
  *,*::before,*::after { box-sizing:border-box; margin:0; padding:0; }
  body {
    font-family: 'Geist', system-ui, sans-serif;
    background: #0D1B2A;
    color: #E8ECEF;
    -webkit-font-smoothing: antialiased;
  }
  a { text-decoration:none; color:inherit; }
  ::selection { background:#0F6E56; color:#E8ECEF; }

  /* ── Hero ── */
  .art-hero {
    background: #0F2436;
    border-bottom: 1px solid rgba(232,236,239,0.10);
    padding: 56px 40px 64px;
  }
  .art-hero-in { max-width: 760px; margin: 0 auto; }

  .back {
    display: inline-flex; align-items: center; gap: 6px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px; letter-spacing: 0.10em; text-transform: uppercase;
    color: rgba(232,236,239,0.40); margin-bottom: 32px;
    transition: color .25s ease;
  }
  .back:hover { color: #E8ECEF; }

  /* Tag pill */
  .art-tag {
    font-family: 'JetBrains Mono', monospace;
    font-size: 10px; letter-spacing: .08em; text-transform: uppercase;
    padding: 2px 8px; border-radius: 2px; border: 1px solid;
    display: inline-block; margin-bottom: 20px;
  }

  /* Título */
  .art-h1 {
    font-family: 'Instrument Serif', serif;
    font-size: clamp(30px, 4.5vw, 52px);
    font-weight: 400; color: #E8ECEF;
    letter-spacing: -0.01em; line-height: 1.06; margin-bottom: 20px;
  }

  /* Meta */
  .art-meta {
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px; color: rgba(232,236,239,0.40);
    display: flex; gap: 12px; align-items: center;
    letter-spacing: 0.08em; text-transform: uppercase;
  }
  .art-dot { width: 3px; height: 3px; border-radius: 50%; background: rgba(232,236,239,0.25); }

  /* ── Body ── */
  .art-body { max-width: 760px; margin: 0 auto; padding: 56px 40px; }

  /* Lead / excerpt */
  .art-lead {
    font-family: 'Instrument Serif', serif;
    font-size: clamp(17px, 2.2vw, 21px);
    font-style: italic;
    color: rgba(232,236,239,0.72);
    line-height: 1.55; margin-bottom: 32px;
    padding-bottom: 32px;
    border-bottom: 1px solid rgba(232,236,239,0.10);
  }

  /* ── CTA top ── */
  .cta-top {
    background: rgba(15,110,86,0.09);
    border: 1px solid rgba(15,110,86,0.25);
    border-radius: 4px;
    padding: 18px 22px;
    display: flex; align-items: center; justify-content: space-between;
    gap: 16px; margin-bottom: 48px; flex-wrap: wrap;
  }
  .cta-top-t { font-size: 14px; font-weight: 500; color: #E8ECEF; }
  .cta-top-s {
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px; color: rgba(232,236,239,0.45);
    margin-top: 4px; letter-spacing: 0.06em;
  }
  .cta-top-btn {
    background: #0F6E56; color: #F5F1E8;
    padding: 10px 20px; border-radius: 2px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 12px; font-weight: 500; letter-spacing: 0.08em;
    white-space: nowrap; transition: background .2s ease;
  }
  .cta-top-btn:hover { background: #168A6C; }

  /* ── Prose ── */
  .prose h2 {
    font-family: 'Instrument Serif', serif;
    font-size: clamp(22px, 3vw, 32px); font-weight: 400;
    color: #E8ECEF; letter-spacing: -0.01em;
    margin: 52px 0 16px; line-height: 1.1;
  }
  .prose h3 {
    font-family: 'Instrument Serif', serif;
    font-size: 22px; font-weight: 400;
    color: #E8ECEF; margin: 40px 0 12px; line-height: 1.2;
  }
  .prose h4 {
    font-size: 15px; font-weight: 600;
    color: #E8ECEF; margin: 30px 0 10px;
    font-family: 'JetBrains Mono', monospace;
    letter-spacing: 0.06em; text-transform: uppercase;
  }
  .prose p {
    font-size: 16px; color: rgba(232,236,239,0.80);
    line-height: 1.75; margin: 16px 0; font-weight: 300;
  }
  .prose ul, .prose ol { padding-left: 24px; margin: 16px 0; }
  .prose li {
    font-size: 15px; color: rgba(232,236,239,0.75);
    line-height: 1.7; margin: 6px 0; font-weight: 300;
  }
  .prose blockquote {
    border-left: 2px solid #0F6E56;
    padding-left: 20px; margin: 28px 0;
    color: rgba(232,236,239,0.60); font-style: italic;
  }
  .prose code {
    background: rgba(232,236,239,0.08);
    padding: 2px 7px; border-radius: 3px;
    font-size: 13px; font-family: 'JetBrains Mono', monospace;
    color: #E8ECEF;
  }
  .prose pre {
    background: #061421;
    border: 1px solid rgba(232,236,239,0.10);
    border-radius: 4px; overflow: hidden; margin: 28px 0;
  }
  .prose pre .lang {
    padding: 8px 16px;
    background: rgba(232,236,239,0.04);
    font-family: 'JetBrains Mono', monospace;
    font-size: 10px; color: rgba(232,236,239,0.35);
    border-bottom: 1px solid rgba(232,236,239,0.08);
    letter-spacing: 0.12em; text-transform: uppercase;
  }
  .prose pre code {
    background: none; padding: 16px; display: block;
    font-size: 13px; color: rgba(232,236,239,0.85); line-height: 1.65;
  }
  .prose hr {
    border: none;
    border-top: 1px solid rgba(232,236,239,0.10);
    margin: 44px 0;
  }
  .prose .callout {
    background: rgba(15,110,86,0.10);
    border: 1px solid rgba(15,110,86,0.25);
    border-radius: 4px; padding: 18px 20px; margin: 24px 0;
    font-size: 14px; color: rgba(232,236,239,0.85); line-height: 1.65;
  }
  .prose strong { font-weight: 600; color: #E8ECEF; }
  .prose a {
    color: #0F6E56; text-decoration: underline;
    text-underline-offset: 3px; transition: color .2s ease;
  }
  .prose a:hover { color: #168A6C; }
  figure figcaption {
    font-family: 'JetBrains Mono', monospace;
    text-align: center; font-size: 11px;
    color: rgba(232,236,239,0.35); margin-top: 10px;
    letter-spacing: 0.08em; text-transform: uppercase;
  }

  /* ── CTA bottom ── */
  .cta-bot {
    background: #0F2436;
    border: 1px solid rgba(232,236,239,0.10);
    border-radius: 4px; padding: 40px; margin-top: 56px;
  }
  .cta-bot-h {
    font-family: 'Instrument Serif', serif;
    font-size: 28px; font-weight: 400; color: #E8ECEF;
    margin-bottom: 10px; line-height: 1.1;
  }
  .cta-bot-s {
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px; color: rgba(232,236,239,0.45);
    margin-bottom: 28px; letter-spacing: 0.06em;
  }
  .cta-bot-btns { display: flex; gap: 10px; flex-wrap: wrap; }
  .cta-bot-p {
    display: inline-flex; align-items: center; gap: 6px;
    background: #0F6E56; color: #F5F1E8;
    padding: 12px 22px; border-radius: 2px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 12px; font-weight: 500; letter-spacing: 0.08em;
    transition: background .2s ease;
  }
  .cta-bot-p:hover { background: #168A6C; }
  .cta-bot-s2 {
    display: inline-flex; align-items: center; gap: 6px;
    background: transparent;
    border: 1px solid rgba(232,236,239,0.14);
    color: rgba(232,236,239,0.80);
    padding: 11px 18px; border-radius: 2px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 12px; font-weight: 400; letter-spacing: 0.08em;
    transition: background .2s ease, border-color .2s ease;
  }
  .cta-bot-s2:hover { background: rgba(232,236,239,0.05); border-color: rgba(232,236,239,0.28); }

  /* ── Back bottom ── */
  .art-back-bottom {
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px; color: rgba(232,236,239,0.40);
    display: inline-flex; align-items: center; gap: 6px;
    letter-spacing: 0.10em; text-transform: uppercase;
    transition: color .25s ease;
  }
  .art-back-bottom:hover { color: #E8ECEF; }

  @media (max-width: 768px) {
    .art-hero, .art-body { padding-left: 20px; padding-right: 20px; }
    .cta-top { flex-direction: column; align-items: flex-start; }
    .cta-bot { padding: 28px 20px; }
  }
`;

// ── Texto con formato inline ──────────────────────────────────────────────────

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

type ListGroup   = { kind: "list"; type: "bullet" | "numbered"; items: NotionBlock[] };
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
              <figure key={i} style={{ margin: "28px 0" }}>
                <img
                  src={block.url}
                  alt={block.caption ?? ""}
                  style={{ width: "100%", borderRadius: 4, border: "1px solid rgba(232,236,239,0.10)" }}
                />
                {block.caption && (
                  <figcaption>{block.caption}</figcaption>
                )}
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
    <div style={{ fontFamily: "'Geist', system-ui, sans-serif", background: "#0D1B2A" }}>
      <style dangerouslySetInnerHTML={{ __html: S }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <SiteNav />

      {/* HERO */}
      <div className="art-hero">
        <div className="art-hero-in">
          <Link href="/blog" className="back">
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Volver al blog
          </Link>
          <span
            className="art-tag"
            style={{
              color:       cc?.c ?? "#E8ECEF",
              borderColor: cc?.b ?? "rgba(232,236,239,0.18)",
            }}
          >
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

        {/* Lead */}
        <p className="art-lead">{post.excerpt}</p>

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
        <div style={{ borderTop: "1px solid rgba(232,236,239,0.10)", paddingTop: 28, marginTop: 28 }}>
          <Link href="/blog" className="art-back-bottom">
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