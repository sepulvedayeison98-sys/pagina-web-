import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from "./config";

let client: SupabaseClient | undefined;

/**
 * Cliente de Supabase para el navegador (Client Components del panel).
 * Singleton para evitar múltiples instancias compitiendo por el lock de auth.
 * `lock` de paso: evita cuelgues de `navigator.locks` en algunos entornos.
 */
export function createClient() {
  if (client) return client;
  client = createBrowserClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: {
      lock: async (_name, _acquireTimeout, fn) => fn(),
    },
  });
  return client;
}
