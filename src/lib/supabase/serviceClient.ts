import { createClient as createServiceRoleClient } from "@supabase/supabase-js";
import { SUPABASE_URL } from "./config";
import { createClient as createCookieClient } from "./server";

/**
 * Cliente con la service role key: ignora RLS y los permisos de `anon` /
 * `authenticated`. Úsalo SOLO en código de servidor ya autenticado por otra
 * vía (firma HMAC del webhook, sesión de admin verificada) — nunca en
 * componentes de cliente ni en código que reciba input sin validar antes.
 *
 * Las funciones wa_* son SECURITY DEFINER: cualquiera con la clave
 * publishable podía llamarlas directo por PostgREST y saltarse tanto la
 * firma del webhook como el guard de sesión del panel. Este cliente es la
 * vía pensada para cerrar ese acceso público una vez esté desplegado.
 *
 * Mientras SUPABASE_SERVICE_ROLE_KEY no esté configurada en el entorno,
 * cae de vuelta al cliente publishable (el mismo que se usaba antes) para
 * no romper el webhook en producción durante el despliegue — en ese estado
 * las RPC wa_* siguen siendo públicas hasta correr la migración que revoca
 * ese acceso.
 */
export async function createServiceClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    console.warn(
      "SUPABASE_SERVICE_ROLE_KEY no configurada: usando el cliente publishable como respaldo."
    );
    return createCookieClient();
  }

  return createServiceRoleClient(SUPABASE_URL, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
