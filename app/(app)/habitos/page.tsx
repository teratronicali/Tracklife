import { redirect } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase/server'
import HabitosView from '@/components/habitos/HabitosView'
import { lastNDates } from '@/lib/utils'
import type { Habito, Perfil } from '@/lib/types'

export default async function HabitosPage() {
  const supabase = createServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const desde = lastNDates(84)[0]

  const [{ data: habitos }, { data: registros }, { data: perfil }] = await Promise.all([
    supabase.from('habitos').select('*').eq('usuario_id', user.id).order('created_at'),
    supabase
      .from('habito_registros')
      .select('habito_id, fecha')
      .eq('usuario_id', user.id)
      .gte('fecha', desde),
    supabase.from('perfiles').select('*').eq('id', user.id).single<Perfil>(),
  ])

  return (
    <HabitosView
      habitosIniciales={(habitos as Habito[]) ?? []}
      registrosIniciales={registros ?? []}
      perfil={perfil as Perfil}
      usuarioId={user.id}
    />
  )
}
