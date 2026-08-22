import Anthropic from "@anthropic-ai/sdk";
import type { SupabaseClient } from "@supabase/supabase-js";
import { SYSTEM_PROMPT } from "./prompt";
import { AGENT_TOOLS, executeTool, type AgentContext } from "./tools";

const client = new Anthropic();

/** Tope de vueltas del loop de tools: evita una conversación colgada consumiendo tokens sin fin. */
const MAX_ITERATIONS = 6;

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

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    const response = await client.messages.create({
      model: "claude-opus-5",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      tools: AGENT_TOOLS,
      messages,
    });

    const toolUseBlocks = response.content.filter(
      (b): b is Anthropic.ToolUseBlock => b.type === "tool_use"
    );

    if (toolUseBlocks.length === 0) {
      return extractText(response.content);
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

  return "Dame un momento para confirmar bien ese dato y te escribo enseguida.";
}

function extractText(content: Anthropic.ContentBlock[]): string {
  return content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();
}
