"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "motion/react";
import { Search, ShoppingBag, Menu, X } from "lucide-react";
import Wordmark from "./Wordmark";

const LINKS = [
  { label: "Cascos", href: "/#catalogo" },
  { label: "Categorías", href: "/#categorias" },
  { label: "Tecnología", href: "/#tecnologia" },
  { label: "Comunidad", href: "/#comunidad" },
];

/** Nav sticky: material translúcido que se asienta y gana profundidad al hacer scroll. */
export default function Nav() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (v) => {
    const next = v > 8;
    setScrolled((prev) => (prev === next ? prev : next));
  });

  return (
    <header
      className={`sticky top-0 z-50 transition-[background-color,box-shadow,backdrop-filter] duration-300 supports-[backdrop-filter]:bg-ink/70 ${
        scrolled
          ? "bg-ink/90 shadow-[0_10px_30px_-12px_rgba(0,0,0,0.6)] backdrop-blur-xl"
          : "bg-ink/80 backdrop-blur-md"
      }`}
    >
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 px-5 lg:px-8">
        <Wordmark onDark className="text-xl" />

        <ul className="hidden items-center gap-8 md:flex">
          {LINKS.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                className="text-sm text-text-light/75 transition-colors hover:text-accent"
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-4 text-text-light">
          <button aria-label="Buscar" className="hover:text-accent">
            <Search size={20} />
          </button>
          <Link
            href="#"
            aria-label="Carrito (2)"
            className="relative hover:text-accent"
          >
            <ShoppingBag size={20} />
            <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[0.6rem] font-bold text-white">
              2
            </span>
          </Link>
          <button
            aria-label={open ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={open}
            className="md:hidden hover:text-accent"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden border-t border-white/10 md:hidden"
          >
            <ul className="flex flex-col gap-1 px-5 py-4">
              {LINKS.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    onClick={() => setOpen(false)}
                    className="block py-2 text-text-light/80 hover:text-accent"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scroll-edge: brillo suave donde el material flotante se encuentra con el contenido. */}
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-x-0 top-full h-6 bg-gradient-to-b from-ink/25 to-transparent transition-opacity duration-300 ${
          scrolled ? "opacity-100" : "opacity-0"
        }`}
      />
    </header>
  );
}
