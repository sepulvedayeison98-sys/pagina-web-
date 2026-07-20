"use client";

import Link from "next/link";
import { LogOut, ExternalLink } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Wordmark from "../Wordmark";

/** Cabecera del panel admin: marca + ver tienda + cerrar sesión. */
export default function AdminHeader() {
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
    </header>
  );
}
