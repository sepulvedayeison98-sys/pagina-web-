import AdminHeader from "@/components/admin/AdminHeader";
import ContentForm from "@/components/admin/ContentForm";
import { getSiteContent } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function ContentPage() {
  const content = await getSiteContent();

  return (
    <>
      <AdminHeader />
      <div className="mx-auto max-w-4xl px-5 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-extrabold tracking-tight">
            Textos de la tienda
          </h1>
          <p className="text-sm text-text-dark/55">
            Edita lo que se lee en la página principal. Los cambios se publican
            al guardar.
          </p>
        </div>
        <ContentForm initial={content} />
      </div>
    </>
  );
}
