import { AlertTriangle, CheckCircle2, RefreshCw, XCircle } from "lucide-react";
import AdminHeader from "@/components/admin/AdminHeader";
import { createClient } from "@/lib/supabase/server";
import { diagnosticarWhatsApp, type Estado } from "@/lib/whatsapp/diagnostico";

// El diagnóstico consulta a Meta en vivo: cachearlo lo volvería inútil.
export const dynamic = "force-dynamic";

const ESTILO: Record<Estado, { Icon: typeof CheckCircle2; color: string; borde: string }> = {
  ok: { Icon: CheckCircle2, color: "text-emerald-600", borde: "border-emerald-600/25" },
  aviso: { Icon: AlertTriangle, color: "text-warn", borde: "border-warn/30" },
  error: { Icon: XCircle, color: "text-danger", borde: "border-danger/30" },
};

export default async function WhatsAppDiagnosticoPage() {
  // El middleware ya bloquea /admin sin sesión; esta comprobación explícita
  // es defensa en profundidad, igual que en las acciones del panel.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return (
      <>
        <AdminHeader />
        <p className="mx-auto max-w-6xl px-5 py-10 text-sm">No autenticado.</p>
      </>
    );
  }

  const { checks, callbackUrl } = await diagnosticarWhatsApp();
  const fallas = checks.filter((c) => c.estado === "error").length;

  return (
    <>
      <AdminHeader />
      <div className="mx-auto max-w-4xl px-5 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-extrabold tracking-tight">
            Conexión con WhatsApp
          </h1>
          <p className="mt-1 text-sm text-text-dark/55">
            Cada punto se verifica en vivo contra la API de Meta. Ningún secreto
            se muestra aquí: solo si Meta lo acepta.
          </p>
        </div>

        {/* Resumen */}
        <div
          className={`mb-8 rounded-2xl border p-5 ${
            fallas === 0
              ? "border-emerald-600/25 bg-emerald-600/[0.06]"
              : "border-danger/30 bg-danger/[0.06]"
          }`}
        >
          <p className="font-bold">
            {fallas === 0
              ? "Todo en orden: el asesor puede recibir y responder mensajes."
              : `${fallas} ${fallas === 1 ? "problema" : "problemas"} que impiden la conexión.`}
          </p>
          <p className="mt-1 text-sm text-text-dark/65">
            Arregla primero los puntos en rojo, en el orden en que aparecen.
          </p>
        </div>

        <ul className="space-y-3">
          {checks.map((check) => {
            const { Icon, color, borde } = ESTILO[check.estado];
            return (
              <li
                key={check.titulo}
                className={`rounded-2xl border bg-white p-5 ${borde}`}
              >
                <div className="flex items-start gap-3">
                  <Icon size={19} className={`mt-0.5 shrink-0 ${color}`} aria-hidden />
                  <div className="min-w-0">
                    <p className="font-bold">{check.titulo}</p>
                    <p className="mt-1 text-sm text-text-dark/70">{check.detalle}</p>
                    {check.arreglo && (
                      <p className="mt-3 rounded-xl bg-text-dark/[0.04] p-3 text-sm text-text-dark/80">
                        <span className="font-semibold">Cómo se arregla: </span>
                        {check.arreglo}
                      </p>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        {/* Datos que hay que pegar en Meta */}
        <div className="mt-8 rounded-2xl border border-text-dark/10 bg-white p-5">
          <h2 className="font-bold">Qué configurar en Meta</h2>
          <p className="mt-1 text-sm text-text-dark/60">
            Meta for Developers → tu app → WhatsApp → Configuration → Edit.
          </p>
          <dl className="mt-4 space-y-3 text-sm">
            <div>
              <dt className="font-semibold">Callback URL</dt>
              <dd className="mt-1 break-all rounded-lg bg-text-dark/[0.04] px-3 py-2 font-mono text-xs">
                {callbackUrl}
              </dd>
            </div>
            <div>
              <dt className="font-semibold">Verify token</dt>
              <dd className="mt-1 text-text-dark/70">
                El mismo valor exacto que está en{" "}
                <code className="font-mono text-xs">WHATSAPP_VERIFY_TOKEN</code> en
                Vercel. Sin espacios de más al copiarlo.
              </dd>
            </div>
            <div>
              <dt className="font-semibold">Campo suscrito</dt>
              <dd className="mt-1 text-text-dark/70">
                <code className="font-mono text-xs">messages</code> — sin esta
                casilla marcada, Meta nunca llama al webhook.
              </dd>
            </div>
          </dl>
        </div>

        <a
          href="/admin/whatsapp"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-accent-hover"
        >
          <RefreshCw size={15} /> Revisar de nuevo
        </a>
      </div>
    </>
  );
}
