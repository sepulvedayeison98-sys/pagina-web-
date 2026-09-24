"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LogOut,
  ExternalLink,
  Package,
  Type,
  Star,
  Boxes,
  Receipt,
  MessageCircle,
  Webhook,
  KeyRound,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Wordmark from "../Wordmark";

const TABS = [
  { href: "/admin", label: "Productos", Icon: Package },
  { href: "/admin/contenido", label: "Textos", Icon: Type },
  { href: "/admin/inventario", label: "Inventario", Icon: Boxes },
  { href: "/admin/pedidos", label: "Pedidos", Icon: Receipt },
  { href: "/admin/resenas", label: "Reseñas", Icon: Star },
  { href: "/admin/conversaciones", label: "WhatsApp", Icon: MessageCircle },
  { href: "/admin/whatsapp", label: "Conexión", Icon: Webhook },
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
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-5 sm:py-4">
        <Link href="/admin" className="flex items-center gap-3">
          <Wordmark className="text-lg" enlace={false} />
          <span className="eyebrow text-text-dark/40">Admin</span>
        </Link>
        {/* En celular solo los íconos: con texto, la barra no cabía y
            empujaba el ancho de toda la página. */}
        <div className="flex items-center gap-4 text-sm sm:gap-5">
          <Link
            href="/"
            target="_blank"
            aria-label="Ver tienda"
            className="inline-flex items-center gap-1 text-text-dark/60 hover:text-accent"
          >
            <span className="hidden sm:inline">Ver tienda</span> <ExternalLink size={14} />
          </Link>
          <Link
            href="/admin/cuenta"
            className={`inline-flex items-center gap-1 hover:text-accent ${
              pathname === "/admin/cuenta" ? "text-accent" : "text-text-dark/60"
            }`}
          >
            <KeyRound size={14} /> <span className="hidden sm:inline">Mi cuenta</span>
          </Link>
          <button
            onClick={logout}
            aria-label="Salir"
            className="inline-flex items-center gap-1 text-text-dark/60 hover:text-accent"
          >
            <LogOut size={14} /> <span className="hidden sm:inline">Salir</span>
          </button>
        </div>
      </div>

      {/* Pestañas de sección. En pantallas angostas se desplazan de lado en
          vez de ensanchar la página (lo que hacía que el celular alejara
          todo el panel para mostrarlas completas). */}
      <nav
        className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-2 [scrollbar-width:none] sm:px-5 [&::-webkit-scrollbar]:hidden"
        aria-label="Secciones"
      >
        {TABS.map(({ href, label, Icon }) => {
          const on =
            href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={on ? "page" : undefined}
              ref={on ? (el) => el?.scrollIntoView({ block: "nearest", inline: "center" }) : undefined}
              className={`-mb-px inline-flex shrink-0 items-center gap-2 whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium transition-colors sm:px-4 ${
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
