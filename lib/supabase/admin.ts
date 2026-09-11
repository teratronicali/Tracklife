import { createClient } from '@supabase/supabase-js'

// Cliente con la service_role key: ignora RLS por completo.
// Usar SOLO en codigo server-side de confianza (ej. el webhook de Stripe),
// nunca exponer esta key al navegador.
export function createAdminSupabase() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
