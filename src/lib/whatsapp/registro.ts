"use server";

import { createHmac } from "crypto";
import { createClient } from "@/lib/supabase/server";

const GRAPH_VERSION = process.env.WHATSAPP_GRAPH_VERSION || "v22.0";

/**
 * Qué significa cada código de error de /register y qué hacer.
 *
 * La pantalla de Meta los resume todos en "Se produjo un error durante el
 * registro": la API sí dice cuál fue, y la salida depende de eso (esperar
 * unos minutos, volver a verificar por SMS, usar el PIN anterior…).
 */
const PISTAS: Record<number, string> = {
  133005:
    "El número ya tenía un PIN de verificación en dos pasos y este no coincide. Usa el PIN que se creó antes o restablécelo en WhatsApp Manager → Números de teléfono → Configuración → Verificación en dos pasos.",
  133006:
    "Meta pide volver a verificar el número por SMS antes de registrarlo. En WhatsApp Manager, abre el número y sigue la verificación por código.",
  133008:
    "Demasiados intentos con el PIN. Espera unas horas antes de volver a intentar.",
  133009: "Intentos demasiado seguidos. Espera un minuto y vuelve a intentar.",
  133010:
    "El número todavía no está registrado en la cuenta de WhatsApp Business. Agrégalo y verifícalo primero en el paso anterior de Meta.",
  133015:
    "El número se borró hace poco de la app de WhatsApp o de WhatsApp Business. Meta exige esperar unos minutos antes de registrarlo en la API: vuelve a intentar en 5-10 minutos.",
  133016:
    "Se alcanzó el límite de registros y desregistros para este número. Toca esperar (normalmente 24 horas) antes del siguiente intento.",
  131031:
    "La cuenta de WhatsApp Business está bloqueada o restringida. Revisa las alertas en WhatsApp Manager o en Business Support Home.",
  190: "El token de WHATSAPP_TOKEN venció o es inválido. Genera uno permanente de Usuario del sistema y actualízalo en Vercel.",
  200: "El token no tiene permiso sobre este número. Debe ser de un Usuario del sistema con whatsapp_business_management y whatsapp_business_messaging, asignado a esta cuenta.",
};

export type ResultadoRegistro =
  | { ok: true }
  | {
      ok: false;
      mensaje: string;
      codigo?: number;
      subcodigo?: number;
      pista?: string;
    };

/**
 * Registra WHATSAPP_PHONE_NUMBER_ID en Cloud API con el PIN de verificación
 * en dos pasos. Es la misma llamada que hace el botón "Registrar" de Meta,
 * pero devolviendo el error real en vez del mensaje genérico.
 */
export async function registrarNumero(pin: string): Promise<ResultadoRegistro> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, mensaje: "No autenticado." };

  const limpio = pin.trim();
  if (!/^\d{6}$/.test(limpio)) {
    return { ok: false, mensaje: "El PIN debe tener exactamente 6 dígitos." };
  }

  const token = process.env.WHATSAPP_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const appSecret = process.env.WHATSAPP_APP_SECRET;
  if (!token || !phoneNumberId) {
    return {
      ok: false,
      mensaje: "Faltan WHATSAPP_TOKEN o WHATSAPP_PHONE_NUMBER_ID en Vercel.",
    };
  }

  const url = new URL(`https://graph.facebook.com/${GRAPH_VERSION}/${phoneNumberId}/register`);
  if (appSecret) {
    url.searchParams.set(
      "appsecret_proof",
      createHmac("sha256", appSecret).update(token).digest("hex")
    );
  }

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ messaging_product: "whatsapp", pin: limpio }),
      cache: "no-store",
    });
    const json = await res.json().catch(() => null);

    if (res.ok && json?.success) return { ok: true };

    const err = json?.error ?? {};
    const codigo = typeof err.code === "number" ? err.code : undefined;
    const subcodigo =
      typeof err.error_subcode === "number" ? err.error_subcode : undefined;
    const detalle = [err.message, err.error_user_msg, err.error_data?.details]
      .filter(Boolean)
      .join(" — ");

    return {
      ok: false,
      mensaje: detalle || `Meta respondió ${res.status} sin detalle.`,
      codigo,
      subcodigo,
      pista: codigo !== undefined ? PISTAS[codigo] : undefined,
    };
  } catch (err) {
    return {
      ok: false,
      mensaje: err instanceof Error ? err.message : "No se pudo contactar a Meta.",
    };
  }
}
