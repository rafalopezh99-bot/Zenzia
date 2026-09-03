import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// Envia un email a RL Digital Studios cada vez que llega una solicitud
// nueva por /registro. La llama un trigger de Postgres (ver migracion
// 2026-09-03-signup-request-email-trigger.sql) al insertar en
// signup_requests, pasando el registro en { record: {...} }.
//
// Doble candado: ademas del JWT (verify_jwt=true), se exige un secreto
// compartido en la cabecera x-webhook-secret para que nadie que solo
// tenga la anon key (publica) pueda invocar esto y mandar spam a nuestro
// correo. Configura RESEND_API_KEY y WEBHOOK_SECRET en:
// Supabase Dashboard -> Edge Functions -> notify-signup-request -> Secrets.

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const WEBHOOK_SECRET = Deno.env.get("WEBHOOK_SECRET");
const NOTIFY_TO = "rldigitalstudios1@gmail.com";

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  if (!WEBHOOK_SECRET || req.headers.get("x-webhook-secret") !== WEBHOOK_SECRET) {
    return new Response(JSON.stringify({ ok: false, error: "unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!RESEND_API_KEY) {
    console.error("RESEND_API_KEY no configurada");
    return new Response(JSON.stringify({ ok: false, error: "RESEND_API_KEY missing" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  let payload: any;
  try {
    payload = await req.json();
  } catch {
    return new Response(JSON.stringify({ ok: false, error: "invalid json" }), { status: 400 });
  }

  const r = payload.record ?? payload;

  const html = `
    <h2>Nueva solicitud de acceso a Zenzia</h2>
    <p><strong>Nombre:</strong> ${escapeHtml(r.manager_name)}</p>
    <p><strong>Negocio:</strong> ${escapeHtml(r.business_name)}</p>
    <p><strong>Servicio:</strong> ${escapeHtml(r.service_offered)}</p>
    <p><strong>Sector:</strong> ${escapeHtml(r.vertical ?? "no indicado")}</p>
    <p><strong>Plan:</strong> ${escapeHtml(r.plan)}</p>
    <p><strong>Uso:</strong> ${escapeHtml(r.usage_type)}</p>
    <p><strong>Email:</strong> ${escapeHtml(r.email)}</p>
    <p><strong>Telefono:</strong> ${escapeHtml(r.phone)}</p>
    ${r.message ? `<p><strong>Mensaje:</strong> ${escapeHtml(r.message)}</p>` : ""}
    <p>Revisala en tu panel, dentro de "Solicitudes".</p>
  `;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: "Zenzia <onboarding@resend.dev>",
      to: [NOTIFY_TO],
      subject: `Nueva solicitud de acceso: ${r.business_name ?? ""}`,
      html,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    console.error("Error enviando email:", data);
    return new Response(JSON.stringify({ ok: false, error: data }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ ok: true, data }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
