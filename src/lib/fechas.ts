/**
 * Fechas del panel, siempre en hora de Colombia.
 *
 * El servidor de Vercel corre en UTC y el navegador en hora local: si cada
 * uno formatea con la suya, el HTML del servidor no coincide con el del
 * cliente (React se queja al hidratar) y las horas salen corridas cinco horas.
 * Colombia no tiene horario de verano, así que el desfase es fijo: -05:00.
 */
export const ZONA = "America/Bogota";
export const OFFSET_COLOMBIA = "-05:00";
export const DIA_MS = 24 * 60 * 60 * 1000;

const fmtClaveDia = new Intl.DateTimeFormat("en-CA", { timeZone: ZONA, year: "numeric", month: "2-digit", day: "2-digit" });
const fmtHora = new Intl.DateTimeFormat("es-CO", { timeZone: ZONA, hour: "numeric", minute: "2-digit" });
const fmtDiaSemana = new Intl.DateTimeFormat("es-CO", { timeZone: ZONA, weekday: "long" });
const fmtFechaCorta = new Intl.DateTimeFormat("es-CO", { timeZone: ZONA, day: "2-digit", month: "2-digit", year: "2-digit" });
const fmtFechaLarga = new Intl.DateTimeFormat("es-CO", { timeZone: ZONA, weekday: "long", day: "numeric", month: "long", year: "numeric" });
const fmtMes = new Intl.DateTimeFormat("es-CO", { timeZone: ZONA, month: "long", year: "numeric" });

/**
 * Node y el navegador traen versiones distintas de ICU: uno separa "p. m."
 * (o "$ 170.000") con espacio duro (U+00A0) y el otro con espacio fino
 * (U+202F). Se ven iguales, pero el HTML no coincide y React se queja.
 */
export function limpio(texto: string): string {
  return texto.replace(/[  ]/g, " ");
}

/** "2026-09-24": el día calendario en Colombia, comparable como texto. */
export function claveDia(d: Date | string | number): string {
  return fmtClaveDia.format(new Date(d));
}

/** "2026-09": el mes calendario en Colombia. */
export function claveMes(d: Date | string | number): string {
  return claveDia(d).slice(0, 7);
}

export function mismoDia(a: string, b: string) {
  return claveDia(a) === claveDia(b);
}

export function hora(iso: string): string {
  return limpio(fmtHora.format(new Date(iso)));
}

/** Hora de una lista estilo WhatsApp: hora si es hoy, "Ayer", día de la semana o fecha. */
export function horaLista(iso: string): string {
  const d = new Date(iso);
  const ahora = Date.now();
  if (claveDia(d) === claveDia(ahora)) return limpio(fmtHora.format(d));
  if (claveDia(d) === claveDia(ahora - DIA_MS)) return "Ayer";
  if (ahora - d.getTime() < 6 * DIA_MS) return limpio(fmtDiaSemana.format(d));
  return limpio(fmtFechaCorta.format(d));
}

/** "Hoy", "Ayer" o "martes, 22 de septiembre de 2026". */
export function etiquetaDia(iso: string): string {
  const ahora = Date.now();
  if (claveDia(iso) === claveDia(ahora)) return "Hoy";
  if (claveDia(iso) === claveDia(ahora - DIA_MS)) return "Ayer";
  return limpio(fmtFechaLarga.format(new Date(iso)));
}

/** "septiembre de 2026", a partir de "2026-09". */
export function etiquetaMes(mes: string): string {
  return limpio(fmtMes.format(new Date(`${mes}-15T12:00:00${OFFSET_COLOMBIA}`)));
}

/** Inicio (incluido) y fin (excluido) de un mes "2026-09", en hora de Colombia, como ISO. */
export function rangoMes(mes: string): { desde: string; hasta: string } {
  const [y, m] = mes.split("-").map(Number);
  const siguiente = m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, "0")}`;
  return {
    desde: new Date(`${mes}-01T00:00:00${OFFSET_COLOMBIA}`).toISOString(),
    hasta: new Date(`${siguiente}-01T00:00:00${OFFSET_COLOMBIA}`).toISOString(),
  };
}

/** Inicio de un día "2026-09-24" en Colombia, como ISO. `finDelDia` da el inicio del día siguiente. */
export function inicioDia(dia: string, finDelDia = false): string {
  const t = new Date(`${dia}T00:00:00${OFFSET_COLOMBIA}`).getTime();
  return new Date(finDelDia ? t + DIA_MS : t).toISOString();
}

/** Mes en curso en Colombia ("2026-09"). */
export function mesActual(): string {
  return claveMes(Date.now());
}

/**
 * Rango de un periodo relativo a hoy en Colombia: "hoy" o los últimos `dias`
 * días contando hoy. Devuelve el inicio (incluido) como ISO.
 */
export function inicioUltimosDias(dias: number): string {
  return inicioDia(claveDia(Date.now() - (dias - 1) * DIA_MS));
}
