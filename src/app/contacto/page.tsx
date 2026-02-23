// src/app/contacto/page.tsx
"use client";

import { useState } from "react";

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      style={{
        width: "100%",
        height: 42,
        padding: "10px 12px",
        borderRadius: 12,
        border: "1px solid var(--border)",
        background: "var(--input-bg)",
        color: "var(--text)",
        outline: "none",
        boxSizing: "border-box",
      }}
    />
  );
}

function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      style={{
        width: "100%",
        minHeight: 140,
        padding: "10px 12px",
        borderRadius: 12,
        border: "1px solid var(--border)",
        background: "var(--input-bg)",
        color: "var(--text)",
        outline: "none",
        boxSizing: "border-box",
        resize: "vertical",
      }}
    />
  );
}

function Button(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      style={{
        height: 44,
        padding: "0 14px",
        borderRadius: 14,
        border: "1px solid rgba(0,0,0,0.08)",
        background: "var(--primary)",
        color: "white",
        fontWeight: 950,
        cursor: props.disabled ? "not-allowed" : "pointer",
        opacity: props.disabled ? 0.7 : 1,
      }}
    />
  );
}

export default function ContactoPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  async function onSend() {
    setStatus(null);
    setLoading(true);
    try {
      const r = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
        cache: "no-store",
        body: JSON.stringify({
          name,
          email,
          message,
          page: "/contacto",
        }),
      });

      const data = await r.json();
      if (!data?.ok) {
        setStatus(`❌ ${data?.error ?? "No se pudo enviar."}`);
      } else {
        setStatus("✅ Gracias. Tu mensaje fue enviado.");
        setMessage("");
      }
    } catch (e: any) {
      setStatus(`❌ ${e?.message ?? "Error"}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: "28px 24px 60px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <div>
          <div style={{ fontWeight: 1000, fontSize: 22 }}>Contacto</div>
          <div style={{ color: "var(--muted)", marginTop: 6 }}>
            Sugerencias, dudas o casos raros. Esto mejora el motor.
          </div>
        </div>
        <a href="/" style={{ color: "var(--primary2)", fontWeight: 900 }}>Volver al inicio</a>
      </div>

      <div
        style={{
          marginTop: 16,
          border: "1px solid var(--border)",
          background: "var(--panel)",
          borderRadius: 16,
          padding: 18,
          boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
        }}
      >
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ fontWeight: 900 }}>Nombre</span>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Tu nombre (opcional)" />
          </label>

          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ fontWeight: 900 }}>Email</span>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nombre@dominio.com (opcional)" />
          </label>
        </div>

        <label style={{ display: "grid", gap: 6, marginTop: 12 }}>
          <span style={{ fontWeight: 900 }}>Mensaje</span>
          <Textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Cuéntanos tu duda o sugerencia…" />
        </label>

        <div style={{ marginTop: 12, display: "flex", justifyContent: "flex-end" }}>
          <Button onClick={onSend} disabled={loading || !message.trim()}>
            {loading ? "Enviando..." : "Enviar"}
          </Button>
        </div>

        {status ? <div style={{ marginTop: 10, color: "var(--muted)", fontWeight: 900 }}>{status}</div> : null}
      </div>
    </main>
  );
}