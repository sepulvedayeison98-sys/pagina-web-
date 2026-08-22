import AdminHeader from "@/components/admin/AdminHeader";
import AgentTester from "@/components/admin/AgentTester";
import ConversationsManager, {
  type ConversationRow,
} from "@/components/admin/ConversationsManager";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function ConversacionesPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("wa_conversations")
    .select(
      "id,status,last_message_at,draft_order,customer:wa_customers(id,name,phone,city,stage,score)"
    )
    .order("last_message_at", { ascending: false })
    .limit(150);

  // El embed de Supabase puede llegar como objeto o como arreglo de un solo
  // elemento según cómo infiera la relación; se normaliza a objeto único.
  const conversaciones: ConversationRow[] = (data ?? []).map((r: any) => ({
    id: r.id,
    status: r.status,
    last_message_at: r.last_message_at,
    draft_order: r.draft_order,
    customer: Array.isArray(r.customer) ? (r.customer[0] ?? null) : (r.customer ?? null),
  }));

  return (
    <>
      <AdminHeader />
      <div className="mx-auto max-w-6xl px-5 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-extrabold tracking-tight">
            Conversaciones de WhatsApp
          </h1>
          <p className="text-sm text-text-dark/55">
            Lo que responde el asesor virtual, en vivo. Puedes tomar cualquier
            hilo escalado y seguir la conversación tú mismo desde WhatsApp.
          </p>
        </div>
        <AgentTester />
        <ConversationsManager initial={conversaciones} />
      </div>
    </>
  );
}
