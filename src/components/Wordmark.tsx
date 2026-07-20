import Link from "next/link";

/** Logo tipográfico VEL[T]OR — Archivo italic 800, la "T" en acento naranja. */
export default function Wordmark({
  className = "",
  onDark = false,
}: {
  className?: string;
  onDark?: boolean;
}) {
  return (
    <Link
      href="/"
      aria-label="VELTOR — inicio"
      className={`inline-flex items-baseline font-display font-extrabold italic tracking-tight select-none ${
        onDark ? "text-text-light" : "text-text-dark"
      } ${className}`}
    >
      <span>VEL</span>
      <span className="text-accent">T</span>
      <span>OR</span>
    </Link>
  );
}
