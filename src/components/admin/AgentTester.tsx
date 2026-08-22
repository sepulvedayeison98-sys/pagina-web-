"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Send } from "lucide-react";
import { testAgentMessage } from "@/lib/agent/testAction";

/**
 * Prueba rápida del asesor virtual desde el panel, sin depender de WhatsApp.
 * Útil mientras se configuran las credenciales de Meta.
 */
export default function AgentTester() {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [reply, setReply] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function enviar() {
    if (!input.trim() || loading) return;
    setLoading(true);
    setError(null);
    setReply(null);

    const result = await testAgentMessage(input);
    setLoading(false);

    if ("error" in result) {
      setError(result.error);
      return;
    }
    setReply(result.reply);
    setInput("");
    router.refresh();
  }

  return (
    <div className="mb-6 rounded-2xl border border-accent/30 bg-accent/5 p-5">
      <p className="mb-3 text-sm font-semibold text-text-dark">
        Probar el asesor virtual (sin WhatsApp)
      </p>
      <div className="flex flex-wrap gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && enviar()}
          placeholder="Ej: ¿cuánto vale el 501?"
          className="min-w-0 flex-1 rounded-full border border-text-dark/20 px-4 py-2.5 text-sm focus:border-accent focus:outline-none"
        />
        <button
          onClick={enviar}
          disabled={loading || !input.trim()}
          className="inline-flex items-center gap-1.5 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent-hover disabled:opacity-50"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
          Enviar
        </button>
      </div>

      {error && <p className="mt-3 text-sm text-danger">{error}</p>}
      {reply && (
        <div className="mt-3 rounded-xl bg-white p-4 text-sm whitespace-pre-wrap">
          {reply}
        </div>
      )}
      <p className="mt-3 text-xs text-text-dark/45">
        Esta conversación de prueba queda guardada abajo, como cualquier otra.
      </p>
    </div>
  );
}
