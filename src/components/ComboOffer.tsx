"use client";

import { useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import Reveal from "./Reveal";
import Placeholder from "./Placeholder";
import ComboSelector from "./ComboSelector";
import { formatCOP } from "@/lib/format";
import { text, type SiteContent } from "@/lib/content";
import type { ComboData } from "@/lib/data";
import comboFallback from "@/assets/combo-2-cascos-501.webp";

/**
 * Oferta destacada de la portada.
 *
 * A diferencia de una promo genérica, aquí el beneficio es concreto y se
 * entiende de una: qué llevas, cuánto cuesta y qué te ahorras. El botón no
 * manda a buscar los cascos por separado: abre el selector y en dos toques
 * el combo está en el carrito.
 *
 * El precio y el ahorro salen del producto combo (editable en Productos);
 * los textos, de la pestaña Textos.
 */
export default function ComboOffer({
  combo,
  content,
}: {
  combo: ComboData;
  content: SiteContent;
}) {
  const [open, setOpen] = useState(false);

  const incluye = text(content, "combo.includes")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  const stockNote = text(content, "combo.stockNote").trim();
  const ahorro =
    combo.compareAt && combo.compareAt > combo.price
      ? combo.compareAt - combo.price
      : null;

  return (
    <section className="bg-ink text-text-light">
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-5 py-16 lg:grid-cols-2 lg:gap-14 lg:px-8">
        {/* Imagen del combo */}
        <Reveal className="order-last lg:order-first">
          <div className="relative">
            <Placeholder
              className="aspect-square w-full rounded-3xl"
              src={combo.imageUrl ?? comboFallback.src}
              alt={combo.name}
              label="Los 2 cascos"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
            {ahorro && (
              <span className="absolute left-4 top-4 rounded-full bg-accent px-4 py-2 text-sm font-extrabold text-white shadow-lg">
                Ahorras {formatCOP(ahorro)}
              </span>
            )}
          </div>
        </Reveal>

        <div>
          <Reveal>
            <p className="eyebrow mb-3 text-accent">
              {text(content, "combo.eyebrow")}
            </p>
            <h2 className="text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
              {text(content, "combo.title")}
            </h2>
            <p className="mt-4 max-w-lg text-text-light/70">
              {text(content, "combo.body")}
            </p>
          </Reveal>

          {/* Qué incluye */}
          {incluye.length > 0 && (
            <Reveal delay={0.08}>
              <ul className="mt-7 space-y-2.5 rounded-2xl border border-white/12 bg-white/[0.04] p-5">
                {incluye.map((linea) => (
                  <li key={linea} className="flex items-start gap-2.5 text-sm">
                    <Check
                      size={17}
                      className="mt-0.5 shrink-0 text-accent"
                      aria-hidden
                    />
                    <span className="text-text-light/85">{linea}</span>
                  </li>
                ))}
              </ul>
            </Reveal>
          )}

          {/* Precio y llamada a la acción */}
          <Reveal delay={0.14}>
            <div className="mt-7 flex flex-wrap items-baseline gap-x-4 gap-y-1">
              <span className="text-4xl font-extrabold tracking-tight text-accent sm:text-5xl">
                {formatCOP(combo.price)}
              </span>
              {combo.compareAt && combo.compareAt > combo.price && (
                <span className="text-lg text-text-light/40 line-through">
                  {formatCOP(combo.compareAt)}
                </span>
              )}
            </div>

            <button
              onClick={() => setOpen(true)}
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-accent px-8 py-4 text-base font-bold text-white transition-colors hover:bg-accent-hover"
            >
              {text(content, "combo.cta")} <ArrowRight size={18} />
            </button>

            <p className="mt-3 max-w-md text-sm text-text-light/55">
              {text(content, "combo.note")}
            </p>

            {stockNote && (
              <p className="eyebrow mt-4 text-text-light/40">{stockNote}</p>
            )}
          </Reveal>
        </div>
      </div>

      <ComboSelector
        combo={combo}
        open={open}
        onClose={() => setOpen(false)}
      />
    </section>
  );
}
