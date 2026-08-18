import Link from "next/link";
import Wordmark from "./Wordmark";
import { SOCIALS } from "./icons/Social";
import { WHATSAPP_NUMBER } from "@/lib/config";

/** Enlace de WhatsApp con un mensaje prellenado (tienda atendida por chat). */
function wa(msg: string) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
}

const COLUMNS = [
  {
    title: "Tienda",
    links: [
      { label: "Cascos integrales", href: "/#catalogo" },
      { label: "Cascos jet", href: "/#catalogo" },
      { label: "Modulares", href: "/#catalogo" },
      { label: "Off-road", href: "/#catalogo" },
      { label: "Accesorios", href: "/#catalogo" },
    ],
  },
  {
    title: "Ayuda",
    links: [
      { label: "Guía de tallas", href: "/guia-de-tallas" },
      { label: "Envíos y entregas", href: wa("Hola ROVEX, tengo una duda sobre envíos y entregas.") },
      { label: "Cambios y garantía", href: wa("Hola ROVEX, quiero consultar sobre cambios y garantía.") },
      { label: "Preguntas frecuentes", href: wa("Hola ROVEX, tengo una pregunta.") },
    ],
  },
  {
    title: "ROVEX",
    links: [
      { label: "Nuestra historia", href: "/#comunidad" },
      { label: "Puntos de venta", href: wa("Hola ROVEX, ¿dónde puedo ver los cascos en persona?") },
      { label: "Trabaja con nosotros", href: wa("Hola ROVEX, me interesa trabajar con ustedes.") },
      { label: "Contacto", href: wa("Hola ROVEX, quiero más información.") },
    ],
  },
];

/** Footer de 4 columnas + redes. */
export default function Footer() {
  return (
    <footer className="bg-ink text-text-light">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-10 px-5 py-16 md:grid-cols-4 lg:px-8">
        <div className="col-span-2 md:col-span-1">
          <Wordmark onDark className="text-2xl" />
          <p className="mt-4 max-w-xs text-sm text-text-light/60">
            Equipamiento, tecnología y estilo para motociclistas. Protección y
            diseño premium en cada kilómetro.
          </p>
          <div className="mt-6 flex gap-3">
            {SOCIALS.map(({ label, href, Icon }) => (
              <Link
                key={label}
                href={href}
                aria-label={label}
                target={href.startsWith("http") ? "_blank" : undefined}
                rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 text-text-light/70 transition-colors hover:border-accent hover:text-accent"
              >
                <Icon size={16} />
              </Link>
            ))}
          </div>
        </div>

        {COLUMNS.map((col) => (
          <div key={col.title}>
            <h4 className="eyebrow mb-4 text-text-light/50">{col.title}</h4>
            <ul className="space-y-3">
              {col.links.map((l) => {
                const external = l.href.startsWith("http");
                return (
                  <li key={l.label}>
                    <Link
                      href={l.href}
                      target={external ? "_blank" : undefined}
                      rel={external ? "noopener noreferrer" : undefined}
                      className="text-sm text-text-light/75 transition-colors hover:text-accent"
                    >
                      {l.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-5 py-6 text-xs text-text-light/50 sm:flex-row lg:px-8">
          <p>© {new Date().getFullYear()} ROVEX. Todos los derechos reservados.</p>
          <div className="flex gap-5">
            <Link href="/guia-de-tallas" className="hover:text-accent">
              Guía de tallas
            </Link>
            <Link
              href={wa("Hola ROVEX, quiero más información.")}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-accent"
            >
              Contacto
            </Link>
            <span>Hecho en Colombia 🇨🇴</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
