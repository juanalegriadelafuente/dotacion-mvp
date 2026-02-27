// src/lib/supabaseServer.ts
import "server-only";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;

const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// OJO: la service role key JAMÁS debe ir con NEXT_PUBLIC_
if (!supabaseUrl) {
  throw new Error(
    "Missing env SUPABASE_URL (o NEXT_PUBLIC_SUPABASE_URL). Revisa que .env.local esté en la raíz del proyecto.",
  );
}

if (!serviceRoleKey) {
  throw new Error("Missing env SUPABASE_SERVICE_ROLE_KEY. Revisa .env.local.");
}

// Cliente admin (server-side) para insertar/leer leads sin RLS headaches
export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});
