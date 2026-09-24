"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Ban, Check, ChevronDown, Loader2, Package, Phone, Search, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatCOP } from "@/lib/format";
import { claveDia, claveMes, etiquetaDia, etiquetaMes, hora } from "@/lib/fechas";
import { ESTADOS_FILTRO, type EstadoFiltro, type Filtros, type Periodo } from "@/lib/pedidos";

export type { EstadoFiltro, Filtros, Periodo };

export interface OrderItemRow {
  product_name: string;
  size: string;
  qty: number;
  unit_price: number;
}

export interface OrderRow {
  id: string;
  code: number;
  customer_name: string;
  customer_phone: string | null;
  customer_city: string | null;
  status: string;
  total: number;
  stock_applied: boolean;
  created_at: string;
  note: string | null;
  order_items: OrderItemRow[];
}

const PERIODOS: { id: Periodo; label: string }[] = [
  { id: "mes", label: "Mes" },
  { id: "hoy", label: "Hoy" },
  { id: "7d", label: "Últimos 7 días" },
  { id: "rango", label: "Entre fechas" },
  { id: "todo", label: "Todo" },
];

const ESTADOS: Record<string, { label: string; cls: string }> = {
  pendiente: { label: "Pendiente", cls: "bg-warn/10 text-warn border-warn/30" },
  pagado: { label: "Aprobado", cls: "bg-accent/10 text-accent border-accent/30" },
  enviado: { label: "Enviado", cls: "bg-text-dark/5 text-text-dark/70 border-text-dark/20" },
  entregado: { label: "Entregado", cls: "bg-emerald-600/10 text-emerald-700 border-emerald-600/25" },
  rechazado: { label: "Rechazado", cls: "bg-danger/10 text-danger border-danger/30" },
  cancelado: { label: "Cancelado", cls: "bg-text-dark/5 text-text-dark/45 border-text-dark/15" },
};

/** Estados que ya no cuentan como venta ni permiten acciones. */
const CERRADOS = ["rechazado", "cancelado"];
const APROBADOS = ["pagado", "enviado", "entregado"];

interface GrupoDia {
  dia: string;
  pedidos: OrderRow[];
}
interface GrupoMes {
  mes: string;
  dias: GrupoDia[];
}

/** Agrupa (ya vienen del más nuevo al más viejo) por mes y, dentro, por día. */
function agrupar(orders: OrderRow[]): GrupoMes[] {
  const meses: GrupoMes[] = [];
  for (const o of orders) {
    const mes = claveMes(o.created_at);
    const dia = claveDia(o.created_at);
    let gm = meses[meses.length - 1];
    if (!gm || gm.mes !== mes) meses.push((gm = { mes, dias: [] }));
    let gd = gm.dias[gm.dias.length - 1];
    if (!gd || gd.dia !== dia) gm.dias.push((gd = { dia, pedidos: [] }));
    gd.pedidos.push(o);
  }
  return meses;
}

