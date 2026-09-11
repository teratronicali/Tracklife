import { redirect } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase/server'
import FinanzasView from '@/components/finanzas/FinanzasView'
import { lastNDates } from '@/lib/utils'
import type { FinanzaTransaccion, Perfil } from '@/lib/types'

export default async function FinanzasPage() {
  const supabase = createServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const desde = lastNDates(60)[0]

  const [{ data: transacciones }, { data: perfil }] = await Promise.all([
    supabase
      .from('finanzas_transacciones')
      .select('*')
      .eq('usuario_id', user.id)
      .gte('fecha', desde)
      .order('fecha', { ascending: false }),
    supabase.from('perfiles').select('*').eq('id', user.id).single<Perfil>(),
  ])

  return (
    <FinanzasView
      transaccionesIniciales={(transacciones as FinanzaTransaccion[]) ?? []}
      usuarioId={user.id}
      perfil={perfil as Perfil}
    />
  )
}
