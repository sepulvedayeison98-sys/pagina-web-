"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Archive,
  ArchiveRestore,
  ArrowLeft,
  Bot,
  BotOff,
  Check,
  ExternalLink,
  Info,
  Loader2,
  MessageCircle,
  Search,
  Send,
  ShieldAlert,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { enviarComoHumano } from "@/lib/whatsapp/panelActions";
import { formatCOP } from "@/lib/format";
import { etiquetaDia as separadorDia, hora as horaMensaje, horaLista, mismoDia } from "@/lib/fechas";

/** Una fila de la bandeja: un chat por cliente (función wa_admin_inbox). */
export interface InboxRow {
  customer_id: string;
  name: string | null;
  phone: string;
  city: string | null;
  stage: string;
  score: number;
  notes: string | null;
  conversation_id: string;
  channel: string;
  status: "activa" | "escalada" | "cerrada";
  bot_paused: boolean;
  draft_order: { items?: DraftItem[] } | null;
  last_message_at: string;
  last_role: MessageRow["role"] | null;
  last_content: string | null;
  last_customer_at: string | null;
  unread: number;
  pending_handoffs: number;
}

interface DraftItem {
  slug?: string;
  name?: string;
  size?: string;
  qty?: number;
  price?: number;
}

interface MessageRow {
  id: string;
  conversation_id: string;
  role: "customer" | "assistant" | "system" | "human_agent";
  content: string;
  created_at: string;
}

interface HandoffRow {
  id: string;
  conversation_id: string;
  reason: string;
  summary: string;
  created_at: string;
}

type Filtro = "todos" | "no_leidos" | "humano" | "archivados";

const FILTROS: { id: Filtro; label: string }[] = [
  { id: "todos", label: "Todos" },
  { id: "no_leidos", label: "No leídos" },
  { id: "humano", label: "Atención humana" },
  { id: "archivados", label: "Archivados" },
];

const ETAPAS: Record<string, string> = {
  nuevo: "Nuevo",
  explorando: "Explorando",
  interesado: "Interesado",
  cotizado: "Cotizado",
  pendiente_pago: "Pendiente de pago",
  comprado: "Comprado",
  entregado: "Entregado",
  perdido: "Perdido",
};

/** Cada cuánto se consulta la base mientras el panel está abierto. */
const REFRESCO_BANDEJA_MS = 5000;
const REFRESCO_CHAT_MS = 3000;
/** Ventana de WhatsApp para escribir texto libre tras el último mensaje del cliente. */
const VENTANA_24H_MS = 24 * 60 * 60 * 1000;

// ───────────────────────── utilidades de formato ─────────────────────────

function nombreDe(c: Pick<InboxRow, "name" | "phone">): string {
  const n = c.name?.trim();
  // WhatsApp a veces manda nombres de perfil vacíos o puros signos ("..").
  if (n && /[\p{L}\p{N}]/u.test(n)) return n;
  return formatearTelefono(c.phone);
}

/**
 * Número de WhatsApp o BSUID (quien activó nombre de usuario no comparte su
 * número). Misma regla que esContactoWhatsApp del servidor; se repite aquí
 * porque ese módulo usa crypto de Node y no puede ir al navegador.
 */
function esContacto(id: string): boolean {
  return /^\d{8,15}$/.test(id) || /^[A-Z]{2}\.[A-Za-z0-9]+$/.test(id);
}

function formatearTelefono(phone: string): string {
  if (/^[A-Z]{2}\.[A-Za-z0-9]+$/.test(phone)) return "Usuario de WhatsApp (sin número)";
  if (!/^\d{10,15}$/.test(phone)) return phone;
  if (phone.startsWith("57") && phone.length === 12) {
    return `+57 ${phone.slice(2, 5)} ${phone.slice(5, 8)} ${phone.slice(8)}`;
  }
  return `+${phone}`;
}

function iniciales(texto: string): string {
  const palabras = texto.replace(/[^\p{L}\p{N}\s]/gu, "").trim().split(/\s+/);
  if (!palabras[0]) return "?";
  if (/^\d/.test(palabras[0])) return "#";
  return (palabras[0][0] + (palabras[1]?.[0] ?? "")).toUpperCase();
}

/** Color estable por cliente, para reconocer el chat de un vistazo. */
function colorAvatar(semilla: string): string {
  const colores = [
    "bg-rose-100 text-rose-700",
    "bg-amber-100 text-amber-800",
    "bg-emerald-100 text-emerald-700",
    "bg-sky-100 text-sky-700",
    "bg-violet-100 text-violet-700",
    "bg-teal-100 text-teal-700",
  ];
  let h = 0;
  for (const ch of semilla) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return colores[h % colores.length];
}

function formatoPesos(n: number): string {
  return formatCOP(n);
}

