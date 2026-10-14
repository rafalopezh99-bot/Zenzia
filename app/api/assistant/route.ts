import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { getCurrentCompanyProfile } from "@/lib/company";
import { getTerminology } from "@/lib/terminology";
import { planHas } from "@/lib/plans";
import { ASSISTANT_TOOLS, runAssistantTool } from "@/lib/assistant/tools";

// Asistente virtual del profesional (plan Pro). El cliente envía el historial
// completo tal cual se lo devolvimos (incluidos los bloques de pensamiento:
// el historial no se edita, solo se añade al final) y el mensaje nuevo.
export const maxDuration = 60;

// Modelo más económico (Claude Haiku 5.5). Para más calidad: "claude-sonnet-5-5" o "claude-opus-5-5".
const MODEL = "claude-haiku-5-5";
const MONTHLY_LIMIT = 300; // mensajes del usuario al mes por negocio
const MAX_TOOL_ROUNDS = 6;

const client = new Anthropic(); // ANTHROPIC_API_KEY del entorno

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "El asistente todavía no está configurado." }, { status: 503 });
  }
  const profile = await getCurrentCompanyProfile();
  if (!planHas(profile.plan, "assistant")) {
    return NextResponse.json({ error: "El asistente está disponible en el plan Pro." }, { status: 403 });
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sesión caducada" }, { status: 401 });

  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
  const { count } = await supabase
    .from("assistant_usage")
    .select("id", { count: "exact", head: true })
    .gte("created_at", monthStart);
  if ((count ?? 0) >= MONTHLY_LIMIT) {
    return NextResponse.json({ error: `Has usado los ${MONTHLY_LIMIT} mensajes del asistente de este mes.` }, { status: 429 });
  }

  const body = (await req.json()) as { history?: Anthropic.Beta.BetaMessageParam[]; message?: string };
  const text = String(body.message ?? "").trim().slice(0, 4000);
  if (!text) return NextResponse.json({ error: "Mensaje vacío" }, { status: 400 });
  const messages: Anthropic.Beta.BetaMessageParam[] = [...(body.history ?? []), { role: "user", content: text }];

  const terms = getTerminology(profile.vertical);
  const today = new Date().toLocaleDateString("es-ES", { timeZone: "Europe/Madrid", weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const system = [
    {
      type: "text" as const,
      text:
        `Eres el asistente virtual de Zenzia, el CRM de "${profile.companyName}" (sector: ${profile.vertical ?? "general"}). ` +
        `Ayudas al profesional${profile.fullName ? ` (${profile.fullName})` : ""} con su agenda, sus ${terms.contacts.toLowerCase()}, la facturación y la redacción de textos. ` +
        `Responde siempre en español, de forma breve y clara, sin tecnicismos. Usa las herramientas para consultar datos reales; nunca inventes datos. ` +
        `Antes de crear una cita, resume cliente, día, hora y servicio y pide confirmación; créala solo cuando el usuario diga que sí. ` +
        `No das diagnósticos médicos: si te piden pautas o ejercicios, ofrécelos como propuesta orientativa para que el profesional los revise. ` +
        `Las cantidades en euros con formato español (1.234,50 €).`,
      cache_control: { type: "ephemeral" as const },
    },
    { type: "text" as const, text: `Hoy es ${today}. Zona horaria: España (Europe/Madrid).` },
  ];

  let inputTokens = 0;
  let outputTokens = 0;
  try {
    for (let round = 0; round <= MAX_TOOL_ROUNDS; round++) {
      const response = await client.beta.messages.create({
        model: MODEL,
        max_tokens: 16000,
        output_config: { effort: "low" },
        system,
        tools: ASSISTANT_TOOLS,
        messages,
      });
      inputTokens += response.usage.input_tokens;
      outputTokens += response.usage.output_tokens;
      // Se guarda la respuesta completa (no solo el texto) para no editar el historial.
      messages.push({ role: "assistant", content: response.content });

      if (response.stop_reason === "refusal") {
        await logUsage();
        return NextResponse.json({ history: messages, reply: "Lo siento, no puedo ayudarte con eso." });
      }
      if (response.stop_reason !== "tool_use") {
        await logUsage();
        const reply = response.content
          .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === "text")
          .map((b) => b.text)
          .join("\n")
          .trim();
        return NextResponse.json({ history: messages, reply: reply || "Hecho." });
      }

      const toolUses = response.content.filter((b): b is Anthropic.Beta.BetaToolUseBlock => b.type === "tool_use");
      const results = await Promise.all(
        toolUses.map(async (t): Promise<Anthropic.Beta.BetaToolResultBlockParam> => {
          try {
            const out = await runAssistantTool(supabase, profile.companyId, t.name, t.input);
            return { type: "tool_result", tool_use_id: t.id, content: JSON.stringify(out) };
          } catch (e) {
            return { type: "tool_result", tool_use_id: t.id, content: e instanceof Error ? e.message : "Error", is_error: true };
          }
        })
      );
      messages.push({ role: "user", content: results });
    }
    await logUsage();
    return NextResponse.json({ history: messages, reply: "No he podido terminar esa tarea, ¿puedes concretarla un poco más?" });
  } catch (e) {
    if (e instanceof Anthropic.RateLimitError) {
      return NextResponse.json({ error: "El asistente está muy ocupado, prueba en unos segundos." }, { status: 429 });
    }
    if (e instanceof Anthropic.APIError) {
      return NextResponse.json({ error: `Error del asistente (${e.status}).` }, { status: 502 });
    }
    throw e;
  }

  async function logUsage() {
    await supabase.from("assistant_usage").insert({
      company_id: profile.companyId,
      user_id: user!.id,
      input_tokens: inputTokens,
      output_tokens: outputTokens,
    });
  }
}
