// src/app/api/blog-posts/route.ts
// Coloca este archivo en: src/app/api/blog-posts/route.ts

import { NextResponse } from "next/server";

/* ─────────────────────────────────────────
   CONFIG
───────────────────────────────────────── */
const NOTION_TOKEN = process.env.NOTION_TOKEN;
const DB_ID        = "e23b4f22db5645068d082e2895dc6d40"; // Blog DB

// Cuántos artículos mostrar en la homepage
const PREVIEW_COUNT = 4;

/* ─────────────────────────────────────────
   HELPERS
───────────────────────────────────────── */
const MONTHS = [
  "ene","feb","mar","abr","may","jun",
  "jul","ago","sep","oct","nov","dic",
];

function formatDate(iso: string): string {
  // iso = "2026-05-26"  (never trust timezone — parse manually)
  const [y, m, d] = iso.split("-").map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

// Revalidar cada 5 minutos (Next.js ISR en la API Route)
export const revalidate = 300;

/* ─────────────────────────────────────────
   GET /api/blog-posts
   Response: { articles: BlogPost[], total: number }
───────────────────────────────────────── */
export async function GET() {
  if (!NOTION_TOKEN) {
    console.error("[blog-posts] NOTION_TOKEN no definido");
    return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 });
  }

  let notionRes: Response;
  try {
    notionRes = await fetch(
      `https://api.notion.com/v1/databases/${DB_ID}/query`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${NOTION_TOKEN}`,
          "Notion-Version": "2022-06-28",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          filter: {
            property: "Estado",
            select: { equals: "Publicado" },
          },
          sorts: [
            { property: "Fecha publicación", direction: "descending" },
          ],
          page_size: 100, // traemos todos para calcular total y numeración
        }),
        // cache Next.js: revalida cada 5 min
        next: { revalidate: 300 },
      }
    );
  } catch (err) {
    console.error("[blog-posts] fetch error:", err);
    return NextResponse.json({ error: "Network error" }, { status: 502 });
  }

  if (!notionRes.ok) {
    const body = await notionRes.text();
    console.error("[blog-posts] Notion error:", body);
    return NextResponse.json({ error: "Notion error" }, { status: 500 });
  }

  const data = await notionRes.json();
  const results: NotionPage[] = data.results ?? [];
  const total = results.length;

  // Los primeros PREVIEW_COUNT (ya vienen ordenados desc por fecha)
  const articles = results.slice(0, PREVIEW_COUNT).map((page, i) => {
    const p = page.properties;

    const isoDate =
      p["Fecha publicación"]?.date?.start ?? "";

    return {
      id:       page.id,
      n:        String(total - i).padStart(3, "0"), // e.g. "012"
      title:    p["Título"]?.title?.[0]?.plain_text      ?? "",
      slug:     p["Slug"]?.rich_text?.[0]?.plain_text    ?? "",
      excerpt:  p["Excerpt"]?.rich_text?.[0]?.plain_text ?? "",
      category: p["Categoría"]?.select?.name             ?? "",
      readTime: p["Tiempo lectura"]?.rich_text?.[0]?.plain_text ?? "",
      date:     isoDate ? formatDate(isoDate) : "",
    };
  });

  return NextResponse.json({ articles, total });
}

/* ─────────────────────────────────────────
   TYPES (solo para este archivo)
───────────────────────────────────────── */
interface NotionPage {
  id: string;
  properties: {
    "Título"?:           { title: { plain_text: string }[] };
    "Slug"?:             { rich_text: { plain_text: string }[] };
    "Excerpt"?:          { rich_text: { plain_text: string }[] };
    "Categoría"?:        { select: { name: string } | null };
    "Tiempo lectura"?:   { rich_text: { plain_text: string }[] };
    "Fecha publicación"?:{ date: { start: string } | null };
    "Estado"?:           { select: { name: string } | null };
  };
}
