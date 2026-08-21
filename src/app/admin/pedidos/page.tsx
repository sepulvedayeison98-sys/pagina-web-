import AdminHeader from "@/components/admin/AdminHeader";
import OrdersManager, { type OrderRow } from "@/components/admin/OrdersManager";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function PedidosPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("orders")
    .select(
      "id,code,customer_name,customer_phone,customer_city,status,total,stock_applied,created_at,note,order_items(product_name,size,qty,unit_price)"
    )
    .order("created_at", { ascending: false })
    .limit(200);

  return (
    <>
      <AdminHeader />
      <div className="mx-auto max-w-4xl px-5 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-extrabold tracking-tight">Pedidos</h1>
          <p className="text-sm text-text-dark/55">
            Los pedidos llegan como “pendientes”. Al confirmarlos se descuenta
            el inventario.
          </p>
        </div>
        <OrdersManager initial={(data ?? []) as OrderRow[]} />
      </div>
    </>
  );
}
