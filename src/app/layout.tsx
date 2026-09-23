import type { Metadata } from "next";
import { Archivo, JetBrains_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { siteUrl } from "@/lib/site";
import { META_PIXEL_ID } from "@/lib/config";

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
      <body>
        {children}
        {/* Meta Pixel: solo del lado del navegador por ahora (sin Conversions API,
            pendiente de la verificación de negocio). Ver src/lib/metaPixel.ts. */}
        <Script id="meta-pixel" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
            n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
            document,'script','https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${META_PIXEL_ID}');
            fbq('track', 'PageView');
          `}
        </Script>
        <noscript>
          <img
            height="1"
            width="1"
            style={{ display: "none" }}
            src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`}
            alt=""
          />
        </noscript>
      </body>
    </html>
  );
}
