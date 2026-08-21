/**
 * Variantes de una misma referencia.
 *
 * Un modelo (501, F71, FF808…) se vende en varias combinaciones que comparten
 * ficha técnica pero cambian por fuera: el acabado (SOLID = monocolor negro,
 * o el nombre del gráfico), el tipo de visor y el color del spoiler.
 *
 * Cada combinación es un producto propio, con su inventario y su precio,
 * pero se agrupan visualmente por modelo para no perderse en el panel.
 */

export const VISORES = [
  "Transparente",
  "Humo",
  "Iridium",
  "Espejo",
  "Fotocromático",
] as const;

/** Acabados frecuentes. Es una ayuda, se puede escribir cualquier otro. */
export const ACABADOS = [
  "SOLID",
  "Mate",
  "Brillante",
  "Gráfico",
  "Bicolor",
] as const;

export interface VariantInfo {
  model?: string | null;
  variant?: string | null;
  visor?: string | null;
  spoiler?: string | null;
}

/**
 * Nombre sugerido de la referencia: "ICH 501 SOLID".
 * Se usa al crear, pero el nombre queda editable.
 */
export function suggestName(brand: string, v: VariantInfo): string {
  return [brand, v.model, v.variant].filter(Boolean).join(" ").trim();
}

/**
 * Resumen corto de lo que distingue a esta variante de sus hermanas.
 * Ej.: "Visor humo · Spoiler rojo". Vacío si no hay nada que la distinga.
 */
export function variantSummary(v: VariantInfo): string {
  const partes: string[] = [];
  if (v.visor) partes.push(`Visor ${v.visor.toLowerCase()}`);
  if (v.spoiler) partes.push(`Spoiler ${v.spoiler.toLowerCase()}`);
  return partes.join(" · ");
}
