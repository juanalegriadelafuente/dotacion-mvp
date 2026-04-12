// src/components/SiteFooter.tsx
import Link from "next/link";

export default function SiteFooter() {
  const links = [
    { label: "Calculadora", href: "/calculadora" },
    { label: "SAN", href: "/san" },
    { label: "Blog", href: "/blog" },
    { label: "Contacto", href: "/contacto" },
    { label: "Privacidad", href: "/privacidad" },
  ];

  return (
    <footer style={{
      background: "#0C1F15",
      borderTop: "1px solid rgba(255,255,255,0.07)",
      padding: "36px 40px",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      flexWrap: "wrap", gap: 16,
    }}>
      <div>
        <div style={{ fontSize: 14, fontWeight: 800, color: "white", fontFamily: "'DM Mono', monospace" }}>
          dotaciones<span style={{ color: "#52B788" }}>.cl</span>
        </div>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", marginTop: 4 }}>
          Nexwork SpA · Chile
        </div>
      </div>
      <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
        {links.map((l) => (
          <Link key={l.href} href={l.href} style={{
            fontSize: 12, color: "rgba(255,255,255,0.4)",
            textDecoration: "none",
          }}>
            {l.label}
          </Link>
        ))}
      </div>
      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.25)" }}>
        © {new Date().getFullYear()} dotaciones.cl
      </div>
    </footer>
  );
}