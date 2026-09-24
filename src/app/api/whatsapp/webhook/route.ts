import { NextResponse, type NextRequest } from "next/server";
import { after } from "next/server";
import { createServiceClient } from "@/lib/supabase/serviceClient";
import {
  parseIncomingMessage,
  sendWhatsAppMessage,
  verifyWebhookSignature,
  type IncomingWhatsAppMessage,
} from "@/lib/whatsapp/client";
import { runEngine, type HistoryRow } from "@/lib/agent/engine";

export const runtime = "nodejs";
/** El asesor puede tardar ~30 s cuando encadena varias consultas al catálogo. */
export const maxDuration = 60;

/** Verificación del webhook: Meta llama esto una vez al configurarlo en developers.facebook.com. */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const mode = params.get("hub.mode");
  const token = params.get("hub.verify_token");
  const challenge = params.get("hub.challenge");

  if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN && challenge) {
    return new NextResponse(challenge, { status: 200 });
  }
  return new NextResponse("Verificación fallida", { status: 403 });
}

/**
 * Recepción de mensajes entrantes de WhatsApp Cloud API.
 *
 * Se responde 200 de inmediato y la conversación se procesa después con
 * `after()`: generar la respuesta toma entre 10 y 30 segundos, y Meta
 * reintenta los webhooks que tardan en contestar — sin esto, el cliente
 * recibiría la misma respuesta varias veces.
 */
export async function POST(request: NextRequest) {
  const rawBody = await request.text();

  if (!verifyWebhookSignature(rawBody, request.headers.get("x-hub-signature-256"))) {
    return new NextResponse("Firma inválida", { status: 401 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ ok: true });
  }

  const incoming = parseIncomingMessage(payload);
  // Sin mensaje entrante (confirmaciones de entrega/lectura, estados, etc.).
  if (!incoming) return NextResponse.json({ ok: true });

  after(() => atender(incoming));
  return NextResponse.json({ ok: true });
}

/**
 * Espera antes de responder, para agrupar mensajes seguidos: mucha gente
 * escribe "Hola" y enseguida la pregunta, o manda el mismo saludo dos veces.
 */
const AGRUPAR_MS = 2000;

/** Todo el trabajo pesado: ya se le respondió a Meta antes de llegar aquí. */
async function atender(incoming: IncomingWhatsAppMessage) {
  try {
    // Meta llama este endpoint sin sesión de usuario: la firma HMAC ya
    // verificada arriba es la autenticación real, así que se usa la service
    // role (las RPC wa_* ya no son ejecutables por `anon`/`authenticated`).
    const supabase = await createServiceClient();

    const { data: customerId, error: customerError } = await supabase.rpc(
      "wa_touch_customer",
      { p_phone: incoming.from, p_name: incoming.name }
    );
    if (customerError || !customerId) throw customerError ?? new Error("No se pudo crear el cliente");

    const { data: conversationId, error: conversationError } = await supabase.rpc(
      "wa_get_active_conversation",
      { p_customer_id: customerId, p_channel: "whatsapp" }
    );
    if (conversationError || !conversationId) {
      throw conversationError ?? new Error("No se pudo crear la conversación");
    }

    // Candado de idempotencia: si Meta reenvía el mismo mensaje, aquí se corta
    // y no se le responde dos veces al cliente. Fotos, audios y demás también
    // quedan en el chat con su etiqueta, para que se vean en el panel.
    const { data: esNuevo } = await supabase.rpc("wa_claim_incoming_message", {
      p_conversation_id: conversationId,
      p_content: incoming.display,
      p_wa_message_id: incoming.waMessageId,
    });
    if (esNuevo === false) return;

    // Alguien tomó el chat desde el panel: el mensaje ya quedó guardado y
    // aparece como no leído; el bot no se mete en la conversación.
    const { data: pausado } = await supabase.rpc("wa_bot_paused", {
      p_conversation_id: conversationId,
    });
    if (pausado === true) return;

    // Si el cliente mandó otro mensaje después de este, responde el de ese
    // último (su historial ya incluye este): así no le llegan dos respuestas.
    const sigueSiendoElUltimo = async () => {
      const { data } = await supabase.rpc("wa_is_latest_customer_message", {
        p_conversation_id: conversationId,
        p_wa_message_id: incoming.waMessageId,
      });
      return data !== false;
    };
    await new Promise((r) => setTimeout(r, AGRUPAR_MS));
    if (!(await sigueSiendoElUltimo())) return;

    // Fotos y audios también pasan por el asesor (llegan como "[Imagen]",
    // "[Audio]"…): con contexto sabe si es el comprobante de una
    // transferencia o si tiene que pedir que se lo escriban.
    // 40 mensajes: con 20, en conversaciones largas olvidaba la talla o el
    // nombre que el cliente dio al principio.
    const { data: historyRows } = await supabase.rpc("wa_recent_messages", {
      p_conversation_id: conversationId,
      p_limit: 40,
    });

    const reply = await runEngine(
      { supabase, customerId, conversationId, phone: incoming.from },
      (historyRows ?? []) as HistoryRow[]
    );

    // El asesor tarda hasta ~30 s: si en ese rato alguien tomó el chat desde
    // el panel, la respuesta se descarta en vez de pisarle la conversación.
    const { data: pausadoAhora } = await supabase.rpc("wa_bot_paused", {
      p_conversation_id: conversationId,
    });
    if (pausadoAhora === true) return;
    // Y si mientras tanto escribió algo más, esa respuesta ya quedó vieja.
    if (!(await sigueSiendoElUltimo())) return;

    const wamid = await sendWhatsAppMessage(incoming.from, reply);
    await supabase.rpc("wa_log_message", {
      p_conversation_id: conversationId,
      p_role: "assistant",
      p_content: reply,
      p_wa_message_id: wamid,
    });
  } catch (err) {
    console.error("whatsapp webhook error", err);
  }
}
