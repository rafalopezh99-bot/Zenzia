import type Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { fromAppLocalInput, formatAppTime } from "@/lib/timezone";
import { parseLines } from "@/lib/documents";

// Herramientas del asistente virtual. Todas usan el cliente de Supabase con la
// sesión del usuario, así que RLS limita cada consulta a SU negocio.

type Supa = Awaited<ReturnType<typeof createClient>>;

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString("es-ES", { timeZone: "Europe/Madrid", weekday: "short", day: "numeric", month: "short" }) +
  " " +
  formatAppTime(iso);

export const ASSISTANT_TOOLS: Anthropic.Beta.BetaTool[] = [
  {
    name: "get_appointments",
    description:
      "Lista las citas del negocio entre dos fechas (incluidas), con cliente, servicio, estado y notas. Usa fechas YYYY-MM-DD en hora de España.",
    input_schema: {
      type: "object",
      properties: {
        from_date: { type: "string", description: "Fecha inicial YYYY-MM-DD" },
        to_date: { type: "string", description: "Fecha final YYYY-MM-DD" },
      },
      required: ["from_date", "to_date"],
      additionalProperties: false,
    },
    strict: true,
  },
  {
    name: "search_clients",
    description: "Busca clientes/pacientes por nombre o teléfono. Devuelve id, nombre, teléfono y email.",
    input_schema: {
      type: "object",
      properties: { query: { type: "string", description: "Texto a buscar (nombre o teléfono)" } },
      required: ["query"],
      additionalProperties: false,
    },
    strict: true,
  },
  {
    name: "get_client_history",
    description:
      "Ficha de un cliente: datos, últimas citas con sus notas de sesión, evolución registrada (seguimiento), bonos y facturas.",
    input_schema: {
      type: "object",
      properties: { client_id: { type: "string", description: "id del cliente (de search_clients)" } },
      required: ["client_id"],
      additionalProperties: false,
    },
    strict: true,
  },
  {
    name: "get_billing_summary",
    description: "Resumen de facturación entre dos fechas: total facturado, cobrado, pendiente y desglose por concepto.",
    input_schema: {
      type: "object",
      properties: {
        from_date: { type: "string", description: "YYYY-MM-DD" },
        to_date: { type: "string", description: "YYYY-MM-DD" },
      },
      required: ["from_date", "to_date"],
      additionalProperties: false,
    },
    strict: true,
  },
  {
    name: "list_services",
    description: "Catálogo de servicios del negocio (id, nombre, duración en minutos y precio).",
    input_schema: { type: "object", properties: {}, required: [], additionalProperties: false },
    strict: true,
  },
  {
    name: "create_appointment",
    description:
      "Crea una cita. Úsala SOLO después de que el usuario haya confirmado explícitamente cliente, día y hora. starts_at en hora de España con formato YYYY-MM-DDTHH:MM.",
    input_schema: {
      type: "object",
      properties: {
        client_id: { type: "string" },
        starts_at: { type: "string", description: "YYYY-MM-DDTHH:MM (hora de España)" },
        service_id: { type: ["string", "null"], description: "id del servicio o null" },
        duration_min: { type: ["integer", "null"], description: "Duración en minutos si no hay servicio" },
        notes: { type: ["string", "null"] },
      },
      required: ["client_id", "starts_at", "service_id", "duration_min", "notes"],
      additionalProperties: false,
    },
    strict: true,
  },
];

const day = (d: string, end = false) => fromAppLocalInput(`${d}T${end ? "23:59" : "00:00"}`).toISOString();

