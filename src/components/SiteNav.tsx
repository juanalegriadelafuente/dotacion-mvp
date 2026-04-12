// src/components/SiteNav.tsx
import Link from "next/link";

export default function SiteNav() {
  return (
    <nav style={{
      background: "#0C1F15",
      borderBottom: "1px solid rgba(255,255,255,0.07)",
      padding: "0 40px", height: 56,
      display: "flex", alignItems: "center", justifyContent: "space-between",
      position: "sticky", top: 0, zIndex: 100,
    }}>
      <Link href="/" style={{
        fontSize: 16, fontWeight: 800, color: "white",
        letterSpacing: "-0.02em", textDecoration: "none",
        fontFamily: "'DM Mono', monospace",
      }}>
        dotaciones<span style={{ color: "#52B788" }}>.cl</span>
      </Link>
      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
        <Link href="/blog" style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", padding: "6px 14px", borderRadius: 6, textDecoration: "none" }}>Blog</Link>
        <Link href="/contacto" style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", padding: "6px 14px", borderRadius: 6, textDecoration: "none" }}>Contacto</Link>
        <Link href="/calculadora" style={{
          background: "#52B788", color: "#0C1F15",
          padding: "8px 18px", borderRadius: 8,
          fontSize: 13, fontWeight: 700, textDecoration: "none",
        }}>
          Calculadora →
        </Link>
      </div>
    </nav>
  );
}