/**
 * Formato de WhatsApp en el panel: *negrita*, _cursiva_, ~tachado~ y enlaces
 * clicables. Sin esto los asteriscos del asesor se veían literales, cuando al
 * cliente le llegan en negrita.
 */
const PATRON_FORMATO = /(https?:\/\/[^\s]+|\*[^*\n]+\*|_[^_\n]+_|~[^~\n]+~)/g;

function conFormato(texto: string, oscuro: boolean): React.ReactNode[] {
  return texto.split(PATRON_FORMATO).map((parte, i) => {
    if (!parte) return null;
    if (/^https?:\/\//.test(parte)) {
      // El punto o la coma pegados al final son de la frase, no del enlace.
      const url = parte.replace(/[.,;:!?)]+$/, "");
      const resto = parte.slice(url.length);
      return (
        <span key={i}>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className={`break-all underline ${oscuro ? "text-white" : "text-accent"}`}
          >
            {url}
          </a>
          {resto}
        </span>
      );
    }
    const marca = parte[0];
    if (parte.length > 2 && parte.endsWith(marca) && "*_~".includes(marca)) {
      const interior = parte.slice(1, -1);
      if (marca === "*") return <strong key={i}>{interior}</strong>;
      if (marca === "_") return <em key={i}>{interior}</em>;
      return <s key={i}>{interior}</s>;
    }
    return <span key={i}>{parte}</span>;
  });
}

function necesitaHumano(c: InboxRow): boolean {
  return c.status === "escalada" || c.pending_handoffs > 0 || c.bot_paused;
}

// ───────────────────────────── componente ─────────────────────────────

/**
 * Bandeja de WhatsApp del panel, al estilo de WhatsApp Web: lista de chats
 * ordenada por el último mensaje y, al abrir uno, el hilo completo con el
 * cliente. Desde aquí se responde a mano (lo que pausa el bot en ese chat),
 * se archiva, se elimina y se edita la ficha del cliente.
 *
 * No hay realtime publicado en estas tablas: se consulta cada pocos
 * segundos mientras la pestaña está visible.
 */
