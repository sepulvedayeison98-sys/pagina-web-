import { Instagram, Facebook } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { FACEBOOK_URL, INSTAGRAM_URL } from "@/lib/config";

/** Solo redes con cuenta real: un ícono que no lleva a ningún lado resta confianza. */
export const SOCIALS: { label: string; href: string; Icon: LucideIcon }[] = [
  { label: "Instagram", href: INSTAGRAM_URL, Icon: Instagram },
  { label: "Facebook", href: FACEBOOK_URL, Icon: Facebook },
];
