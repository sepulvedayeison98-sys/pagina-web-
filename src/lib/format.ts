import { limpio } from "./fechas";

/**
 * Formatea un número como precio en pesos colombianos (COP).
 *
 * El espacio entre "$" y la cifra sale distinto según la versión de ICU (Node
 * en el servidor, Chrome en el cliente): se normaliza para que el HTML del
 * servidor y el del navegador coincidan al hidratar.
 */
export function formatCOP(value: number): string {
  return limpio(
    new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0,
    }).format(value)
  );
}
