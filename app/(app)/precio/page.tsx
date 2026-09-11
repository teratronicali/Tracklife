import { redirect } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase/server'
import PrecioView from '@/components/precio/PrecioView'
import type { Perfil } from '@/lib/types'

export default async function PrecioPage() {
  const supabase = createServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: perfil } = await supabase.from('perfiles').select('*').eq('id', user.id).single<Perfil>()

  return <PrecioView perfil={perfil as Perfil} />
}
