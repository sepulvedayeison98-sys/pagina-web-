import Link from "next/link";
import Image from "next/image";
import { Plus, Pencil, ImageOff } from "lucide-react";
import AdminHeader from "@/components/admin/AdminHeader";
import { createClient } from "@/lib/supabase/server";
import { formatCOP } from "@/lib/format";

export const dynamic = "force-dynamic";

interface Row {
  id: string;
  name: string;
  slug: string;
  category: string;
  price: number;
  active: boolean;
  badge: string | null;
  image_url: string | null;
}

export default async function AdminDashboard() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select("id,name,slug,category,price,active,badge,image_url")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  const products = (data ?? []) as Row[];

  return (
    <>
      <AdminHeader />
      <div className="mx-auto max-w-6xl px-5 py-10">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">Productos</h1>
            <p className="text-sm text-text-dark/55">
              {products.length} en catálogo. Toca uno para editarlo.
            </p>
          </div>
          <Link
            href="/admin/products/new"
            className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-hover"
          >
            <Plus size={16} /> Nuevo producto
          </Link>
        </div>

        <ul className="divide-y divide-text-dark/10 overflow-hidden rounded-2xl border border-text-dark/10 bg-white">
          {products.map((p) => (
            <li key={p.id}>
              <Link
                href={`/admin/products/${p.id}`}
                className="flex items-center gap-4 px-4 py-3 transition-colors hover:bg-paper"
              >
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-studio">
                  {p.image_url ? (
                    <Image
                      src={p.image_url}
                      alt={p.name}
                      fill
                      sizes="56px"
                      className="object-cover"
                    />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-text-dark/30">
                      <ImageOff size={18} />
                    </span>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-semibold">{p.name}</span>
                    {!p.active && (
                      <span className="rounded-full bg-text-dark/10 px-2 py-0.5 text-[0.6rem] font-mono uppercase tracking-wider text-text-dark/50">
                        Oculto
                      </span>
                    )}
                    {p.badge && (
                      <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[0.6rem] font-mono uppercase tracking-wider text-accent">
                        {p.badge}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-text-dark/50">
                    {p.category} · {p.slug}
                  </span>
                </div>

                <span className="shrink-0 font-bold text-accent">
                  {formatCOP(p.price)}
                </span>
                <Pencil size={16} className="shrink-0 text-text-dark/35" />
              </Link>
            </li>
          ))}
          {products.length === 0 && (
            <li className="px-4 py-10 text-center text-sm text-text-dark/50">
              Aún no hay productos. Crea el primero con “Nuevo producto”.
            </li>
          )}
        </ul>
      </div>
    </>
  );
}
