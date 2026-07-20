"use client";

import Link from "next/link";
import { motion } from "motion/react";
import type { ReactNode } from "react";
import Placeholder from "./Placeholder";

/**
 * Tile con zoom en hover (la "imagen" escala a 1.06 dentro del recorte).
 * Usado en categorías y en la grilla de comunidad/Instagram.
 */
export default function ZoomTile({
  title,
  subtitle,
  href = "#",
  className = "",
  children,
}: {
  title?: string;
  subtitle?: string;
  href?: string;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`group relative block overflow-hidden rounded-2xl ${className}`}
    >
      <motion.div
        className="h-full w-full"
        whileHover={{ scale: 1.06 }}
        transition={{ type: "spring", bounce: 0.1, duration: 0.6 }}
      >
        <Placeholder className="h-full w-full" compact />
      </motion.div>

      {children}

      {(title || subtitle) && (
        <div className="pointer-events-none absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-ink/70 via-ink/10 to-transparent p-5">
          {subtitle && (
            <span className="eyebrow text-text-light/70">{subtitle}</span>
          )}
          {title && (
            <span className="text-lg font-bold text-text-light">{title}</span>
          )}
        </div>
      )}
    </Link>
  );
}
