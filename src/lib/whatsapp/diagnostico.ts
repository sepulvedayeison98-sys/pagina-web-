import { createHmac } from "crypto";
import { siteUrl } from "@/lib/site";

/**
 * Diagnóstico de la conexión con WhatsApp Cloud API.
 *
 * Cuando el asesor "no responde" casi nunca hay un error visible: Meta acepta
 * el webhook y se queda callado, o el token venció sin avisar. Este módulo
 * hace las mismas preguntas que uno haría a mano en Graph API y traduce cada
 * respuesta a algo accionable.
 *
 * Nunca devuelve el valor de un secreto: solo si existe, si Meta lo acepta y
 * qué hacer cuando no.
 */

const GRAPH_VERSION = process.env.WHATSAPP_GRAPH_VERSION || "v22.0";
const GRAPH = `https://graph.facebook.com/${GRAPH_VERSION}`;

export type Estado = "ok" | "error" | "aviso";

export interface Check {
  titulo: string;
  estado: Estado;
  detalle: string;
  /** Pasos concretos cuando el estado no es "ok". */
  arreglo?: string;
}

interface RespuestaGraph {
  ok: boolean;
  status: number;
  json: any;
}

async function graph(
  path: string,
  params: Record<string, string>
): Promise<RespuestaGraph> {
  const url = new URL(`${GRAPH}/${path}`);
  for (const [clave, valor] of Object.entries(params)) {
    url.searchParams.set(clave, valor);
  }
  const res = await fetch(url, { cache: "no-store" });
  const json = await res.json().catch(() => null);
  return { ok: res.ok, status: res.status, json };
}

/** Firma que Meta exige (o acepta) para probar que quien llama conoce el app secret. */
function appsecretProof(token: string, secret: string): string {
  return createHmac("sha256", secret).update(token).digest("hex");
}

function mensajeDeError(json: any, status: number): string {
  const err = json?.error;
  if (!err) return `Meta respondió ${status} sin detalle.`;
  const partes = [err.message];
  if (err.error_user_msg) partes.push(err.error_user_msg);
  return partes.filter(Boolean).join(" — ");
}

export interface Diagnostico {
  checks: Check[];
  /** URL exacta que hay que pegar como Callback URL en Meta. */
  callbackUrl: string;
}

