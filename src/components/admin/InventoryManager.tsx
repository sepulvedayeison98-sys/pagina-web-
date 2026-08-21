"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Check, Plus, Minus, Search } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { SIZES } from "@/lib/products";
import NewReferenceForm from "./NewReferenceForm";
import { variantSummary } from "@/lib/variants";

export interface StockRow {
  product_id: string;
  name: string;
  slug: string;
  brand: string | null;
  model: string | null;
  visor: string | null;
  spoiler: string | null;
  sizes: string[];
  stock: Record<string, number>;
}

const input =
  "w-full rounded-lg border border-text-dark/20 px-3 py-2 text-sm focus:border-accent focus:outline-none";

/**
 * Existencias por producto y talla.
 *
 * Dos formas de trabajar:
 *  - "+" y "−" registran entradas y salidas sueltas (llegó mercancía,
 *    se dañó una unidad…). Cada toque queda en el historial.
 *  - Escribir un número y salir del campo hace un ajuste por conteo físico:
 *    se guarda la diferencia contra lo que había.
 *
 * Solo se muestran las tallas que el producto tiene habilitadas.
 */
export default function InventoryManager({ initial }: { initial: StockRow[] }) {
  const router = useRouter();
  const supabase = createClient();

  const [q, setQ] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState(initial);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return rows;
    return rows.filter(
      (r) =>
        r.name.toLowerCase().includes(t) ||
        (r.brand ?? "").toLowerCase().includes(t) ||
        (r.model ?? "").toLowerCase().includes(t)
    );
  }, [q, rows]);

  const totalUnidades = rows.reduce(
    (n, r) => n + Object.values(r.stock).reduce((a, b) => a + b, 0),
    0
  );
  const agotados = rows.reduce(
    (n, r) => n + r.sizes.filter((s) => (r.stock[s] ?? 0) <= 0).length,
    0
  );

  function bump(productId: string, size: string, delta: number) {
    setRows((prev) =>
      prev.map((r) =>
        r.product_id === productId
          ? {
              ...r,
              stock: {
                ...r.stock,
                [size]: Math.max(0, (r.stock[size] ?? 0) + delta),
              },
            }
          : r
      )
    );
  }

  async function move(productId: string, size: string, delta: number) {
    const key = productId + size;
    setBusy(key);
    setError(null);
    bump(productId, size, delta);

    const { error } = await supabase.rpc("stock_move", {
      p_product_id: productId,
      p_size: size,
      p_qty: delta,
      p_kind: delta > 0 ? "entrada" : "salida",
      p_note: null,
      p_order_id: null,
    });

    setBusy(null);
    if (error) {
      setError("No se pudo guardar el movimiento.");
      bump(productId, size, -delta);
      return;
    }
    setSaved(key);
    setTimeout(() => setSaved(null), 1200);
    router.refresh();
  }

  async function setExact(productId: string, size: string, value: number) {
    const key = productId + size;
    const row = rows.find((r) => r.product_id === productId);
    if (!row || (row.stock[size] ?? 0) === value) return;

    setBusy(key);
    setError(null);
    const { error } = await supabase.rpc("set_stock", {
      p_product_id: productId,
      p_size: size,
      p_qty: value,
      p_note: "Conteo físico",
    });

    setBusy(null);
    if (error) {
      setError("No se pudo ajustar la existencia.");
      return;
    }
    setRows((prev) =>
      prev.map((r) =>
        r.product_id === productId
          ? { ...r, stock: { ...r.stock, [size]: value } }
          : r
      )
    );
    setSaved(key);
    setTimeout(() => setSaved(null), 1200);
    router.refresh();
  }

  return (
    <div className="space-y-5">
      <NewReferenceForm />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-5 text-sm">
          <span>
            <strong className="text-lg">{totalUnidades}</strong>{" "}
            <span className="text-text-dark/55">unidades en total</span>
          </span>
          {agotados > 0 && (
            <span className="text-warn">
              <strong className="text-lg">{agotados}</strong> tallas agotadas
            </span>
          )}
        </div>
        <div className="relative">
          <Search
            size={15}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-dark/35"
          />
          <input
            className={`${input} w-56 pl-9`}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar producto o marca"
          />
        </div>
      </div>

      {error && <p className="text-sm text-warn">{error}</p>}

      <div className="space-y-3">
        {filtered.map((r) => (
          <section
            key={r.product_id}
            className="rounded-2xl border border-text-dark/10 bg-white p-5"
          >
            <div className="mb-4 flex items-baseline justify-between gap-3">
              <div className="min-w-0">
                <h3 className="font-semibold">{r.name}</h3>
                {variantSummary(r) && (
                  <p className="text-xs text-text-dark/50">
                    {variantSummary(r)}
                  </p>
                )}
              </div>
              <span className="shrink-0 text-xs text-text-dark/45">
                {r.brand ? `${r.brand} · ` : ""}
                {Object.values(r.stock).reduce((a, b) => a + b, 0)} und
              </span>
            </div>

            <div className="flex flex-wrap gap-3">
              {SIZES.filter((s) => r.sizes.includes(s)).map((size) => {
                const key = r.product_id + size;
                const value = r.stock[size] ?? 0;
                const cero = value <= 0;
                return (
                  <div
                    key={size}
                    className={`flex flex-col items-center gap-1.5 rounded-xl border px-3 py-2.5 ${
                      cero ? "border-warn/40 bg-warn/5" : "border-text-dark/15"
                    }`}
                  >
                    <span className="text-xs font-bold tracking-wide text-text-dark/60">
                      {size}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => move(r.product_id, size, -1)}
                        disabled={busy === key || value <= 0}
                        aria-label={`Sacar una unidad de la talla ${size}`}
                        className="flex h-7 w-7 items-center justify-center rounded-md text-text-dark/50 hover:bg-text-dark/5 disabled:opacity-30"
                      >
                        <Minus size={13} />
                      </button>

                      <input
                        type="number"
                        min={0}
                        defaultValue={value}
                        key={`${key}-${value}`}
                        onBlur={(e) =>
                          setExact(
                            r.product_id,
                            size,
                            Math.max(0, Number(e.target.value) || 0)
                          )
                        }
                        aria-label={`Existencias talla ${size}`}
                        className={`w-12 rounded-md border border-transparent bg-transparent text-center text-sm font-bold tabular-nums focus:border-accent focus:outline-none ${
                          cero ? "text-warn" : ""
                        }`}
                      />

                      <button
                        onClick={() => move(r.product_id, size, 1)}
                        disabled={busy === key}
                        aria-label={`Ingresar una unidad de la talla ${size}`}
                        className="flex h-7 w-7 items-center justify-center rounded-md text-text-dark/50 hover:bg-text-dark/5 disabled:opacity-30"
                      >
                        <Plus size={13} />
                      </button>
                    </div>

                    <span className="h-3 text-[0.6rem]">
                      {busy === key && (
                        <Loader2
                          size={11}
                          className="animate-spin text-text-dark/40"
                        />
                      )}
                      {saved === key && (
                        <Check size={11} className="text-accent" />
                      )}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>
        ))}

        {filtered.length === 0 && (
          <p className="rounded-2xl border border-text-dark/10 bg-white px-5 py-10 text-center text-sm text-text-dark/50">
            Sin resultados.
          </p>
        )}
      </div>
    </div>
  );
}
