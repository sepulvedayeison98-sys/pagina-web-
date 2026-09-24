import { siteUrl } from "@/lib/site";
import { esBsuid, sendWhatsAppMessage } from "./client";

/**
 * Avisos al equipo por WhatsApp, desde el mismo número de ROVEX.
 *
 * Los números salen de WHATSAPP_NOTIFY_NUMBERS (Vercel, solo servidor),
 * separados por coma. No van en el código ni en los textos del panel: el
 * repositorio y la tabla site_content son públicos.
 *
 * Límite de WhatsApp: solo se puede mandar texto libre a un número que le
 * escribió al de ROVEX en las últimas 24 horas. Si esa ventana se cierra, Meta
 * rechaza el aviso (código 131047) y queda en el log; para que no pase, cada
 * número del equipo debe escribirle al de ROVEX al menos una vez al día. La
 * alternativa sin ese límite es una plantilla aprobada por Meta.
 */

/** Cliente que vuelve a escribir tras este tiempo en silencio: se avisa como si fuera nuevo. */
export const VUELVE_TRAS_MS = 12 * 60 * 60 * 1000;

/** "3246856614" o "+57 324 685 6614" -> "573246856614". */
function normalizar(numero: string): string | null {
  const d = numero.replace(/\D/g, "");
  if (/^3\d{9}$/.test(d)) return `57${d}`;
  if (/^\d{11,15}$/.test(d)) return d;
  return null;
}

export function numerosEquipo(): string[] {
  return (process.env.WHATSAPP_NOTIFY_NUMBERS ?? "")
    .split(",")
    .map((n) => normalizar(n))
    .filter((n): n is string => n !== null);
}

/** Si quien escribe es del equipo: no se le avisa al equipo de sí mismo. */
export function esDelEquipo(remitente: string): boolean {
  return numerosEquipo().includes(remitente);
}

function contacto(nombre: string | null | undefined, remitente: string): string {
  const n = nombre?.trim();
  const valido = n && /[\p{L}\p{N}]/u.test(n) ? n : null;
  const numero = esBsuid(remitente) ? "usuario de WhatsApp sin número visible" : `+${remitente}`;
  return valido ? `${valido} (${numero})` : numero;
}

function recortar(texto: string, max: number): string {
  const t = texto.replace(/\s+/g, " ").trim();
  return t.length > max ? `${t.slice(0, max - 1)}…` : t;
}

async function enviarAlEquipo(texto: string, motivo: string): Promise<void> {
  const numeros = numerosEquipo();
  if (numeros.length === 0) return;

  const resultados = await Promise.allSettled(numeros.map((n) => sendWhatsAppMessage(n, texto)));
  resultados.forEach((r, i) => {
    if (r.status === "fulfilled") return;
    const detalle = r.reason instanceof Error ? r.reason.message : String(r.reason);
    const ventanaCerrada = detalle.includes("131047");
    console.error(
      `aviso al equipo (${motivo}) no llegó a ${numeros[i]}:`,
      ventanaCerrada
        ? "la ventana de 24 h está cerrada; ese número debe escribirle al de ROVEX para reabrirla."
        : detalle
    );
  });
}

export async function avisarConversacionNueva(opts: {
  nombre: string | null;
  remitente: string;
  mensaje: string;
  vuelve: boolean;
}): Promise<void> {
  const titulo = opts.vuelve ? "🔔 Un cliente volvió a escribir" : "🔔 Nueva conversación";
  const texto = [
    titulo,
    `Cliente: ${contacto(opts.nombre, opts.remitente)}`,
    `Mensaje: "${recortar(opts.mensaje, 200)}"`,
    "",
    "El asesor ya le está respondiendo. Para ver o tomar el chat:",
    `${siteUrl()}/admin/conversaciones`,
  ].join("\n");
  await enviarAlEquipo(texto, "conversación nueva");
}

export async function avisarEscalamiento(opts: {
  nombre: string | null | undefined;
  remitente: string;
  motivo: string;
  resumen: string;
}): Promise<void> {
  const texto = [
    "⚠️ El asesor necesita que alguien atienda un chat",
    `Cliente: ${contacto(opts.nombre, opts.remitente)}`,
    `Motivo: ${opts.motivo.replaceAll("_", " ")}`,
    `Resumen: ${recortar(opts.resumen, 400)}`,
    "",
    "Atiéndelo desde el panel (pestaña Atención humana):",
    `${siteUrl()}/admin/conversaciones`,
  ].join("\n");
  await enviarAlEquipo(texto, "escalamiento");
}
