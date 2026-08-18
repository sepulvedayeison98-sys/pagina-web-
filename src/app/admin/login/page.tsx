"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Wordmark from "@/components/Wordmark";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setLoading(false);
      setError("Correo o contraseña incorrectos.");
      return;
    }
    // Navegación dura: garantiza que /admin se pida con la cookie ya escrita
    // (evita que el middleware rebote antes de que la sesión esté disponible).
    window.location.assign("/admin");
  }

  return (
    <div className="flex min-h-[100dvh] items-center justify-center px-5">
      <div className="w-full max-w-sm rounded-2xl border border-text-dark/10 bg-white p-8 shadow-sm">
        <div className="mb-6 text-center">
          <Wordmark className="text-2xl" />
          <p className="eyebrow mt-2 text-text-dark/40">Panel de administración</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-text-dark/70">Correo</span>
            <input
              type="email"
              name="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-lg border border-text-dark/20 px-3 py-2.5 text-sm focus:border-accent focus:outline-none"
              placeholder="tu@correo.com"
            />
          </label>

          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-text-dark/70">Contraseña</span>
            <input
              type="password"
              name="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-lg border border-text-dark/20 px-3 py-2.5 text-sm focus:border-accent focus:outline-none"
              placeholder="••••••••"
            />
          </label>

          {error && <p className="text-sm text-warn">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-accent-hover disabled:opacity-60"
          >
            {loading ? "Entrando…" : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}
