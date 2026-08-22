import { createHmac, timingSafeEqual } from "crypto";

const GRAPH_VERSION = process.env.WHATSAPP_GRAPH_VERSION || "v22.0";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Falta la variable de entorno ${name}`);
  return value;
}

/** Envía un mensaje de texto libre por WhatsApp Cloud API. `to` en formato internacional sin "+". */
export async function sendWhatsAppMessage(to: string, body: string): Promise<void> {
  const token = requireEnv("WHATSAPP_TOKEN");
  const phoneNumberId = requireEnv("WHATSAPP_PHONE_NUMBER_ID");

  const res = await fetch(
    `https://graph.facebook.com/${GRAPH_VERSION}/${phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body, preview_url: false },
      }),
    }
  );

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Error enviando WhatsApp (${res.status}): ${detail}`);
  }
}

/**
 * Verifica la firma X-Hub-Signature-256 del webhook contra WHATSAPP_APP_SECRET,
 * usando comparación de tiempo constante para evitar timing attacks.
 */
export function verifyWebhookSignature(
  rawBody: string,
  signatureHeader: string | null
): boolean {
  if (!signatureHeader?.startsWith("sha256=")) return false;

  const appSecret = process.env.WHATSAPP_APP_SECRET;
  if (!appSecret) return false;

  const expected = createHmac("sha256", appSecret).update(rawBody, "utf8").digest("hex");
  const received = signatureHeader.slice("sha256=".length);

  const expectedBuf = Buffer.from(expected, "hex");
  const receivedBuf = Buffer.from(received, "hex");
  if (expectedBuf.length !== receivedBuf.length) return false;
  return timingSafeEqual(expectedBuf, receivedBuf);
}

export interface IncomingWhatsAppMessage {
  from: string;
  waMessageId: string;
  name: string | null;
  text: string | null;
}

/** Extrae el primer mensaje de texto de un payload de webhook de WhatsApp Cloud API. */
export function parseIncomingMessage(payload: unknown): IncomingWhatsAppMessage | null {
  const entry = (payload as any)?.entry?.[0];
  const value = entry?.changes?.[0]?.value;
  const message = value?.messages?.[0];
  if (!message) return null;

  const name = value?.contacts?.[0]?.profile?.name ?? null;
  const text = message.type === "text" ? (message.text?.body ?? null) : null;

  return { from: message.from, waMessageId: message.id, name, text };
}
