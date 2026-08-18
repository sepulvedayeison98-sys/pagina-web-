import type { Metadata } from "next";
import Image from "next/image";
import Reveal from "@/components/Reveal";
import guiaTallas from "@/assets/guia-tallas.webp";

export const metadata: Metadata = {
  title: "Guía de tallas · ROVEX",
  description:
    "Encuentra tu talla de casco ROVEX. Mide la circunferencia de tu cabeza y elige entre S, M, L y XL. Envíos a toda Colombia.",
};

const ROWS = [
  { size: "S", cm: "55 – 56 cm" },
  { size: "M", cm: "57 – 58 cm" },
  { size: "L", cm: "59 – 60 cm" },
  { size: "XL", cm: "61 – 62 cm" },
];

const STEPS = [
  "Mide el contorno de tu cabeza en la parte más ancha, aprox. 1 pulgada por encima de las cejas.",
  "Si quedas entre dos tallas, elige la mayor para mayor comodidad.",
  "Asegúrate de que el casco se sienta firme, pero sin puntos de presión excesivos.",
];

export default function GuiaDeTallasPage() {
  return (
    <div className="mx-auto max-w-4xl px-5 py-14 lg:px-8">
      <Reveal className="mb-8 text-center">
        <p className="eyebrow mb-2 text-accent">ROVEX · Cascos</p>
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
          Guía de tallas
        </h1>
        <p className="mx-auto mt-3 max-w-prose text-text-dark/60">
          Un casco bien ajustado protege mejor. Encuentra tu talla ideal en
          segundos.
        </p>
      </Reveal>

      <Reveal>
        <div className="overflow-hidden rounded-2xl border border-text-dark/10 shadow-sm">
          <Image
            src={guiaTallas}
            alt="Guía de tallas ROVEX: mide la circunferencia de tu cabeza 1 pulgada sobre las cejas. S 55-56 cm, M 57-58 cm, L 59-60 cm, XL 61-62 cm."
            placeholder="blur"
            sizes="(max-width: 896px) 100vw, 56rem"
            className="h-auto w-full"
            priority
          />
        </div>
      </Reveal>

      <div className="mt-10 grid gap-8 sm:grid-cols-2">
        <Reveal as="div">
          <h2 className="eyebrow mb-4 text-text-dark/60">Tabla de tallas</h2>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-text-dark/15 text-left text-text-dark/50">
                <th className="pb-2 font-semibold">Talla</th>
                <th className="pb-2 font-semibold">Circunferencia</th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map((r) => (
                <tr
                  key={r.size}
                  className="border-b border-text-dark/10 last:border-0"
                >
                  <td className="py-2.5">
                    <span className="inline-flex h-8 min-w-8 items-center justify-center rounded-lg bg-ink px-2 font-bold text-white">
                      {r.size}
                    </span>
                  </td>
                  <td className="py-2.5 font-semibold text-text-dark">
                    {r.cm}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Reveal>

        <Reveal as="div" delay={0.08}>
          <h2 className="eyebrow mb-4 text-text-dark/60">Cómo medir</h2>
          <ol className="space-y-3">
            {STEPS.map((step, i) => (
              <li key={i} className="flex gap-3 text-sm text-text-dark/70">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/10 text-xs font-bold text-accent">
                  {i + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </Reveal>
      </div>
    </div>
  );
}
