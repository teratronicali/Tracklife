import type { createServerSupabase } from '@/lib/supabase/server'
import { fechaISO } from '@/lib/plan-semana'
import { XP_TABLE } from '@/lib/gamification'

type SupabaseServer = ReturnType<typeof createServerSupabase>

export interface ResultadoHerramienta {
  ok: boolean
  resultado: Record<string, unknown>
  accion?: string
  xpGanado?: number
}

async function otorgarXPServidor(supabase: SupabaseServer, xp: number, tipo: string, descripcion?: string) {
  if (xp <= 0) return
  await supabase.rpc('add_xp', { p_xp: xp, p_tipo: tipo, p_descripcion: descripcion ?? null })
}

async function crearGasto(supabase: SupabaseServer, usuarioId: string, input: Record<string, unknown>): Promise<ResultadoHerramienta> {
  const monto = Number(input.monto)
  const categoria = String(input.categoria ?? 'otros')
  const descripcion = input.descripcion ? String(input.descripcion) : null
  const fecha = input.fecha ? String(input.fecha) : fechaISO(new Date())
  const { data, error } = await supabase
    .from('finanzas_transacciones')
    .insert({ usuario_id: usuarioId, tipo: 'gasto', categoria, descripcion, monto, fecha })
    .select()
    .single()
  if (error || !data) return { ok: false, resultado: { error: error?.message ?? 'no se pudo crear' } }
  await otorgarXPServidor(supabase, XP_TABLE.finanzas, 'finanzas', descripcion ?? categoria)
  return { ok: true, resultado: { id: data.id, monto, categoria, fecha }, accion: `Gasto registrado: ${categoria} · ${fecha}`, xpGanado: XP_TABLE.finanzas }
}

async function crearIngreso(supabase: SupabaseServer, usuarioId: string, input: Record<string, unknown>): Promise<ResultadoHerramienta> {
  const monto = Number(input.monto)
  const categoria = String(input.categoria ?? 'otros')
  const descripcion = input.descripcion ? String(input.descripcion) : null
  const fecha = input.fecha ? String(input.fecha) : fechaISO(new Date())
  const { data, error } = await supabase
    .from('finanzas_transacciones')
    .insert({ usuario_id: usuarioId, tipo: 'ingreso', categoria, descripcion, monto, fecha })
    .select()
    .single()
  if (error || !data) return { ok: false, resultado: { error: error?.message ?? 'no se pudo crear' } }
  await otorgarXPServidor(supabase, XP_TABLE.finanzas, 'finanzas', descripcion ?? categoria)
  return { ok: true, resultado: { id: data.id, monto, categoria, fecha }, accion: `Ingreso registrado: ${categoria} · ${fecha}`, xpGanado: XP_TABLE.finanzas }
}

async function registrarEntrenamiento(supabase: SupabaseServer, usuarioId: string, input: Record<string, unknown>): Promise<ResultadoHerramienta> {
  const nombre = String(input.ejercicio ?? '').trim()
  if (!nombre) return { ok: false, resultado: { error: 'falta el nombre del ejercicio' } }

  const esCardio = input.distancia_km != null || input.duracion_min != null

  const { data: existente } = await supabase.from('ejercicios').select('id').eq('usuario_id', usuarioId).eq('nombre', nombre).maybeSingle()
  let ejercicioId = existente?.id as string | undefined
  if (!ejercicioId) {
    const { data: creado, error } = await supabase
      .from('ejercicios')
      .insert({ usuario_id: usuarioId, nombre, grupo_muscular: esCardio ? 'cardio' : 'general' })
      .select()
      .single()
    if (error || !creado) return { ok: false, resultado: { error: error?.message ?? 'no se pudo crear el ejercicio' } }
    ejercicioId = creado.id
  }

  const fila: Record<string, unknown> = {
    usuario_id: usuarioId,
    ejercicio_id: ejercicioId,
    peso: input.peso != null ? Number(input.peso) : 0,
    reps: input.reps != null ? Number(input.reps) : 0,
    series: input.series != null ? Number(input.series) : 1,
  }
  if (esCardio) {
    fila.distancia_km = input.distancia_km != null ? Number(input.distancia_km) : null
    fila.duracion_min = input.duracion_min != null ? Number(input.duracion_min) : null
    fila.tipo_actividad = 'general'
  }

  const { data, error: errorReg } = await supabase.from('entrenamiento_registros').insert(fila).select().single()
  if (errorReg || !data) return { ok: false, resultado: { error: errorReg?.message ?? 'no se pudo registrar' } }
  await otorgarXPServidor(supabase, XP_TABLE.entrenamiento, 'entrenamiento', nombre)
  return { ok: true, resultado: { id: data.id, ejercicio: nombre }, accion: `Entrenamiento registrado: ${nombre}`, xpGanado: XP_TABLE.entrenamiento }
}