export default function ChatPanel({ initial }: { initial: InboxRow[] }) {
  const supabase = createClient();

  const [inbox, setInbox] = useState<InboxRow[]>(initial);
  const [seleccion, setSeleccion] = useState<string | null>(null);
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [busqueda, setBusqueda] = useState("");

  const [mensajes, setMensajes] = useState<MessageRow[]>([]);
  const [handoffs, setHandoffs] = useState<HandoffRow[]>([]);
  const [cargandoChat, setCargandoChat] = useState(false);

  const [borrador, setBorrador] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState<string | null>(null);

  const [verFicha, setVerFicha] = useState(false);
  const [confirmarBorrado, setConfirmarBorrado] = useState(false);
  const [ocupado, setOcupado] = useState(false);

  const finDelChat = useRef<HTMLDivElement>(null);
  const contenedorChat = useRef<HTMLDivElement>(null);
  const ultimoIdVisto = useRef<string | null>(null);

  const activo = inbox.find((c) => c.customer_id === seleccion) ?? null;

  // ── carga de datos ──

  const recargarBandeja = useCallback(async () => {
    const { data, error } = await supabase.rpc("wa_admin_inbox");
    if (!error && data) setInbox(data as InboxRow[]);
  }, [supabase]);

  const recargarChat = useCallback(
    async (customerId: string) => {
      const { data } = await supabase.rpc("wa_admin_thread", { p_customer_id: customerId });
      const filas = (data ?? []) as MessageRow[];
      setMensajes(filas);

      const ids = [...new Set(filas.map((m) => m.conversation_id))];
      if (ids.length === 0) {
        setHandoffs([]);
        return;
      }
      const { data: hos } = await supabase
        .from("wa_handoffs")
        .select("id,conversation_id,reason,summary,created_at")
        .in("conversation_id", ids)
        .eq("status", "pendiente")
        .order("created_at", { ascending: true });
      setHandoffs((hos ?? []) as HandoffRow[]);
    },
    [supabase]
  );

  const marcarLeido = useCallback(
    async (customerId: string) => {
      setInbox((prev) => prev.map((c) => (c.customer_id === customerId ? { ...c, unread: 0 } : c)));
      await supabase
        .from("wa_conversations")
        .update({ admin_read_at: new Date().toISOString() })
        .eq("customer_id", customerId);
    },
    [supabase]
  );

  // Bandeja: refresco periódico mientras la pestaña esté a la vista.
  useEffect(() => {
    const t = setInterval(() => {
      if (document.visibilityState === "visible") recargarBandeja();
    }, REFRESCO_BANDEJA_MS);
    return () => clearInterval(t);
  }, [recargarBandeja]);

  // Chat abierto: carga inicial + refresco más frecuente.
  useEffect(() => {
    if (!seleccion) return;
    let vivo = true;
    setCargandoChat(true);
    setMensajes([]);
    setHandoffs([]);
    ultimoIdVisto.current = null;
    recargarChat(seleccion).finally(() => vivo && setCargandoChat(false));
    marcarLeido(seleccion);

    const t = setInterval(() => {
      if (document.visibilityState === "visible") recargarChat(seleccion);
    }, REFRESCO_CHAT_MS);
    return () => {
      vivo = false;
      clearInterval(t);
    };
  }, [seleccion, recargarChat, marcarLeido]);

  // Si llega un mensaje nuevo al chat que está abierto, se da por leído.
  const noLeidosActivo = activo?.unread ?? 0;
  useEffect(() => {
    if (seleccion && noLeidosActivo > 0) marcarLeido(seleccion);
  }, [seleccion, noLeidosActivo, marcarLeido]);

  // Bajar al último mensaje al abrir el chat, o cuando llega uno nuevo y ya
  // se estaba viendo el final (si se subió a leer historial, no se le mueve).
  useEffect(() => {
    const ultimo = mensajes[mensajes.length - 1]?.id ?? null;
    if (!ultimo || ultimo === ultimoIdVisto.current) return;
    const caja = contenedorChat.current;
    const primeraVez = ultimoIdVisto.current === null;
    const cercaDelFinal = caja ? caja.scrollHeight - caja.scrollTop - caja.clientHeight < 160 : true;
    ultimoIdVisto.current = ultimo;
    if (primeraVez || cercaDelFinal) {
      finDelChat.current?.scrollIntoView({ block: "end", behavior: primeraVez ? "auto" : "smooth" });
    }
  }, [mensajes]);

  // Total de no leídos en el título de la pestaña del navegador.
  const totalNoLeidos = inbox.reduce((n, c) => n + (c.status === "cerrada" ? 0 : c.unread), 0);
  useEffect(() => {
    const base = "Panel · ROVEX";
    document.title = totalNoLeidos > 0 ? `(${totalNoLeidos}) ${base}` : base;
    return () => {
      document.title = base;
    };
  }, [totalNoLeidos]);

  // ── lista filtrada ──

  const visibles = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return inbox.filter((c) => {
      const archivado = c.status === "cerrada";
      if (filtro === "archivados" ? !archivado : archivado) return false;
      if (filtro === "no_leidos" && c.unread === 0) return false;
      if (filtro === "humano" && !necesitaHumano(c)) return false;
      if (!q) return true;
      return (
        nombreDe(c).toLowerCase().includes(q) ||
        c.phone.includes(q.replace(/\D/g, "") || "\u0000") ||
        (c.last_content ?? "").toLowerCase().includes(q) ||
        (c.city ?? "").toLowerCase().includes(q)
      );
    });
  }, [inbox, filtro, busqueda]);

  const conteo = useMemo(() => {
    const abiertos = inbox.filter((c) => c.status !== "cerrada");
    return {
      todos: abiertos.length,
      no_leidos: abiertos.filter((c) => c.unread > 0).length,
      humano: abiertos.filter(necesitaHumano).length,
      archivados: inbox.length - abiertos.length,
    } satisfies Record<Filtro, number>;
  }, [inbox]);

  // ── acciones ──

  function abrir(customerId: string) {
    setSeleccion(customerId);
    setVerFicha(false);
    setConfirmarBorrado(false);
    setErrorEnvio(null);
    setBorrador("");
  }

  async function enviar() {
    if (!activo || !borrador.trim() || enviando) return;
    setEnviando(true);
    setErrorEnvio(null);
    const r = await enviarComoHumano(activo.customer_id, borrador);
    setEnviando(false);
    if ("error" in r) {
      setErrorEnvio(r.error);
      return;
    }
    setBorrador("");
    await Promise.all([recargarChat(activo.customer_id), recargarBandeja()]);
  }

  async function cambiarBot(pausar: boolean) {
    if (!activo) return;
    setOcupado(true);
    setInbox((prev) =>
      prev.map((c) => (c.customer_id === activo.customer_id ? { ...c, bot_paused: pausar } : c))
    );
    await supabase.from("wa_conversations").update({ bot_paused: pausar }).eq("id", activo.conversation_id);
    setOcupado(false);
  }

  async function archivar(archivar: boolean) {
    if (!activo) return;
    setOcupado(true);
    if (archivar) {
      await supabase
        .from("wa_conversations")
        .update({ status: "cerrada" })
        .eq("customer_id", activo.customer_id)
        .neq("status", "cerrada");
    } else {
      await supabase.from("wa_conversations").update({ status: "activa" }).eq("id", activo.conversation_id);
    }
    await recargarBandeja();
    setOcupado(false);
    if (archivar) setSeleccion(null);
  }

  async function eliminar() {
    if (!activo) return;
    setOcupado(true);
    // Borra todas las conversaciones del cliente; mensajes, escalamientos y
    // eventos se van en cascada. La ficha del cliente se conserva: si vuelve
    // a escribir, el chat empieza de cero pero con su etapa y notas.
    const { error } = await supabase.from("wa_conversations").delete().eq("customer_id", activo.customer_id);
    setOcupado(false);
    setConfirmarBorrado(false);
    if (error) {
      setErrorEnvio(`No se pudo eliminar: ${error.message}`);
      return;
    }
    setInbox((prev) => prev.filter((c) => c.customer_id !== activo.customer_id));
    setSeleccion(null);
  }

  async function atenderHandoff(h: HandoffRow) {
    if (!activo) return;
    setOcupado(true);
    await supabase
      .from("wa_handoffs")
      .update({ status: "atendido", resolved_at: new Date().toISOString() })
      .eq("id", h.id);
    // Sin escalamientos pendientes, la conversación deja de estar "escalada".
    const quedan = handoffs.filter((x) => x.id !== h.id && x.conversation_id === h.conversation_id);
    if (quedan.length === 0) {
      await supabase
        .from("wa_conversations")
        .update({ status: "activa" })
        .eq("id", h.conversation_id)
        .eq("status", "escalada");
    }
    setHandoffs((prev) => prev.filter((x) => x.id !== h.id));
    await recargarBandeja();
    setOcupado(false);
  }

  // ── derivados del chat abierto ──

  const esWhatsapp = activo ? esContacto(activo.phone) : false;
  const fueraDeVentana =
    !!activo &&
    esWhatsapp &&
    (!activo.last_customer_at || Date.now() - new Date(activo.last_customer_at).getTime() > VENTANA_24H_MS);

  return (
    <div className="flex h-[calc(100dvh-9.5rem)] min-h-[520px] overflow-hidden rounded-2xl border border-text-dark/10 bg-white shadow-sm">
      {/* ───────────── Lista de chats ───────────── */}
      <aside
        className={`w-full flex-col border-r border-text-dark/10 lg:flex lg:w-[360px] lg:shrink-0 ${
          activo ? "hidden" : "flex"
        }`}
      >
        <div className="border-b border-text-dark/10 p-3">
          <label className="relative block">
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-dark/35" />
            <input
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar nombre, número o mensaje"
              className="w-full rounded-full bg-text-dark/[0.05] py-2 pl-9 pr-3 text-sm placeholder:text-text-dark/40 focus:bg-white focus:outline-none focus:ring-2 focus:ring-accent/30"
            />
          </label>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {FILTROS.map((f) => (
              <button
                key={f.id}
                onClick={() => setFiltro(f.id)}
                className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                  filtro === f.id
                    ? "bg-accent text-white"
                    : "bg-text-dark/[0.05] text-text-dark/60 hover:bg-text-dark/10"
                }`}
              >
                {f.label}
                {conteo[f.id] > 0 && <span className="ml-1 opacity-70">{conteo[f.id]}</span>}
              </button>
            ))}
          </div>
        </div>

        <ul className="flex-1 overflow-y-auto">
          {visibles.map((c) => {
            const nombre = nombreDe(c);
            const seleccionado = c.customer_id === seleccion;
            const prefijo =
              c.last_role === "assistant" ? "🤖 " : c.last_role === "human_agent" ? "Tú: " : "";
            return (
              <li key={c.customer_id}>
                <button
                  onClick={() => abrir(c.customer_id)}
                  className={`flex w-full items-center gap-3 border-b border-text-dark/[0.06] px-3 py-3 text-left transition-colors ${
                    seleccionado ? "bg-accent/[0.07]" : "hover:bg-text-dark/[0.03]"
                  }`}
                >
                  <span
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold ${colorAvatar(c.phone)}`}
                  >
                    {iniciales(nombre)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline justify-between gap-2">
                      <span className={`truncate ${c.unread > 0 ? "font-bold" : "font-semibold"}`}>{nombre}</span>
                      <span
                        className={`shrink-0 text-[0.7rem] ${
                          c.unread > 0 ? "font-bold text-accent" : "text-text-dark/40"
                        }`}
                      >
                        {horaLista(c.last_message_at)}
                      </span>
                    </span>
                    <span className="mt-0.5 flex items-center gap-2">
                      <span
                        className={`min-w-0 flex-1 truncate text-sm ${
                          c.unread > 0 ? "text-text-dark/80" : "text-text-dark/50"
                        }`}
                      >
                        {c.last_content ? prefijo + c.last_content : "Sin mensajes"}
                      </span>
                      {(c.status === "escalada" || c.pending_handoffs > 0) && (
                        <ShieldAlert size={14} className="shrink-0 text-warn" aria-label="Escalado a humano" />
                      )}
                      {c.bot_paused && (
                        <BotOff size={14} className="shrink-0 text-text-dark/40" aria-label="Bot pausado" />
                      )}
                      {c.unread > 0 && (
                        <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-accent px-1.5 text-[0.65rem] font-bold text-white">
                          {c.unread}
                        </span>
                      )}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}

          {visibles.length === 0 && (
            <li className="px-6 py-16 text-center text-sm text-text-dark/45">
              <MessageCircle size={26} className="mx-auto mb-2 text-text-dark/20" />
              {inbox.length === 0
                ? "Aún no hay chats. Aparecerán aquí en cuanto alguien escriba al WhatsApp."
                : busqueda
                  ? "Ningún chat coincide con la búsqueda."
                  : "No hay chats en esta vista."}
            </li>
          )}
        </ul>
      </aside>

      {/* ───────────── Chat abierto ───────────── */}
      <section className={`min-w-0 flex-1 flex-col ${activo ? "flex" : "hidden lg:flex"}`}>
        {!activo ? (
          <div className="flex flex-1 flex-col items-center justify-center bg-paper/60 px-8 text-center">
            <MessageCircle size={40} className="mb-3 text-text-dark/15" />
            <p className="font-semibold text-text-dark/60">Selecciona un chat</p>
            <p className="mt-1 max-w-xs text-sm text-text-dark/40">
              Los chats se ordenan por el último mensaje. Los que tienen número rojo tienen mensajes sin leer.
            </p>
          </div>
        ) : (
          <div className="relative flex min-h-0 flex-1">
            <div className="flex min-w-0 flex-1 flex-col">
              {/* Cabecera del chat */}
              <header className="flex items-center gap-3 border-b border-text-dark/10 px-3 py-2.5">
                <button
                  onClick={() => setSeleccion(null)}
                  className="rounded-full p-1.5 text-text-dark/60 hover:bg-text-dark/5 lg:hidden"
                  aria-label="Volver a la lista"
                >
                  <ArrowLeft size={18} />
                </button>
                <button onClick={() => setVerFicha((v) => !v)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${colorAvatar(activo.phone)}`}
                  >
                    {iniciales(nombreDe(activo))}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate font-semibold">{nombreDe(activo)}</span>
                    <span className="block truncate text-xs text-text-dark/50">
                      {activo.bot_paused ? "Bot pausado · lo atiendes tú" : "El asesor IA está respondiendo"}
                      {activo.city ? ` · ${activo.city}` : ""}
                    </span>
                  </span>
                </button>

                <div className="flex shrink-0 items-center gap-1">
                  {esWhatsapp && (
                    <button
                      onClick={() => cambiarBot(!activo.bot_paused)}
                      disabled={ocupado}
                      title={activo.bot_paused ? "Reactivar el asesor IA en este chat" : "Pausar el asesor IA y atender tú"}
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50 ${
                        activo.bot_paused
                          ? "bg-emerald-600/10 text-emerald-700 hover:bg-emerald-600/20"
                          : "bg-text-dark/[0.06] text-text-dark/70 hover:bg-text-dark/10"
                      }`}
                    >
                      {activo.bot_paused ? <Bot size={14} /> : <BotOff size={14} />}
                      <span className="hidden sm:inline">{activo.bot_paused ? "Reactivar bot" : "Pausar bot"}</span>
                    </button>
                  )}
                  <button
                    onClick={() => archivar(activo.status !== "cerrada")}
                    disabled={ocupado}
                    title={activo.status === "cerrada" ? "Desarchivar" : "Archivar"}
                    className="hidden rounded-full p-2 text-text-dark/55 hover:bg-text-dark/5 disabled:opacity-50 sm:block"
                  >
                    {activo.status === "cerrada" ? <ArchiveRestore size={17} /> : <Archive size={17} />}
                  </button>
                  <button
                    onClick={() => setConfirmarBorrado(true)}
                    disabled={ocupado}
                    title="Eliminar chat"
                    className="hidden rounded-full p-2 text-text-dark/55 hover:bg-danger/10 hover:text-danger disabled:opacity-50 sm:block"
                  >
                    <Trash2 size={17} />
                  </button>
                  <button
                    onClick={() => setVerFicha((v) => !v)}
                    title="Ficha del cliente"
                    className={`rounded-full p-2 hover:bg-text-dark/5 ${verFicha ? "text-accent" : "text-text-dark/55"}`}
                  >
                    <Info size={17} />
                  </button>
                </div>
              </header>

              {/* Confirmación de borrado */}
              {confirmarBorrado && (
                <div className="flex flex-wrap items-center gap-3 border-b border-danger/20 bg-danger/[0.06] px-4 py-3 text-sm">
                  <p className="min-w-0 flex-1 text-text-dark/80">
                    <span className="font-semibold text-danger">¿Eliminar este chat?</span> Se borran todos los mensajes
                    con {nombreDe(activo)}. No se puede deshacer.
                  </p>
                  <button
                    onClick={() => setConfirmarBorrado(false)}
                    className="rounded-full px-3 py-1.5 font-semibold text-text-dark/60 hover:bg-text-dark/5"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={eliminar}
                    disabled={ocupado}
                    className="inline-flex items-center gap-1.5 rounded-full bg-danger px-4 py-1.5 font-semibold text-white disabled:opacity-50"
                  >
                    {ocupado ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />} Eliminar
                  </button>
                </div>
              )}

              {/* Escalamientos pendientes */}
              {handoffs.map((h) => (
                <div
                  key={h.id}
                  className="flex flex-wrap items-start gap-3 border-b border-warn/20 bg-warn/[0.07] px-4 py-3 text-sm"
                >
                  <ShieldAlert size={16} className="mt-0.5 shrink-0 text-warn" />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-warn">
                      El asesor pidió ayuda · {h.reason.replaceAll("_", " ")}
                    </p>
                    <p className="mt-0.5 text-text-dark/70">{h.summary}</p>
                  </div>
                  <button
                    onClick={() => atenderHandoff(h)}
                    disabled={ocupado}
                    className="inline-flex items-center gap-1 rounded-full bg-warn px-3 py-1 text-xs font-semibold text-white disabled:opacity-50"
                  >
                    <Check size={13} /> Atendido
                  </button>
                </div>
              ))}

              {/* Mensajes */}
              <div ref={contenedorChat} className="flex-1 overflow-y-auto bg-paper/70 px-3 py-4 sm:px-8">
                {cargandoChat && mensajes.length === 0 ? (
                  <div className="flex justify-center py-16">
                    <Loader2 size={20} className="animate-spin text-text-dark/30" />
                  </div>
                ) : (
                  <ol className="space-y-1.5">
                    {mensajes.map((m, i) => {
                      const previo = mensajes[i - 1];
                      const nuevoDia = !previo || !mismoDia(previo.created_at, m.created_at);
                      const nuevaConversacion = previo && previo.conversation_id !== m.conversation_id;
                      const entrante = m.role === "customer";
                      const agrupado = !nuevoDia && previo?.role === m.role;
                      return (
                        <li key={m.id}>
                          {nuevoDia && (
                            <div className="my-3 flex justify-center">
                              <span className="rounded-lg bg-white px-3 py-1 text-[0.7rem] font-semibold capitalize text-text-dark/50 shadow-sm">
                                {separadorDia(m.created_at)}
                              </span>
                            </div>
                          )}
                          {nuevaConversacion && !nuevoDia && (
                            <div className="my-3 flex items-center gap-3 text-[0.65rem] uppercase tracking-wide text-text-dark/35">
                              <span className="h-px flex-1 bg-text-dark/10" /> Nueva conversación
                              <span className="h-px flex-1 bg-text-dark/10" />
                            </div>
                          )}
                          {m.role === "system" ? (
                            <p className="my-2 text-center text-xs italic text-text-dark/45">{m.content}</p>
                          ) : (
                            <div className={`flex ${entrante ? "justify-start" : "justify-end"} ${agrupado ? "" : "pt-1.5"}`}>
                              <div
                                className={`relative max-w-[85%] rounded-2xl px-3.5 py-2 text-sm shadow-sm sm:max-w-[70%] ${
                                  entrante
                                    ? "rounded-tl-md bg-white text-text-dark"
                                    : m.role === "human_agent"
                                      ? "rounded-tr-md bg-ink text-white"
                                      : "rounded-tr-md bg-accent/[0.1] text-text-dark ring-1 ring-accent/15"
                                }`}
                              >
                                {!entrante && !agrupado && (
                                  <p
                                    className={`mb-0.5 flex items-center gap-1 text-[0.65rem] font-bold uppercase tracking-wide ${
                                      m.role === "human_agent" ? "text-white/60" : "text-accent"
                                    }`}
                                  >
                                    {m.role === "human_agent" ? (
                                      <>
                                        <UserRound size={11} /> Equipo ROVEX
                                      </>
                                    ) : (
                                      <>
                                        <Bot size={11} /> Asesor IA
                                      </>
                                    )}
                                  </p>
                                )}
                                <p className="whitespace-pre-wrap break-words">
                                  {conFormato(m.content, m.role === "human_agent")}
                                </p>
                                <p
                                  className={`mt-0.5 text-right text-[0.65rem] ${
                                    m.role === "human_agent" ? "text-white/50" : "text-text-dark/40"
                                  }`}
                                >
                                  {horaMensaje(m.created_at)}
                                </p>
                              </div>
                            </div>
                          )}
                        </li>
                      );
                    })}
                    {mensajes.length === 0 && !cargandoChat && (
                      <li className="py-16 text-center text-sm text-text-dark/45">Sin mensajes todavía.</li>
                    )}
                  </ol>
                )}
                <div ref={finDelChat} />
              </div>

              {/* Caja de respuesta */}
              <footer className="border-t border-text-dark/10 bg-white px-3 py-2.5">
                {!esWhatsapp ? (
                  <p className="py-2 text-center text-xs text-text-dark/45">
                    Chat de prueba interna: no tiene un número de WhatsApp al cual responder.
                  </p>
                ) : fueraDeVentana ? (
                  <p className="rounded-xl bg-warn/[0.08] px-3 py-2.5 text-xs text-text-dark/70">
                    <span className="font-semibold text-warn">Pasaron más de 24 horas</span> desde el último mensaje del
                    cliente. WhatsApp no deja escribirle texto libre hasta que vuelva a escribir (o con una plantilla
                    aprobada por Meta).
                  </p>
                ) : (
                  <>
                    {errorEnvio && (
                      <p className="mb-2 flex items-start gap-2 rounded-xl bg-danger/[0.07] px-3 py-2 text-xs text-danger">
                        <span className="flex-1">{errorEnvio}</span>
                        <button onClick={() => setErrorEnvio(null)} aria-label="Cerrar">
                          <X size={13} />
                        </button>
                      </p>
                    )}
                    <div className="flex items-end gap-2">
                      <textarea
                        value={borrador}
                        onChange={(e) => setBorrador(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            enviar();
                          }
                        }}
                        rows={1}
                        placeholder="Escribe un mensaje"
                        className="max-h-40 min-h-[42px] flex-1 resize-none rounded-2xl bg-text-dark/[0.05] px-4 py-2.5 text-sm placeholder:text-text-dark/40 focus:bg-white focus:outline-none focus:ring-2 focus:ring-accent/30"
                        style={{ fieldSizing: "content" } as React.CSSProperties}
                      />
                      <button
                        onClick={enviar}
                        disabled={enviando || !borrador.trim()}
                        aria-label="Enviar"
                        className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-full bg-accent text-white transition-colors hover:bg-accent-hover disabled:opacity-40"
                      >
                        {enviando ? <Loader2 size={17} className="animate-spin" /> : <Send size={17} />}
                      </button>
                    </div>
                    <p className="mt-1.5 px-1 text-[0.65rem] text-text-dark/35">
                      {activo.bot_paused ? "" : "Al enviar, el bot se pausa en este chat · "}
                      Enter envía · Shift + Enter hace salto de línea
                    </p>
                  </>
                )}
              </footer>
            </div>

            {/* Ficha del cliente */}
            {verFicha && (
              <FichaCliente
                key={activo.customer_id}
                cliente={activo}
                ocupado={ocupado}
                onCerrar={() => setVerFicha(false)}
                onGuardado={recargarBandeja}
                onArchivar={() => archivar(activo.status !== "cerrada")}
                onEliminar={() => {
                  setVerFicha(false);
                  setConfirmarBorrado(true);
                }}
              />
            )}
          </div>
        )}
      </section>
    </div>
  );
}

