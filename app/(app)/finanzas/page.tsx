import { redirect } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase/server'
import FinanzasView from '@/components/finanzas/FinanzasView'
import { lastNDates } from '@/lib/utils'
import type { FinanzaTransaccion } from '@/lib/types'

export default async function FinanzasPage() {
  const supabase = createServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const desde = lastNDates(60)[0]

  const { data: transacciones } = await supabase
    .from('finanzas_transacciones')
    .select('*')
    .eq('usuario_id', user.id)
    .gte('fecha', desde)
    .order('fecha', { ascending: false })

  return <FinanzasView transaccionesIniciales={(transacciones as FinanzaTransaccion[]) ?? []} usuarioId={user.id} />
}
