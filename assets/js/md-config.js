/* Configuración de Supabase para la galería y el panel (admin.html).
 *
 * - Mientras url / anonKey estén vacíos, la web usa los datos locales
 *   de assets/js/gallery-data.js (el sitio funciona igual que antes).
 * - Rellénalos con Supabase > Project Settings > API:
 *     url     -> "Project URL"        (https://xxxx.supabase.co)
 *     anonKey -> "anon public" o "publishable" key
 * - Esa clave es PÚBLICA: está pensada para ir en el navegador y la seguridad
 *   la ponen las políticas RLS de supabase/schema.sql.
 * - NUNCA pongas aquí la "service_role" / "secret" key.
 */
window.MD_SUPABASE = {
  url: '',
  anonKey: '',
  bucket: 'gallery'
};
