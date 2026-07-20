import { Instagram, Facebook, Youtube, Music2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";

/**
 * Glifos de redes. lucide-react no trae logos de marca comerciales,
 * usamos aproximaciones genéricas (Music2 para TikTok).
 */
export const SOCIALS: { label: string; href: string; Icon: LucideIcon }[] = [
  { label: "Instagram", href: "#", Icon: Instagram },
  { label: "Facebook", href: "#", Icon: Facebook },
  { label: "TikTok", href: "#", Icon: Music2 },
  { label: "YouTube", href: "#", Icon: Youtube },
];
