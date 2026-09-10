import { redirect } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase/server'
import MetasView from '@/components/metas/MetasView'
import type { Meta } from '@/lib/types'

export default async function MetasPage() {
  const supabase = createServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: metas } = await supabase
    .from('metas')
    .select('*')
    .eq('usuario_id', user.id)
    .order('created_at', { ascending: false })

  return <MetasView metasIniciales={(metas as Meta[]) ?? []} usuarioId={user.id} />
}
