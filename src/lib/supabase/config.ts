/**
 * Configuración pública de Supabase.
 * La URL y la clave "publishable" son PÚBLICAS por diseño (se exponen en el
 * navegador): la seguridad la da Row Level Security + Auth, no el secreto de
 * la clave. Por eso pueden vivir en el código y no requieren variables de
 * entorno en Vercel.
 */
export const SUPABASE_URL = "https://lqqtlhypsophtabckyqa.supabase.co";
export const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_tYplHSTnVAwuwGs6j-fTDg_1Avdyamd";
