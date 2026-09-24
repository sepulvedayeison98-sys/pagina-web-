"use server";

import { createClient } from "@/lib/supabase/server";
import { esContactoWhatsApp, sendWhatsAppMessage } from "./client";

/** Qué decir cuando Meta rechaza el envío, según su código de error. */
function explicarError(detalle: string): string {
  const codigo = Number(detalle.match(/"code"\s*:\s*(\d+)/)?.[1]);
  switch (codigo) {
    case 131047:
      return "Pasaron más de 24 horas desde el último mensaje del cliente. WhatsApp solo deja escribirle de nuevo con una plantilla aprobada por Meta, o cuando el cliente vuelva a escribir.";
    case 131026:
      return "El número no pudo recibir el mensaje (puede no tener WhatsApp o haber bloqueado al negocio).";
    case 131056:
      return "Se enviaron demasiados mensajes seguidos a este cliente. Espera un momento.";
    case 190:
      return "El token de WhatsApp venció. Revísalo en la pestaña Conexión.";
    default:
      return "Meta no aceptó el mensaje. Revisa la pestaña Conexión.";
  }
}

/**
 * Envía un mensaje escrito por una persona desde el panel.
 *
 * Al tomar el chat se pausa el bot en esa conversación: si no, el asesor
 * le contestaría al cliente encima de la persona. Se reactiva desde el
 * mismo panel.
 */
export async function enviarComoHumano(
  customerId: string,
  texto: string
): Promise<{ ok: true } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado." };

  const cuerpo = texto.trim();
  if (!cuerpo) return { error: "Escribe un mensaje." };
  if (cuerpo.length > 4096) return { error: "El mensaje es demasiado largo (máx. 4096 caracteres)." };

  // Las políticas is_admin() hacen de segundo guard: un usuario que no sea
  // admin no ve el cliente y se corta aquí.
  const { data: cliente } = await supabase
    .from("wa_customers")
    .select("id,phone")
    .eq("id", customerId)
    .maybeSingle();
  if (!cliente) return { error: "Cliente no encontrado." };
  if (!esContactoWhatsApp(cliente.phone)) {
    return { error: "Este chat es de prueba interna: no tiene un número de WhatsApp real." };
  }

  // Reusa la conversación abierta; si el chat estaba archivado, abre una
  // nueva para que la respuesta del cliente caiga en el mismo hilo.
  const { data: conversationId, error: errConv } = await supabase.rpc(
    "wa_get_active_conversation",
    { p_customer_id: customerId, p_channel: "whatsapp" }
  );
  if (errConv || !conversationId) return { error: "No se pudo abrir la conversación." };

  let wamid: string | null;
  try {
    wamid = await sendWhatsAppMessage(cliente.phone, cuerpo);
  } catch (err) {
    const detalle = err instanceof Error ? err.message : "";
    console.error("envío manual de WhatsApp", detalle);
    return { error: explicarError(detalle) };
  }

  await supabase.rpc("wa_log_message", {
    p_conversation_id: conversationId,
    p_role: "human_agent",
    p_content: cuerpo,
    p_wa_message_id: wamid,
  });

  await supabase
    .from("wa_conversations")
    .update({ bot_paused: true, admin_read_at: new Date().toISOString() })
    .eq("id", conversationId);

  return { ok: true };
}
