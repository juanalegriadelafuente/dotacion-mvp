// src/app/blog/[slug]/page.tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getBlogPost, getBlogSlugs, type NotionBlock } from "@/lib/notion-blog";

export const revalidate = 3600;

// ─── SEO dinámico ─────────────────────────────────────────────────────────────

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
      title: post.title,
      description: post.metaDescription,
      url: `https://dotaciones.cl/blog/${slug}`,
      type: "article",
      authors: ["https://dotaciones.cl"],
    },
  };
}

// ─── Static params ────────────────────────────────────────────────────────────

export async function generateStaticParams() {
  const slugs = await getBlogSlugs();
  return slugs.map((slug) => ({ slug }));
}

// ─── Renderizador de texto con formato ───────────────────────────────────────

function RichText({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\)|`[^`]+`)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return <strong key={i}>{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith("`") && part.endsWith("`")) {
          return (
            <code key={i} className="bg-slate-100 px-1.5 py-0.5 rounded text-sm font-mono">
              {part.slice(1, -1)}
            </code>
          );
        }
        const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
        if (linkMatch) {
          return (
            <a key={i} href={linkMatch[2]} className="text-blue-600 hover:underline">
              {linkMatch[1]}
            </a>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

// ─── Tipos para agrupación de listas ─────────────────────────────────────────

type ListGroup = { kind: "list"; type: "bullet" | "numbered"; items: NotionBlock[] };
type SingleBlock = { kind: "block"; block: NotionBlock };
type GroupEntry = ListGroup | SingleBlock;

// ─── Renderizador de bloques Notion ──────────────────────────────────────────

function NotionContent({ blocks }: { blocks: NotionBlock[] }) {
  // Agrupa bullets y numbered consecutivos con tipos explícitos
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
    <>
      {groups.map((entry, i) => {
        if (entry.kind === "list") {
          if (entry.type === "bullet") {
            return (
              <ul key={i} className="list-disc pl-6 space-y-1.5 my-4 text-slate-700">
                {entry.items.map((item, j) => (
                  <li key={j} className="text-base leading-relaxed">
                    <RichText text={item.text ?? ""} />
                  </li>
                ))}
              </ul>
            );
          }
          return (
            <ol key={i} className="list-decimal pl-6 space-y-1.5 my-4 text-slate-700">
              {entry.items.map((item, j) => (
                <li key={j} className="text-base leading-relaxed">
                  <RichText text={item.text ?? ""} />
                </li>
              ))}
            </ol>
          );
        }

        // Bloque individual
        const { block } = entry;

        switch (block.type) {
          case "heading":
            if (block.level === 1) {
              return (
                <h2 key={i} className="text-2xl font-bold text-slate-900 mt-10 mb-4 tracking-tight">
                  {block.text}
                </h2>
              );
            }
            if (block.level === 2) {
              return (
                <h3 key={i} className="text-xl font-bold text-slate-800 mt-8 mb-3">
                  {block.text}
                </h3>
              );
            }
            return (
              <h4 key={i} className="text-lg font-semibold text-slate-800 mt-6 mb-2">
                {block.text}
              </h4>
            );

          case "paragraph":
            if (!block.text?.trim()) return null;
            return (
              <p key={i} className="text-base text-slate-700 leading-relaxed my-4">
                <RichText text={block.text} />
              </p>
            );

          case "code":
            return (
              <div key={i} className="my-5 rounded-xl bg-slate-900 overflow-hidden">
                <div className="px-4 py-2 bg-slate-800 text-xs text-slate-400 font-mono">
                  {block.language}
                </div>
                <pre className="px-5 py-4 text-sm text-slate-200 overflow-x-auto font-mono leading-relaxed">
                  {block.text}
                </pre>
              </div>
            );

          case "quote":
            return (
              <blockquote key={i} className="border-l-4 border-blue-500 pl-5 my-5 text-slate-600 italic">
                {block.text}
              </blockquote>
            );

          case "callout":
            return (
              <div key={i} className="bg-blue-50 border border-blue-200 rounded-xl px-5 py-4 my-5 text-sm text-slate-700 leading-relaxed">
                <RichText text={block.text ?? ""} />
              </div>
            );

          case "divider":
            return <hr key={i} className="border-slate-200 my-8" />;

          case "image":
            return (
              <figure key={i} className="my-6">
                <img
                  src={block.url}
                  alt={block.caption ?? ""}
                  className="w-full rounded-xl border border-slate-200"
                />
                {block.caption && (
                  <figcaption className="text-center text-xs text-slate-400 mt-2">
                    {block.caption}
                  </figcaption>
                )}
              </figure>
            );

          default:
            return null;
        }
      })}
    </>
  );
}

// ─── Colores de categorías ────────────────────────────────────────────────────

const categoryColors: Record<string, string> = {
  Metodología:       "bg-blue-50 text-blue-700 border border-blue-200",
  Planificación:     "bg-emerald-50 text-emerald-700 border border-emerald-200",
  Normativa:         "bg-amber-50 text-amber-700 border border-amber-200",
  Retail:            "bg-purple-50 text-purple-700 border border-purple-200",
  Salud:             "bg-red-50 text-red-700 border border-red-200",
  "Casos prácticos": "bg-pink-50 text-pink-700 border border-pink-200",
};

// ─── Página del artículo ──────────────────────────────────────────────────────

export default async function BlogArticle(
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const post = await getBlogPost(slug);
  if (!post) notFound();

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
    <main className="min-h-screen bg-gray-50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link
            href="/"
            className="text-xl font-extrabold tracking-tight text-slate-900 hover:text-blue-600 transition-colors"
          >
            dotaciones<span className="text-blue-600">.cl</span>
          </Link>
          <Link
            href="/blog"
            className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Volver al blog
          </Link>
        </div>
      </header>

      <article className="max-w-3xl mx-auto px-6 py-12">

        {/* Meta */}
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          <span className={`text-xs font-semibold px-3 py-1 rounded-full ${categoryColors[post.category] ?? "bg-slate-100 text-slate-600"}`}>
            {post.category}
          </span>
          <span className="text-slate-400 text-sm">{post.date}</span>
          <span className="text-slate-400 text-sm">·</span>
          <span className="text-slate-400 text-sm">{post.readTime} de lectura</span>
        </div>

        {/* Título */}
        <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 leading-tight mb-4 tracking-tight">
          {post.title}
        </h1>
        <p className="text-xl text-slate-500 leading-relaxed mb-10 border-b border-gray-200 pb-10">
          {post.excerpt}
        </p>

        {/* CTA calculadora arriba del fold */}
        <div className="bg-blue-600 text-white rounded-xl p-5 mb-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="font-bold text-sm">¿Prefieres calcularlo directo?</p>
            <p className="text-blue-100 text-xs mt-0.5">Sin registro. El resultado en segundos.</p>
          </div>
          <Link
            href="/calculadora"
            className="shrink-0 bg-white text-blue-700 font-bold text-sm px-5 py-2.5 rounded-lg hover:bg-blue-50 transition-colors"
          >
            Ir a la calculadora →
          </Link>
        </div>

        {/* Contenido desde Notion */}
        <div className="min-h-[200px]">
          <NotionContent blocks={post.content} />
        </div>

        {/* CTA final */}
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-2xl p-8 my-10">
          <h3 className="text-lg font-bold mb-2">Calcula tu dotación ahora — es gratis</h3>
          <p className="text-blue-100 text-sm mb-5">
            Sin registro. El motor propone todas las combinaciones válidas de contratos en segundos.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/calculadora"
              className="bg-white text-blue-700 font-bold px-6 py-3 rounded-lg text-sm hover:bg-blue-50 transition-colors text-center"
            >
              Calculadora Retail / Servicios →
            </Link>
            <Link
              href="/san"
              className="bg-blue-500 text-white font-bold px-6 py-3 rounded-lg text-sm hover:bg-blue-400 transition-colors text-center border border-blue-400"
            >
              Calculadora SAN Hospitalaria →
            </Link>
          </div>
        </div>

        {/* Navegación */}
        <div className="border-t border-gray-200 pt-8 mt-8">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-blue-600 font-semibold text-sm hover:text-blue-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Ver todos los artículos
          </Link>
        </div>
      </article>

      <footer className="border-t border-gray-200 py-8 px-6 text-center text-sm text-slate-400">
        © {new Date().getFullYear()} dotaciones.cl · Nexwork SpA
      </footer>
    </main>
  );
}