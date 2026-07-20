import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import AdminHeader from "@/components/admin/AdminHeader";
import ProductForm, { type ProductRow } from "@/components/admin/ProductForm";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!data) return notFound();
  const product = data as ProductRow;

  return (
    <>
      <AdminHeader />
      <div className="mx-auto max-w-6xl px-5 py-8">
        <Link
          href="/admin"
          className="mb-5 inline-flex items-center gap-1 text-sm text-text-dark/55 hover:text-accent"
        >
          <ArrowLeft size={15} /> Volver
        </Link>
        <h1 className="mb-6 text-2xl font-extrabold tracking-tight">
          {product.name}
        </h1>
        <ProductForm initial={product} />
      </div>
    </>
  );
}
