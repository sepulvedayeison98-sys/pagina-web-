import { Star } from "lucide-react";

/** 5 estrellas; las llenas van en acento naranja. */
export default function Stars({
  rating,
  size = 16,
  className = "",
}: {
  rating: number;
  size?: number;
  className?: string;
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
            className={filled ? "text-accent" : "text-text-dark/25"}
            fill={filled ? "currentColor" : "none"}
            strokeWidth={filled ? 0 : 1.5}
          />
        );
      })}
    </span>
  );
}
