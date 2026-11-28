import { createClient } from "@supabase/supabase-js";

// Cliente anónimo (sin cookies) para las rutas públicas de la tienda. Solo
// puede llamar a las funciones public_shop_* (security definer), que ya
// filtran por empresa y por módulo activo.
export function anonClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false },
  });
}

// La web de la tienda está en otro dominio (Netlify), así que estas rutas
// responden con CORS abierto: no usan cookies ni devuelven nada privado.
export const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
};

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
