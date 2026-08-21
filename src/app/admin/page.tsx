import Link from "next/link";
import { Plus } from "lucide-react";
import AdminHeader from "@/components/admin/AdminHeader";
import ProductList, {
  type ProductListRow,
} from "@/components/admin/ProductList";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select("id,name,slug,brand,category,price,active,badge,image_url")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  const products = (data ?? []) as ProductListRow[];

  const sinFoto = products.filter((p) => !p.image_url).length;

  return (
    <>
      <AdminHeader />
      <div className="mx-auto max-w-6xl px-5 py-10">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">Productos</h1>
            <p className="text-sm text-text-dark/55">
              {products.length} en catálogo
              {sinFoto > 0 && (
                <>
                  {" · "}
                  <span className="text-warn">
                    {sinFoto} sin foto
                  </span>
                </>
              )}
              . Toca uno para editarlo.
            </p>
          </div>
          <Link
            href="/admin/products/new"
            className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-hover"
          >
            <Plus size={16} /> Nuevo producto
          </Link>
        </div>

        <ProductList initial={products} />
      </div>
    </>
  );
}
