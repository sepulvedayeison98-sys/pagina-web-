"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Check, X, Package, Phone } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatCOP } from "@/lib/format";

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

const ESTADOS: Record<string, { label: string; cls: string }> = {
  pendiente: { label: "Pendiente", cls: "bg-warn/10 text-warn border-warn/30" },
  pagado: { label: "Pagado", cls: "bg-accent/10 text-accent border-accent/30" },
  enviado: {
    label: "Enviado",
    cls: "bg-text-dark/5 text-text-dark/70 border-text-dark/20",
  },
  entregado: {
    label: "Entregado",
    cls: "bg-text-dark/5 text-text-dark/70 border-text-dark/20",
  },
  cancelado: {
    label: "Cancelado",
    cls: "bg-danger/10 text-danger border-danger/30",
  },
};

/**
 * Pedidos que llegan desde la tienda.
 *
 * Un pedido nace "pendiente" y NO descuenta inventario: puede ser alguien
 * curioso probando. Al confirmarlo (cuando cierras la venta por WhatsApp) sí
 * sale la mercancía. Al cancelar, si ya había salido, vuelve al inventario.
 */
export default function OrdersManager({ initial }: { initial: OrderRow[] }) {
  const router = useRouter();
  const supabase = createClient();

  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const pendientes = initial.filter((o) => o.status === "pendiente").length;
  const vendido = initial
    .filter((o) => !["pendiente", "cancelado"].includes(o.status))
    .reduce((n, o) => n + o.total, 0);

  async function run(id: string, fn: "confirm_order" | "cancel_order") {
    setBusy(id);
    setError(null);
    const { error } = await supabase.rpc(fn, { p_order_id: id });
    setBusy(null);
    if (error) {
      setError("No se pudo actualizar el pedido.");
      return;
    }
    router.refresh();
  }

  async function setStatus(id: string, status: string) {
    setBusy(id);
    const { error } = await supabase
      .from("orders")
      .update({ status })
      .eq("id", id);
    setBusy(null);
    if (error) setError("No se pudo cambiar el estado.");
    else router.refresh();
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-6 text-sm">
        <span>
          <strong className="text-lg">{initial.length}</strong>{" "}
          <span className="text-text-dark/55">pedidos</span>
        </span>
        {pendientes > 0 && (
          <span className="text-warn">
            <strong className="text-lg">{pendientes}</strong> por confirmar
          </span>
        )}
        <span>
          <strong className="text-lg text-accent">{formatCOP(vendido)}</strong>{" "}
          <span className="text-text-dark/55">vendido</span>
        </span>
      </div>

      {error && <p className="text-sm text-warn">{error}</p>}

      <ul className="space-y-3">
        {initial.map((o) => {
          const e = ESTADOS[o.status] ?? ESTADOS.pendiente;
          return (
            <li
              key={o.id}
              className="rounded-2xl border border-text-dark/10 bg-white p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-sm font-bold text-text-dark/40">
                      #{o.code}
                    </span>
                    <span className="font-semibold">{o.customer_name}</span>
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wide ${e.cls}`}
                    >
                      {e.label}
                    </span>
                    {!o.stock_applied && o.status !== "cancelado" && (
                      <span className="text-[0.65rem] text-text-dark/40">
                        sin descontar stock
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-text-dark/50">
                    {new Date(o.created_at).toLocaleString("es-CO")}
                    {o.customer_city ? ` · ${o.customer_city}` : ""}
                  </p>
                  {o.customer_phone && (
                    <a
                      href={`https://wa.me/${o.customer_phone.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 inline-flex items-center gap-1 text-xs text-accent hover:underline"
                    >
                      <Phone size={11} /> {o.customer_phone}
                    </a>
                  )}
                </div>
                <span className="text-lg font-extrabold text-accent">
                  {formatCOP(o.total)}
                </span>
              </div>

              <ul className="mt-3 space-y-1 border-t border-text-dark/10 pt-3">
                {o.order_items.map((it, i) => (
                  <li
                    key={i}
                    className="flex justify-between gap-3 text-sm text-text-dark/70"
                  >
                    <span className="min-w-0 truncate">
                      {it.qty} × {it.product_name}{" "}
                      <span className="text-text-dark/40">
                        (talla {it.size})
                      </span>
                    </span>
                    <span className="shrink-0 tabular-nums">
                      {formatCOP(it.unit_price * it.qty)}
                    </span>
                  </li>
                ))}
              </ul>

              {o.status !== "cancelado" && (
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  {o.status === "pendiente" && (
                    <button
                      onClick={() => run(o.id, "confirm_order")}
                      disabled={busy === o.id}
                      className="inline-flex items-center gap-1.5 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-hover disabled:opacity-50"
                    >
                      {busy === o.id ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Check size={14} />
                      )}
                      Confirmar venta
                    </button>
                  )}

                  {o.status === "pagado" && (
                    <button
                      onClick={() => setStatus(o.id, "enviado")}
                      disabled={busy === o.id}
                      className="inline-flex items-center gap-1.5 rounded-full border border-text-dark/20 px-4 py-2 text-sm font-medium hover:border-text-dark/50 disabled:opacity-50"
                    >
                      <Package size={14} /> Marcar enviado
                    </button>
                  )}

                  {o.status === "enviado" && (
                    <button
                      onClick={() => setStatus(o.id, "entregado")}
                      disabled={busy === o.id}
                      className="inline-flex items-center gap-1.5 rounded-full border border-text-dark/20 px-4 py-2 text-sm font-medium hover:border-text-dark/50 disabled:opacity-50"
                    >
                      <Check size={14} /> Marcar entregado
                    </button>
                  )}

                  <button
                    onClick={() => {
                      if (
                        confirm(
                          `¿Cancelar el pedido #${o.code}?${
                            o.stock_applied
                              ? " La mercancía volverá al inventario."
                              : ""
                          }`
                        )
                      )
                        run(o.id, "cancel_order");
                    }}
                    disabled={busy === o.id}
                    className="ml-auto inline-flex items-center gap-1.5 text-sm text-text-dark/45 hover:text-danger disabled:opacity-50"
                  >
                    <X size={14} /> Cancelar
                  </button>
                </div>
              )}
            </li>
          );
        })}

        {initial.length === 0 && (
          <li className="rounded-2xl border border-text-dark/10 bg-white px-5 py-12 text-center text-sm text-text-dark/50">
            Aún no hay pedidos. Aparecerán aquí cuando un cliente finalice su
            compra por WhatsApp.
          </li>
        )}
      </ul>
    </div>
  );
}
