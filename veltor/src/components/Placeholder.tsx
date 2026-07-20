import Image from "next/image";
import { Camera } from "lucide-react";

/**
 * Recuadro de imagen unificado (fondo "studio").
 * Si `src` trae una foto real, la muestra (cubriendo el recuadro).
 * Si no, muestra "FOTO PRÓXIMAMENTE".
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
          alt={alt ?? label ?? "Foto de producto VELTOR"}
          fill
          sizes={sizes ?? "(max-width: 768px) 100vw, 33vw"}
          className="object-cover"
        />
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col items-center justify-center gap-2 bg-studio text-text-dark/45 ${className}`}
    >
      <Camera size={compact ? 20 : 28} strokeWidth={1.5} />
      {!compact && (
        <span className="eyebrow text-[0.6rem] text-text-dark/45">
          Foto próximamente
        </span>
      )}
      {label && (
        <span className="eyebrow text-[0.55rem] text-text-dark/35">{label}</span>
      )}
    </div>
  );
}
