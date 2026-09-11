import { redirect } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase/server'
import MetasView from '@/components/metas/MetasView'
import type { Meta, Perfil } from '@/lib/types'

export default async function MetasPage() {
  const supabase = createServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: metas }, { data: perfil }] = await Promise.all([
    supabase.from('metas').select('*').eq('usuario_id', user.id).order('created_at', { ascending: false }),
    supabase.from('perfiles').select('*').eq('id', user.id).single<Perfil>(),
  ])

  return <MetasView metasIniciales={(metas as Meta[]) ?? []} usuarioId={user.id} perfil={perfil as Perfil} />
}
