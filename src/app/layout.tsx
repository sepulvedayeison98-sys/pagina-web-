import type { Metadata } from "next";
import { Archivo, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { siteUrl } from "@/lib/site";

const archivo = Archivo({
  subsets: ["latin"],
  variable: "--font-archivo",
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  weight: ["400", "500", "700"],
  display: "swap",
});

const TITLE = "ROVEX — Equipamiento, tecnología y estilo";
const DESCRIPTION =
  "Cascos, guantes, accesorios y tecnología para motociclistas. Protección y diseño premium accesible. Envíos a toda Colombia.";

export const metadata: Metadata = {
  // Base absoluta: WhatsApp, Instagram y Facebook descartan las imágenes de
  // vista previa si la URL es relativa.
  metadataBase: new URL(siteUrl()),
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    type: "website",
    siteName: "ROVEX",
    title: TITLE,
    description: DESCRIPTION,
    locale: "es_CO",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es-CO" className={`${archivo.variable} ${jetbrainsMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
