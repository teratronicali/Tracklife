import type { createClient } from '@/lib/supabase/client'
import type { PlanConDias, PlanDia, PlanDiaEstado, RutinaConEjercicios } from '@/lib/types'
import { DIAS_SEMANA } from '@/lib/plantillas-entrenamiento'

type SupabaseClient = ReturnType<typeof createClient>

export function fechaISO(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

// Lunes=0 .. Domingo=6 (Date.getDay() nativo es Domingo=0 .. Sabado=6)
export function diaSemanaISO(d: Date): number {
  return (d.getDay() + 6) % 7
}

export function sumarDias(d: Date, n: number): Date {
  const copia = new Date(d)
  copia.setDate(copia.getDate() + n)
  return copia
}

export function inicioSemana(d: Date): Date {
  return sumarDias(d, -diaSemanaISO(d))
}

export function fechasSemana(inicioLunes: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => sumarDias(inicioLunes, i))
}

export interface DiaCalendario {
  fecha: string
  diaSemana: number
  nombreDia: string
  esHoy: boolean
  esPasado: boolean
  rutina: RutinaConEjercicios | null
  estado: PlanDiaEstado | null
  esCompensacion: boolean
}

// Combina la plantilla semanal (plan_dias) con lo que realmente paso cada
// fecha (plan_dia_estados: cumplido/incumplido/compensado) para pintar el
// calendario de una semana concreta.
export function construirCalendarioSemana(
  plan: PlanConDias,
  estados: PlanDiaEstado[],
  rutinas: RutinaConEjercicios[],
  inicioLunes: Date,
  hoyISO: string
): DiaCalendario[] {
  const estadosPorFecha = new Map(estados.map((e) => [e.fecha, e]))
  return fechasSemana(inicioLunes).map((fecha) => {
    const fechaStr = fechaISO(fecha)
    const diaSemana = diaSemanaISO(fecha)
    const plantilla = plan.dias.find((d) => d.dia_semana === diaSemana)
    const estado = estadosPorFecha.get(fechaStr) ?? null

    let rutina: RutinaConEjercicios | null = null
    let esCompensacion = false
    if (estado?.estado === 'compensado' && estado.rutina_id) {
      rutina = rutinas.find((r) => r.id === estado.rutina_id) ?? null
      esCompensacion = true
    } else if (plantilla?.rutina) {
      rutina = plantilla.rutina
    }

    return {
      fecha: fechaStr,
      diaSemana,
      nombreDia: DIAS_SEMANA[diaSemana],
      esHoy: fechaStr === hoyISO,
      esPasado: fechaStr < hoyISO,
      rutina,
      estado,
      esCompensacion,
    }
  })
}

export async function fetchEstadosPlan(
  supabase: SupabaseClient,
  planId: string,
  desde: string,
  hasta: string
): Promise<PlanDiaEstado[]> {
  const { data } = await supabase
    .from('plan_dia_estados')
    .select('*')
    .eq('plan_id', planId)
    .gte('fecha', desde)
    .lte('fecha', hasta)
  return (data ?? []) as PlanDiaEstado[]
}

export interface DiaPorRevisar {
  fecha: string
  diaSemana: number
  rutina: RutinaConEjercicios
}

