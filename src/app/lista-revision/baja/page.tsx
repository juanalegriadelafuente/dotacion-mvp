// src/app/lista-revision/baja/page.tsx
import type { Metadata } from "next";
import { Suspense } from "react";
import SiteFooter from "@/components/SiteFooter";
import SiteNav from "@/components/SiteNav";
import Baja from "./Baja";

export const metadata: Metadata = {
  title: "Darme de baja",
  robots: { index: false, follow: false },
};

export default function PaginaBaja() {
  return (
    <div className="noche">
      <SiteNav />
      <main className="px-4 py-16 sm:px-10">
        <div className="mx-auto max-w-[640px]">
          <h1 className="titular text-[clamp(32px,5vw,44px)] leading-[1.05]">
            ¿Dejas de recibir estos correos?
          </h1>
          <Suspense>
            <Baja />
          </Suspense>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
