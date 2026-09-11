import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { obtenerAccessTokenValido, obtenerActividades, mapearTipoActividad } from '@/lib/strava'
import type { IntegracionStrava } from '@/lib/types'

export async function POST() {
  const supabase = createServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { data: integracion } = await supabase
    .from('integraciones_strava')
    .select('*')
    .eq('usuario_id', user.id)
    .single<IntegracionStrava>()

  if (!integracion) return NextResponse.json({ error: 'Strava no esta conectado' }, { status: 400 })

  try {
    const accessToken = await obtenerAccessTokenValido(integracion, async (nuevo) => {
      await supabase.from('integraciones_strava').update(nuevo).eq('usuario_id', user.id)
    })

    const despuesDeEpoch = integracion.ultima_sincronizacion
      ? Math.floor(new Date(integracion.ultima_sincronizacion).getTime() / 1000)
      : Math.floor(Date.now() / 1000) - 30 * 24 * 60 * 60

    const actividades = await obtenerActividades(accessToken, despuesDeEpoch)

    let importadas = 0
    for (const actividad of actividades) {
      const tipoActividad = mapearTipoActividad(actividad.type)
      const nombreEjercicio = `${actividad.type} (Strava)`

      let ejercicioId: string | null = null
      const { data: ejercicioExistente } = await supabase
        .from('ejercicios')
        .select('id')
        .eq('usuario_id', user.id)
        .eq('nombre', nombreEjercicio)
        .maybeSingle()

      if (ejercicioExistente) {
        ejercicioId = ejercicioExistente.id
      } else {
        const { data: nuevoEjercicio } = await supabase
          .from('ejercicios')
          .insert({ usuario_id: user.id, nombre: nombreEjercicio, grupo_muscular: 'general' })
          .select('id')
          .single()
        ejercicioId = nuevoEjercicio?.id ?? null
      }
      if (!ejercicioId) continue

      const { error: insertError } = await supabase.from('entrenamiento_registros').insert({
        usuario_id: user.id,
        ejercicio_id: ejercicioId,
        fecha: actividad.start_date.slice(0, 10),
        fuente: 'strava',
        strava_activity_id: actividad.id,
        distancia_km: actividad.distance ? Number((actividad.distance / 1000).toFixed(2)) : null,
        duracion_min: actividad.moving_time ? Math.round(actividad.moving_time / 60) : null,
        tipo_actividad: tipoActividad,
        peso: 0,
        reps: 0,
        series: 1,
      })

      if (!insertError) {
        importadas++
        await supabase.rpc('add_xp', { p_xp: 40, p_tipo: 'entrenamiento_strava', p_descripcion: actividad.name })
      }
    }

    await supabase
      .from('integraciones_strava')
      .update({ ultima_sincronizacion: new Date().toISOString() })
      .eq('usuario_id', user.id)

    return NextResponse.json({ importadas })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Error desconocido' }, { status: 500 })
  }
}