async function crearTarea(supabase: SupabaseServer, usuarioId: string, input: Record<string, unknown>): Promise<ResultadoHerramienta> {
  const titulo = String(input.titulo ?? '').trim()
  if (!titulo) return { ok: false, resultado: { error: 'falta el titulo' } }
  const { data, error } = await supabase
    .from('tareas')
    .insert({
      usuario_id: usuarioId,
      titulo,
      descripcion: input.descripcion ? String(input.descripcion) : null,
      etiqueta: input.etiqueta ? String(input.etiqueta) : null,
      xp_valor: 30,
    })
    .select()
    .single()
  if (error || !data) return { ok: false, resultado: { error: error?.message ?? 'no se pudo crear' } }
  return { ok: true, resultado: { id: data.id, titulo }, accion: `Tarea creada: ${titulo}` }
}

async function crearMeta(supabase: SupabaseServer, usuarioId: string, input: Record<string, unknown>): Promise<ResultadoHerramienta> {
  const titulo = String(input.titulo ?? '').trim()
  if (!titulo) return { ok: false, resultado: { error: 'falta el titulo' } }
  const { data, error } = await supabase
    .from('metas')
    .insert({
      usuario_id: usuarioId,
      titulo,
      tipo: String(input.tipo ?? 'personal'),
      monto_objetivo: Number(input.monto_objetivo) || 0,
      dias_objetivo: input.dias_objetivo != null ? Number(input.dias_objetivo) : null,
    })
    .select()
    .single()
  if (error || !data) return { ok: false, resultado: { error: error?.message ?? 'no se pudo crear' } }
  return { ok: true, resultado: { id: data.id, titulo }, accion: `Meta creada: ${titulo}` }
}

async function crearHabito(supabase: SupabaseServer, usuarioId: string, input: Record<string, unknown>): Promise<ResultadoHerramienta> {
  const nombre = String(input.nombre ?? '').trim()
  if (!nombre) return { ok: false, resultado: { error: 'falta el nombre' } }
  const { data, error } = await supabase
    .from('habitos')
    .insert({
      usuario_id: usuarioId,
      nombre,
      emoji: input.emoji ? String(input.emoji) : '✅',
      momento: input.momento ? String(input.momento) : 'manana',
      xp_valor: 30,
    })
    .select()
    .single()
  if (error || !data) return { ok: false, resultado: { error: error?.message ?? 'no se pudo crear' } }
  return { ok: true, resultado: { id: data.id, nombre }, accion: `Habito creado: ${nombre}` }
}

async function consultarProgreso(supabase: SupabaseServer, usuarioId: string): Promise<ResultadoHerramienta> {
  const hoy = fechaISO(new Date())
  const inicioMes = `${hoy.slice(0, 7)}-01`

  const [{ data: perfil }, { data: tareasPendientes }, { data: gastosMes }, { data: habitosHoy }] = await Promise.all([
    supabase.from('perfiles').select('xp_total, nivel, racha_actual, mejor_racha').eq('id', usuarioId).single(),
    supabase.from('tareas').select('id').eq('usuario_id', usuarioId).neq('estado', 'hecho'),
    supabase.from('finanzas_transacciones').select('monto, tipo').eq('usuario_id', usuarioId).gte('fecha', inicioMes),
    supabase.from('habito_registros').select('habito_id').eq('usuario_id', usuarioId).eq('fecha', hoy),
  ])

  const gastosDelMes = (gastosMes ?? []).filter((t) => t.tipo === 'gasto').reduce((s, t) => s + Number(t.monto), 0)
  const ingresosDelMes = (gastosMes ?? []).filter((t) => t.tipo === 'ingreso').reduce((s, t) => s + Number(t.monto), 0)

  return {
    ok: true,
    resultado: {
      xp_total: perfil?.xp_total ?? 0,
      nivel: perfil?.nivel ?? 1,
      racha_actual: perfil?.racha_actual ?? 0,
      mejor_racha: perfil?.mejor_racha ?? 0,
      tareas_pendientes: (tareasPendientes ?? []).length,
      habitos_completados_hoy: (habitosHoy ?? []).length,
      gastos_del_mes: gastosDelMes,
      ingresos_del_mes: ingresosDelMes,
    },
  }
}

export async function ejecutarHerramienta(
  supabase: SupabaseServer,
  usuarioId: string,
  nombre: string,
  input: Record<string, unknown>
): Promise<ResultadoHerramienta> {
  switch (nombre) {
    case 'crear_gasto':
      return crearGasto(supabase, usuarioId, input)
    case 'crear_ingreso':
      return crearIngreso(supabase, usuarioId, input)
    case 'registrar_entrenamiento':
      return registrarEntrenamiento(supabase, usuarioId, input)
    case 'crear_tarea':
      return crearTarea(supabase, usuarioId, input)
    case 'crear_meta':
      return crearMeta(supabase, usuarioId, input)
    case 'crear_habito':
      return crearHabito(supabase, usuarioId, input)
    case 'consultar_progreso':
      return consultarProgreso(supabase, usuarioId)
    default:
      return { ok: false, resultado: { error: `Herramienta desconocida: ${nombre}` } }
  }
}
