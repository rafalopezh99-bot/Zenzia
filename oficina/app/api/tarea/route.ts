import Anthropic from "@anthropic-ai/sdk";
import { departamento } from "@/lib/departamentos";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MODELO = process.env.OFICINA_MODELO || "claude-opus-5-5";
// Tope de reanudaciones cuando la búsqueda web pausa el turno (pause_turn).
const MAX_REANUDACIONES = 4;

type Turno = { role: "user" | "assistant"; content: string };

// Cada línea de la respuesta es un evento JSON:
// {t:"texto",v} trozo de respuesta · {t:"estado",v} qué está haciendo
// {t:"error",v} · {t:"fin"}
type Evento =
  | { t: "texto"; v: string }
  | { t: "estado"; v: string }
  | { t: "error"; v: string }
  | { t: "fin" };

function validarTurnos(x: unknown): Turno[] | null {
  if (!Array.isArray(x) || x.length === 0) return null;
  const turnos: Turno[] = [];
  for (const m of x) {
    if (
      !m ||
      (m.role !== "user" && m.role !== "assistant") ||
      typeof m.content !== "string" ||
      !m.content.trim()
    ) {
      return null;
    }
    turnos.push({ role: m.role, content: m.content });
  }
  if (turnos[0].role !== "user" || turnos[turnos.length - 1].role !== "user") return null;
  return turnos;
}

export async function POST(req: Request) {
  let cuerpo: { departamento?: string; mensajes?: unknown };
  try {
    cuerpo = await req.json();
  } catch {
    return Response.json({ error: "Petición no válida" }, { status: 400 });
  }

  const depto = departamento(cuerpo.departamento ?? "");
  const turnos = validarTurnos(cuerpo.mensajes);
  if (!depto || !turnos) {
    return Response.json({ error: "Departamento o mensajes no válidos" }, { status: 400 });
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json(
      { error: "Falta ANTHROPIC_API_KEY en oficina/.env.local (mira el README)" },
      { status: 500 },
    );
  }

  const client = new Anthropic();
  const tools: Anthropic.Beta.BetaToolUnion[] = depto.busquedaWeb
    ? [{ type: "web_search_20260209", name: "web_search", max_uses: 5 }]
    : [];

  const flujo = new ReadableStream<Uint8Array>({
    async start(controller) {
      const enc = new TextEncoder();
      const enviar = (e: Evento) => controller.enqueue(enc.encode(JSON.stringify(e) + "\n"));

      const mensajes: Anthropic.Beta.BetaMessageParam[] = turnos.map((t) => ({
        role: t.role,
        content: t.content,
      }));

      try {
        for (let i = 0; i <= MAX_REANUDACIONES; i++) {
          const stream = client.beta.messages.stream(
            {
              model: MODELO,
              max_tokens: 64000,
              betas: ["server-side-fallback-2026-07-01"],
              fallbacks: "default",
              thinking: { type: "adaptive" },
              output_config: { effort: "medium" },
              system: [{ type: "text", text: depto.prompt, cache_control: { type: "ephemeral" } }],
              tools,
              messages: mensajes,
            },
            { signal: req.signal },
          );

          for await (const ev of stream) {
            if (ev.type === "content_block_start") {
              const bloque = ev.content_block;
              if (bloque.type === "thinking") enviar({ t: "estado", v: "Pensando…" });
              else if (bloque.type === "server_tool_use") enviar({ t: "estado", v: "Buscando en internet…" });
              else if (bloque.type === "text") enviar({ t: "estado", v: "Escribiendo…" });
            } else if (ev.type === "content_block_delta" && ev.delta.type === "text_delta") {
              enviar({ t: "texto", v: ev.delta.text });
            }
          }

          const final = await stream.finalMessage();
          if (final.stop_reason === "pause_turn") {
            mensajes.push({ role: "assistant", content: final.content });
            continue;
          }
          if (final.stop_reason === "refusal") {
            enviar({ t: "error", v: "El departamento no puede ayudar con esta tarea tal y como está planteada." });
          } else if (final.stop_reason === "max_tokens") {
            enviar({ t: "error", v: "La respuesta se ha cortado por larga. Pídeles que continúen." });
          }
          break;
        }
        enviar({ t: "fin" });
      } catch (err) {
        if (req.signal.aborted) {
          // El usuario canceló la tarea: no hay a quién avisar.
        } else if (err instanceof Anthropic.AuthenticationError) {
          enviar({ t: "error", v: "La clave ANTHROPIC_API_KEY no es válida." });
        } else if (err instanceof Anthropic.RateLimitError) {
          enviar({ t: "error", v: "Demasiadas peticiones seguidas. Espera un minuto y reintenta." });
        } else if (err instanceof Anthropic.APIError) {
          enviar({ t: "error", v: `Error de la API (${err.status ?? "sin código"}): ${err.message}` });
        } else {
          enviar({ t: "error", v: "Se ha perdido la conexión con Claude. Reintenta." });
        }
      } finally {
        try {
          controller.close();
        } catch {
          // ya cerrado
        }
      }
    },
  });

  return new Response(flujo, {
    headers: { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-store" },
  });
}
