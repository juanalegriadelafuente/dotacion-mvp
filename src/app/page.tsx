"use client";

import Link from "next/link";
import { useState } from "react";

const testimonials = [
  { quote: "Antes tardábamos horas en Excel. Con Dotaciones.cl lo resolvemos en minutos con respaldo defendible.", name: "Jefa de RRHH", company: "Cadena retail, Santiago" },
  { quote: "La calculadora SAN nos ayudó a justificar la dotación ante el directorio con números claros y auditables.", name: "Subdirector de Gestión de Personas", company: "Hospital regional, Chile" },
  { quote: "Sencilla, rápida y el Excel exportado es exactamente lo que necesitábamos para la valorización.", name: "Consultora de RRHH", company: "Independiente" },
];

const faqs = [
  { q: "¿Para qué sirve una calculadora de dotación?", a: "Te permite determinar cuántas personas necesitas, en qué jornadas y con qué contrato, considerando la demanda real. El resultado es un mix óptimo y defendible ante gerencia o directorio." },
  { q: "¿Necesito registrarme?", a: "No. Todas las calculadoras son de acceso libre y gratuito." },
  { q: "¿Qué incluye el Excel exportado?", a: "Mix de contratos sugerido, cobertura por día, horas planificadas y estructura lista para valorización." },
  { q: "¿La calculadora SAN cumple la normativa vigente?", a: "Sí. Incorpora parámetros RTD/RCD y calcula la dotación mínima normativa como punto de partida." },
];

function LeadForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setStatus("loading");
    try {
      const r = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source: "home-guia", role: null }),
      });
      const data = await r.json();
      setStatus(data.ok ? "ok" : "error");
    } catch {
      setStatus("error");
    }
  }

  if (status === "ok") {
    return (
      <p className="text-white font-semibold text-sm bg-blue-500 rounded-lg px-6 py-4 inline-block">
        ✅ ¡Listo! Te enviamos la guía a tu correo.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2 justify-center">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="tu@email.cl"
        className="flex-1 px-4 py-3 rounded-lg text-gray-900 text-sm focus:outline-none min-w-0"
      />
      <button
        type="submit"
        disabled={status === "loading"}
        className="bg-white text-blue-700 font-bold px-6 py-3 rounded-lg hover:bg-blue-50 transition-colors text-sm whitespace-nowrap disabled:opacity-60"
      >
        {status === "loading" ? "Enviando…" : "Quiero la guía →"}
      </button>
      {status === "error" && (
        <p className="text-red-200 text-xs mt-1 w-full">Hubo un error. Intenta de nuevo.</p>
      )}
    </form>
  );
}

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white text-gray-900">
      {/* NAV */}
      <nav className="border-b border-gray-100 sticky top-0 bg-white/95 backdrop-blur z-50">
        <div className="max-w-5xl mx-auto px-4 py-3 flex justify-between items-center">
          <Link href="/" className="font-bold text-lg text-blue-700">Dotaciones.cl</Link>
          <div className="flex gap-5 text-sm font-medium">
            <Link href="/blog" className="text-gray-600 hover:text-blue-700">Blog</Link>
            <Link href="/contacto" className="text-gray-600 hover:text-blue-700">Contacto</Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="bg-gradient-to-br from-blue-50 to-white py-20 px-4 text-center">
        <span className="inline-block bg-blue-100 text-blue-700 text-xs font-semibold px-3 py-1 rounded-full mb-4 uppercase tracking-wide">
          Herramienta gratuita para RRHH
        </span>
        <h1 className="text-4xl md:text-5xl font-extrabold leading-tight mb-4">
          Calcula la dotación óptima<br className="hidden md:block" /> de tu equipo en minutos
        </h1>
        <p className="text-lg text-gray-600 mb-8 max-w-xl mx-auto">
          Mix de contratos, cobertura por día y exportación a Excel lista para valorización. Sin registro, sin costo.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/calculadora" className="bg-blue-700 text-white font-semibold px-7 py-3 rounded-lg shadow hover:bg-blue-800 transition-colors">
            🛒 Calculadora Retail / Servicios
          </Link>
          <Link href="/san" className="bg-white border-2 border-blue-700 text-blue-700 font-semibold px-7 py-3 rounded-lg hover:bg-blue-50 transition-colors">
            🏥 Calculadora SAN Hospitalaria
          </Link>
        </div>
      </section>

      {/* STATS */}
      <section className="border-y border-gray-100 py-10 px-4">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[{v:"+500",l:"Cálculos realizados"},{v:"2",l:"Sectores cubiertos"},{v:"100%",l:"Gratis, sin registro"},{v:"Excel",l:"Exportación incluida"}].map(s=>(
            <div key={s.l}><p className="text-3xl font-extrabold text-blue-700">{s.v}</p><p className="text-sm text-gray-500 mt-1">{s.l}</p></div>
          ))}
        </div>
      </section>

      {/* PARA QUIÉN ES */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-10">¿Para quién es Dotaciones.cl?</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {icon:"🏪",title:"Retail y servicios",desc:"Tiendas, supermercados, call centers, restaurantes. Calcula dotación por tramo horario y genera el mix de jornadas ideal."},
              {icon:"🏥",title:"Hospitales y clínicas",desc:"Gestores y jefes de RRHH que necesitan cumplir normativa SAN con dotación real, cobertura por día y respaldo Excel."},
              {icon:"📊",title:"Consultores de RRHH",desc:"Profesionales que necesitan resultados defendibles para presentar a gerencia o directorio con respaldo de cálculo."},
            ].map(c=>(
              <div key={c.title} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="text-3xl mb-3">{c.icon}</div>
                <h3 className="font-bold mb-2">{c.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIOS */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-10">Lo que dicen quienes lo usan</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map(t=>(
              <div key={t.name} className="bg-gray-50 rounded-xl p-6 border border-gray-100">
                <p className="text-gray-700 text-sm leading-relaxed mb-4 italic">&ldquo;{t.quote}&rdquo;</p>
                <p className="font-semibold text-sm">{t.name}</p>
                <p className="text-xs text-gray-400">{t.company}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CAPTURA EMAIL */}
      <section className="py-16 px-4 bg-blue-700 text-white text-center">
        <div className="max-w-xl mx-auto">
          <h2 className="text-2xl font-bold mb-3">Recibe la guía de dotación óptima gratis</h2>
          <p className="text-blue-100 mb-6 text-sm">Guía práctica en PDF: cómo calcular, justificar y presentar tu dotación ante gerencia. Sin spam.</p>
          <LeadForm />
        </div>
      </section>

      {/* BLOG PREVIEW */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold">Últimos artículos</h2>
            <Link href="/blog" className="text-blue-700 text-sm font-medium hover:underline">Ver todos →</Link>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {slug:"como-calcular-dotacion-personal",tag:"Guía",title:"Cómo calcular la dotación de personal paso a paso",desc:"Guía práctica para determinar cuántas personas necesitas según tu operación real.",date:"Marzo 2026"},
              {slug:"mix-contratos-jornada-parcial-chile",tag:"Normativa",title:"Mix de contratos y jornada parcial en Chile",desc:"Qué dice el Código del Trabajo sobre jornadas parciales y cómo optimizar tu mix.",date:"Febrero 2026"},
              {slug:"dotacion-hospitalaria-san-normativa",tag:"SAN",title:"Dotación hospitalaria: cumplir la normativa SAN sin sobredotar",desc:"Claves para calcular la dotación mínima normativa y ajustarla a la operación real.",date:"Enero 2026"},
            ].map(p=>(
              <Link key={p.slug} href={`/blog/${p.slug}`} className="group block border border-gray-100 rounded-xl p-5 hover:shadow-md transition-shadow">
                <span className="text-xs font-semibold text-blue-600 uppercase tracking-wide">{p.tag}</span>
                <h3 className="font-bold text-gray-900 mt-1 mb-2 group-hover:text-blue-700 text-sm leading-snug">{p.title}</h3>
                <p className="text-gray-500 text-xs leading-relaxed mb-3">{p.desc}</p>
                <span className="text-xs text-gray-400">{p.date}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-10">Preguntas frecuentes</h2>
          <div className="space-y-4">
            {faqs.map(f=>(
              <div key={f.q} className="bg-white rounded-xl p-5 border border-gray-100">
                <h3 className="font-semibold mb-2 text-sm">{f.q}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-gray-100 py-8 px-4">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-400">
          <p className="font-semibold text-gray-700">Dotaciones.cl</p>
          <div className="flex gap-6">
            <Link href="/calculadora" className="hover:text-blue-700">Retail</Link>
            <Link href="/san" className="hover:text-blue-700">SAN</Link>
            <Link href="/blog" className="hover:text-blue-700">Blog</Link>
            <Link href="/contacto" className="hover:text-blue-700">Contacto</Link>
          </div>
          <p>© {new Date().getFullYear()} Dotaciones.cl · Chile</p>
        </div>
      </footer>
    </main>
  );
}