export async function diagnosticarWhatsApp(): Promise<Diagnostico> {
  const checks: Check[] = [];

  const token = process.env.WHATSAPP_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;
  const appSecret = process.env.WHATSAPP_APP_SECRET;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;

  const callbackUrl = `${siteUrl()}/api/whatsapp/webhook`;

  // ── 1. ¿Están todas las variables? ────────────────────────────────────
  const requeridas: Array<[string, string | undefined]> = [
    ["WHATSAPP_TOKEN", token],
    ["WHATSAPP_PHONE_NUMBER_ID", phoneNumberId],
    ["WHATSAPP_VERIFY_TOKEN", verifyToken],
    ["WHATSAPP_APP_SECRET", appSecret],
    ["ANTHROPIC_API_KEY", anthropicKey],
  ];
  const faltantes = requeridas.filter(([, valor]) => !valor).map(([nombre]) => nombre);

  checks.push({
    titulo: "Variables de entorno",
    estado: faltantes.length === 0 ? "ok" : "error",
    detalle:
      faltantes.length === 0
        ? "Las 5 variables requeridas están definidas en este entorno."
        : `Faltan: ${faltantes.join(", ")}.`,
    arreglo:
      faltantes.length === 0
        ? undefined
        : "Vercel → proyecto rovex → Settings → Environment Variables. Deben existir en el entorno Production y hay que volver a desplegar después de agregarlas.",
  });

  // Sin token no hay nada más que preguntarle a Meta.
  if (!token) {
    return { checks, callbackUrl };
  }

  // ── 2. ¿El token sirve y es permanente? ───────────────────────────────
  // El fallo más común de todos: se usa el token de prueba de la pantalla
  // "API Setup", que dura 24 horas, en vez de uno de System User.
  let appId: string | null = null;
  let wabaId: string | null = null;

  try {
    const { ok, status, json } = await graph("debug_token", {
      input_token: token,
      access_token: token,
    });
    const data = json?.data;

    if (!ok || !data) {
      checks.push({
        titulo: "Token de WhatsApp",
        estado: "error",
        detalle: mensajeDeError(json, status),
        arreglo:
          "El token no es válido. Genera uno nuevo en Meta → Business Settings → Usuarios del sistema → Generar token, con los permisos whatsapp_business_messaging y whatsapp_business_management.",
      });
    } else if (!data.is_valid) {
      checks.push({
        titulo: "Token de WhatsApp",
        estado: "error",
        detalle: "Meta reporta el token como inválido o revocado.",
        arreglo:
          "Genera un token nuevo desde un Usuario del sistema (Business Settings → Usuarios del sistema) y actualiza WHATSAPP_TOKEN en Vercel.",
      });
    } else {
      appId = data.app_id ? String(data.app_id) : null;

      const scopes: string[] = data.scopes ?? [];
      const granular: Array<{ scope: string; target_ids?: string[] }> =
        data.granular_scopes ?? [];
      wabaId =
        granular.find((g) => g.scope === "whatsapp_business_messaging")
          ?.target_ids?.[0] ?? null;

      // expires_at 0 = no expira, que es lo que se quiere en producción.
      const expira = Number(data.expires_at ?? 0);
      const permanente = expira === 0;
      const vencido = !permanente && expira * 1000 < Date.now();
      const fecha = permanente
        ? null
        : new Date(expira * 1000).toLocaleString("es-CO", {
            dateStyle: "medium",
            timeStyle: "short",
          });

      checks.push({
        titulo: "Token de WhatsApp",
        estado: vencido ? "error" : permanente ? "ok" : "aviso",
        detalle: vencido
          ? `El token venció el ${fecha}. Por eso Meta deja de aceptar los envíos.`
          : permanente
            ? `Token válido y permanente. App ID ${appId ?? "desconocido"}.`
            : `Token válido pero temporal: vence el ${fecha}.`,
        arreglo: permanente
          ? undefined
          : "Los tokens de la pantalla API Setup duran 24 h. Crea un Usuario del sistema en Business Settings, asígnale la cuenta de WhatsApp y genera un token sin expiración.",
      });

      const puedeEnviar = scopes.includes("whatsapp_business_messaging");
      checks.push({
        titulo: "Permisos del token",
        estado: puedeEnviar ? "ok" : "error",
        detalle: puedeEnviar
          ? `Incluye whatsapp_business_messaging${
              scopes.includes("whatsapp_business_management")
                ? " y whatsapp_business_management"
                : ""
            }.`
          : `El token no tiene whatsapp_business_messaging. Permisos actuales: ${
              scopes.join(", ") || "ninguno"
            }.`,
        arreglo: puedeEnviar
          ? undefined
          : "Vuelve a generar el token marcando whatsapp_business_messaging (y whatsapp_business_management para leer la configuración).",
      });
    }
  } catch (err) {
    checks.push({
      titulo: "Token de WhatsApp",
      estado: "error",
      detalle: err instanceof Error ? err.message : "No se pudo consultar a Meta.",
    });
  }

  // ── 3. ¿El app secret es el de esta misma app? ────────────────────────
  // Este es el fallo silencioso peor: si el secreto es de otra app, Meta
  // entrega los mensajes igual, pero el webhook los rechaza con 401 al
  // validar la firma y el cliente nunca recibe respuesta.
  if (appSecret) {
    try {
      const { ok, status, json } = await graph("me", {
        access_token: token,
        appsecret_proof: appsecretProof(token, appSecret),
        fields: "id",
      });
      const mensaje = mensajeDeError(json, status);
      const secretoMalo = /appsecret_proof/i.test(mensaje);

      checks.push({
        titulo: "App secret (firma del webhook)",
        estado: ok ? "ok" : secretoMalo ? "error" : "aviso",
        detalle: ok
          ? "Meta acepta la firma: el secreto corresponde a la app del token."
          : secretoMalo
            ? "El secreto no corresponde a la app dueña del token. El webhook va a rechazar todos los mensajes entrantes con 401."
            : `No se pudo confirmar: ${mensaje}`,
        arreglo:
          ok || !secretoMalo
            ? undefined
            : "Meta for Developers → tu app → Configuración → Básica → Clave secreta de la app. Copia esa y reemplaza WHATSAPP_APP_SECRET en Vercel. Debe ser de la MISMA app que generó el token.",
      });
    } catch (err) {
      checks.push({
        titulo: "App secret (firma del webhook)",
        estado: "aviso",
        detalle: err instanceof Error ? err.message : "No se pudo verificar.",
      });
    }
  }

  // ── 4. ¿El número existe y el token lo alcanza? ───────────────────────
  if (phoneNumberId) {
    try {
      const params: Record<string, string> = {
        access_token: token,
        fields: "display_phone_number,verified_name,quality_rating,code_verification_status",
      };
      if (appSecret) params.appsecret_proof = appsecretProof(token, appSecret);

      const { ok, status, json } = await graph(phoneNumberId, params);

      checks.push({
        titulo: "Número de WhatsApp Business",
        estado: ok ? "ok" : "error",
        detalle: ok
          ? `${json.display_phone_number ?? "sin número"} · ${
              json.verified_name ?? "sin nombre verificado"
            } · calidad ${json.quality_rating ?? "n/d"} · verificación ${
              json.code_verification_status ?? "n/d"
            }`
          : mensajeDeError(json, status),
        arreglo: ok
          ? undefined
          : "Revisa WHATSAPP_PHONE_NUMBER_ID: es el ID numérico que aparece en WhatsApp → API Setup, no el número de teléfono. También falla si el token pertenece a otra cuenta de negocio.",
      });
    } catch (err) {
      checks.push({
        titulo: "Número de WhatsApp Business",
        estado: "error",
        detalle: err instanceof Error ? err.message : "No se pudo consultar.",
      });
    }
  }

  // ── 5. ¿La app está suscrita a la cuenta? ─────────────────────────────
  // Sin esta suscripción Meta jamás llama al webhook, aunque la URL haya
  // quedado verificada en verde.
  if (wabaId) {
    try {
      const params: Record<string, string> = { access_token: token };
      if (appSecret) params.appsecret_proof = appsecretProof(token, appSecret);

      const { ok, status, json } = await graph(`${wabaId}/subscribed_apps`, params);
      const apps: any[] = json?.data ?? [];
      const suscrita = apps.some(
        (a) => !appId || String(a?.whatsapp_business_api_data?.id) === appId
      );

      checks.push({
        titulo: "Suscripción de la app a la cuenta (WABA)",
        estado: ok && suscrita ? "ok" : "error",
        detalle: !ok
          ? mensajeDeError(json, status)
          : suscrita
            ? `La app está suscrita a la cuenta ${wabaId} y recibirá los mensajes.`
            : `Ninguna app suscrita a la cuenta ${wabaId}: Meta no va a llamar al webhook.`,
        arreglo:
          ok && suscrita
            ? undefined
            : "Meta for Developers → tu app → WhatsApp → Configuration → sección Webhook → botón Manage → marca el campo messages. Eso crea la suscripción.",
      });
    } catch (err) {
      checks.push({
        titulo: "Suscripción de la app a la cuenta (WABA)",
        estado: "error",
        detalle: err instanceof Error ? err.message : "No se pudo consultar.",
      });
    }
  }

  // ── 6. El apretón de manos que hace Meta, hecho contra nosotros mismos ─
  // Prueba la URL pública real: si el dominio está detrás de la protección
  // de Vercel, aquí se ve (Meta recibiría lo mismo y fallaría la
  // verificación sin decir por qué).
  if (verifyToken) {
    try {
      const reto = "rovex-diagnostico";
      const url = `${callbackUrl}?hub.mode=subscribe&hub.verify_token=${encodeURIComponent(
        verifyToken
      )}&hub.challenge=${reto}`;
      const res = await fetch(url, { cache: "no-store" });
      const cuerpo = (await res.text()).trim();
      const bien = res.status === 200 && cuerpo === reto;

      checks.push({
        titulo: "Verificación del webhook (como la hace Meta)",
        estado: bien ? "ok" : "error",
        detalle: bien
          ? `${callbackUrl} respondió correctamente al reto de verificación.`
          : `${callbackUrl} respondió ${res.status}${
              cuerpo.startsWith("<") ? " (una página HTML, no el reto)" : `: ${cuerpo.slice(0, 120)}`
            }.`,
        arreglo: bien
          ? undefined
          : "Si responde HTML, el dominio está protegido (Vercel → Settings → Deployment Protection) y Meta no puede alcanzarlo. Usa el dominio propio, no la URL .vercel.app.",
      });
    } catch (err) {
      checks.push({
        titulo: "Verificación del webhook (como la hace Meta)",
        estado: "error",
        detalle: err instanceof Error ? err.message : "No se pudo alcanzar la URL.",
      });
    }
  }

  return { checks, callbackUrl };
}
