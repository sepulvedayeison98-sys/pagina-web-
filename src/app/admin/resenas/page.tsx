import AdminHeader from "@/components/admin/AdminHeader";
import ReviewsManager, {
  type ReviewRow,
} from "@/components/admin/ReviewsManager";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function ReviewsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("reviews")
    .select("id,author,city,rating,title,body,review_date")
    .order("review_date", { ascending: false });

  return (
    <>
      <AdminHeader />
      <div className="mx-auto max-w-4xl px-5 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-extrabold tracking-tight">Reseñas</h1>
          <p className="text-sm text-text-dark/55">
            Lo que publiques aquí aparece en la portada y en la ficha de cada
            producto.
          </p>
        </div>
        <ReviewsManager initial={(data ?? []) as ReviewRow[]} />
      </div>
    </>
  );
}
