import Anthropic from "@anthropic-ai/sdk";
import type { SupabaseClient } from "@supabase/supabase-js";
import { PRIMER_CONTACTO, SYSTEM_PROMPT } from "./prompt";
import { AGENT_TOOLS, executeTool, type AgentContext } from "./tools";

const client = new Anthropic();

/**
 * Tope de vueltas del loop de tools: evita una conversación colgada
 * consumiendo tokens sin fin. La última vuelta siempre es sin herramientas,
 * para obligar a contestarle al cliente con lo que ya se averiguó.
 */
const MAX_ITERATIONS = 8;

export interface HistoryRow {
  role: "customer" | "assistant" | "system" | "human_agent";
  content: string;
}

function toMessageParams(history: HistoryRow[]): Anthropic.MessageParam[] {
  const messages: Anthropic.MessageParam[] = [];
  for (const row of history) {
    if (row.role === "system") continue;
    const role = row.role === "customer" ? "user" : "assistant";
    // WhatsApp no exige alternancia estricta; el API sí permite turnos consecutivos
    // del mismo rol (los combina), así que basta con mapear 1 a 1.
    messages.push({ role, content: row.content });
  }
  return messages;
}

/**
 * Corre el motor comercial sobre el historial de una conversación y devuelve
 * el texto de la respuesta final para enviar al cliente por WhatsApp.
 */
export async function runEngine(
  ctx: AgentContext,
  history: HistoryRow[]
): Promise<string> {
  const messages = toMessageParams(history);
  // Claude a veces escribe texto para el cliente en el mismo turno en que
  // llama una tool (antes de que el loop continúe). Se acumula el texto de
  // TODOS los turnos, no solo del último, para no perder esa respuesta.
  const collectedText: string[] = [];

  // Solo el mensaje entrante en el historial ⇒ es el primer contacto y toca
  // presentarse. En los turnos siguientes no se envía ese bloque, para que
  // no vuelva a saludar a mitad de la conversación.
  const system =
    messages.length <= 1 ? `${SYSTEM_PROMPT}\n\n${PRIMER_CONTACTO}` : SYSTEM_PROMPT;

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    // Con muchas consultas seguidas (p. ej. revisar la talla en varios
    // cascos) el modelo podía agotar las vueltas sin escribir nada, y el
    // cliente recibía el mensaje de respaldo aunque la respuesta ya estaba
    // averiguada. En la última vuelta se le quitan las herramientas.
    const ultimaVuelta = i === MAX_ITERATIONS - 1;
    const response = await client.messages.create({
      model: "claude-opus-5",
      max_tokens: 1024,
      system,
      tools: AGENT_TOOLS,
      ...(ultimaVuelta ? { tool_choice: { type: "none" as const } } : {}),
      messages,
    });

    const turnText = extractText(response.content);
    if (turnText) collectedText.push(turnText);

    const toolUseBlocks = response.content.filter(
      (b): b is Anthropic.ToolUseBlock => b.type === "tool_use"
    );

    if (toolUseBlocks.length === 0) {
      return collectedText.join("\n\n") || FALLBACK_REPLY;
    }

    messages.push({ role: "assistant", content: response.content });

    const toolResults: Anthropic.ToolResultBlockParam[] = [];
    for (const block of toolUseBlocks) {
      const result = await executeTool(
        block.name,
        (block.input as Record<string, unknown>) ?? {},
        ctx
      );
      toolResults.push({ type: "tool_result", tool_use_id: block.id, content: result });
    }
    messages.push({ role: "user", content: toolResults });
  }

  return collectedText.join("\n\n") || FALLBACK_REPLY;
}

/**
 * Solo si ni la vuelta final produjo texto. No promete "te escribo ahorita":
 * el asesor solo contesta cuando el cliente escribe, así que esa promesa lo
 * dejaba esperando para siempre. Pedirle que repita reactiva la conversación.
 */
const FALLBACK_REPLY =
  "Perdona, se me enredó el sistema buscando eso. ¿Me lo repites y te respondo de una?";

function extractText(content: Anthropic.ContentBlock[]): string {
  return content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();
}
