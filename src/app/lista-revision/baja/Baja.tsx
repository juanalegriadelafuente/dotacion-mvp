"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";

type Estado = "listo" | "enviando" | "hecho" | "error";

export default function Baja() {
  const token = useSearchParams().get("t") ?? "";
  const [estado, setEstado] = useState<Estado>("listo");

  async function confirmar() {
    setEstado("enviando");
    try {
      const res = await fetch(
        `/api/lista-revision/baja?t=${encodeURIComponent(token)}`,
        { method: "POST" },
      );
      setEstado(res.ok ? "hecho" : "error");
    } catch {
      setEstado("error");
    }
  }

  if (estado === "hecho") {
    return (
      <output className="mt-6 block text-[17px] text-[#C3CCD5]">
        Listo. Borramos tu correo y no te escribiremos más.
      </output>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={confirmar}
        disabled={estado === "enviando" || !token}
        className="mt-6 h-[50px] rounded-lg bg-[#2BB58D] px-5 text-[16px] font-semibold text-[#06140F] disabled:opacity-60"
      >
        {estado === "enviando" ? "Dando de baja…" : "Darme de baja"}
      </button>
      {(estado === "error" || !token) && (
        <p role="alert" className="mt-3 text-[14px] text-[#FF8A8A]">
          No pudimos darte de baja con este enlace. Escríbenos a hola@kaden.cl y
          lo hacemos a mano.
        </p>
      )}
    </>
  );
}
