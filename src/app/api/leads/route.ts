// src/app/api/leads/route.ts
import { NextRequest, NextResponse } from "next/server";

const NOTION_API_KEY = process.env.NOTION_API_KEY!;
const NOTION_DATABASE_ID = process.env.NOTION_LEADS_DATABASE_ID!;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      nombre,
      email,
      empresa,
      cargo,
      sector,
      calculadora,    // "Retail / Servicios" | "SAN Hospitalaria"
      fuente,         // "Calculadora" | "Guía PDF" | "Blog"
    } = body;

    if (!email) {
      return NextResponse.json({ error: "Email requerido" }, { status: 400 });
    }

    const notionPayload = {
      parent: { database_id: NOTION_DATABASE_ID },
      properties: {
        Nombre:              { title: [{ text: { content: nombre || email } }] },
        Email:               { email },
        Empresa:             { rich_text: [{ text: { content: empresa || "" } }] },
        Cargo:               { rich_text: [{ text: { content: cargo || "" } }] },
        Estado:              { select: { name: "Nuevo" } },
        Fuente:              { select: { name: fuente || "Calculadora" } },
        ...(sector     && { Sector:            { select: { name: sector } } }),
        ...(calculadora && { "Calculadora usada": { select: { name: calculadora } } }),
      },
    };

    const res = await fetch("https://api.notion.com/v1/pages", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${NOTION_API_KEY}`,
        "Content-Type": "application/json",
        "Notion-Version": "2022-06-28",
      },
      body: JSON.stringify(notionPayload),
    });

    if (!res.ok) {
      const err = await res.json();
      console.error("Notion error:", err);
      return NextResponse.json({ error: "Error guardando lead" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}