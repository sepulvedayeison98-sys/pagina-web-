"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { motion } from "motion/react";
import Placeholder from "./Placeholder";
import Reveal from "./Reveal";
import type { SiteContent } from "@/lib/content";
import { text } from "@/lib/content";
import promoNuevaColeccion from "@/assets/promo-nueva-coleccion.webp";
import promoOfertas from "@/assets/promo-ofertas.webp";
import promoTecnologia from "@/assets/promo-tecnologia.webp";

/**
 * Fotos de los 3 recuadros, en el mismo orden que promo1/2/3.
 *
 * Recortes de casco con transparencia real (sin fondo ni texto quemado):
 * "contain" para verlas completas, nunca recortadas.
 */
const PANEL_IMAGES: string[] = [
  promoNuevaColeccion.src,
  promoOfertas.src,
  promoTecnologia.src,
];

interface Panel {
  title: string;
  badge?: string;
  cta: string;
  href: string;
  image: string;
}

/**
 * Líneas de velocidad, pegadas a los bordes verticales del recuadro.
 *
 * Se midió el canal alfa de las 3 fotos: el casco ocupa casi todo el ancho
 * justo en su ecuador (hasta 96% en la más ancha), así que cualquier línea
 * que cruce por el centro termina tapada por él. El margen que SÍ es libre
 * en las tres, de arriba a abajo, es una franja angosta pegada a cada borde
 * (por eso el x de estas líneas nunca pasa de ~7% ni baja de ~93%).
 * viewBox fijo (400×500): escala con el recuadro sin recalcular por breakpoint.
 */
function SpeedLines() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 400 500"
      preserveAspectRatio="xMidYMid slice"
      className="pointer-events-none absolute inset-0 h-full w-full"
    >
      <defs>
        <filter id="pl-blur-sm" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="0.8" />
        </filter>
        <filter id="pl-blur-md" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="2.2" />
        </filter>
        <filter id="pl-blur-lg" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="10" />
        </filter>
      </defs>
      <g strokeLinecap="round" fill="none">
        {/* borde izquierdo: tres tramos de distinto largo/blur, como si el
            flujo de aire pasara pegado al casco sin tocarlo */}
        <line x1="9" y1="40" x2="2" y2="150" stroke="#fff" strokeWidth="1.6" opacity="0.55" filter="url(#pl-blur-sm)" />
        <line x1="13" y1="170" x2="3" y2="330" stroke="#f02020" strokeWidth="2.4" opacity="0.5" filter="url(#pl-blur-md)" />
        <line x1="16" y1="350" x2="4" y2="470" stroke="#d81e24" strokeWidth="2" opacity="0.4" filter="url(#pl-blur-md)" />

        {/* borde derecho, espejado */}
        <line x1="391" y1="55" x2="398" y2="165" stroke="#fff" strokeWidth="1.6" opacity="0.5" filter="url(#pl-blur-sm)" />
        <line x1="387" y1="185" x2="397" y2="345" stroke="#f02020" strokeWidth="2.4" opacity="0.46" filter="url(#pl-blur-md)" />
        <line x1="384" y1="365" x2="396" y2="460" stroke="#d81e24" strokeWidth="2" opacity="0.36" filter="url(#pl-blur-md)" />

        {/* esquinas superiores: la única franja libre de sobra (por encima
            del casco en las tres fotos), acentos cortos y brillantes */}
        <line x1="0" y1="6" x2="76" y2="26" stroke="#fff" strokeWidth="1.8" opacity="0.6" filter="url(#pl-blur-sm)" />
        <line x1="400" y1="4" x2="322" y2="24" stroke="#fff" strokeWidth="1.8" opacity="0.55" filter="url(#pl-blur-sm)" />

        {/* dos trazos muy largos y muy difuminados, casi neblina, que cruzan
            de esquina a esquina para dar profundidad de fondo sin competir
            con el casco (opacidad mínima a propósito) */}
        <line x1="-20" y1="20" x2="420" y2="480" stroke="#d81e24" strokeWidth="6" opacity="0.07" filter="url(#pl-blur-lg)" />
        <line x1="420" y1="10" x2="-20" y2="460" stroke="#d81e24" strokeWidth="6" opacity="0.06" filter="url(#pl-blur-lg)" />
      </g>
    </svg>
  );
}

