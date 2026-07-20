import Link from "next/link";
import Wordmark from "./Wordmark";
import { SOCIALS } from "./icons/Social";

const COLUMNS = [
  {
    title: "Tienda",
    links: ["Cascos integrales", "Cascos jet", "Modulares", "Off-road", "Accesorios"],
  },
  {
    title: "Ayuda",
    links: ["Guía de tallas", "Envíos y entregas", "Cambios y garantía", "Preguntas frecuentes"],
  },
  {
    title: "VELTOR",
    links: ["Nuestra historia", "Puntos de venta", "Trabaja con nosotros", "Contacto"],
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
            Equipamiento premium para motociclistas. Protección, diseño y
            tecnología en cada kilómetro.
          </p>
          <div className="mt-6 flex gap-3">
            {SOCIALS.map(({ label, href, Icon }) => (
              <Link
                key={label}
                href={href}
                aria-label={label}
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
              {col.links.map((l) => (
                <li key={l}>
                  <Link
                    href="#"
                    className="text-sm text-text-light/75 transition-colors hover:text-accent"
                  >
                    {l}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-5 py-6 text-xs text-text-light/50 sm:flex-row lg:px-8">
          <p>© {new Date().getFullYear()} VELTOR. Todos los derechos reservados.</p>
          <div className="flex gap-5">
            <Link href="#" className="hover:text-accent">Términos</Link>
            <Link href="#" className="hover:text-accent">Privacidad</Link>
            <Link href="#" className="hover:text-accent">Hecho en Colombia 🇨🇴</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
