"use client";

import { useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import Reveal from "./Reveal";
import Placeholder from "./Placeholder";
import ComboSelector from "./ComboSelector";
import { formatCOP } from "@/lib/format";
import { text, type SiteContent } from "@/lib/content";
import type { ComboData } from "@/lib/data";
// Mismo recorte con transparencia que usa el cuadro destacado: son los
// mismos 2 cascos del combo, sin fondo ni texto quemado, para poder
// montarlos sobre la escena de luces en vez de un póster plano.
import comboCutout from "@/assets/promo-ofertas.webp";

/**
 * Líneas de velocidad de la escena: nacen de un punto oculto detrás de los
 * cascos y se abren hacia los bordes, con longitud, opacidad y desenfoque
 * distintos por trazo. Al ir por debajo del recorte, los cascos las tapan
 * en el centro y solo asoman hacia afuera: leen como luz de fondo, no como
 * un gráfico pegado encima. viewBox cuadrado, igual que el recuadro.
 */
function ComboSpeedLines() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 400 400"
      preserveAspectRatio="xMidYMid slice"
      className="pointer-events-none absolute inset-0 h-full w-full"
    >
      <defs>
        <filter id="cs-sm" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1" />
        </filter>
        <filter id="cs-md" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="3" />
        </filter>
        <filter id="cs-lg" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="9" />
        </filter>
      </defs>
      <g strokeLinecap="round" fill="none">
        {/* abanico corto y brillante, justo saliendo del contorno */}
        <line x1="182" y1="198" x2="52" y2="118" stroke="#fff" strokeWidth="2" opacity="0.7" filter="url(#cs-sm)" />
        <line x1="218" y1="198" x2="348" y2="118" stroke="#fff" strokeWidth="2" opacity="0.66" filter="url(#cs-sm)" />
        <line x1="186" y1="258" x2="74" y2="330" stroke="#ffb3b3" strokeWidth="1.8" opacity="0.55" filter="url(#cs-sm)" />
        <line x1="214" y1="258" x2="326" y2="330" stroke="#ffb3b3" strokeWidth="1.8" opacity="0.52" filter="url(#cs-sm)" />

        {/* medios en rojo, más difusos */}
        <line x1="168" y1="190" x2="-24" y2="62" stroke="#f02020" strokeWidth="3.4" opacity="0.5" filter="url(#cs-md)" />
        <line x1="232" y1="190" x2="424" y2="62" stroke="#f02020" strokeWidth="3.4" opacity="0.48" filter="url(#cs-md)" />
        <line x1="158" y1="228" x2="-32" y2="216" stroke="#f02020" strokeWidth="3" opacity="0.42" filter="url(#cs-md)" />
        <line x1="242" y1="228" x2="432" y2="216" stroke="#f02020" strokeWidth="3" opacity="0.4" filter="url(#cs-md)" />
        <line x1="172" y1="268" x2="-14" y2="372" stroke="#d81e24" strokeWidth="2.8" opacity="0.38" filter="url(#cs-md)" />
        <line x1="228" y1="268" x2="414" y2="372" stroke="#d81e24" strokeWidth="2.8" opacity="0.36" filter="url(#cs-md)" />

        {/* luz de piso reflejada bajo los cascos */}
        <line x1="118" y1="322" x2="282" y2="322" stroke="#f02020" strokeWidth="5" opacity="0.3" filter="url(#cs-lg)" />

        {/* trazos muy largos y difusos: profundidad de fondo */}
        <line x1="200" y1="230" x2="-40" y2="-10" stroke="#d81e24" strokeWidth="7" opacity="0.14" filter="url(#cs-lg)" />
        <line x1="200" y1="230" x2="440" y2="-10" stroke="#d81e24" strokeWidth="7" opacity="0.13" filter="url(#cs-lg)" />
      </g>
    </svg>
  );
}

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
    <section id="combo" className="scroll-mt-24 bg-ink text-text-light">
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-5 py-16 lg:grid-cols-2 lg:gap-14 lg:px-8">
        {/* Escena del combo: fondo negro + luces detrás, cascos flotando
            encima. Las capas van en orden: halo, líneas, cascos, insignia. */}
        <Reveal className="order-last lg:order-first">
          <div className="relative aspect-square w-full overflow-hidden rounded-3xl bg-black">
            <div aria-hidden className="combo-scene-glow pointer-events-none absolute inset-0" />
            <ComboSpeedLines />

            <div className="absolute inset-0 z-10">
              <Placeholder
                className="h-full w-full"
                src={combo.imageUrl ?? comboCutout.src}
                alt={combo.name}
                label="Los 2 cascos"
                fit="contain"
                bgClassName="bg-transparent"
                imageClassName="promo-helmet-glow"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>

            {ahorro && (
              <span className="absolute left-4 top-4 z-20 rounded-full bg-accent px-4 py-2 text-sm font-extrabold text-white shadow-lg">
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
