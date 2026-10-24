// src/app/blog/[slug]/page.tsx

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import SiteFooter from "@/components/SiteFooter";
import SiteNav from "@/components/SiteNav";
import { getBlogPost, getBlogSlugs, type NotionBlock } from "@/lib/notion-blog";
import { URL_REVISAR } from "@/lib/sitio";

export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPost(slug);
  if (!post) return { title: "Artículo no encontrado" };
  return {
    title: post.title,
    description: post.metaDescription,
    alternates: { canonical: `https://dotaciones.cl/blog/${slug}` },
    openGraph: {
      title: post.title,
      description: post.metaDescription,
      url: `https://dotaciones.cl/blog/${slug}`,
      type: "article",
      authors: ["https://dotaciones.cl"],
    },
  };
}

export async function generateStaticParams() {
  const slugs = await getBlogSlugs();
  return slugs.map((slug) => ({ slug }));
}

const S = `
  /* Sin resets globales: Tailwind ya los trae, y uno sin capa pisaría sus utilidades. */
  ::selection { background:#E0DCFF; color:#0F172A; }

  /* ── Hero (diseño A, D-ING-9) ── */
  .art-hero { position:relative; overflow:hidden; padding: 56px 20px 48px; }
  .art-hero::before {
    content:""; position:absolute; top:-260px; right:-120px; width:560px; height:560px;
    border-radius:50%; background:linear-gradient(135deg,#6D5EFC,#22C1C3);
    opacity:.18; filter:blur(70px); pointer-events:none;
  }
  .art-hero-in { position:relative; max-width: 760px; margin: 0 auto; }
  .back {
    display:inline-flex; align-items:center; gap:6px;
    font-size:14px; font-weight:600; color:#64748B; margin-bottom:28px;
  }
  .back:hover { color:#5B4BEA; }
  .art-tag {
    display:inline-block; margin-bottom:18px;
    font-size:12px; font-weight:700; padding:4px 12px; border-radius:999px;
    background:#EEF2FF; color:#5B4BEA; border:0;
  }
  .art-h1 {
    font-size: clamp(30px, 5vw, 46px); font-weight: 800; color:#0F172A;
    letter-spacing:-0.02em; line-height:1.1; margin-bottom:18px;
  }
  .art-meta { font-size:14px; color:#64748B; display:flex; gap:10px; align-items:center; }
  .art-dot { width:4px; height:4px; border-radius:50%; background:#CBD5E1; }

  /* ── Cuerpo ── */
  .art-body { max-width: 760px; margin: 0 auto; padding: 8px 20px 64px; }
  .art-lead {
    font-size: clamp(18px, 2.2vw, 20px); color:#334155; line-height:1.6;
    margin-bottom:32px; padding-bottom:32px; border-bottom:1px solid #E2E8F0;
  }

  /* ── CTA arriba ── */
  .cta-top {
    display:flex; align-items:center; justify-content:space-between; gap:16px; flex-wrap:wrap;
    background:#F5F3FF; border:1px solid #DDD6FE; border-radius:16px;
    padding:18px 22px; margin-bottom:44px;
  }
  .cta-top-t { font-size:15px; font-weight:700; color:#0F172A; }
  .cta-top-s { font-size:13.5px; color:#64748B; margin-top:3px; }
  .cta-top-btn {
    background:linear-gradient(135deg,#6D5EFC,#22C1C3); color:#fff;
    padding:11px 20px; border-radius:999px; font-size:14px; font-weight:700; white-space:nowrap;
    box-shadow:0 8px 20px -8px rgba(109,94,252,.6);
  }
  .cta-top-btn:hover { filter:brightness(1.05); }

  /* ── Texto ── */
  .prose h2 { font-size: clamp(24px, 3vw, 30px); font-weight:800; color:#0F172A; letter-spacing:-0.015em; margin:48px 0 14px; line-height:1.2; }
  .prose h3 { font-size:21px; font-weight:700; color:#0F172A; margin:36px 0 10px; line-height:1.3; }
  .prose h4 { font-size:14px; font-weight:700; color:#5B4BEA; margin:28px 0 8px; letter-spacing:.06em; text-transform:uppercase; }
  .prose p { font-size:17px; color:#334155; line-height:1.8; margin:16px 0; }
  .prose ul, .prose ol { padding-left:24px; margin:16px 0; }
  .prose li { font-size:17px; color:#334155; line-height:1.75; margin:6px 0; }
  .prose li::marker { color:#6D5EFC; }
  .prose blockquote { border-left:4px solid #6D5EFC; background:#F8FAFC; padding:14px 20px; margin:28px 0; color:#475569; font-style:italic; border-radius:0 12px 12px 0; }
  .prose code { background:#F1F5F9; padding:2px 7px; border-radius:6px; font-size:14px; color:#0F172A; font-family: var(--font-geist-mono), monospace; }
  .prose pre { background:#0F172A; border-radius:14px; overflow:hidden; margin:28px 0; }
  .prose pre .lang { padding:8px 16px; font-size:11px; color:#94A3B8; border-bottom:1px solid #1E293B; letter-spacing:.1em; text-transform:uppercase; }
  .prose pre code { background:none; padding:16px; display:block; font-size:13.5px; color:#E2E8F0; line-height:1.65; }
  .prose hr { border:none; border-top:1px solid #E2E8F0; margin:44px 0; }
  .prose .callout { background:#F5F3FF; border:1px solid #DDD6FE; border-radius:14px; padding:18px 20px; margin:24px 0; font-size:16px; color:#334155; line-height:1.7; }
  .prose strong { font-weight:700; color:#0F172A; }
  .prose a { color:#5B4BEA; text-decoration:underline; text-underline-offset:3px; }
  .prose a:hover { color:#4338CA; }
  .prose table { width:100%; border-collapse:collapse; margin:24px 0; font-size:15px; }
  .prose th, .prose td { border-bottom:1px solid #E2E8F0; padding:10px 12px; text-align:left; color:#334155; }
  .prose th { color:#0F172A; font-weight:700; background:#F8FAFC; }
  figure figcaption { text-align:center; font-size:13px; color:#94A3B8; margin-top:10px; }

  /* ── CTA abajo ── */
  .cta-bot {
    background:linear-gradient(135deg,#6D5EFC,#22C1C3); color:#fff;
    border-radius:24px; padding:36px; margin-top:56px;
  }
  .cta-bot-h { font-size:26px; font-weight:800; line-height:1.2; margin-bottom:10px; color:#fff; }
  .cta-bot-s { font-size:15.5px; color:rgba(255,255,255,.88); line-height:1.6; margin-bottom:24px; }
  .cta-bot-btns { display:flex; gap:10px; flex-wrap:wrap; }
  .cta-bot-p { display:inline-flex; align-items:center; gap:6px; background:#fff; color:#0F172A; padding:12px 22px; border-radius:999px; font-size:15px; font-weight:700; }
  .cta-bot-p:hover { background:#F1F5F9; }
  .cta-bot-s2 { display:inline-flex; align-items:center; gap:6px; border:1.5px solid rgba(255,255,255,.6); color:#fff; padding:11px 20px; border-radius:999px; font-size:15px; font-weight:600; }
  .cta-bot-s2:hover { background:rgba(255,255,255,.12); }

  .art-back-bottom { font-size:14px; font-weight:600; color:#64748B; display:inline-flex; align-items:center; gap:6px; }
  .art-back-bottom:hover { color:#5B4BEA; }

  @media (max-width: 768px) {
    .cta-top { flex-direction:column; align-items:flex-start; }
    .cta-bot { padding:28px 22px; }
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
        if (lm)
          return (
            <a key={i} href={lm[2]}>
              {lm[1]}
            </a>
          );
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

// ── Tipos de agrupación ───────────────────────────────────────────────────────

type ListGroup = {
  kind: "list";
  type: "bullet" | "numbered";
  items: NotionBlock[];
};
type SingleBlock = { kind: "block"; block: NotionBlock };
type GroupEntry = ListGroup | SingleBlock;

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
                  <li key={j}>
                    <RichText text={item.text ?? ""} />
                  </li>
                ))}
              </ul>
            );
          }
          return (
            <ol key={i}>
              {entry.items.map((item, j) => (
                <li key={j}>
                  <RichText text={item.text ?? ""} />
                </li>
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
            return (
              <p key={i}>
                <RichText text={block.text} />
              </p>
            );
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
            return (
              <div key={i} className="callout">
                <RichText text={block.text ?? ""} />
              </div>
            );
          case "divider":
            return <hr key={i} />;
          case "image":
            return (
              <figure key={i} style={{ margin: "28px 0" }}>
                <img
                  src={block.url}
                  alt={block.caption ?? ""}
                  style={{
                    width: "100%",
                    borderRadius: 14,
                    border: "1px solid #E2E8F0",
                  }}
                />
                {block.caption && <figcaption>{block.caption}</figcaption>}
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

export default async function BlogArticle({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getBlogPost(slug);
  if (!post) notFound();

  // Los artículos de salud llevan a la calculadora SAN; el resto, a revisar el
  // turno, que es lo que busca quien llega por «turnos» (Search Console, 10-2026).
  const esSalud = post.category === "Salud" || slug.includes("san");
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.metaDescription,
    datePublished: post.date,
    author: {
      "@type": "Organization",
      name: "dotaciones.cl — Nexwork SpA",
      url: "https://dotaciones.cl",
    },
    publisher: {
      "@type": "Organization",
      name: "dotaciones.cl",
      url: "https://dotaciones.cl",
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://dotaciones.cl/blog/${slug}`,
    },
  };

  return (
    <div className="fuente-a min-h-screen bg-white text-slate-900">
      <style dangerouslySetInnerHTML={{ __html: S }} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SiteNav />

      {/* HERO */}
      <div className="art-hero">
        <div className="art-hero-in">
          <Link href="/blog" className="back">
            <svg
              width="14"
              height="14"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Volver al blog
          </Link>
          <span className="art-tag">{post.category}</span>
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
        {esSalud ? (
          <div className="cta-top">
            <div>
              <div className="cta-top-t">¿Prefieres calcularlo directo?</div>
              <div className="cta-top-s">
                Calculadora SAN gratuita. El resultado en segundos.
              </div>
            </div>
            <Link href="/san" className="cta-top-btn">
              Ir a la calculadora →
            </Link>
          </div>
        ) : (
          <div className="cta-top">
            <div>
              <div className="cta-top-t">
                ¿Ya tienes tu turno armado? Revisa si cumple la ley.
              </div>
              <div className="cta-top-s">
                Pega tu planilla de Excel. Gratis, sin registro y sin guardar
                tus datos.
              </div>
            </div>
            <a href={URL_REVISAR} className="cta-top-btn">
              Revisar mi turno →
            </a>
          </div>
        )}

        {/* Contenido desde Notion */}
        <NotionContent blocks={post.content} />

        {/* CTA bottom */}
        {esSalud ? (
          <div className="cta-bot">
            <h3 className="cta-bot-h">Calcula tu dotación ahora — es gratis</h3>
            <p className="cta-bot-s">
              El motor propone las combinaciones válidas de contratos en
              segundos.
            </p>
            <div className="cta-bot-btns">
              <Link href="/san" className="cta-bot-p">
                Calculadora SAN →
              </Link>
              <Link href="/calculadora" className="cta-bot-s2">
                Calculadora Retail / Servicios →
              </Link>
            </div>
          </div>
        ) : (
          <div className="cta-bot">
            <h3 className="cta-bot-h">
              ¿Tu turno cumple la ley? Compruébalo en un minuto
            </h3>
            <p className="cta-bot-s">
              Pega tu planilla del mes y te marcamos, persona por persona, lo
              que no cumple: días seguidos, descanso entre jornadas, domingos
              libres y horas extra.
            </p>
            <div className="cta-bot-btns">
              <a href={URL_REVISAR} className="cta-bot-p">
                Revisar mi turno gratis →
              </a>
              <Link href="/calculadora" className="cta-bot-s2">
                Calcular mi dotación →
              </Link>
            </div>
          </div>
        )}

        {/* Nav inferior */}
        <div
          style={{
            borderTop: "1px solid #E2E8F0",
            paddingTop: 28,
            marginTop: 28,
          }}
        >
          <Link href="/blog" className="art-back-bottom">
            <svg
              width="14"
              height="14"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Ver todo el blog
          </Link>
        </div>
      </div>

      <SiteFooter />
    </div>
  );
}
