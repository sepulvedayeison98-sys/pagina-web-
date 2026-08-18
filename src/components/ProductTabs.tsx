"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { Truck, ShieldCheck, RotateCcw } from "lucide-react";
import { type Review, type Spec } from "@/lib/products";
import Stars from "./Stars";

type Tab = "specs" | "envios" | "resenas";

const TABS: { id: Tab; label: string }[] = [
  { id: "specs", label: "Especificaciones" },
  { id: "envios", label: "Envíos y garantía" },
  { id: "resenas", label: "Reseñas" },
];

/** Pestañas funcionales: specs / envíos / reseñas. Recibe specs y reseñas por prop. */
export default function ProductTabs({
  specs,
  reviews,
}: {
  specs: Spec[];
  reviews: Review[];
}) {
  const [tab, setTab] = useState<Tab>("specs");

  return (
    <div>
      <div className="flex flex-wrap gap-1 border-b border-text-dark/10">
        {TABS.map((t) => {
          const on = t.id === tab;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`relative px-4 py-3 text-sm font-semibold transition-colors ${
                on ? "text-text-dark" : "text-text-dark/45 hover:text-text-dark/70"
              }`}
            >
              {t.label}
              {on && (
                <motion.span
                  layoutId="tab-underline"
                  className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-accent"
                />
              )}
            </button>
          );
        })}
      </div>

      <div className="py-6">
        {tab === "specs" && specs.length > 0 && (
          <dl className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
            {specs.map((s) => (
              <div
                key={s.label}
                className="flex justify-between gap-4 border-b border-text-dark/10 pb-3"
              >
                <dt className="text-sm text-text-dark/55">{s.label}</dt>
                <dd className="text-right text-sm font-medium">{s.value}</dd>
              </div>
            ))}
          </dl>
        )}
        {tab === "specs" && specs.length === 0 && (
          <p className="text-sm text-text-dark/55">
            Especificaciones próximamente.
          </p>
        )}

        {tab === "envios" && (
          <ul className="space-y-5">
            {[
              {
                Icon: Truck,
                title: "Envío gratis desde $200.000",
                body: "Entregas en 1–3 días hábiles en las principales ciudades. Cobertura nacional.",
              },
              {
                Icon: RotateCcw,
                title: "30 días para cambios",
                body: "¿No era tu talla? Cambio o devolución sin costo dentro de los primeros 30 días.",
              },
              {
                Icon: ShieldCheck,
                title: "2 años de garantía",
                body: "Garantía contra defectos de fabricación y soporte postventa directo con ROVEX.",
              },
            ].map(({ Icon, title, body }) => (
              <li key={title} className="flex gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent">
                  <Icon size={20} />
                </span>
                <div>
                  <h4 className="font-semibold">{title}</h4>
                  <p className="text-sm text-text-dark/60">{body}</p>
                </div>
              </li>
            ))}
          </ul>
        )}

        {tab === "resenas" && (
          <ul className="space-y-6">
            {reviews.map((r) => (
              <li
                key={r.author + r.date}
                className="border-b border-text-dark/10 pb-6 last:border-0"
              >
                <div className="mb-1 flex items-center justify-between">
                  <span className="font-semibold">{r.title}</span>
                  <Stars rating={r.rating} size={14} />
                </div>
                <p className="text-sm text-text-dark/70">{r.body}</p>
                <p className="mt-2 text-xs text-text-dark/45">
                  {r.author} · {r.city}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
