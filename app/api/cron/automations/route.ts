import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail, sendWhatsAppTemplate, escapeHtml } from "@/lib/messaging";
import { planHas, toPlanKey } from "@/lib/plans";

export const dynamic = "force-dynamic";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://app.zenzia.es";
const when = (iso: string) =>
  new Date(iso).toLocaleString("es-ES", {
    timeZone: "Europe/Madrid",
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });

// Automatizaciones de Smart y Pro. Lo llama pg_cron cada hora (ver
// supabase/migrations/2026-10-07-smart-pro-features.sql) con
// "Authorization: Bearer CRON_SECRET".
//  1. Recordatorio de citas en las próximas 24 h (email en Smart, + WhatsApp en Pro).
//  2. Petición de reseña de Google tras una cita completada (Pro).
//  3. "Te echamos de menos" a clientes que llevan 60 días sin venir (Pro).
export async function GET(req: Request) {
  if (!process.env.CRON_SECRET || req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  const db = createAdminClient();
  const now = Date.now();
  const stats = { reminders: 0, reviews: 0, winback: 0 };

  // 1. Recordatorios
  const { data: upcoming } = await db
    .from("appointments")
    .select("id, starts_at, contacts(full_name, email, phone), companies(name, plan, email)")
    .eq("status", "scheduled")
    .eq("reminder_sent", false)
    .gte("starts_at", new Date(now).toISOString())
    .lte("starts_at", new Date(now + 24 * 3600000).toISOString())
    .limit(200);

  for (const a of (upcoming ?? []) as any[]) {
    const plan = toPlanKey(a.companies?.plan);
    if (!planHas(plan, "email_reminders")) continue;
    const c = a.contacts;
    const business = a.companies?.name ?? "";
    if (c?.email) {
      await sendEmail(
        c.email,
        `Recordatorio de tu cita en ${business}`,
        `<p>Hola ${escapeHtml(c.full_name)},</p><p>Te recordamos tu cita en <b>${escapeHtml(business)}</b> el <b>${when(a.starts_at)}</b>.</p><p>Si no puedes venir, avísanos respondiendo a este email.</p>`,
        a.companies?.email
      );
    }
    if (planHas(plan, "whatsapp") && c?.phone) {
      await sendWhatsAppTemplate(c.phone, [c.full_name, business, when(a.starts_at)]);
    }
    await db.from("appointments").update({ reminder_sent: true }).eq("id", a.id);
    stats.reminders++;
  }

  // 2. Reseñas de Google (citas completadas hace entre 12 y 48 h)
  const { data: done } = await db
    .from("appointments")
    .select("id, contacts(full_name, email), companies(name, plan, google_review_url, email)")
    .eq("status", "completed")
    .eq("review_requested", false)
    .gte("starts_at", new Date(now - 48 * 3600000).toISOString())
    .lte("starts_at", new Date(now - 12 * 3600000).toISOString())
    .limit(200);

  for (const a of (done ?? []) as any[]) {
    const co = a.companies;
    if (!planHas(toPlanKey(co?.plan), "reviews") || !co?.google_review_url || !a.contacts?.email) continue;
    await sendEmail(
      a.contacts.email,
      `¿Qué tal tu sesión en ${co.name}?`,
      `<p>Hola ${escapeHtml(a.contacts.full_name)},</p><p>Gracias por venir a <b>${escapeHtml(co.name)}</b>. Si te ha gustado, nos ayudaría muchísimo una reseña:</p><p><a href="${escapeHtml(co.google_review_url)}">Dejar mi reseña en Google</a></p>`,
      co.email
    );
    await db.from("appointments").update({ review_requested: true }).eq("id", a.id);
    stats.reviews++;
  }

  // 3. Clientes inactivos (una vez al día, a las 10:00 de Madrid)
  const madridHour = Number(new Date().toLocaleString("en-GB", { timeZone: "Europe/Madrid", hour: "2-digit", hour12: false }));
  if (madridHour === 10) {
    const { data: inactive } = await db.rpc("winback_candidates", { p_days: 60 });
    for (const c of (inactive ?? []) as any[]) {
      if (c.email) {
        await sendEmail(
          c.email,
          `Te echamos de menos en ${c.company_name}`,
          `<p>Hola ${escapeHtml(c.full_name)},</p><p>Hace tiempo que no te vemos por <b>${escapeHtml(c.company_name)}</b>. ¿Te reservamos una cita?</p><p><a href="${SITE_URL}/reservar/${c.company_id}">Reservar cita</a></p>`
        );
      }
      await db.from("contacts").update({ last_winback_at: new Date().toISOString() }).eq("id", c.contact_id);
      stats.winback++;
    }
  }

  return NextResponse.json({ ok: true, ...stats });
}
