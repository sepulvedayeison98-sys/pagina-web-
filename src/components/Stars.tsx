import { Star } from "lucide-react";

/** 5 estrellas; las llenas van en acento rojo. */
export default function Stars({
  rating,
  size = 16,
  className = "",
  emptyClassName = "text-text-dark/25",
}: {
  rating: number;
  size?: number;
  className?: string;
  /** Color del contorno de las estrellas vacías: ajustar en fondos oscuros. */
  emptyClassName?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-0.5 ${className}`}
      aria-label={`${rating.toFixed(1)} de 5 estrellas`}
      role="img"
    >
      {Array.from({ length: 5 }).map((_, i) => {
        const filled = i < Math.round(rating);
        return (
          <Star
            key={i}
            size={size}
            className={filled ? "text-accent" : emptyClassName}
            fill={filled ? "currentColor" : "none"}
            strokeWidth={filled ? 0 : 1.5}
          />
        );
      })}
    </span>
  );
}
