"use client";
// src/components/Medicion.tsx
//
// Lo que se mide en todas las páginas (D-ING-11): una visita por página, y los
// clics que salen hacia Kaden (la revisión y Lite), que es donde se convierte.
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { medir } from "@/lib/medir";

export default function Medicion() {
  const ruta = usePathname();

  useEffect(() => {
    medir("visita", ruta);
  }, [ruta]);

  useEffect(() => {
    function alHacerClic(e: MouseEvent) {
      const a = (e.target as HTMLElement | null)?.closest?.("a");
      if (!a?.href) return;
      if (a.href.includes("kaden.cl/verificador"))
        medir("revisar_click", location.pathname);
      else if (a.href.includes("lite.kaden.cl"))
        medir("lite_click", location.pathname);
      else if (
        a.pathname === "/kit-turnos" &&
        location.pathname !== "/kit-turnos"
      )
        medir("kit_click", location.pathname);
    }
    document.addEventListener("click", alHacerClic, { capture: true });
    return () =>
      document.removeEventListener("click", alHacerClic, { capture: true });
  }, []);

  return null;
}
