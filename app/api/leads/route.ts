import { NextRequest, NextResponse } from "next/server";
import { insertLead, type LeadOrigin } from "@/lib/leads";

// Endpoint público para que OTROS sitios (hoy: rldigitalstudios.com)
// puedan mandar un lead a Zenzia sin tener sesión. Reutiliza la misma
// inserción en `contacts` (etapa "nuevo_lead") que el formulario propio de
// la landing de Zenzia — ver lib/leads.ts. Solo acepta insertar, nunca
// leer ni modificar nada; la política RLS que lo permite está en
// supabase/migrations/2026-08-31-landing-contact-form.sql.
//
// IMPORTANTE al desplegar: cambia la URL a la que apunta el formulario de
// rldigitalstudios.com (hoy http://localhost:3000/api/leads para pruebas
// en local) por la URL real una vez Zenzia esté publicado, p. ej.
// https://app.zenzia.es/api/leads.

const ALLOWED_ORIGINS = [
  "https://zenzia.es",
  "https://www.zenzia.es",
  "https://rldigitalstudios.com",
  "https://www.rldigitalstudios.com",
];

function corsHeaders(origin: string | null): Record<string, string> {
  const allowed = !!origin && (ALLOWED_ORIGINS.includes(origin) || origin.startsWith("http://localhost"));
  const headers: Record<string, string> = {
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
  if (allowed) headers["Access-Control-Allow-Origin"] = origin as string;
  return headers;
}

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(req.headers.get("origin")) });
}

export async function POST(req: NextRequest) {
  const headers = corsHeaders(req.headers.get("origin"));

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "JSON inválido" }, { status: 400, headers });
  }

  // Honeypot anti-spam: mismo patrón que el formulario propio de Zenzia.
  if (typeof body.website === "string" && body.website.trim() !== "") {
    return NextResponse.json({ ok: true, error: null }, { headers });
  }

  const originParam = typeof body.origen === "string" ? body.origen : "rldigitalstudios";
  const origen: LeadOrigin = originParam === "landing_zenzia" ? "landing_zenzia" : "rldigitalstudios";

  const result = await insertLead({
    full_name: String(body.full_name ?? body.nombre ?? ""),
    email: String(body.email ?? ""),
    message: String(body.message ?? body.mensaje ?? ""),
    origen,
  });

  return NextResponse.json(result, { status: result.ok ? 200 : 400, headers });
}
