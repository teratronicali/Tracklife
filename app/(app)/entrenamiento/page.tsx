import { redirect } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase/server'
import EntrenamientoView from '@/components/entrenamiento/EntrenamientoView'
import { lastNDates } from '@/lib/utils'
import type {
  Ejercicio,
  EntrenamientoRegistro,
  NutricionComida,
  NutricionMeta,
  Perfil,
  RutinaConEjercicios,
} from '@/lib/types'

export default async function EntrenamientoPage() {
  const supabase = createServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const desde14 = lastNDates(14)[0]
  const desde7 = lastNDates(7)[0]

  const [{ data: ejercicios }, { data: registros }, { data: comidas }, { data: metaNutricion }, { data: perfil }, { data: rutinas }] =
    await Promise.all([
      supabase.from('ejercicios').select('*').eq('usuario_id', user.id).order('nombre'),
      supabase
        .from('entrenamiento_registros')
        .select('*, ejercicio:ejercicios(*)')
        .eq('usuario_id', user.id)
        .gte('fecha', desde14)
        .order('fecha', { ascending: false }),
      supabase.from('nutricion_comidas').select('*').eq('usuario_id', user.id).gte('fecha', desde7).order('fecha', { ascending: false }),
      supabase.from('nutricion_metas').select('*').eq('usuario_id', user.id).maybeSingle<NutricionMeta>(),
      supabase.from('perfiles').select('*').eq('id', user.id).single<Perfil>(),
      supabase
        .from('rutinas')
        .select('*, ejercicios:rutina_ejercicios(*, ejercicio:ejercicios(*))')
        .eq('usuario_id', user.id)
        .order('created_at', { ascending: false }),
    ])

  const rutinasOrdenadas = ((rutinas as RutinaConEjercicios[]) ?? []).map((r) => ({
    ...r,
    ejercicios: [...r.ejercicios].sort((a, b) => a.orden - b.orden),
  }))

  return (
    <EntrenamientoView
      ejerciciosIniciales={(ejercicios as Ejercicio[]) ?? []}
      registrosIniciales={(registros as EntrenamientoRegistro[]) ?? []}
      comidasIniciales={(comidas as NutricionComida[]) ?? []}
      metaNutricionInicial={metaNutricion ?? null}
      rutinasIniciales={rutinasOrdenadas}
      usuarioId={user.id}
      perfil={perfil as Perfil}
    />
  )
}
