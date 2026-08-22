import Image from "next/image";
import logo from "@/assets/logo-rovex.webp";

/**
 * Recuadro de imagen unificado.
 *
 * Con `src` muestra la foto real. Sin foto, en vez de un recuadro gris que
 * parece un error, dibuja un panel oscuro de marca: el mismo fondo negro con
 * resplandor rojo del resto del sitio, el logotipo tenue y el nombre de la
 * pieza. Así un producto sin foto se lee como "todavía no publicada", no
 * como una página rota.
 */
export default function Placeholder({
  src,
  alt,
  label,
  className = "",
  compact = false,
  sizes,
}: {
  src?: string | null;
  alt?: string;
  label?: string;
  className?: string;
  compact?: boolean;
  sizes?: string;
}) {
  if (src) {
    return (
      <div className={`relative overflow-hidden bg-studio ${className}`}>
        <Image
          src={src}
          alt={alt ?? label ?? "Foto de producto ROVEX"}
          fill
          sizes={sizes ?? "(max-width: 768px) 100vw, 33vw"}
          className="object-cover"
        />
      </div>
    );
  }

  return (
    <div
      className={`relative flex flex-col items-center justify-center overflow-hidden bg-ink ${className}`}
      aria-label={alt ?? label ?? "Foto próximamente"}
    >
      {/* Resplandor de marca, igual que el hero */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 60% at 30% 25%, rgba(216,30,36,.18), transparent 62%), radial-gradient(ellipse 60% 50% at 85% 85%, rgba(216,30,36,.10), transparent 62%)",
        }}
      />

      <Image
        src={logo}
        alt=""
        aria-hidden
        className={`relative opacity-[0.16] ${compact ? "w-1/2" : "w-1/2 max-w-[190px]"}`}
        sizes="200px"
      />

      {!compact && label && (
        <span className="eyebrow relative mt-3 px-3 text-center text-[0.55rem] text-text-light/35">
          {label}
        </span>
      )}
    </div>
  );
}
