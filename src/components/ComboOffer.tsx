"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
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
 * un gráfico pegado encima.
 *
 * Desborda el bloque de los cascos (inset negativo) para que la luz siga
 * hacia el resto de la sección y no quede encerrada en un recuadro. Lo que
 * sobra lo recorta el overflow-hidden de la sección.
 */
function ComboSpeedLines() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 400 400"
      preserveAspectRatio="xMidYMid slice"
      className="combo-scene-lines pointer-events-none absolute -inset-x-[45%] -inset-y-[70%] z-0"
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
      {/* Los cascos ocupan ~x 72-328, y 124-275 de este viewBox: los trazos
          arrancan dentro de esa zona (tapados) y salen hacia los bordes. */}
      <g strokeLinecap="round" fill="none">
        {/* abanico corto y brillante, justo saliendo del contorno */}
        <line x1="170" y1="176" x2="60" y2="104" stroke="#fff" strokeWidth="2.2" opacity="0.7" filter="url(#cs-sm)" />
        <line x1="230" y1="176" x2="340" y2="104" stroke="#fff" strokeWidth="2.2" opacity="0.66" filter="url(#cs-sm)" />
        <line x1="174" y1="240" x2="72" y2="306" stroke="#ffb3b3" strokeWidth="1.9" opacity="0.55" filter="url(#cs-sm)" />
        <line x1="226" y1="240" x2="328" y2="306" stroke="#ffb3b3" strokeWidth="1.9" opacity="0.52" filter="url(#cs-sm)" />

        {/* medios en rojo, más difusos: cruzan el borde del bloque */}
        <line x1="150" y1="170" x2="-70" y2="34" stroke="#f02020" strokeWidth="3.6" opacity="0.5" filter="url(#cs-md)" />
        <line x1="250" y1="170" x2="470" y2="34" stroke="#f02020" strokeWidth="3.6" opacity="0.48" filter="url(#cs-md)" />
        <line x1="136" y1="202" x2="-90" y2="196" stroke="#f02020" strokeWidth="3.2" opacity="0.44" filter="url(#cs-md)" />
        <line x1="264" y1="202" x2="490" y2="196" stroke="#f02020" strokeWidth="3.2" opacity="0.42" filter="url(#cs-md)" />
        <line x1="152" y1="244" x2="-70" y2="360" stroke="#d81e24" strokeWidth="3" opacity="0.4" filter="url(#cs-md)" />
        <line x1="248" y1="244" x2="470" y2="360" stroke="#d81e24" strokeWidth="3" opacity="0.38" filter="url(#cs-md)" />

        {/* luz de piso reflejada bajo los cascos */}
        <line x1="96" y1="292" x2="304" y2="292" stroke="#f02020" strokeWidth="6" opacity="0.3" filter="url(#cs-lg)" />

        {/* trazos muy largos y difusos: profundidad de fondo */}
        <line x1="200" y1="200" x2="-140" y2="-90" stroke="#d81e24" strokeWidth="8" opacity="0.14" filter="url(#cs-lg)" />
        <line x1="200" y1="200" x2="540" y2="-90" stroke="#d81e24" strokeWidth="8" opacity="0.13" filter="url(#cs-lg)" />
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
  const reduce = useReducedMotion();

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
    // Negro puro, igual que el fondo que traen los recortes: la escena es
    // toda la sección, sin recuadro. overflow-hidden recorta la luz que
    // desborda para que no invada las secciones vecinas.
    <section
      id="combo"
      className="relative scroll-mt-24 overflow-hidden bg-black text-text-light"
    >
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-5 py-16 lg:grid-cols-2 lg:gap-14 lg:px-8">
        {/* El halo y las líneas desbordan el bloque (inset negativo) y se
            funden con el fondo de la sección.

            Esta columna NO usa Reveal: ese wrapper anima con filter, y un
            elemento con filtro recorta todo lo que se le sale — cortaba en
            seco el halo, las líneas y el resplandor rojo del casco contra
            el borde de la columna. Aquí se anima solo con opacidad y
            desplazamiento, que no recortan. */}
        <motion.div
          className="relative order-last aspect-[3/2] w-full lg:order-first"
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 24 }}
          whileInView={reduce ? { opacity: 1 } : { opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: reduce ? 0.4 : 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          <div
            aria-hidden
            className="combo-scene-glow pointer-events-none absolute -inset-x-[45%] -inset-y-[70%] z-0"
          />
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
            <span className="absolute -top-2 left-0 z-20 rounded-full bg-accent px-4 py-2 text-sm font-extrabold text-white shadow-lg">
              Ahorras {formatCOP(ahorro)}
            </span>
          )}
        </motion.div>

        {/* z-10: la luz que desborda del bloque de los cascos pasa por
            detrás del texto, no por encima. */}
        <div className="relative z-10">
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
