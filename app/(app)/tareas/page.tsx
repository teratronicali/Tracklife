import { redirect } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase/server'
import TareasView from '@/components/tareas/TareasView'
import type { Perfil, Tarea, TareaSubtarea } from '@/lib/types'

export default async function TareasPage() {
  const supabase = createServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: tareas }, { data: subtareas }, { data: perfil }] = await Promise.all([
    supabase.from('tareas').select('*').eq('usuario_id', user.id).order('orden'),
    supabase.from('tareas_subtareas').select('*').eq('usuario_id', user.id).order('orden'),
    supabase.from('perfiles').select('*').eq('id', user.id).single<Perfil>(),
  ])

  return (
    <TareasView
      tareasIniciales={(tareas as Tarea[]) ?? []}
      subtareasIniciales={(subtareas as TareaSubtarea[]) ?? []}
      usuarioId={user.id}
      perfil={perfil as Perfil}
    />
  )
}
