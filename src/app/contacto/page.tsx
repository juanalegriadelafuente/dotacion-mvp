"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

function emailLooksOk(email: string) {
  if (!email.trim()) return true; // opcional
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

type Status = { kind: "ok" | "error"; msg: string } | null;

export default function ContactoPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<Status>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus(null);

    const msg = message.trim();
    const mail = email.trim();

    if (!msg) {
      setStatus({ kind: "error", msg: "Escribe un mensaje antes de enviar." });
      return;
    }
    if (!emailLooksOk(mail)) {
      setStatus({
        kind: "error",
        msg: "Email inválido. Ej: nombre@dominio.com",
      });
      return;
    }

    setLoading(true);
    try {
      const r = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
        },
        cache: "no-store",
        body: JSON.stringify({
          name: name.trim() || null,
          email: mail || null,
          message: msg,
          page: "/contacto",
        }),
      });

      const data = await r.json().catch(() => ({}) as any);

      if (!r.ok || !data?.ok) {
        setStatus({ kind: "error", msg: data?.error ?? "No se pudo enviar." });
      } else {
        setStatus({ kind: "ok", msg: "Gracias. Tu mensaje fue enviado." });
        setMessage("");
      }
    } catch (err: any) {
      setStatus({ kind: "error", msg: err?.message ?? "Error inesperado." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="container">
      <div className="topbar">
        <div className="brand">
          <Link href="/" className="brandMark" aria-label="Ir al inicio">
            <Image
              src="/logo.svg"
              alt="Dotaciones.cl"
              width={34}
              height={34}
              className="logo"
              priority
            />
            <span className="brandName">Dotaciones.cl</span>
          </Link>
          <div className="brandSub">
            Sugerencias, dudas o casos raros. Esto mejora el motor.
          </div>
        </div>

        <div className="actions">
          <Link className="btn" href="/">
            Volver al inicio
          </Link>
          <Link className="btn btnPrimary" href="/calculadora">
            Ir a la calculadora →
          </Link>
        </div>
      </div>

      <div style={{ marginTop: 14 }} className="card">
        <div className="cardPad">
          <div className="cardHead">
            <h1 className="h2">Contacto</h1>
            <span className="small">respondemos por email si lo dejas</span>
          </div>

          <div className="hr" />

          <form onSubmit={onSubmit}>
            <div className="grid2" style={{ gridTemplateColumns: "1fr 1fr" }}>
              <div className="field">
                <label className="label" htmlFor="contact_name">
                  Nombre (opcional)
                </label>
                <input
                  id="contact_name"
                  className="input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Tu nombre"
                  autoComplete="name"
                />
              </div>

              <div className="field">
                <label className="label" htmlFor="contact_email">
                  Email (opcional)
                </label>
                <input
                  id="contact_email"
                  className="input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nombre@dominio.com"
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="field" style={{ marginTop: 12 }}>
              <label className="label" htmlFor="contact_message">
                Mensaje
              </label>
              <textarea
                id="contact_message"
                className="input"
                style={{ minHeight: 140, resize: "vertical", paddingTop: 10 }}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Cuéntanos tu duda o sugerencia…"
              />
              <div className="small">
                Tip: si es un caso raro, pega pasos para reproducirlo.
              </div>
            </div>

            {status ? (
              <div
                style={{ marginTop: 12 }}
                className={`alert ${status.kind === "ok" ? "alertOk" : "alertError"}`}
              >
                {status.kind === "ok" ? "✅ " : "❌ "}
                {status.msg}
              </div>
            ) : null}

            <div
              style={{
                marginTop: 12,
                display: "flex",
                justifyContent: "flex-end",
              }}
            >
              <button
                className="btn btnPrimary"
                type="submit"
                disabled={loading || !message.trim()}
              >
                {loading ? "Enviando…" : "Enviar"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
