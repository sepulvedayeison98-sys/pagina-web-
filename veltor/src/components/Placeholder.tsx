import { Camera } from "lucide-react";

/**
 * Recuadro de imagen unificado (fondo "studio").
 * Mientras no haya foto real, muestra "FOTO PRÓXIMAMENTE".
 * `label` permite distinguir vistas (p. ej. en la galería de producto).
 */
export default function Placeholder({
  label,
  className = "",
  compact = false,
}: {
  label?: string;
  className?: string;
  compact?: boolean;
}) {
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
