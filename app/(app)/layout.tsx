import { redirect } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase/server'
import Sidebar from '@/components/Sidebar'
import type { Perfil } from '@/lib/types'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = createServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: perfil } = await supabase
    .from('perfiles')
    .select('*')
    .eq('id', user.id)
    .single<Perfil>()

  if (!perfil) redirect('/login')

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar perfil={perfil} />
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  )
}
