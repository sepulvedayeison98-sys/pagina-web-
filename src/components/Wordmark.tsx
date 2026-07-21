import Link from "next/link";
import Image from "next/image";
import logo from "@/assets/logo-veltor.png";

/**
 * Marca VELTOR. Sobre fondo oscuro (onDark) usa el logotipo completo
 * (ícono + wordmark, blanco/naranja). Sobre fondo claro cae al wordmark
 * tipográfico VEL[T]OR en tinta oscura, ya que el logo es blanco y
 * quedaría invisible sobre superficies claras (p. ej. el panel /admin).
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
        aria-label="VELTOR — inicio"
        className={`inline-flex select-none items-center ${className}`}
      >
        <Image
          src={logo}
          alt="VELTOR"
          priority
          className="h-9 w-auto sm:h-10"
          sizes="(max-width: 640px) 72px, 88px"
        />
      </Link>
    );
  }

  return (
    <Link
      href="/"
      aria-label="VELTOR — inicio"
      className={`inline-flex items-baseline font-display font-extrabold italic tracking-tight select-none text-text-dark ${className}`}
    >
      <span>VEL</span>
      <span className="text-accent">T</span>
      <span>OR</span>
    </Link>
  );
}
