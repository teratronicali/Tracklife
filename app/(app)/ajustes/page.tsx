import { redirect } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase/server'
import AjustesView from '@/components/ajustes/AjustesView'
import type { IntegracionStrava, Perfil } from '@/lib/types'

export default async function AjustesPage() {
  const supabase = createServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: perfil }, { data: integracion }] = await Promise.all([
    supabase.from('perfiles').select('*').eq('id', user.id).single<Perfil>(),
    supabase.from('integraciones_strava').select('*').eq('usuario_id', user.id).maybeSingle<IntegracionStrava>(),
  ])

  return <AjustesView perfil={perfil as Perfil} integracionStrava={integracion ?? null} />
}
