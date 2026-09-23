declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

/**
 * Marca un contacto (clic a WhatsApp) para el Pixel de Meta.
 * Sin Conversions API todavía: solo del lado del navegador, así que
 * bloqueadores de anuncios y Safari/iOS pueden perderse el evento.
 */
export function trackWhatsAppContact() {
  if (typeof window !== "undefined" && window.fbq) {
    window.fbq("track", "Contact");
  }
}