function PromoPanel({ panel }: { panel: Panel }) {
  return (
    <Link
      href={panel.href}
      // Sin borde ni esquinas redondeadas: los tres bloques se leen como una
      // sola escena continua (el fondo y las luces viven en la sección).
      className="group relative block aspect-[4/3] overflow-hidden lg:aspect-[4/5]"
    >
      <SpeedLines />

      {/* Se reserva una banda inferior para el texto: así el casco sube y el
          título deja de caerle encima. */}
      <motion.div
        className="relative h-full w-full pb-20"
        whileHover={{ scale: 1.06 }}
        transition={{ type: "spring", bounce: 0.1, duration: 0.6 }}
      >
        <Placeholder
          className="h-full w-full"
          src={panel.image}
          fit="contain"
          bgClassName="bg-transparent"
          imageClassName="promo-helmet-glow"
          compact
        />
      </motion.div>

      <div className="pointer-events-none absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black via-black/45 to-transparent px-6 pb-5 pt-6">
        {panel.badge && (
          <span className="mb-2 w-fit rounded-full bg-accent px-3 py-1 text-[0.65rem] font-bold uppercase tracking-widest text-white">
            {panel.badge}
          </span>
        )}
        <h3 className="font-display text-2xl font-extrabold leading-tight text-text-light sm:text-3xl">
          {panel.title}
        </h3>
        <span className="mt-3 inline-flex w-fit items-center gap-1.5 text-sm font-semibold uppercase tracking-wide text-text-light transition-colors group-hover:text-accent">
          {panel.cta} <ArrowRight size={15} />
        </span>
      </div>
    </Link>
  );
}

/**
 * Los tres recuadros promocionales bajo el banner principal ("cuadro
 * destacado"): cada uno enlaza a una sección de la tienda. El texto y los
 * enlaces se editan desde /admin/contenido; las fotos de fondo son fijas
 * (PANEL_IMAGES, en el mismo orden que promo1/2/3).
 */
export default function PromoBanner({ content }: { content: SiteContent }) {
  const panels: Panel[] = [1, 2, 3].map((n, i) => ({
    title: text(content, `promo${n}.title`),
    badge: text(content, `promo${n}.badge`) || undefined,
    cta: text(content, `promo${n}.cta`),
    href: text(content, `promo${n}.href`),
    image: PANEL_IMAGES[i],
  }));

  return (
    // Negro puro: al ser recortes con transparencia, es lo que se ve
    // alrededor de cada casco. Los tres bloques se funden sin costura.
    <section className="relative overflow-hidden bg-black">
      {/* Halo + neblina mínima detrás de los cascos: van PRIMERO (z-0) para
          que las fotos, ya transparentes, floten delante de la luz. */}
      <div aria-hidden className="promo-band-glow pointer-events-none absolute inset-0 z-0" />
      <div aria-hidden className="promo-band-mist pointer-events-none absolute inset-0 z-0" />

      <div className="relative z-10 mx-auto max-w-7xl px-5 py-10 lg:px-8">
        {/* Sin separación entre bloques: los tres forman una sola escena.
            La altura la marca la proporción de cada uno; no se le fija
            altura al contenedor, si no los recuadros se desbordan y se
            montan sobre la sección siguiente. */}
        <div className="grid grid-cols-1 lg:grid-cols-3">
          {panels.map((panel, i) => (
            <Reveal key={panel.title} delay={i * 0.06}>
              <PromoPanel panel={panel} />
            </Reveal>
          ))}
        </div>
      </div>

      {/* Líneas de velocidad + trama, por encima de todo en "screen". */}
      <div aria-hidden className="promo-band-lines pointer-events-none absolute inset-0 z-20" />
    </section>
  );
}