// Revisa los ultimos dias (hasta 6 hacia atras, sin pasar la creacion del
// plan) buscando entrenamientos programados que no se marcaron. Si ya existe
// una sesion finalizada ese dia para esa rutina, lo da por cumplido solo.
// Lo que no se puede resolver solo, lo devuelve para preguntarle al usuario.
export async function revisarDiasPendientes(
  supabase: SupabaseClient,
  usuarioId: string,
  plan: PlanConDias,
  rutinas: RutinaConEjercicios[]
): Promise<{ estadosNuevos: PlanDiaEstado[]; porRevisar: DiaPorRevisar[] }> {
  const hoy = new Date()
  const hoyISO = fechaISO(hoy)
  const creadoISO = plan.created_at.slice(0, 10)
  const desde = fechaISO(sumarDias(hoy, -6)) > creadoISO ? fechaISO(sumarDias(hoy, -6)) : creadoISO

  if (desde >= hoyISO) return { estadosNuevos: [], porRevisar: [] }

  const estadosExistentes = await fetchEstadosPlan(supabase, plan.id, desde, hoyISO)
  const estadosPorFecha = new Map(estadosExistentes.map((e) => [e.fecha, e]))

  const { data: sesiones } = await supabase
    .from('sesiones_entrenamiento')
    .select('fecha, rutina_id')
    .eq('usuario_id', usuarioId)
    .not('finalizada_en', 'is', null)
    .gte('fecha', desde)
    .lt('fecha', hoyISO)
  const sesionesPorClave = new Set((sesiones ?? []).map((s) => `${s.fecha}|${s.rutina_id}`))

  const estadosNuevos: PlanDiaEstado[] = []
  const porRevisar: DiaPorRevisar[] = []

  let cursor = new Date(desde)
  while (fechaISO(cursor) < hoyISO) {
    const fechaStr = fechaISO(cursor)
    const diaSemana = diaSemanaISO(cursor)
    cursor = sumarDias(cursor, 1)

    const yaResuelto = estadosPorFecha.get(fechaStr)
    if (yaResuelto && yaResuelto.estado !== 'pendiente') continue

    const plantilla: PlanDia | undefined = plan.dias.find((d) => d.dia_semana === diaSemana)
    if (!plantilla || plantilla.descanso || !plantilla.rutina_id) continue

    if (sesionesPorClave.has(`${fechaStr}|${plantilla.rutina_id}`)) {
      const { data } = await supabase
        .from('plan_dia_estados')
        .upsert(
          { usuario_id: usuarioId, plan_id: plan.id, fecha: fechaStr, rutina_id: plantilla.rutina_id, estado: 'cumplido' },
          { onConflict: 'plan_id,fecha' }
        )
        .select()
        .single()
      if (data) estadosNuevos.push(data as PlanDiaEstado)
      continue
    }

    const rutina = rutinas.find((r) => r.id === plantilla.rutina_id)
    if (rutina) porRevisar.push({ fecha: fechaStr, diaSemana, rutina })
  }

  return { estadosNuevos, porRevisar }
}

// El usuario confirma que si entreno ese dia pero se le olvido registrarlo.
export async function marcarCumplidoRetroactivo(
  supabase: SupabaseClient,
  usuarioId: string,
  planId: string,
  fecha: string,
  rutinaId: string
): Promise<PlanDiaEstado | null> {
  const { data } = await supabase
    .from('plan_dia_estados')
    .upsert({ usuario_id: usuarioId, plan_id: planId, fecha, rutina_id: rutinaId, estado: 'cumplido' }, { onConflict: 'plan_id,fecha' })
    .select()
    .single()
  return (data as PlanDiaEstado) ?? null
}

// El usuario no pudo entrenar ese dia: se marca incumplido y se busca el
// primer dia de descanso disponible desde ahi hasta el domingo de esa misma
// semana para moverle el entrenamiento (reajuste automatico de la semana).
export async function marcarIncumplidoYCompensar(
  supabase: SupabaseClient,
  usuarioId: string,
  plan: PlanConDias,
  fecha: string,
  rutinaId: string
): Promise<{ incumplido: PlanDiaEstado | null; compensadoEn: string | null }> {
  const { data: incumplido } = await supabase
    .from('plan_dia_estados')
    .upsert({ usuario_id: usuarioId, plan_id: plan.id, fecha, rutina_id: rutinaId, estado: 'incumplido' }, { onConflict: 'plan_id,fecha' })
    .select()
    .single()

  const fechaDate = new Date(`${fecha}T00:00:00`)
  const finDeSemana = sumarDias(inicioSemana(fechaDate), 6)
  const hoyISO = fechaISO(new Date())

  const desde = fechaISO(sumarDias(fechaDate, 1))
  const hasta = fechaISO(finDeSemana)
  const estadosSemana = await fetchEstadosPlan(supabase, plan.id, desde <= hasta ? desde : hasta, hasta)
  const estadosPorFecha = new Map(estadosSemana.map((e) => [e.fecha, e]))

  let candidato = sumarDias(fechaDate, 1)
  let compensadoEn: string | null = null
  while (fechaISO(candidato) <= fechaISO(finDeSemana)) {
    const candidatoISO = fechaISO(candidato)
    if (candidatoISO >= hoyISO) {
      const diaSemana = diaSemanaISO(candidato)
      const plantilla = plan.dias.find((d) => d.dia_semana === diaSemana)
      const libre = plantilla?.descanso && !estadosPorFecha.has(candidatoISO)
      if (libre) {
        await supabase
          .from('plan_dia_estados')
          .upsert(
            { usuario_id: usuarioId, plan_id: plan.id, fecha: candidatoISO, rutina_id: rutinaId, estado: 'compensado', origen_fecha: fecha },
            { onConflict: 'plan_id,fecha' }
          )
        compensadoEn = candidatoISO
        break
      }
    }
    candidato = sumarDias(candidato, 1)
  }

  return { incumplido: (incumplido as PlanDiaEstado) ?? null, compensadoEn }
}
