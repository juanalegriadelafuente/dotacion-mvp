// src/lib/notion-blog.ts
// Lee los artículos del blog directamente desde la base de datos de Notion
// Para publicar: cambia el Estado del artículo a "Publicado" en Notion. Listo.

const NOTION_API_KEY    = process.env.NOTION_API_KEY!;
const NOTION_BLOG_DB_ID = process.env.NOTION_BLOG_DATABASE_ID!;

export type BlogPost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  date: string;
  readTime: string;
  metaDescription: string;
  featured: boolean;
};

export type BlogPostWithContent = BlogPost & {
  content: NotionBlock[];
};

export type NotionBlock = {
  type: string;
  text?: string;
  items?: string[];      // para listas
  rows?: string[][];     // para tablas
  language?: string;     // para code blocks
  level?: number;        // para headings (1,2,3)
  url?: string;          // para imágenes
  caption?: string;
};

// ─── Listar artículos publicados ─────────────────────────────────────────────

export async function getBlogPosts(): Promise<BlogPost[]> {
  const res = await fetch(
    `https://api.notion.com/v1/databases/${NOTION_BLOG_DB_ID}/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${NOTION_API_KEY}`,
        "Content-Type": "application/json",
        "Notion-Version": "2022-06-28",
      },
      body: JSON.stringify({
        filter: {
          property: "Estado",
          select: { equals: "Publicado" },
        },
        sorts: [
          { property: "Fecha publicación", direction: "descending" },
        ],
      }),
      next: { revalidate: 3600 }, // revalidar cada hora
    }
  );

  if (!res.ok) {
    console.error("Notion blog query error:", await res.text());
    return [];
  }

  const data = await res.json();
  return data.results.map(pageToPost);
}

// ─── Obtener un artículo por slug ─────────────────────────────────────────────

export async function getBlogPost(slug: string): Promise<BlogPostWithContent | null> {
  // Buscar la página por slug
  const res = await fetch(
    `https://api.notion.com/v1/databases/${NOTION_BLOG_DB_ID}/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${NOTION_API_KEY}`,
        "Content-Type": "application/json",
        "Notion-Version": "2022-06-28",
      },
      body: JSON.stringify({
        filter: {
          and: [
            { property: "Slug",   rich_text: { equals: slug } },
            { property: "Estado", select:    { equals: "Publicado" } },
          ],
        },
      }),
      next: { revalidate: 3600 },
    }
  );

  if (!res.ok) return null;

  const data = await res.json();
  if (!data.results.length) return null;

  const page = data.results[0];
  const post = pageToPost(page);

  // Obtener bloques de contenido
  const content = await getPageBlocks(page.id);

  return { ...post, content };
}

// ─── Obtener todos los slugs (para generateStaticParams) ──────────────────────

export async function getBlogSlugs(): Promise<string[]> {
  const posts = await getBlogPosts();
  return posts.map(p => p.slug).filter(Boolean);
}

// ─── Helpers internos ─────────────────────────────────────────────────────────

function pageToPost(page: any): BlogPost {
  const props = page.properties;

  const slug      = props["Slug"]?.rich_text?.[0]?.plain_text ?? "";
  const title     = props["Título"]?.title?.[0]?.plain_text ?? "";
  const excerpt   = props["Excerpt"]?.rich_text?.[0]?.plain_text ?? "";
  const category  = props["Categoría"]?.select?.name ?? "";
  const readTime  = props["Tiempo lectura"]?.rich_text?.[0]?.plain_text ?? "";
  const metaDesc  = props["Meta description"]?.rich_text?.[0]?.plain_text ?? excerpt;
  const featured  = props["Destacado"]?.checkbox ?? false;
  const dateRaw   = props["Fecha publicación"]?.date?.start ?? page.created_time;
  const date      = new Date(dateRaw).toLocaleDateString("es-CL", {
    day: "2-digit", month: "long", year: "numeric",
  });

  return { id: page.id, slug, title, excerpt, category, date, readTime, metaDescription: metaDesc, featured };
}

async function getPageBlocks(pageId: string): Promise<NotionBlock[]> {
  const res = await fetch(
    `https://api.notion.com/v1/blocks/${pageId}/children?page_size=100`,
    {
      headers: {
        Authorization: `Bearer ${NOTION_API_KEY}`,
        "Notion-Version": "2022-06-28",
      },
      next: { revalidate: 3600 },
    }
  );

  if (!res.ok) return [];

  const data = await res.json();
  const blocks: NotionBlock[] = [];

  for (const block of data.results) {
    const parsed = parseBlock(block);
    if (parsed) blocks.push(parsed);
  }

  return blocks;
}

function getRichText(richText: any[]): string {
  if (!richText?.length) return "";
  return richText.map((t: any) => {
    let text = t.plain_text ?? "";
    if (t.annotations?.bold)          text = `**${text}**`;
    if (t.annotations?.italic)        text = `_${text}_`;
    if (t.annotations?.code)          text = `\`${text}\``;
    if (t.href)                        text = `[${t.plain_text}](${t.href})`;
    return text;
  }).join("");
}

function parseBlock(block: any): NotionBlock | null {
  const type = block.type;

  switch (type) {
    case "heading_1":
      return { type: "heading", level: 1, text: getRichText(block.heading_1?.rich_text) };
    case "heading_2":
      return { type: "heading", level: 2, text: getRichText(block.heading_2?.rich_text) };
    case "heading_3":
      return { type: "heading", level: 3, text: getRichText(block.heading_3?.rich_text) };
    case "paragraph":
      return { type: "paragraph", text: getRichText(block.paragraph?.rich_text) };
    case "bulleted_list_item":
      return { type: "bullet", text: getRichText(block.bulleted_list_item?.rich_text) };
    case "numbered_list_item":
      return { type: "numbered", text: getRichText(block.numbered_list_item?.rich_text) };
    case "code":
      return {
        type: "code",
        text: getRichText(block.code?.rich_text),
        language: block.code?.language ?? "text",
      };
    case "quote":
      return { type: "quote", text: getRichText(block.quote?.rich_text) };
    case "divider":
      return { type: "divider" };
    case "image":
      const imgUrl = block.image?.file?.url ?? block.image?.external?.url ?? "";
      const caption = getRichText(block.image?.caption ?? []);
      return { type: "image", url: imgUrl, caption };
    case "callout":
      return { type: "callout", text: getRichText(block.callout?.rich_text) };
    default:
      return null;
  }
}
