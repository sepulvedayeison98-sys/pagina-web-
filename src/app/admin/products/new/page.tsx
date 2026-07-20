import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import AdminHeader from "@/components/admin/AdminHeader";
import ProductForm from "@/components/admin/ProductForm";

export default function NewProductPage() {
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
          Nuevo producto
        </h1>
        <ProductForm />
      </div>
    </>
  );
}
