import { createHmac, timingSafeEqual } from "crypto";

const GRAPH_VERSION = process.env.WHATSAPP_GRAPH_VERSION || "v22.0";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Falta la variable de entorno ${name}`);
  return value;
}

/**
 * BSUID: el identificador que Meta usa para quien activó nombre de usuario
 * en WhatsApp y ya no comparte su número ("US.13491208655302741918").
 */
export function esBsuid(id: string): boolean {
  return /^[A-Z]{2}\.[A-Za-z0-9]+$/.test(id);
}

/** Si un id de contacto sirve para escribirle por WhatsApp (número o BSUID). */
export function esContactoWhatsApp(id: string): boolean {
  return /^\d{8,15}$/.test(id) || esBsuid(id);
}

/**
 * Envía un mensaje de texto libre por WhatsApp Cloud API. `to` es el número
 * en formato internacional sin "+", o el BSUID si el cliente no comparte su
 * número. Devuelve el id que Meta le asigna (wamid), o null si no lo trae.
 */
export async function sendWhatsAppMessage(to: string, body: string): Promise<string | null> {
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
        recipient_type: "individual",
        // Con número se usa `to`; con BSUID, `recipient` (si llegan los dos,
        // Meta usa `to`, así que no se mandan juntos).
        ...(esBsuid(to) ? { recipient: to } : { to }),
        type: "text",
        // Con vista previa, el enlace a la tienda que manda el asesor llega
        // con la foto y el nombre del casco: da más confianza que un link pelado.
        text: { body, preview_url: true },
      }),
    }
  );

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Error enviando WhatsApp (${res.status}): ${detail}`);
  }

  const json = await res.json().catch(() => null);
  return json?.messages?.[0]?.id ?? null;
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
  /**
   * A quién responder: el número si Meta lo manda y, si no, el BSUID. Desde
   * que existen los nombres de usuario de WhatsApp, `from` puede no venir.
   */
  from: string;
  waMessageId: string;
  name: string | null;
  /** Solo para mensajes de texto: es lo único que el asesor sabe leer. */
  text: string | null;
  /**
   * Cómo se ve el mensaje en el panel. Para texto es el texto; para fotos,
   * audios, etc. una etiqueta ("[Imagen] pie de foto"), para que quien
   * atiende sepa que el cliente mandó algo aunque el bot no pueda leerlo.
   */
  display: string;
}

const ETIQUETAS: Record<string, string> = {
  image: "Imagen",
  audio: "Audio",
  voice: "Nota de voz",
  video: "Video",
  document: "Documento",
  sticker: "Sticker",
  location: "Ubicación",
  contacts: "Contacto",
  reaction: "Reacción",
  button: "Botón",
  interactive: "Respuesta interactiva",
};

/** Extrae el primer mensaje entrante de un payload de webhook de WhatsApp Cloud API. */
export function parseIncomingMessage(payload: unknown): IncomingWhatsAppMessage | null {
  const entry = (payload as any)?.entry?.[0];
  const value = entry?.changes?.[0]?.value;
  const message = value?.messages?.[0];
  if (!message) return null;

  const contacto = value?.contacts?.[0];
  const from: string | null =
    message.from ?? contacto?.wa_id ?? message.from_user_id ?? contacto?.user_id ?? null;
  if (!from) {
    // Sin número ni BSUID no hay a quién responder. Se deja rastro con las
    // claves que sí llegaron para poder adaptar el código si Meta cambia algo.
    console.error("whatsapp webhook: mensaje sin remitente", {
      claves_mensaje: Object.keys(message),
      claves_contacto: contacto ? Object.keys(contacto) : null,
    });
    return null;
  }

  const name = contacto?.profile?.name ?? contacto?.username ?? null;
  const text = message.type === "text" ? (message.text?.body ?? null) : null;

  let display = text ?? "";
  if (text === null) {
    const tipo: string = message.type ?? "desconocido";
    const etiqueta = ETIQUETAS[tipo] ?? `Mensaje (${tipo})`;
    const extra =
      message[tipo]?.caption ??
      message[tipo]?.filename ??
      message[tipo]?.emoji ??
      message.button?.text ??
      null;
    display = extra ? `[${etiqueta}] ${extra}` : `[${etiqueta}]`;
  }

  return { from, waMessageId: message.id, name, text, display };
}