/** Mayúscula solo al inicio ("Jueves, 24 de septiembre"), no en cada palabra como text-transform. */
function inicial(texto: string): string {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

function plural(n: number, uno: string, varios: string): string {
  return `${n} ${n === 1 ? uno : varios}`;
}

function resumen(orders: OrderRow[]) {
  const aprobados = orders.filter((o) => APROBADOS.includes(o.status));
  return {
    total: orders.length,
    pendientes: orders.filter((o) => o.status === "pendiente").length,
    aprobados: aprobados.length,
    vendido: aprobados.reduce((n, o) => n + o.total, 0),
    rechazados: orders.filter((o) => o.status === "rechazado").length,
    cancelados: orders.filter((o) => o.status === "cancelado").length,
  };
}

/**
 * Pedidos de la tienda y del asesor de WhatsApp, agrupados por mes y día.
 *
 * Los filtros viven en la URL y se aplican en la base (la página solo trae
 * el periodo elegido), así la pestaña no crece sin fin con el tiempo.
 *
 * Un pedido nace "pendiente" y NO descuenta inventario: puede ser alguien
 * curioso probando. Al aprobarlo sí sale la mercancía; al rechazarlo o
 * cancelarlo, si ya había salido, vuelve al inventario.
 */
export default function OrdersManager({
  orders,
  filtros,
  mesActual,
  pendientesTotal,
  truncado,
}: {
  orders: OrderRow[];
  filtros: Filtros;
  /** "2026-09": tope del selector de mes (viene del servidor, en hora de Colombia). */
  mesActual: string;
  pendientesTotal: number;
  truncado: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();
  const [navegando, startTransition] = useTransition();

  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState(filtros.q);

  function aplicar(cambios: Partial<Filtros>) {
    const f = { ...filtros, ...cambios };
    const p = new URLSearchParams();
    if (f.estado !== "todos") p.set("estado", f.estado);
    if (f.periodo !== "mes") p.set("periodo", f.periodo);
    if (f.periodo === "mes") p.set("mes", f.mes);
    if (f.periodo === "rango") {
      if (f.desde) p.set("desde", f.desde);
      if (f.hasta) p.set("hasta", f.hasta);
    }
    if (f.q) p.set("q", f.q);
    const qs = p.toString();
    startTransition(() => router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false }));
  }

  // La búsqueda se aplica sola al dejar de escribir.
  useEffect(() => {
    if (busqueda.trim() === filtros.q) return;
    const t = setTimeout(() => aplicar({ q: busqueda.trim() }), 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busqueda]);

  const grupos = useMemo(() => agrupar(orders), [orders]);
  const r = useMemo(() => resumen(orders), [orders]);

  async function run(o: OrderRow, fn: "confirm_order" | "cancel_order" | "reject_order") {
    setBusy(o.id);
    setError(null);
    const { error } = await supabase.rpc(fn, { p_order_id: o.id });
    setBusy(null);
    if (error) {
      setError(`No se pudo actualizar el pedido #${o.code}.`);
      return;
    }
    router.refresh();
  }

  async function setStatus(o: OrderRow, status: string) {
    setBusy(o.id);
    setError(null);
    const { error } = await supabase.from("orders").update({ status }).eq("id", o.id);
    setBusy(null);
    if (error) setError(`No se pudo cambiar el estado del pedido #${o.code}.`);
    else router.refresh();
  }

  function confirmarYCorrer(o: OrderRow, fn: "cancel_order" | "reject_order") {
    const accion = fn === "reject_order" ? "Rechazar" : "Cancelar";
    const stock = o.stock_applied ? " La mercancía vuelve al inventario." : "";
    if (confirm(`¿${accion} el pedido #${o.code} de ${o.customer_name}?${stock}`)) run(o, fn);
  }

  const chip = (activo: boolean) =>
    `shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
      activo ? "bg-accent text-white" : "bg-text-dark/[0.05] text-text-dark/60 hover:bg-text-dark/10"
    }`;
  const campo =
    "rounded-full border border-text-dark/15 bg-white px-3 py-1.5 text-sm focus:border-accent focus:outline-none";

  const variosMeses = grupos.length > 1;

  return (
    <div className="space-y-5">
      {/* ───────── Filtros ───────── */}
      <div className="space-y-3 rounded-2xl border border-text-dark/10 bg-white p-4">
        <label className="relative block">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-dark/35" />
          <input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por # de pedido, nombre, ciudad o teléfono"
            className="w-full rounded-full bg-text-dark/[0.05] py-2 pl-9 pr-9 text-sm placeholder:text-text-dark/40 focus:bg-white focus:outline-none focus:ring-2 focus:ring-accent/30"
          />
          {busqueda && (
            <button
              onClick={() => setBusqueda("")}
              aria-label="Borrar búsqueda"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-dark/40 hover:text-text-dark"
            >
              <X size={14} />
            </button>
          )}
        </label>

        <div className="flex flex-wrap gap-1.5">
          {(Object.keys(ESTADOS_FILTRO) as EstadoFiltro[]).map((id) => (
            <button key={id} onClick={() => aplicar({ estado: id })} className={chip(filtros.estado === id)}>
              {ESTADOS_FILTRO[id].label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-1.5 border-t border-text-dark/10 pt-3">
          {PERIODOS.map((p) => (
            <button key={p.id} onClick={() => aplicar({ periodo: p.id })} className={chip(filtros.periodo === p.id)}>
              {p.label}
            </button>
          ))}
          {filtros.periodo === "mes" && (
            <input
              type="month"
              value={filtros.mes}
              max={mesActual}
              onChange={(e) => e.target.value && aplicar({ mes: e.target.value })}
              aria-label="Mes"
              className={campo}
            />
          )}
          {filtros.periodo === "rango" && (
            <span className="flex flex-wrap items-center gap-1.5 text-xs text-text-dark/55">
              <input
                type="date"
                value={filtros.desde}
                max={filtros.hasta || undefined}
                onChange={(e) => aplicar({ desde: e.target.value })}
                aria-label="Desde"
                className={campo}
              />
              a
              <input
                type="date"
                value={filtros.hasta}
                min={filtros.desde || undefined}
                onChange={(e) => aplicar({ hasta: e.target.value })}
                aria-label="Hasta"
                className={campo}
              />
            </span>
          )}
          {navegando && <Loader2 size={15} className="ml-1 animate-spin text-text-dark/40" />}
        </div>
      </div>

      {/* Pendientes fuera del periodo que se está mirando */}
      {pendientesTotal > r.pendientes && filtros.estado !== "pendientes" && (
        <button
          onClick={() => aplicar({ estado: "pendientes", periodo: "todo", q: "" })}
          className="flex w-full items-center justify-between gap-3 rounded-2xl border border-warn/30 bg-warn/[0.07] px-4 py-3 text-left text-sm"
        >
          <span>
            <strong className="text-warn">{pendientesTotal} pendientes</strong> en total, algunos fuera de este
            periodo.
          </span>
          <span className="shrink-0 font-semibold text-warn">Ver todos →</span>
        </button>
      )}

      {/* ───────── Resumen del filtro ───────── */}
      <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
        <span>
          <strong className="text-lg">{r.total}</strong>{" "}
          <span className="text-text-dark/55">{r.total === 1 ? "pedido" : "pedidos"}</span>
        </span>
        {r.pendientes > 0 && (
          <span className="text-warn">
            <strong className="text-lg">{r.pendientes}</strong> por aprobar
          </span>
        )}
        <span>
          <strong className="text-lg text-accent">{formatCOP(r.vendido)}</strong>{" "}
          <span className="text-text-dark/55">vendido ({plural(r.aprobados, "aprobado", "aprobados")})</span>
        </span>
        {r.rechazados + r.cancelados > 0 && (
          <span className="text-text-dark/55">
            {plural(r.rechazados, "rechazado", "rechazados")} · {plural(r.cancelados, "cancelado", "cancelados")}
          </span>
        )}
      </div>

      {error && <p className="text-sm text-warn">{error}</p>}
      {truncado && (
        <p className="text-xs text-text-dark/55">
          Se muestran los {orders.length} más recientes. Acota el periodo para ver el resto.
        </p>
      )}

      {/* ───────── Pedidos agrupados ───────── */}
      <div className={`space-y-8 transition-opacity ${navegando ? "opacity-50" : ""}`}>
        {grupos.map((gm) => {
          const rm = resumen(gm.dias.flatMap((d) => d.pedidos));
          return (
            <section key={gm.mes}>
              {variosMeses && (
                <h2 className="mb-3 flex flex-wrap items-baseline justify-between gap-2 border-b border-text-dark/10 pb-2">
                  <span className="text-lg font-extrabold">{inicial(etiquetaMes(gm.mes))}</span>
                  <span className="text-xs text-text-dark/50">
                    {plural(rm.total, "pedido", "pedidos")} · {formatCOP(rm.vendido)} vendido
                  </span>
                </h2>
              )}

              <div className="space-y-4">
                {gm.dias.map((gd) => {
                  const rd = resumen(gd.pedidos);
                  return (
                    <details key={gd.dia} open className="group">
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-xl px-1 py-1.5 [&::-webkit-details-marker]:hidden">
                        <span className="flex items-center gap-2 text-sm font-bold">
                          <ChevronDown size={15} className="text-text-dark/40 transition-transform group-open:rotate-0 -rotate-90" />
                          {inicial(etiquetaDia(gd.pedidos[0].created_at))}
                        </span>
                        <span className="shrink-0 text-right text-xs text-text-dark/50">
                          {plural(rd.total, "pedido", "pedidos")}
                          {rd.vendido > 0 && ` · ${formatCOP(rd.vendido)}`}
                        </span>
                      </summary>

                      <ul className="mt-2 space-y-3">
                        {gd.pedidos.map((o) => (
                          <Tarjeta
                            key={o.id}
                            o={o}
                            busy={busy === o.id}
                            onAprobar={() => run(o, "confirm_order")}
                            onRechazar={() => confirmarYCorrer(o, "reject_order")}
                            onCancelar={() => confirmarYCorrer(o, "cancel_order")}
                            onEstado={(s) => setStatus(o, s)}
                          />
                        ))}
                      </ul>
                    </details>
                  );
                })}
              </div>
            </section>
          );
        })}

        {orders.length === 0 && (
          <p className="rounded-2xl border border-text-dark/10 bg-white px-5 py-12 text-center text-sm text-text-dark/50">
            {filtros.q || filtros.estado !== "todos"
              ? "Ningún pedido coincide con estos filtros."
              : "No hay pedidos en este periodo."}
          </p>
        )}
      </div>
    </div>
  );
}

function Tarjeta({
  o,
  busy,
  onAprobar,
  onRechazar,
  onCancelar,
  onEstado,
}: {
  o: OrderRow;
  busy: boolean;
  onAprobar: () => void;
  onRechazar: () => void;
  onCancelar: () => void;
  onEstado: (s: string) => void;
}) {
  const e = ESTADOS[o.status] ?? ESTADOS.pendiente;
  const cerrado = CERRADOS.includes(o.status);
  const boton =
    "inline-flex items-center gap-1.5 rounded-full border border-text-dark/20 px-4 py-2 text-sm font-medium hover:border-text-dark/50 disabled:opacity-50";

  return (
    <li className={`rounded-2xl border border-text-dark/10 bg-white p-5 ${cerrado ? "opacity-70" : ""}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-sm font-bold text-text-dark/40">#{o.code}</span>
            <span className="font-semibold">{o.customer_name}</span>
            <span className={`rounded-full border px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wide ${e.cls}`}>
              {e.label}
            </span>
            {!o.stock_applied && !cerrado && (
              <span className="text-[0.65rem] text-text-dark/40">sin descontar stock</span>
            )}
          </div>
          <p className="mt-1 text-xs text-text-dark/50">
            {hora(o.created_at)}
            {o.customer_city ? ` · ${o.customer_city}` : ""}
          </p>
          {o.customer_phone && /^\d{8,15}$/.test(o.customer_phone) && (
            <a
              href={`https://wa.me/${o.customer_phone}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-flex items-center gap-1 text-xs text-accent hover:underline"
            >
              <Phone size={11} /> {o.customer_phone}
            </a>
          )}
        </div>
        <span className={`text-lg font-extrabold ${cerrado ? "text-text-dark/40 line-through" : "text-accent"}`}>
          {formatCOP(o.total)}
        </span>
      </div>

      <ul className="mt-3 space-y-1 border-t border-text-dark/10 pt-3">
        {o.order_items.map((it, i) => (
          <li key={i} className="flex justify-between gap-3 text-sm text-text-dark/70">
            <span className="min-w-0 truncate">
              {it.qty} × {it.product_name} <span className="text-text-dark/40">(talla {it.size})</span>
            </span>
            <span className="shrink-0 tabular-nums">{formatCOP(it.unit_price * it.qty)}</span>
          </li>
        ))}
      </ul>

      {/* Dirección, pago y envío que deja el asesor de WhatsApp: es lo que
          hace falta para despachar sin volver a escribirle. */}
      {o.note && (
        <p className="mt-3 whitespace-pre-line rounded-xl bg-text-dark/[0.04] px-3 py-2.5 text-xs leading-relaxed text-text-dark/75">
          {o.note}
        </p>
      )}

      {!cerrado && o.status !== "entregado" && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {o.status === "pendiente" && (
            <>
              <button
                onClick={onAprobar}
                disabled={busy}
                className="inline-flex items-center gap-1.5 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-hover disabled:opacity-50"
              >
                {busy ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                Aprobar venta
              </button>
              <button
                onClick={onRechazar}
                disabled={busy}
                title="La tienda no lo aprueba: el pago no llegó, datos falsos, sin cobertura…"
                className={`${boton} hover:border-danger/50 hover:text-danger`}
              >
                <Ban size={14} /> Rechazar
              </button>
            </>
          )}

          {o.status === "pagado" && (
            <button onClick={() => onEstado("enviado")} disabled={busy} className={boton}>
              <Package size={14} /> Marcar enviado
            </button>
          )}

          {o.status === "enviado" && (
            <button onClick={() => onEstado("entregado")} disabled={busy} className={boton}>
              <Check size={14} /> Marcar entregado
            </button>
          )}

          <button
            onClick={onCancelar}
            disabled={busy}
            title="El cliente desistió"
            className="ml-auto inline-flex items-center gap-1.5 text-sm text-text-dark/45 hover:text-danger disabled:opacity-50"
          >
            <X size={14} /> Cancelar
          </button>
        </div>
      )}
    </li>
  );
}
