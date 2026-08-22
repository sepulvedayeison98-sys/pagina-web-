import { NextResponse, type NextRequest } from "next/server";
import { after } from "next/server";
import { createClient } from "@/lib/supabase/server";
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

/** Todo el trabajo pesado: ya se le respondió a Meta antes de llegar aquí. */
async function atender(incoming: IncomingWhatsAppMessage) {
  try {
    if (!incoming.text) {
      await sendWhatsAppMessage(
        incoming.from,
        "Por ahora solo puedo leer mensajes de texto. ¿Me cuentas en palabras qué casco buscas?"
      );
      return;
    }

    const supabase = await createClient();

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
    // y no se le responde dos veces al cliente.
    const { data: esNuevo } = await supabase.rpc("wa_claim_incoming_message", {
      p_conversation_id: conversationId,
      p_content: incoming.text,
      p_wa_message_id: incoming.waMessageId,
    });
    if (esNuevo === false) return;

    const { data: historyRows } = await supabase.rpc("wa_recent_messages", {
      p_conversation_id: conversationId,
      p_limit: 20,
    });

    const reply = await runEngine(
      { supabase, customerId, conversationId, phone: incoming.from },
      (historyRows ?? []) as HistoryRow[]
    );

    await supabase.rpc("wa_log_message", {
      p_conversation_id: conversationId,
      p_role: "assistant",
      p_content: reply,
    });

    await sendWhatsAppMessage(incoming.from, reply);
  } catch (err) {
    console.error("whatsapp webhook error", err);
  }
}
