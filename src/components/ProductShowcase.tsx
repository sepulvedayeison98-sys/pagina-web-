"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
} from "motion/react";
import Placeholder from "./Placeholder";
import { formatCOP } from "@/lib/format";
import type { Product } from "@/lib/products";

/** Fracción del ancho de viewport que dura la entrada de cada tarjeta (0 a 1 de revelado). */
const REVEAL_WINDOW = 0.42;

interface Breakpoint {
  enter: number;
  full: number;
}
type BreakpointsRef = { current: Breakpoint[] };

/** Recuadro de imagen + info de un producto. Compartido por las dos variantes (fija y de respaldo). */
function ProductTile({ product }: { product: Product }) {
  return (
    <>
      <Link
        href={`/producto/${product.slug}`}
        className="group relative block aspect-[6/5] overflow-hidden rounded-3xl bg-studio"
      >
        <Placeholder
          className="h-full w-full transition-transform duration-700 group-hover:scale-105"
          src={product.imageUrl}
          alt={product.name}
          label={product.name}
          sizes="(max-width: 768px) 84vw, 380px"
        />
        <span className="absolute left-4 top-4 rounded-full border border-white/15 bg-black/45 px-3 py-1 text-[0.65rem] font-mono uppercase tracking-widest text-white/85 backdrop-blur-sm">
          {product.badge ?? product.category}
        </span>
      </Link>

      <div className="flex flex-col gap-1.5 px-1">
        <h3 className="font-display text-xl font-semibold tracking-tight">
          {product.name}
        </h3>
        <p className="line-clamp-2 text-sm text-text-dark/60">
          {product.description ||
            `${product.rating.toFixed(1)} de valoración · ${product.reviewCount} reseñas`}
        </p>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-lg font-bold text-accent">
            {formatCOP(product.price)}
          </span>
          {product.compareAt && (
            <span className="text-sm text-text-dark/40 line-through">
              {formatCOP(product.compareAt)}
            </span>
          )}
        </div>
        <Link
          href={`/producto/${product.slug}`}
          className="mt-1 inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-text-dark transition-colors hover:text-accent"
        >
          Ver producto <ArrowRight size={14} />
        </Link>
      </div>
    </>
  );
}

/** Tarjeta con revelado exagerado (abajo→arriba, blur+escala) según el progreso del scroll anclado. */
function RevealCard({
  product,
  index,
  scrollYProgress,
  breakpointsRef,
  setCardRef,
}: {
  product: Product;
  index: number;
  scrollYProgress: MotionValue<number>;
  breakpointsRef: BreakpointsRef;
  setCardRef: (el: HTMLDivElement | null) => void;
}) {
  const t = useTransform(scrollYProgress, (p) => {
    const bp = breakpointsRef.current[index];
    if (!bp) return 0;
    const span = bp.full - bp.enter || 1;
    return Math.min(Math.max((p - bp.enter) / span, 0), 1);
  });
  const y = useTransform(t, (v) => (1 - v) * 90);
  const opacity = useTransform(t, (v) => 0.1 + v * 0.9);
  const scale = useTransform(t, (v) => 0.92 + v * 0.08);
  const blur = useTransform(t, (v) => `blur(${(1 - v) * 8}px)`);

  return (
    <motion.div
      ref={setCardRef}
      style={{ y, opacity, scale, filter: blur }}
      className="flex w-[min(80vw,380px)] shrink-0 flex-col gap-4"
    >
      <ProductTile product={product} />
    </motion.div>
  );
}

