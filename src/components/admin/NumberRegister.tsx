"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, Loader2 } from "lucide-react";
import { registrarNumero, type ResultadoRegistro } from "@/lib/whatsapp/registro";

/**
 * Registro del número en Cloud API desde el panel. Sirve cuando el botón
 * "Registrar" de Meta falla con su mensaje genérico: aquí se ve el código
 * de error real y qué hacer con él.
 */
export default function NumberRegister() {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<ResultadoRegistro | null>(null);

  async function registrar() {
    if (loading || pin.length !== 6) return;
    setLoading(true);
    setResultado(null);
    const r = await registrarNumero(pin);
    setLoading(false);
    setResultado(r);
    // Tras registrar, el diagnóstico de arriba debe cambiar de estado.
    if (r.ok) router.refresh();
  }

  return (
    <div className="mt-8 rounded-2xl border border-accent/30 bg-accent/5 p-5">
      <h2 className="font-bold">Registrar el número en la API</h2>
      <p className="mt-1 text-sm text-text-dark/65">
        Hace lo mismo que el botón «Registrar» de Meta, pero si falla muestra
        el motivo real. El PIN es la verificación en dos pasos del número:
        si es la primera vez, el que escribas aquí queda como PIN; si ya se
        había creado uno, tiene que ser ese mismo.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <input
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
          onKeyDown={(e) => e.key === "Enter" && registrar()}
          inputMode="numeric"
          autoComplete="off"
          placeholder="PIN de 6 dígitos"
          aria-label="PIN de 6 dígitos"
          className="w-44 rounded-full border border-text-dark/20 px-4 py-2.5 font-mono text-sm tracking-widest focus:border-accent focus:outline-none"
        />
        <button
          onClick={registrar}
          disabled={loading || pin.length !== 6}
          className="inline-flex items-center gap-1.5 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent-hover disabled:opacity-50"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <KeyRound size={14} />}
          Registrar
        </button>
      </div>

      {resultado?.ok && (
        <p className="mt-4 rounded-xl bg-emerald-600/10 p-3 text-sm font-semibold text-emerald-700">
          Número registrado. Guarda el PIN: Meta lo vuelve a pedir si algún día
          hay que registrar el número de nuevo.
        </p>
      )}

      {resultado && !resultado.ok && (
        <div className="mt-4 rounded-xl bg-white p-4 text-sm">
          <p className="font-semibold text-danger">
            {resultado.codigo !== undefined
              ? `Error ${resultado.codigo}${resultado.subcodigo ? ` / ${resultado.subcodigo}` : ""}`
              : "Error"}
          </p>
          <p className="mt-1 text-text-dark/70">{resultado.mensaje}</p>
          {resultado.pista && (
            <p className="mt-3 rounded-lg bg-text-dark/[0.04] p-3 text-text-dark/80">
              <span className="font-semibold">Qué hacer: </span>
              {resultado.pista}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
