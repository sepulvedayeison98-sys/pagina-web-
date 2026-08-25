import AdminHeader from "@/components/admin/AdminHeader";
import PasswordForm from "@/components/admin/PasswordForm";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function CuentaPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <>
      <AdminHeader />
      <div className="mx-auto max-w-4xl px-5 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-extrabold tracking-tight">Mi cuenta</h1>
          <p className="text-sm text-text-dark/55">
            Sesión iniciada como{" "}
            <span className="font-medium text-text-dark">{user?.email}</span>
          </p>
        </div>

        {user?.email ? (
          <PasswordForm email={user.email} />
        ) : (
          <p className="text-sm text-text-dark/55">
            No se pudo leer tu sesión. Vuelve a entrar al panel e inténtalo de nuevo.
          </p>
        )}
      </div>
    </>
  );
}
