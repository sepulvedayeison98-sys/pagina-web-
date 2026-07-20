"use client";

import Link from "next/link";
import { motion } from "motion/react";
import type { ReactNode } from "react";

type Variant = "primary" | "secondary" | "dark";

const base =
  "inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold tracking-wide transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-50";

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

/** Botón con micro-interacción de "press" (escala hacia dentro y rebota al soltar). */
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
  const cls = `${base} ${variants[variant]} ${full ? "w-full" : ""} ${className}`;
  const press = {
    whileTap: { scale: 0.96 },
    transition: { type: "spring" as const, bounce: 0.5, duration: 0.4 },
  };

  if (href) {
    return (
      <motion.div className={full ? "w-full" : "inline-flex"} {...press}>
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
      {...press}
    >
      {children}
    </motion.button>
  );
}
