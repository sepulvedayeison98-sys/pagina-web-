"use client";

import { useState } from "react";
import { Check, Eye, EyeOff, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const MIN_LARGO = 8;

/**
 * Cambio de contraseña del usuario que tiene la sesión abierta.
 *
 * Se pide la contraseña actual y se verifica antes de cambiar nada: si no,
 * cualquiera que encuentre una sesión abierta en un computador podría
 * cambiar la clave y dejar por fuera al dueño de la cuenta.
 */
export default function PasswordForm({ email }: { email: string }) {
  const supabase = createClient();
  const [actual, setActual] = useState("");
  const [nueva, setNueva] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [verClaves, setVerClaves] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [listo, setListo] = useState(false);
  const [guardando, setGuardando] = useState(false);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setListo(false);

    if (nueva.length < MIN_LARGO) {
      setError(`La contraseña nueva debe tener al menos ${MIN_LARGO} caracteres.`);
      return;
    }
    if (nueva !== confirmar) {
      setError("La contraseña nueva y su confirmación no coinciden.");
      return;
    }
    if (nueva === actual) {
      setError("La contraseña nueva debe ser distinta de la actual.");
      return;
    }

    setGuardando(true);

    // Verificación de identidad: reintenta el inicio de sesión con la clave actual.
    const { error: errorActual } = await supabase.auth.signInWithPassword({
      email,
      password: actual,
    });
    if (errorActual) {
      setGuardando(false);
      setError("La contraseña actual no es correcta.");
      return;
    }

    const { error: errorCambio } = await supabase.auth.updateUser({ password: nueva });
    setGuardando(false);

    if (errorCambio) {
      setError("No se pudo cambiar la contraseña. Intenta de nuevo.");
      return;
    }

    setActual("");
    setNueva("");
    setConfirmar("");
    setListo(true);
  }

  const campo =
    "w-full rounded-lg border border-text-dark/20 py-2.5 pl-3 pr-11 text-sm focus:border-accent focus:outline-none";

  return (
    <form onSubmit={enviar} className="flex max-w-sm flex-col gap-4">
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium text-text-dark/70">Contraseña actual</span>
        <div className="relative">
          <input
            type={verClaves ? "text" : "password"}
            autoComplete="current-password"
            required
            value={actual}
            onChange={(e) => setActual(e.target.value)}
            className={campo}
          />
          <button
            type="button"
            onClick={() => setVerClaves((v) => !v)}
            aria-label={verClaves ? "Ocultar contraseñas" : "Mostrar contraseñas"}
            aria-pressed={verClaves}
            className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-lg text-text-dark/40 transition-colors hover:text-text-dark"
          >
            {verClaves ? <EyeOff size={17} /> : <Eye size={17} />}
          </button>
        </div>
      </label>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium text-text-dark/70">Contraseña nueva</span>
        <input
          type={verClaves ? "text" : "password"}
          autoComplete="new-password"
          required
          minLength={MIN_LARGO}
          value={nueva}
          onChange={(e) => setNueva(e.target.value)}
          className={campo}
        />
        <span className="text-xs text-text-dark/45">Mínimo {MIN_LARGO} caracteres.</span>
      </label>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium text-text-dark/70">Repite la contraseña nueva</span>
        <input
          type={verClaves ? "text" : "password"}
          autoComplete="new-password"
          required
          value={confirmar}
          onChange={(e) => setConfirmar(e.target.value)}
          className={campo}
        />
      </label>

      {error && <p className="text-sm text-danger">{error}</p>}
      {listo && (
        <p className="inline-flex items-center gap-1.5 text-sm text-accent">
          <Check size={15} /> Contraseña actualizada.
        </p>
      )}

      <button
        type="submit"
        disabled={guardando}
        className="mt-1 inline-flex items-center justify-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-accent-hover disabled:opacity-60"
      >
        {guardando && <Loader2 size={15} className="animate-spin" />}
        {guardando ? "Guardando…" : "Cambiar contraseña"}
      </button>
    </form>
  );
}
