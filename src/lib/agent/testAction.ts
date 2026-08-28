"use server";

import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/serviceClient";
import { runEngine, type HistoryRow } from "./engine";

const TEST_PHONE = "test-admin-panel";

/**
 * Corre el motor comercial desde el panel admin, sin necesitar WhatsApp
 * conectado. Solo para administradores autenticados (mismo guard que el
 * resto del panel, más esta verificación explícita de defensa en profundidad).
 */
export async function testAgentMessage(
  userText: string
): Promise<{ reply: string } | { error: string }> {
  const authClient = await createClient();
  const {
    data: { user },
  } = await authClient.auth.getUser();
  if (!user) return { error: "No autenticado." };

  const text = userText.trim();
  if (!text) return { error: "Escribe un mensaje de prueba." };

  // La sesión de admin ya se verificó arriba; las RPC wa_* corren con la
  // service role porque dejaron de ser ejecutables por `authenticated`.
  const supabase = await createServiceClient();

  const { data: customerId, error: e1 } = await supabase.rpc("wa_touch_customer", {
    p_phone: TEST_PHONE,
    p_name: "Prueba interna (panel)",
  });
  if (e1 || !customerId) return { error: e1?.message ?? "No se pudo crear el cliente de prueba." };

  const { data: conversationId, error: e2 } = await supabase.rpc(
    "wa_get_active_conversation",
    { p_customer_id: customerId, p_channel: "web" }
  );
  if (e2 || !conversationId) {
    return { error: e2?.message ?? "No se pudo crear la conversación de prueba." };
  }

  await supabase.rpc("wa_log_message", {
    p_conversation_id: conversationId,
    p_role: "customer",
    p_content: text,
  });

  const { data: historyRows } = await supabase.rpc("wa_recent_messages", {
    p_conversation_id: conversationId,
    p_limit: 20,
  });

  try {
    const reply = await runEngine(
      { supabase, customerId, conversationId, phone: TEST_PHONE },
      (historyRows ?? []) as HistoryRow[]
    );
    await supabase.rpc("wa_log_message", {
      p_conversation_id: conversationId,
      p_role: "assistant",
      p_content: reply,
    });
    return { reply };
  } catch (err) {
    return {
      error:
        err instanceof Error
          ? err.message
          : "Error inesperado llamando a Claude.",
    };
  }
}
