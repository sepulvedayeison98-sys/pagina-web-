import Link from "next/link";
import Image from "next/image";
import logo from "@/assets/logo-rovex.webp";

/**
 * Marca ROVEX. Sobre fondo oscuro (onDark) usa el logotipo completo
 * (ícono + wordmark cromado). Sobre fondo claro cae al wordmark
 * tipográfico ROVE[X] en tinta oscura con la X en rojo —el mismo gesto
 * del logo—, porque el cromo del logotipo pierde contraste sobre
 * superficies claras (p. ej. el panel /admin).
 */
export default function Wordmark({
  className = "",
  onDark = false,
}: {
  className?: string;
  onDark?: boolean;
}) {
  if (onDark) {
    return (
      <Link
        href="/"
        aria-label="ROVEX — inicio"
        className={`inline-flex select-none items-center ${className}`}
      >
        <Image
          src={logo}
          alt="ROVEX"
          priority
          className="h-9 w-auto sm:h-10"
          sizes="(max-width: 640px) 76px, 92px"
        />
      </Link>
    );
  }

  return (
    <Link
      href="/"
      aria-label="ROVEX — inicio"
      className={`inline-flex items-baseline font-display font-extrabold italic tracking-tight select-none text-text-dark ${className}`}
    >
      <span>ROVE</span>
      <span className="text-accent">X</span>
    </Link>
  );
}