/** Variante fija: scroll horizontal anclado con revelado por tarjeta (desktop, sin reduced-motion). */
function PinnedShowcase({ products }: { products: Product[] }) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const spacerRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const breakpointsRef = useRef<Breakpoint[]>([]);
  const maxShiftRef = useRef(0);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });
  const x = useTransform(scrollYProgress, (p) => -p * maxShiftRef.current);
  // Al final del recorrido, cuando las tarjetas ya salieron y solo queda la
  // tarjeta negra de cierre, un panel negro CRECE desde abajo hacia arriba
  // (origin-bottom + scaleY) llenando el hueco blanco que quedaba debajo de la
  // tarjeta. Al 100% cubre toda el área anclada y se une sin costura con la
  // banda Promo (bg-ink) de abajo, como si esa sección negra "subiera" a
  // absorber el final del carrusel.
  const bleedScaleY = useTransform(scrollYProgress, [0.78, 1], [0, 1]);

  useEffect(() => {
    function measure() {
      const vpEl = viewportRef.current;
      const trackEl = trackRef.current;
      if (!vpEl || !trackEl) return;

      const cs = getComputedStyle(vpEl);
      const padL = parseFloat(cs.paddingLeft) || 0;
      const padR = parseFloat(cs.paddingRight) || 0;
      const contentWidth = vpEl.clientWidth - padL - padR;

      if (spacerRef.current) {
        spacerRef.current.style.flexBasis = `${Math.round(contentWidth * 0.08)}px`;
      }
      if (ctaRef.current) {
        ctaRef.current.style.flexBasis = `${contentWidth}px`;
      }

      const maxShift = Math.max(0, trackEl.scrollWidth - contentWidth);
      maxShiftRef.current = maxShift;

      const vw = window.innerWidth;
      const denom = maxShift || 1;
      breakpointsRef.current = cardRefs.current.map((el) => {
        if (!el) return { enter: 0, full: 0 };
        const cardLeft = el.offsetLeft;
        return {
          enter: (padL + cardLeft - vw) / denom,
          full: (padL + cardLeft - vw * (1 - REVEAL_WINDOW)) / denom,
        };
      });

      if (sectionRef.current) {
        sectionRef.current.style.height = `${window.innerHeight + maxShift}px`;
      }
    }

    measure();
    const raf = requestAnimationFrame(measure);
    const timeout = setTimeout(measure, 400);
    window.addEventListener("resize", measure);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timeout);
      window.removeEventListener("resize", measure);
    };
  }, [products.length]);

  return (
    <div ref={sectionRef} className="relative">
      <div className="sticky top-0 flex h-[100dvh] items-center overflow-hidden">
        {/* Panel negro que crece desde abajo al final del scroll para unir el
            carrusel con la banda Promo (bg-ink) sin costura. */}
        <motion.div
          aria-hidden
          style={{ scaleY: bleedScaleY }}
          className="pointer-events-none absolute inset-0 z-0 origin-bottom bg-ink"
        />
        <div
          ref={viewportRef}
          className="relative z-[1] w-full overflow-hidden px-5 lg:px-8"
        >
          <motion.div
            ref={trackRef}
            style={{ x }}
            className="relative flex items-center gap-8 lg:gap-12"
          >
            <div className="flex w-[min(78vw,420px)] shrink-0 flex-col gap-4">
              <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
                Catálogo de cascos
              </h2>
              <p className="max-w-xs text-text-dark/60">
                Desliza para recorrer la colección completa, casco por casco.
              </p>
            </div>

            {products.map((product, i) => (
              <RevealCard
                key={product.slug}
                product={product}
                index={i}
                scrollYProgress={scrollYProgress}
                breakpointsRef={breakpointsRef}
                setCardRef={(el) => {
                  cardRefs.current[i] = el;
                }}
              />
            ))}

            <div ref={spacerRef} aria-hidden className="shrink-0" />

            <div
              ref={ctaRef}
              className="flex shrink-0 flex-col justify-center gap-5 rounded-3xl bg-ink px-8 py-14 text-text-light sm:px-14"
            >
              <p className="font-display text-4xl font-extrabold leading-[0.95] tracking-tight sm:text-6xl">
                Elige.
                <br />
                Equípate.
                <br />
                <span className="text-accent">Rueda.</span>
              </p>
              <p className="max-w-sm text-text-light/70">
                Cascos certificados, guantes técnicos y accesorios pensados
                para cada kilómetro de tu ruta.
              </p>
            </div>
          </motion.div>
        </div>

        {/* HUD de progreso, fijo dentro del área anclada */}
        <div className="pointer-events-none absolute bottom-8 left-5 z-10 flex items-center gap-3 lg:left-8">
          <div className="h-[3px] w-32 overflow-hidden rounded-full bg-text-dark/10">
            <motion.div
              className="h-full origin-left bg-accent"
              style={{ scaleX: scrollYProgress }}
            />
          </div>
          <span className="eyebrow text-text-dark/40">Desliza</span>
        </div>
      </div>
    </div>
  );
}

/** Variante de respaldo: carrusel horizontal nativo (móvil o prefers-reduced-motion). */
function SimpleShowcase({ products }: { products: Product[] }) {
  return (
    <div className="mx-auto max-w-7xl px-5 py-16 lg:px-8">
      <div className="mb-8 max-w-xl">
        <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
          Catálogo de cascos
        </h2>
        <p className="mt-3 text-text-dark/60">
          Desliza para ver toda la colección.
        </p>
      </div>
      <div className="flex snap-x snap-mandatory gap-5 overflow-x-auto pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {products.map((p) => (
          <div
            key={p.slug}
            className="flex w-[78vw] shrink-0 snap-start flex-col gap-4 sm:w-[360px]"
          >
            <ProductTile product={p} />
          </div>
        ))}
        <div className="flex w-[78vw] shrink-0 snap-start flex-col justify-center gap-4 rounded-3xl bg-ink px-6 py-10 text-text-light sm:w-[360px]">
          <p className="font-display text-3xl font-extrabold leading-[0.95] tracking-tight">
            Elige.
            <br />
            Equípate.
            <br />
            <span className="text-accent">Rueda.</span>
          </p>
          <p className="text-sm text-text-light/70">
            Cascos certificados, guantes técnicos y accesorios para cada
            kilómetro de tu ruta.
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Catálogo como scroll horizontal anclado: la sección queda fija a pantalla
 * completa mientras el usuario baja, y ese scroll vertical mueve un carril
 * horizontal de tarjetas que se revelan una a una (abajo→arriba, blur+escala).
 * En móvil o con prefers-reduced-motion cae a un carrusel nativo con
 * scroll-snap, sin animación ni anclaje.
 */
export default function ProductShowcase({ products }: { products: Product[] }) {
  const reduce = useReducedMotion();
  const [enhanced, setEnhanced] = useState(false);

  useEffect(() => {
    function update() {
      setEnhanced(!reduce && window.innerWidth >= 1024);
    }
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [reduce]);

  return (
    <section id="catalogo" className="bg-white">
      {enhanced ? (
        <PinnedShowcase products={products} />
      ) : (
        <SimpleShowcase products={products} />
      )}
    </section>
  );
}