// ───────────────────────────── ficha ─────────────────────────────

function FichaCliente({
  cliente,
  ocupado,
  onCerrar,
  onGuardado,
  onArchivar,
  onEliminar,
}: {
  cliente: InboxRow;
  ocupado: boolean;
  onCerrar: () => void;
  onGuardado: () => Promise<void>;
  onArchivar: () => void;
  onEliminar: () => void;
}) {
  const supabase = createClient();
  const [nombre, setNombre] = useState(cliente.name ?? "");
  const [ciudad, setCiudad] = useState(cliente.city ?? "");
  const [etapa, setEtapa] = useState(cliente.stage);
  const [notas, setNotas] = useState(cliente.notes ?? "");
  const [guardando, setGuardando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);

  const items = Array.isArray(cliente.draft_order?.items) ? cliente.draft_order.items : [];
  const total = items.reduce((n, it) => n + (it.price ?? 0) * (it.qty ?? 1), 0);
  const esWhatsapp = esContacto(cliente.phone);

  async function guardar() {
    setGuardando(true);
    setAviso(null);
    const { error } = await supabase
      .from("wa_customers")
      .update({
        name: nombre.trim() || null,
        city: ciudad.trim() || null,
        stage: etapa,
        notes: notas.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", cliente.customer_id);
    setGuardando(false);
    if (error) {
      setAviso(`No se pudo guardar: ${error.message}`);
      return;
    }
    setAviso("Guardado.");
    await onGuardado();
  }

  const campo =
    "mt-1 w-full rounded-xl border border-text-dark/15 px-3 py-2 text-sm focus:border-accent focus:outline-none";

  return (
    <aside className="absolute inset-0 z-10 flex flex-col overflow-y-auto border-l border-text-dark/10 bg-white xl:static xl:w-[320px] xl:shrink-0">
      <div className="flex items-center justify-between border-b border-text-dark/10 px-4 py-3">
        <p className="font-semibold">Ficha del cliente</p>
        <button onClick={onCerrar} className="rounded-full p-1.5 text-text-dark/50 hover:bg-text-dark/5" aria-label="Cerrar ficha">
          <X size={16} />
        </button>
      </div>

      <div className="space-y-5 p-4 text-sm">
        <div className="text-center">
          <span
            className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full text-xl font-bold ${colorAvatar(cliente.phone)}`}
          >
            {iniciales(nombreDe(cliente))}
          </span>
          <p className="mt-2 font-semibold">{nombreDe(cliente)}</p>
          <p className="text-xs text-text-dark/50">{formatearTelefono(cliente.phone)}</p>
          {/^\d{8,15}$/.test(cliente.phone) && (
            <a
              href={`https://wa.me/${cliente.phone}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-accent hover:underline"
            >
              Abrir en WhatsApp <ExternalLink size={11} />
            </a>
          )}
        </div>

        <div className="flex gap-2">
          <div className="flex-1 rounded-xl bg-text-dark/[0.04] p-3 text-center">
            <p className="text-[0.65rem] uppercase tracking-wide text-text-dark/45">Interés</p>
            <p className="text-lg font-bold">{cliente.score}</p>
          </div>
          <div className="flex-1 rounded-xl bg-text-dark/[0.04] p-3 text-center">
            <p className="text-[0.65rem] uppercase tracking-wide text-text-dark/45">Estado</p>
            <p className="font-semibold capitalize">{cliente.status === "cerrada" ? "Archivado" : cliente.status}</p>
          </div>
        </div>

        <label className="block">
          <span className="text-xs font-semibold text-text-dark/60">Nombre</span>
          <input value={nombre} onChange={(e) => setNombre(e.target.value)} className={campo} />
        </label>
        <label className="block">
          <span className="text-xs font-semibold text-text-dark/60">Ciudad</span>
          <input value={ciudad} onChange={(e) => setCiudad(e.target.value)} className={campo} />
        </label>
        <label className="block">
          <span className="text-xs font-semibold text-text-dark/60">Etapa de venta</span>
          <select value={etapa} onChange={(e) => setEtapa(e.target.value)} className={campo}>
            {Object.entries(ETAPAS).map(([id, label]) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-xs font-semibold text-text-dark/60">Notas</span>
          <textarea value={notas} onChange={(e) => setNotas(e.target.value)} rows={4} className={campo} />
        </label>

        <button
          onClick={guardar}
          disabled={guardando}
          className="inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-accent px-4 py-2.5 font-semibold text-white hover:bg-accent-hover disabled:opacity-50"
        >
          {guardando && <Loader2 size={14} className="animate-spin" />} Guardar cambios
        </button>
        {aviso && <p className="text-center text-xs text-text-dark/60">{aviso}</p>}

        <div>
          <p className="text-xs font-semibold text-text-dark/60">Pedido en preparación</p>
          {items.length === 0 ? (
            <p className="mt-1 text-xs text-text-dark/45">El asesor todavía no ha armado un pedido en este chat.</p>
          ) : (
            <ul className="mt-2 space-y-1.5 rounded-xl bg-text-dark/[0.04] p-3">
              {items.map((it, i) => (
                <li key={i} className="flex justify-between gap-2 text-xs">
                  <span className="min-w-0 truncate">
                    {it.qty ?? 1}× {it.name ?? it.slug} {it.size ? `· ${it.size}` : ""}
                  </span>
                  {typeof it.price === "number" && (
                    <span className="shrink-0 font-semibold">{formatoPesos(it.price * (it.qty ?? 1))}</span>
                  )}
                </li>
              ))}
              {total > 0 && (
                <li className="flex justify-between border-t border-text-dark/10 pt-1.5 text-xs font-bold">
                  <span>Total</span>
                  <span>{formatoPesos(total)}</span>
                </li>
              )}
            </ul>
          )}
        </div>

        <div className="space-y-2 border-t border-text-dark/10 pt-4">
          <button
            onClick={onArchivar}
            disabled={ocupado}
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-text-dark/70 hover:bg-text-dark/5 disabled:opacity-50"
          >
            {cliente.status === "cerrada" ? <ArchiveRestore size={16} /> : <Archive size={16} />}
            {cliente.status === "cerrada" ? "Desarchivar chat" : "Archivar chat"}
          </button>
          <button
            onClick={onEliminar}
            disabled={ocupado}
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-danger hover:bg-danger/[0.07] disabled:opacity-50"
          >
            <Trash2 size={16} /> Eliminar chat
          </button>
        </div>
      </div>
    </aside>
  );
}
