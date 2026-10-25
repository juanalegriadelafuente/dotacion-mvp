"use client";
// src/components/noche/BlogFiltro.tsx
// La lista del blog numerada como edición, con filtro por tema. Los artículos
// llegan del servidor (Notion); acá sólo se filtran.
import Link from "next/link";
import { useState } from "react";

export interface ArticuloLista {
  id: string;
  n: string;
  slug: string;
  titulo: string;
  categoria: string;
  fecha: string;
  lectura: string;
}

export default function BlogFiltro({
  articulos,
}: {
  articulos: ArticuloLista[];
}) {
  const temas = [
    "Todos",
    ...Array.from(new Set(articulos.map((a) => a.categoria))).filter(Boolean),
  ];
  const [tema, setTema] = useState("Todos");
  const vistos = articulos.filter(
    (a) => tema === "Todos" || a.categoria === tema,
  );

  return (
    <>
      <div className="chips" role="group" aria-label="Filtrar por tema">
        {temas.map((t) => (
          <button
            key={t}
            type="button"
            className={`chip${t === tema ? " activo" : ""}`}
            aria-pressed={t === tema}
            onClick={() => setTema(t)}
          >
            {t}
          </button>
        ))}
      </div>
      <div className="lista">
        {vistos.map((a) => (
          <Link key={a.id} href={`/blog/${a.slug}`} className="art">
            <span className="n">{a.n}</span>
            <div>
              <h4>{a.titulo}</h4>
              <div className="meta">
                <span className="cat">{a.categoria}</span>
                <span>{a.fecha}</span>
              </div>
            </div>
            <span className="min">{a.lectura}</span>
          </Link>
        ))}
      </div>
    </>
  );
}
