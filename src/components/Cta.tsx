"use client";

import Link from "next/link";
import {
  motion,
  useMotionValue,
  useSpring,
  useReducedMotion,
} from "motion/react";
import type { PointerEvent, ReactNode } from "react";

type Variant = "primary" | "secondary" | "dark";

const base =
  "relative inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold tracking-wide transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-50";

const variants: Record<Variant, string> = {
  primary: "bg-accent text-white hover:bg-accent-hover",
  secondary:
    "border border-text-dark/25 bg-transparent text-text-dark hover:border-text-dark/60",
  dark: "bg-ink text-text-light hover:bg-black",
};

interface CtaProps {
  children: ReactNode;
  href?: string;
  variant?: Variant;
  className?: string;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
  full?: boolean;
}

/**
 * Botón con dos micro-interacciones físicas (estilo Apple):
 *  - Pull magnético: el botón sigue sutilmente al cursor (máx ~6px), spring
 *    crítico. Movido con motion values (fuera del ciclo de render de React).
 *  - Press: escala hacia dentro y rebota al soltar.
 * Ambas se desactivan bajo prefers-reduced-motion.
 */
export default function Cta({
  children,
  href,
  variant = "primary",
  className = "",
  onClick,
  type = "button",
  disabled = false,
  full = false,
}: CtaProps) {
  const reduce = useReducedMotion();
  const cls = `${base} ${variants[variant]} ${full ? "w-full" : ""} ${className}`;

  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const x = useSpring(mx, { stiffness: 260, damping: 22, mass: 0.4 });
  const y = useSpring(my, { stiffness: 260, damping: 22, mass: 0.4 });

  function handleMove(e: PointerEvent<HTMLElement>) {
    if (reduce) return;
    const r = e.currentTarget.getBoundingClientRect();
    const relX = e.clientX - (r.left + r.width / 2);
    const relY = e.clientY - (r.top + r.height / 2);
    mx.set(relX * 0.22);
    my.set(relY * 0.35);
  }

  function reset() {
    mx.set(0);
    my.set(0);
  }

  const press = {
    whileTap: { scale: 0.96 },
    transition: { type: "spring" as const, bounce: 0.5, duration: 0.4 },
  };

  const interaction = reduce
    ? {}
    : { onPointerMove: handleMove, onPointerLeave: reset };

  if (href) {
    return (
      <motion.div
        className={full ? "w-full" : "inline-flex"}
        style={{ x, y }}
        {...interaction}
        {...press}
      >
        <Link href={href} className={cls}>
          {children}
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cls}
      style={{ x, y }}
      {...interaction}
      {...press}
    >
      {children}
    </motion.button>
  );
}
