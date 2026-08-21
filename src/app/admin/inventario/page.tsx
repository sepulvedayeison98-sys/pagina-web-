import AdminHeader from "@/components/admin/AdminHeader";
import InventoryManager, {
  type StockRow,
} from "@/components/admin/InventoryManager";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

interface ProductRow {
  id: string;
  name: string;
  slug: string;
  brand: string | null;
  model: string | null;
  visor: string | null;
  spoiler: string | null;
  sizes: string[] | null;
}

export default async function InventarioPage() {
  const supabase = await createClient();

  const [{ data: products }, { data: stock }] = await Promise.all([
    supabase
      .from("products")
      .select("id,name,slug,brand,model,visor,spoiler,sizes")
      .order("model", { ascending: true, nullsFirst: false })
      .order("sort_order", { ascending: true }),
    supabase.from("inventory").select("product_id,size,qty"),
  ]);

  // Se cruzan existencias con productos para que cada uno muestre solo las
  // tallas que tiene habilitadas, con 0 por defecto.
  const porProducto = new Map<string, Record<string, number>>();
  for (const s of stock ?? []) {
    const actual = porProducto.get(s.product_id) ?? {};
    actual[s.size as string] = s.qty as number;
    porProducto.set(s.product_id, actual);
  }

  const rows: StockRow[] = ((products ?? []) as ProductRow[]).map((p) => ({
    product_id: p.id,
    name: p.name,
    slug: p.slug,
    brand: p.brand,
    model: p.model,
    visor: p.visor,
    spoiler: p.spoiler,
    sizes: p.sizes ?? [],
    stock: porProducto.get(p.id) ?? {},
  }));

  return (
    <>
      <AdminHeader />
      <div className="mx-auto max-w-4xl px-5 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-extrabold tracking-tight">Inventario</h1>
          <p className="text-sm text-text-dark/55">
            Existencias por talla. Cada cambio queda registrado en el historial.
          </p>
        </div>
        <InventoryManager initial={rows} />
      </div>
    </>
  );
}
