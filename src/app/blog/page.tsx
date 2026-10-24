// src/app/blog/page.tsx
// El blog, diseño A (D-ING-9). Es un blog —normativa, opinión, casos—, no un
// manual: por eso se llama «Blog» y no «Guías».
import type { Metadata } from "next";
import Link from "next/link";
import SiteFooter from "@/components/SiteFooter";
import SiteNav from "@/components/SiteNav";
import Suscripcion from "@/components/Suscripcion";
import { type BlogPost, getBlogPosts } from "@/lib/notion-blog";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Normativa, opinión y casos sobre turnos, jornada y dotación de personal en Chile.",
  alternates: { canonical: "https://dotaciones.cl/blog" },
};

function Tarjeta({ post }: { post: BlogPost }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group flex flex-col rounded-2xl bg-white p-6 ring-1 ring-slate-200 transition hover:-translate-y-1 hover:shadow-xl"
    >
      <div className="flex items-center gap-2 text-[12px]">
        <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 font-bold text-[#5B4BEA]">
          {post.category}
        </span>
        <span className="text-slate-400">{post.readTime}</span>
      </div>
      <h2 className="mt-4 text-[18px] font-bold leading-snug group-hover:text-[#5B4BEA]">
        {post.title}
      </h2>
      <p className="mt-2 flex-1 text-[14.5px] leading-relaxed text-slate-600">
        {post.excerpt}
      </p>
      <span className="mt-4 text-[13px] text-slate-400">{post.date}</span>
    </Link>
  );
}

export default async function BlogIndex() {
  const posts = await getBlogPosts();
  const destacado = posts.find((p) => p.featured) ?? posts[0];
  const resto = posts.filter((p) => p.id !== destacado?.id);

  return (
    <div className="fuente-a min-h-screen bg-white text-slate-900">
      <SiteNav />
      <main>
        <header className="relative overflow-hidden">
          <div
            aria-hidden="true"
            className="degradado-marca absolute -top-56 left-[-10%] h-[520px] w-[520px] rounded-full opacity-20 blur-3xl"
          />
          <div className="relative mx-auto max-w-6xl px-4 pb-12 pt-14 sm:px-5">
            <h1 className="text-[44px] font-extrabold tracking-tight sm:text-[56px]">
              <span className="texto-degradado">Blog</span>
            </h1>
            <p className="mt-3 max-w-2xl text-[18px] leading-relaxed text-slate-600">
              Normativa, opinión y casos sobre turnos, jornada y dotación de
              personal en Chile.
            </p>
          </div>
        </header>

        <div className="mx-auto max-w-6xl px-4 pb-20 sm:px-5">
          {posts.length === 0 && (
            <p className="py-20 text-center text-slate-400">
              No hay artículos publicados todavía.
            </p>
          )}

          {destacado && (
            <Link
              href={`/blog/${destacado.slug}`}
              className="degradado-marca block rounded-3xl p-8 text-white transition-transform hover:-translate-y-1 sm:p-10"
            >
              <span className="rounded-full bg-white/20 px-3 py-1 text-[12px] font-semibold">
                {destacado.category} · {destacado.date}
              </span>
              <h2 className="mt-6 max-w-3xl text-[28px] font-extrabold leading-tight sm:text-[36px]">
                {destacado.title}
              </h2>
              <p className="mt-4 max-w-2xl text-[16px] text-white/85">
                {destacado.excerpt}
              </p>
              <span className="mt-8 inline-block font-semibold">
                Leer · {destacado.readTime} →
              </span>
            </Link>
          )}

          {resto.length > 0 && (
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {resto.map((p) => (
                <Tarjeta key={p.id} post={p} />
              ))}
            </div>
          )}

          <section className="mt-16 flex flex-col gap-6 rounded-3xl bg-slate-50 px-6 py-10 ring-1 ring-slate-200 sm:px-10 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-[24px] font-extrabold">
                Recibe los artículos nuevos
              </h2>
              <p className="mt-2 text-slate-600">
                Cambios de la ley, dictámenes y opinión. Sin spam.
              </p>
            </div>
            <Suscripcion />
          </section>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
