"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

/**
 * Wrapper de "reveal on scroll": aparece con opacity 0→1 y translateY 30→0.
 * Spring sin rebote, dispara cuando el 12% entra en viewport.
 * Respeta prefers-reduced-motion (sin desplazamiento).
 */
export default function Reveal({
  children,
  delay = 0,
  className = "",
  as = "div",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  as?: "div" | "section" | "li" | "article";
}) {
  const reduce = useReducedMotion();
  const MotionTag = motion[as];

  return (
    <MotionTag
      className={className}
      initial={{ opacity: 0, y: reduce ? 0 : 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{ type: "spring", bounce: 0, duration: 0.6, delay }}
    >
      {children}
    </MotionTag>
  );
}
