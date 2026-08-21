"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, ExternalLink, Package, Type, Star } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Wordmark from "../Wordmark";

const TABS = [
  { href: "/admin", label: "Productos", Icon: Package },
  { href: "/admin/contenido", label: "Textos", Icon: Type },
  { href: "/admin/resenas", label: "Reseñas", Icon: Star },
];

/** Cabecera del panel admin: marca + pestañas + ver tienda + cerrar sesión. */
export default function AdminHeader() {
  const pathname = usePathname();

  async function logout() {
    await createClient().auth.signOut();
    window.location.assign("/admin/login");
  }

  return (
    <header className="border-b border-text-dark/10 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
        <Link href="/admin" className="flex items-center gap-3">
          <Wordmark className="text-lg" />
          <span className="eyebrow text-text-dark/40">Admin</span>
        </Link>
        <div className="flex items-center gap-5 text-sm">
          <Link
            href="/"
            target="_blank"
            className="inline-flex items-center gap-1 text-text-dark/60 hover:text-accent"
          >
            Ver tienda <ExternalLink size={14} />
          </Link>
          <button
            onClick={logout}
            className="inline-flex items-center gap-1 text-text-dark/60 hover:text-accent"
          >
            <LogOut size={14} /> Salir
          </button>
        </div>
      </div>

      {/* Pestañas de sección */}
      <nav className="mx-auto flex max-w-6xl gap-1 px-5" aria-label="Secciones">
        {TABS.map(({ href, label, Icon }) => {
          const on =
            href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={on ? "page" : undefined}
              className={`-mb-px inline-flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                on
                  ? "border-accent text-text-dark"
                  : "border-transparent text-text-dark/50 hover:text-text-dark"
              }`}
            >
              <Icon size={15} /> {label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
