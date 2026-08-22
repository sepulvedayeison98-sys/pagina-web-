"use client";

import { useEffect, useState } from "react";
import { Loader2, MessageCircle, Phone, ShieldAlert, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export interface ConversationRow {
  id: string;
  status: "activa" | "escalada" | "cerrada";
  last_message_at: string;
  draft_order: Record<string, unknown> | null;
  customer: {
    id: string;
    name: string | null;
    phone: string;
    city: string | null;
    stage: string;
    score: number;
  } | null;
}

interface MessageRow {
  role: "customer" | "assistant" | "system" | "human_agent";
  content: string;
  created_at: string;
}

interface HandoffRow {
  id: string;
  reason: string;
  summary: string;
  status: "pendiente" | "atendido";
}

const ETAPAS: Record<string, { label: string; cls: string }> = {
  nuevo: { label: "Nuevo", cls: "bg-text-dark/5 text-text-dark/60 border-text-dark/20" },
  explorando: { label: "Explorando", cls: "bg-text-dark/5 text-text-dark/60 border-text-dark/20" },
  interesado: { label: "Interesado", cls: "bg-accent/10 text-accent border-accent/30" },
  cotizado: { label: "Cotizado", cls: "bg-accent/10 text-accent border-accent/30" },
  pendiente_pago: { label: "Pendiente de pago", cls: "bg-warn/10 text-warn border-warn/30" },
  comprado: { label: "Comprado", cls: "bg-accent text-white border-accent" },
  entregado: { label: "Entregado", cls: "bg-accent text-white border-accent" },
  perdido: { label: "Perdido", cls: "bg-danger/10 text-danger border-danger/30" },
};

/** Panel de conversaciones del asesor virtual: lista + hilo + escalamientos pendientes. */
export default function ConversationsManager({ initial }: { initial: ConversationRow[] }) {
  const supabase = createClient();
  const [selected, setSelected] = useState<string | null>(initial[0]?.id ?? null);
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [handoffs, setHandoffs] = useState<HandoffRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!selected) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      const [{ data: msgs }, { data: hos }] = await Promise.all([
        supabase
          .from("wa_messages")
          .select("role,content,created_at")
          .eq("conversation_id", selected)
          .order("created_at", { ascending: true }),
        supabase
          .from("wa_handoffs")
          .select("id,reason,summary,status")
          .eq("conversation_id", selected)
          .eq("status", "pendiente"),
      ]);
      if (cancelled) return;
      setMessages((msgs ?? []) as MessageRow[]);
      setHandoffs((hos ?? []) as HandoffRow[]);
      setLoading(false);
    }
    load();

    return () => {
      cancelled = true;
    };
  }, [selected, supabase]);

  async function cerrarConversacion(id: string) {
    setBusy(true);
    await supabase.from("wa_conversations").update({ status: "cerrada" }).eq("id", id);
    setBusy(false);
    window.location.reload();
  }

  async function marcarAtendido(handoffId: string) {
    setBusy(true);
    await supabase
      .from("wa_handoffs")
      .update({ status: "atendido", resolved_at: new Date().toISOString() })
      .eq("id", handoffId);
    setHandoffs((prev) => prev.filter((h) => h.id !== handoffId));
    setBusy(false);
  }

  const activa = initial.find((c) => c.id === selected) ?? null;

  return (
    <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
      <ul className="space-y-2 lg:max-h-[70vh] lg:overflow-y-auto">
        {initial.map((c) => {
          const etapa = ETAPAS[c.customer?.stage ?? "nuevo"] ?? ETAPAS.nuevo;
          return (
            <li key={c.id}>
              <button
                onClick={() => setSelected(c.id)}
                className={`w-full rounded-2xl border p-4 text-left transition-colors ${
                  c.id === selected
                    ? "border-accent bg-accent/5"
                    : "border-text-dark/10 bg-white hover:border-text-dark/25"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate font-semibold">
                    {c.customer?.name || c.customer?.phone || "Cliente"}
                  </span>
                  {c.status === "escalada" && (
                    <ShieldAlert size={14} className="shrink-0 text-warn" />
                  )}
                </div>
                <p className="mt-1 text-xs text-text-dark/50">
                  {new Date(c.last_message_at).toLocaleString("es-CO")}
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <span className={`rounded-full border px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wide ${etapa.cls}`}>
                    {etapa.label}
                  </span>
                  <span className="text-[0.65rem] text-text-dark/40">
                    score {c.customer?.score ?? 0}
                  </span>
                </div>
              </button>
            </li>
          );
        })}

        {initial.length === 0 && (
          <li className="rounded-2xl border border-text-dark/10 bg-white px-5 py-12 text-center text-sm text-text-dark/50">
            Aún no hay conversaciones. Aparecerán aquí en cuanto el bot reciba
            el primer mensaje de WhatsApp.
          </li>
        )}
      </ul>

      <div className="rounded-2xl border border-text-dark/10 bg-white p-5">
        {!activa ? (
          <p className="py-16 text-center text-sm text-text-dark/50">
            Selecciona una conversación.
          </p>
        ) : (
          <>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-text-dark/10 pb-4">
              <div>
                <p className="font-semibold">
                  {activa.customer?.name || "Cliente sin nombre"}
                </p>
                {activa.customer?.phone && (
                  <a
                    href={`https://wa.me/${activa.customer.phone.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-accent hover:underline"
                  >
                    <Phone size={11} /> {activa.customer.phone}
                  </a>
                )}
                {activa.customer?.city && (
                  <span className="ml-2 text-xs text-text-dark/45">{activa.customer.city}</span>
                )}
              </div>
              {activa.status !== "cerrada" && (
                <button
                  onClick={() => cerrarConversacion(activa.id)}
                  disabled={busy}
                  className="inline-flex items-center gap-1.5 text-sm text-text-dark/45 hover:text-danger disabled:opacity-50"
                >
                  <X size={14} /> Cerrar conversación
                </button>
              )}
            </div>

            {handoffs.map((h) => (
              <div
                key={h.id}
                className="mb-4 rounded-xl border border-warn/30 bg-warn/5 p-4 text-sm"
              >
                <p className="font-semibold text-warn">
                  Escalado · {h.reason.replaceAll("_", " ")}
                </p>
                <p className="mt-1 text-text-dark/70">{h.summary}</p>
                <button
                  onClick={() => marcarAtendido(h.id)}
                  disabled={busy}
                  className="mt-2 rounded-full bg-warn px-3 py-1 text-xs font-semibold text-white disabled:opacity-50"
                >
                  Marcar como atendido
                </button>
              </div>
            ))}

            {loading ? (
              <div className="flex justify-center py-16">
                <Loader2 size={20} className="animate-spin text-text-dark/30" />
              </div>
            ) : (
              <ul className="space-y-3">
                {messages.map((m, i) => (
                  <li
                    key={i}
                    className={`flex ${m.role === "customer" ? "justify-start" : "justify-end"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                        m.role === "customer"
                          ? "bg-text-dark/5 text-text-dark"
                          : m.role === "human_agent"
                            ? "bg-warn/15 text-text-dark"
                            : "bg-accent text-white"
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{m.content}</p>
                      <p className="mt-1 text-[0.65rem] opacity-60">
                        {new Date(m.created_at).toLocaleTimeString("es-CO")}
                      </p>
                    </div>
                  </li>
                ))}

                {messages.length === 0 && (
                  <li className="py-16 text-center text-sm text-text-dark/50">
                    <MessageCircle size={24} className="mx-auto mb-2 text-text-dark/20" />
                    Sin mensajes todavía.
                  </li>
                )}
              </ul>
            )}
          </>
        )}
      </div>
    </div>
  );
}
