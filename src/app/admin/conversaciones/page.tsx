import AdminHeader from "@/components/admin/AdminHeader";
import AgentTester from "@/components/admin/AgentTester";
import ChatPanel, { type InboxRow } from "@/components/admin/ChatPanel";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function ConversacionesPage() {
  const supabase = await createClient();
  // Un chat por cliente, del más reciente al más viejo (ver wa_admin_inbox).
  const { data } = await supabase.rpc("wa_admin_inbox");

  return (
    <>
      <AdminHeader />
      <div className="mx-auto max-w-7xl px-3 py-4 sm:px-5">
        <ChatPanel initial={(data ?? []) as InboxRow[]} />

        {/* La prueba sin WhatsApp queda a mano, pero plegada: el panel es
            para atender chats reales. */}
        <details className="mt-6 rounded-2xl border border-text-dark/10 bg-white p-4 [&[open]>summary]:mb-4">
          <summary className="cursor-pointer text-sm font-semibold text-text-dark/70">
            Probar el asesor sin WhatsApp
          </summary>
          <AgentTester />
        </details>
      </div>
    </>
  );
}