export async function runAssistantTool(supabase: Supa, companyId: string, name: string, input: any): Promise<unknown> {
  switch (name) {
    case "get_appointments": {
      const { data } = await supabase
        .from("appointments")
        .select("starts_at, ends_at, status, notes, price, contacts(id, full_name), services(name)")
        .gte("starts_at", day(input.from_date))
        .lte("starts_at", day(input.to_date, true))
        .order("starts_at")
        .limit(200);
      return (data ?? []).map((a: any) => ({
        cuando: fmtDate(a.starts_at),
        cliente: a.contacts?.full_name,
        cliente_id: a.contacts?.id,
        servicio: a.services?.name ?? null,
        estado: a.status,
        notas: a.notes,
      }));
    }
    case "search_clients": {
      const q = String(input.query ?? "").replace(/[,()%*]/g, " ").trim();
      const { data } = await supabase
        .from("contacts")
        .select("id, full_name, phone, email")
        .eq("status", "active")
        .or(`full_name.ilike.%${q}%,phone.ilike.%${q}%`)
        .limit(15);
      return data ?? [];
    }
    case "get_client_history": {
      const id = String(input.client_id);
      const [c, appts, progress, packages, invoices] = await Promise.all([
        supabase.from("contacts").select("full_name, phone, email, birth_date, custom_fields, created_at").eq("id", id).single(),
        supabase.from("appointments").select("starts_at, status, notes, services(name)").eq("contact_id", id).order("starts_at", { ascending: false }).limit(15),
        supabase.from("activities").select("created_at, custom_fields, content").eq("contact_id", id).eq("type", "progress").order("created_at", { ascending: false }).limit(20),
        supabase.from("packages").select("name, total_sessions, used_sessions, active").eq("contact_id", id),
        supabase.from("invoices").select("doc_number, issue_date, amount, status").eq("contact_id", id).order("issue_date", { ascending: false }).limit(10),
      ]);
      if (!c.data) return { error: "Cliente no encontrado" };
      return {
        cliente: c.data,
        citas: (appts.data ?? []).map((a: any) => ({ cuando: fmtDate(a.starts_at), estado: a.status, servicio: a.services?.name, notas: a.notes })),
        evolucion: progress.data,
        bonos: packages.data,
        facturas: invoices.data,
      };
    }
    case "get_billing_summary": {
      const { data } = await supabase
        .from("invoices")
        .select("amount, status, lines, concept, rectifies_id")
        .gte("issue_date", input.from_date)
        .lte("issue_date", input.to_date);
      const rows = (data ?? []).filter((i: any) => i.status !== "anulada" && !i.rectifies_id);
      const total = rows.reduce((s: number, i: any) => s + Number(i.amount), 0);
      const cobrado = rows.filter((i: any) => i.status === "pagada").reduce((s: number, i: any) => s + Number(i.amount), 0);
      const porConcepto: Record<string, number> = {};
      for (const i of rows as any[]) {
        const lines = parseLines(i.lines);
        if (lines.length) lines.forEach((l) => (porConcepto[l.concept] = (porConcepto[l.concept] ?? 0) + l.qty * l.price));
        else porConcepto[i.concept ?? "Otros"] = (porConcepto[i.concept ?? "Otros"] ?? 0) + Number(i.amount);
      }
      return { facturas: rows.length, total_eur: total, cobrado_eur: cobrado, pendiente_eur: total - cobrado, por_concepto_eur: porConcepto };
    }
    case "list_services": {
      const { data } = await supabase.from("services").select("id, name, duration_min, price").eq("active", true).order("name");
      return data ?? [];
    }
    case "create_appointment": {
      if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(String(input.starts_at))) return { error: "starts_at debe ser YYYY-MM-DDTHH:MM" };
      let duration = Number(input.duration_min) || 60;
      let price: number | null = null;
      if (input.service_id) {
        const { data: s } = await supabase.from("services").select("duration_min, price").eq("id", input.service_id).single();
        if (s) {
          duration = s.duration_min;
          price = s.price;
        }
      }
      const start = fromAppLocalInput(input.starts_at);
      const { error } = await supabase.from("appointments").insert({
        company_id: companyId,
        contact_id: input.client_id,
        starts_at: start.toISOString(),
        ends_at: new Date(start.getTime() + duration * 60000).toISOString(),
        service_id: input.service_id || null,
        price,
        notes: input.notes || null,
      });
      return error ? { error: error.message } : { ok: true, cita: fmtDate(start.toISOString()) };
    }
    default:
      return { error: `Herramienta desconocida: ${name}` };
  }
}
