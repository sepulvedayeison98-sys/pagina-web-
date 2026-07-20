"use client";

import { motion } from "motion/react";

/** Chip de descuento del hero: entra con un "pop" elástico (momentum → rebote). */
export default function HeroBadge() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.6, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: "spring", bounce: 0.45, duration: 0.7, delay: 0.35 }}
      className="absolute -bottom-4 -left-4 rounded-2xl bg-accent px-5 py-4 text-white shadow-[0_18px_40px_-12px_rgba(242,102,31,0.6)]"
    >
      <p className="text-2xl font-extrabold leading-none">-20%</p>
      <p className="text-xs">en la línea Jet</p>
    </motion.div>
  );
}
