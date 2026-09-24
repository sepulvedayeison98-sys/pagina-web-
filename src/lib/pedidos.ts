/**
 * Filtros de la pestaña Pedidos. Viven fuera del componente (que es
 * "use client") porque la página, que corre en el servidor, también los usa
 * para armar la consulta: desde un módulo de cliente solo llegarían como
 * referencias vacías.
 */

export type EstadoFiltro = "todos" | "pendientes" | "aprobados" | "rechazados" | "cancelados";
export type Periodo = "mes" | "hoy" | "7d" | "rango" | "todo";

export interface Filtros {
  estado: EstadoFiltro;
  periodo: Periodo;
  /** "2026-09", cuando periodo es "mes". */
  mes: string;
  /** "2026-09-01", cuando periodo es "rango". */
  desde: string;
  hasta: string;
  q: string;
}

/**
 * Filtros de estado. "Aprobados" junta pagado, enviado y entregado: todos son
 * ventas confirmadas, cada tarjeta dice en qué paso va.
 */
export const ESTADOS_FILTRO: Record<EstadoFiltro, { label: string; estados: string[] | null }> = {
  todos: { label: "Todos", estados: null },
  pendientes: { label: "Pendientes", estados: ["pendiente"] },
  aprobados: { label: "Aprobados", estados: ["pagado", "enviado", "entregado"] },
  rechazados: { label: "Rechazados", estados: ["rechazado"] },
  cancelados: { label: "Cancelados", estados: ["cancelado"] },
};
