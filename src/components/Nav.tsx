"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
} from "motion/react";
import { Search, ShoppingBag, Menu, X } from "lucide-react";
import Wordmark from "./Wordmark";

const LEFT = [
  { label: "Cascos", href: "/#catalogo" },
  { label: "Categorías", href: "/#categorias" },
];
const RIGHT = [
  { label: "Tecnología", href: "/#tecnologia" },
  { label: "Comunidad", href: "/#comunidad" },
];
const ALL = [...LEFT, ...RIGHT];

const EASE = "cubic-bezier(.32,.72,0,1)";

/**
 * Nav flotante: transparente sobre el hero oscuro del inicio y, al hacer
 * scroll, se transforma en un "pill" centrado con blur. En páginas que no
 * son el inicio arranca como pill (fondo claro → texto debe ser legible).
 * Detección de scroll con motion (sin listeners manuales). Menú móvil a
 * pantalla completa con entrada escalonada; respeta prefers-reduced-motion.
 */
export default function Nav() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const reduce = useReducedMotion();
  const pathname = usePathname();
  const overHero = pathname === "/";
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (v) => {
    const next = v > 40;
    setScrolled((prev) => (prev === next ? prev : next));
  });

  // "pill": compacto, oscuro y con blur. Se activa al scrollear o fuera del hero.
  const pill = scrolled || !overHero;

  const linkCls =
    "rounded-full px-3.5 py-2 text-sm font-medium text-text-light/85 whitespace-nowrap transition-colors hover:bg-white/10 hover:text-text-light [text-shadow:0_1px_10px_rgba(0,0,0,.35)]";

  return (
    <>
    <header
      className={`fixed inset-x-0 z-50 mx-auto flex items-center justify-between gap-3 transition-all duration-[600ms] ${
        pill
          ? "top-4 w-[min(1180px,calc(100%-2rem))] rounded-full border border-white/12 bg-ink/70 py-2 pl-4 pr-2 shadow-[0_22px_55px_-28px_rgba(0,0,0,.6)] backdrop-blur-xl"
          : "top-0 w-full rounded-none border border-transparent bg-transparent px-5 py-5 shadow-none lg:px-10"
      }`}
      style={{ transitionTimingFunction: EASE }}
    >
      {/* Izquierda */}
      <nav
        className="hidden flex-1 items-center justify-start gap-1 lg:flex"
        aria-label="Principal"
      >
        {LEFT.map((l) => (
          <Link key={l.href} href={l.href} className={linkCls}>
            {l.label}
          </Link>
        ))}
      </nav>

      {/* Centro: logo */}
      <div className="flex flex-1 justify-center lg:flex-none">
        <Wordmark onDark className="text-xl" />
      </div>

      {/* Derecha */}
      <div className="flex flex-1 items-center justify-end gap-1">
        <nav className="hidden items-center gap-1 lg:flex" aria-label="Secundaria">
          {RIGHT.map((l) => (
            <Link key={l.href} href={l.href} className={linkCls}>
              {l.label}
            </Link>
          ))}
        </nav>

        <button
          aria-label="Buscar"
          className="hidden h-10 w-10 items-center justify-center rounded-full text-text-light/85 transition-colors hover:bg-white/10 hover:text-text-light lg:flex"
        >
          <Search size={19} />
        </button>

        <Link
          href="#"
          aria-label="Carrito (2)"
          className="relative flex h-10 w-10 items-center justify-center rounded-full text-text-light/85 transition-colors hover:bg-white/10 hover:text-text-light"
        >
          <ShoppingBag size={19} />
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[0.6rem] font-bold text-white">
            2
          </span>
        </Link>

        <button
          aria-label={open ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/10 text-text-light transition-colors hover:bg-white/20 lg:hidden"
        >
          {open ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>
    </header>

      {/* Menú móvil a pantalla completa (hermano del header) */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
            className="fixed inset-0 z-40 flex flex-col justify-center gap-1 bg-ink/95 px-8 backdrop-blur-2xl lg:hidden"
          >
            {ALL.map((l, i) => (
              <motion.div
                key={l.href}
                initial={reduce ? { opacity: 0 } : { opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.5,
                  delay: reduce ? 0 : 0.05 + i * 0.05,
                  ease: [0.32, 0.72, 0, 1],
                }}
              >
                <Link
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="block py-1.5 font-display text-3xl font-semibold tracking-tight text-text-light hover:text-accent"
                >
                  {l.label}
                </Link>
              </motion.div>
            ))}
            <motion.div
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.5,
                delay: reduce ? 0 : 0.05 + ALL.length * 0.05,
                ease: [0.32, 0.72, 0, 1],
              }}
            >
              <Link
                href="#"
                onClick={() => setOpen(false)}
                className="mt-2 inline-flex items-center gap-2 py-1.5 font-display text-3xl font-semibold tracking-tight text-accent"
              >
                <ShoppingBag size={26} /> Carrito
              </Link>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
