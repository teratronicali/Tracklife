import type { createClient } from '@/lib/supabase/client'
import type { GrupoMuscular, NivelEntrenamiento, PlanConDias, RutinaConEjercicios, RutinaEjercicio } from '@/lib/types'
import { fechaISO, inicioSemana } from '@/lib/plan-semana'

type SupabaseClient = ReturnType<typeof createClient>

export type NivelRunning = 'nunca_corrido' | 'principiante' | 'intermedio' | 'avanzado'
export type ObjetivoRunning = '5k' | '10k' | '21k' | 'maraton' | 'general'

export const NIVELES_RUNNING: { id: NivelRunning; label: string }[] = [
  { id: 'nunca_corrido', label: 'Nunca he corrido' },
  { id: 'principiante', label: 'Principiante' },
  { id: 'intermedio', label: 'Intermedio' },
  { id: 'avanzado', label: 'Avanzado' },
]

export const OBJETIVOS_RUNNING: { id: ObjetivoRunning; label: string }[] = [
  { id: '5k', label: '5K' },
  { id: '10k', label: '10K' },
  { id: '21k', label: 'Media maraton (21K)' },
  { id: 'maraton', label: 'Maraton (42K)' },
  { id: 'general', label: 'Mejorar resistencia (sin carrera especifica)' },
]

// Duracion recomendada (semanas) segun evidencia de planes de coaching
// habituales (Hal Higdon, guias de maraton/media maraton, etc): principiantes
// absolutos necesitan bastante mas tiempo de adaptacion que quien ya corre.
const DURACION_DEFAULT: Record<Exclude<ObjetivoRunning, 'general'>, Record<NivelRunning, number>> = {
  '5k': { nunca_corrido: 9, principiante: 8, intermedio: 6, avanzado: 6 },
  '10k': { nunca_corrido: 12, principiante: 10, intermedio: 8, avanzado: 6 },
  '21k': { nunca_corrido: 16, principiante: 14, intermedio: 12, avanzado: 10 },
  maraton: { nunca_corrido: 20, principiante: 18, intermedio: 16, avanzado: 14 },
}
const SEMANAS_MIN: Record<Exclude<ObjetivoRunning, 'general'>, number> = { '5k': 4, '10k': 5, '21k': 8, maraton: 10 }
const SEMANAS_MAX = 24

const FONDO_PICO_KM: Record<Exclude<ObjetivoRunning, 'general'>, number> = { '5k': 8, '10k': 13, '21k': 18, maraton: 32 }
const FONDO_INICIAL_KM: Record<Exclude<ObjetivoRunning, 'general'>, number> = { '5k': 3, '10k': 5, '21k': 8, maraton: 14 }
const DISTANCIA_OBJETIVO_KM: Record<Exclude<ObjetivoRunning, 'general'>, number> = { '5k': 5, '10k': 10, '21k': 21.0975, maraton: 42.195 }

export interface TestInicialRunning {
  distanciaKm: number
  tiempoSeg: number
}

export interface RitmosCarrera {
  ritmo5kSegKm: number
  facilSegKm: number
  umbralSegKm: number
  intervaloSegKm: number
  repeticionSegKm: number
}

// A partir de un test de ritmo (una carrera reciente o un time trial: "corri
// X km en Y minutos"), predice el ritmo actual de 5K con la formula de Riegel
// (T2 = T1 * (D2/D1)^1.06, el estandar para predecir tiempos entre distancias
// a partir de un resultado real) y de ahi deriva las zonas de entrenamiento
// como porcentajes del ritmo de 5K — la misma logica que usan calculadoras
// tipo Jack Daniels/McMillan: facil ~25-30% mas lento, umbral/tempo ~7% mas
// lento, intervalos (series cortas fuertes) cerca del ritmo de 5K,
// repeticiones (series muy cortas, ej. 400m) mas rapido que el ritmo de 5K.
export function calcularRitmos(distanciaKm: number, tiempoSeg: number): RitmosCarrera {
  const tiempo5kSeg = tiempoSeg * Math.pow(5 / distanciaKm, 1.06)
  const ritmo5kSegKm = tiempo5kSeg / 5
  return {
    ritmo5kSegKm,
    facilSegKm: ritmo5kSegKm * 1.28,
    umbralSegKm: ritmo5kSegKm * 1.07,
    intervaloSegKm: ritmo5kSegKm * 0.98,
    repeticionSegKm: ritmo5kSegKm * 0.9,
  }
}

// Ritmo objetivo de carrera para una distancia especifica, prediciendo desde
// el ritmo de 5K con la misma formula de Riegel (en vez de un porcentaje fijo,
// para que la caida de ritmo entre 5K y maraton sea realista).
export function ritmoObjetivoSegKm(ritmos: RitmosCarrera, objetivo: Exclude<ObjetivoRunning, 'general'>): number {
  const distancia = DISTANCIA_OBJETIVO_KM[objetivo]
  const tiempo5kSeg = ritmos.ritmo5kSegKm * 5
  const tiempoObjetivoSeg = tiempo5kSeg * Math.pow(distancia / 5, 1.06)
  return tiempoObjetivoSeg / distancia
}

export function formatoRitmo(segPorKm: number): string {
  const total = Math.round(segPorKm)
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}:${String(s).padStart(2, '0')} min/km`
}

export function semanasHastaFecha(fechaObjetivo: string): number {
  const hoy = inicioSemana(new Date())
  const objetivo = inicioSemana(new Date(`${fechaObjetivo}T00:00:00`))
  return Math.round((objetivo.getTime() - hoy.getTime()) / (7 * 24 * 60 * 60 * 1000))
}

export function calcularDuracionPlan(nivel: NivelRunning, objetivo: ObjetivoRunning, fechaObjetivo: string | null): number {
  if (objetivo === 'general') return DURACION_DEFAULT['10k'].intermedio // no se usa como duracion real (plan continuo)
  if (fechaObjetivo) {
    const semanas = semanasHastaFecha(fechaObjetivo)
    return Math.min(Math.max(semanas, 3), SEMANAS_MAX)
  }
  return Math.min(DURACION_DEFAULT[objetivo][nivel], SEMANAS_MAX)
}

interface Fases {
  base: number
  build: number
  peak: number
  taper: number
}

// Periodizacion clasica base -> build -> peak -> taper. El taper (reducir
// volumen manteniendo algo de intensidad para llegar fresco) es mas largo en
// maraton por el desgaste acumulado de fondos muy largos.
function calcularFases(totalSemanas: number, objetivo: ObjetivoRunning): Fases {
  const taper = objetivo === 'maraton' ? Math.min(3, Math.max(2, Math.round(totalSemanas * 0.12))) : Math.max(1, Math.round(totalSemanas * 0.1))
  const restante = Math.max(1, totalSemanas - taper)
  const peak = Math.max(1, Math.round(restante * 0.2))
  const build = Math.max(1, Math.round(restante * 0.35))
  const base = Math.max(1, restante - peak - build)
  return { base, build, peak, taper }
}

type FaseNombre = 'base' | 'build' | 'peak' | 'taper'

function faseDeSemana(semana: number, fases: Fases): FaseNombre {
  if (semana <= fases.base) return 'base'
  if (semana <= fases.base + fases.build) return 'build'
  if (semana <= fases.base + fases.build + fases.peak) return 'peak'
  return 'taper'
}

// Progresion tipo "couch to 5k" para quien nunca ha corrido o es principiante:
// intervalos de trote/caminata que van reduciendo la parte de caminata hasta
// llegar a trote continuo. `progreso` va de 0 (semana 1 de la fase) a 1
// (ultima semana antes de la fase de series especificas).
const PROGRESION_CAMINAR_CORRER = [
  { corte: 0, notas: '8 x (1 min trote suave / 2 min caminata)', minutos: 24 },
  { corte: 0.15, notas: '6 x (2 min trote suave / 2 min caminata)', minutos: 24 },
  { corte: 0.3, notas: '5 x (3 min trote suave / 2 min caminata)', minutos: 25 },
  { corte: 0.45, notas: '4 x (5 min trote suave / 2 min caminata)', minutos: 28 },
  { corte: 0.6, notas: '3 x (8 min trote suave / 2 min caminata)', minutos: 30 },
  { corte: 0.75, notas: '2 x (12 min trote suave / 3 min caminata)', minutos: 30 },
  { corte: 0.88, notas: 'Trote continuo 20 min + camina lo que necesites al final', minutos: 25 },
  { corte: 1, notas: 'Trote continuo, sin caminar', minutos: 30 },
]

function progresionCaminarCorrer(progreso: number) {
  let elegido = PROGRESION_CAMINAR_CORRER[0]
  for (const p of PROGRESION_CAMINAR_CORRER) {
    if (p.corte <= progreso) elegido = p
  }
  return elegido
}

const SERIES_BUILD = ['6 x 400m fuerte, 90 seg trote suave entre series', '5 x 500m fuerte, 2 min trote suave entre series']
const SERIES_PEAK: Record<Exclude<ObjetivoRunning, 'general'>, string> = {
  '5k': '5 x 1000m a ritmo objetivo de carrera, 2 min trote suave',
  '10k': '4 x 1600m a ritmo objetivo de carrera, 2-3 min trote suave',
  '21k': '3 x 3km a ritmo objetivo de carrera, 3 min trote suave',
  maraton: '2 x 6km a ritmo objetivo de maraton, 4 min trote suave',
}

interface CarreraDia {
  nombre: string
  tipoActividad: string
  distanciaKm?: number
  duracionMin?: number
  notas?: string
  ritmoTexto?: string
}

interface DiaGenerado {
  diaSemana: number
  tipo: 'descanso' | 'fuerza' | 'pliometria' | 'carrera'
  carrera?: CarreraDia
}

// Genera el contenido de UNA semana (7 dias, lunes a domingo) segun nivel,
// objetivo, la fase de periodizacion en la que cae, y en que semana relativa
// de esa fase esta (para la progresion del fondo y de las series).
function generarSemana(params: {
  semana: number
  fases: Fases
  nivel: NivelRunning
  objetivo: ObjetivoRunning
  ritmos: RitmosCarrera | null
}): DiaGenerado[] {
  const { semana, fases, nivel, objetivo, ritmos } = params
  const ritmoFacil = ritmos ? formatoRitmo(ritmos.facilSegKm) : undefined
  const fase = faseDeSemana(semana, fases)
  const esPrincipiante = nivel === 'nunca_corrido' || nivel === 'principiante'
  const objetivoConDistancia = objetivo !== 'general'

  const dias: DiaGenerado[] = Array.from({ length: 7 }, (_, i) => ({ diaSemana: i, tipo: 'descanso' }))

  // --- Principiante / nunca ha corrido: progresion caminar-correr ---
  if (esPrincipiante && objetivoConDistancia) {
    const semanasBaseBuild = fases.base + fases.build
    if (fase === 'base' || fase === 'build') {
      const progreso = semanasBaseBuild > 1 ? (semana - 1) / (semanasBaseBuild - 1) : 1
      const paso = progresionCaminarCorrer(progreso)
      const diasCarrera = [0, 2, 5] // Lunes, Miercoles, Sabado
      diasCarrera.forEach((d) => {
        dias[d] = {
          diaSemana: d,
          tipo: 'carrera',
          carrera: { nombre: 'Correr-caminar', tipoActividad: 'running', duracionMin: paso.minutos, notas: paso.notas },
        }
      })
    } else {
      // peak: intenta la distancia objetivo corriendo continuo; taper: baja el volumen
      const semanaEnFase = semana - fases.base - fases.build - (fase === 'taper' ? fases.peak : 0)
      const totalFase = fase === 'peak' ? fases.peak : fases.taper
      const progreso = totalFase > 1 ? (semanaEnFase - 1) / (totalFase - 1) : 1
      const distanciaPico = FONDO_PICO_KM[objetivo]
      const distancia = fase === 'peak' ? FONDO_PICO_KM[objetivo] * (0.6 + 0.4 * progreso) : distanciaPico * (0.7 - 0.3 * progreso)
      dias[0] = { diaSemana: 0, tipo: 'carrera', carrera: { nombre: 'Rodaje suave', tipoActividad: 'running', distanciaKm: Number((distancia * 0.5).toFixed(1)), ritmoTexto: ritmoFacil } }
      dias[2] = { diaSemana: 2, tipo: 'carrera', carrera: { nombre: 'Rodaje suave', tipoActividad: 'running', distanciaKm: Number((distancia * 0.6).toFixed(1)), ritmoTexto: ritmoFacil } }
      dias[5] = { diaSemana: 5, tipo: 'carrera', carrera: { nombre: 'Fondo largo', tipoActividad: 'running', distanciaKm: Number(distancia.toFixed(1)), ritmoTexto: ritmoFacil } }
    }
    dias[1] = { diaSemana: 1, tipo: 'fuerza' }
    dias[4] = { diaSemana: 4, tipo: 'fuerza' }
    return dias
  }

  // --- Sin objetivo especifico: plan continuo de mantenimiento ---
  if (!objetivoConDistancia) {
    dias[0] = { diaSemana: 0, tipo: 'carrera', carrera: { nombre: 'Rodaje suave', tipoActividad: 'running', duracionMin: 30, ritmoTexto: ritmoFacil } }
    dias[2] = {
      diaSemana: 2,
      tipo: 'carrera',
      carrera: { nombre: 'Series', tipoActividad: 'running', notas: SERIES_BUILD[0], ritmoTexto: ritmos ? formatoRitmo(ritmos.repeticionSegKm) : undefined },
    }
    dias[5] = { diaSemana: 5, tipo: 'carrera', carrera: { nombre: 'Fondo largo', tipoActividad: 'running', distanciaKm: 10, ritmoTexto: ritmoFacil } }
    dias[1] = { diaSemana: 1, tipo: 'fuerza' }
    dias[4] = { diaSemana: 4, tipo: 'fuerza' }
    dias[3] = { diaSemana: 3, tipo: nivel === 'avanzado' || nivel === 'intermedio' ? 'pliometria' : 'descanso' }
    return dias
  }

  // --- Intermedio / avanzado con objetivo de carrera: periodizacion completa ---
  const semanaEnFase =
    fase === 'base' ? semana : fase === 'build' ? semana - fases.base : fase === 'peak' ? semana - fases.base - fases.build : semana - fases.base - fases.build - fases.peak
  const esStepBack = fase !== 'taper' && semanaEnFase % 4 === 0

  // progreso del fondo largo dentro de cada fase (0..1)
  const totalFase = fase === 'base' ? fases.base : fase === 'build' ? fases.build : fase === 'peak' ? fases.peak : fases.taper
  const progresoFase = totalFase > 1 ? (semanaEnFase - 1) / (totalFase - 1) : 1

  const inicioFondo = FONDO_INICIAL_KM[objetivo]
  const picoFondo = FONDO_PICO_KM[objetivo]
  const finBase = inicioFondo + (picoFondo - inicioFondo) * 0.5
  const finBuild = inicioFondo + (picoFondo - inicioFondo) * 0.85

  let fondoKm: number
  if (fase === 'base') fondoKm = inicioFondo + (finBase - inicioFondo) * progresoFase
  else if (fase === 'build') fondoKm = finBase + (finBuild - finBase) * progresoFase
  else if (fase === 'peak') fondoKm = finBuild + (picoFondo - finBuild) * progresoFase
  else fondoKm = picoFondo * (0.6 - 0.35 * progresoFase) // taper: baja fuerte

  if (esStepBack) fondoKm *= 0.75

  const diasSemana = nivel === 'avanzado' ? (objetivo === 'maraton' || objetivo === '21k' ? 5 : 4) : 4

  // Long run: sabado. Calidad: martes (si aplica). Facil: resto.
  dias[5] = { diaSemana: 5, tipo: 'carrera', carrera: { nombre: 'Fondo largo', tipoActividad: 'running', distanciaKm: Number(fondoKm.toFixed(1)), ritmoTexto: ritmoFacil } }

  const hayCalidad = fase !== 'base' && fase !== 'taper'
  if (hayCalidad) {
    const notasSerie = fase === 'build' ? SERIES_BUILD[semana % SERIES_BUILD.length] : SERIES_PEAK[objetivo]
    const esTempoState = fase === 'build' && semana % 2 === 0
    const esPeak = fase === 'peak'
    dias[2] = esTempoState
      ? { diaSemana: 2, tipo: 'carrera', carrera: { nombre: 'Tempo run', tipoActividad: 'running', duracionMin: 20, ritmoTexto: ritmos ? formatoRitmo(ritmos.umbralSegKm) : undefined } }
      : {
          diaSemana: 2,
          tipo: 'carrera',
          carrera: {
            nombre: 'Series',
            tipoActividad: 'running',
            notas: notasSerie,
            ritmoTexto: ritmos ? formatoRitmo(esPeak ? ritmoObjetivoSegKm(ritmos, objetivo) : ritmos.repeticionSegKm) : undefined,
          },
        }
  } else {
    dias[2] = { diaSemana: 2, tipo: 'carrera', carrera: { nombre: 'Rodaje suave', tipoActividad: 'running', distanciaKm: Number((fondoKm * 0.45).toFixed(1)), ritmoTexto: ritmoFacil } }
  }

  dias[0] = { diaSemana: 0, tipo: 'carrera', carrera: { nombre: 'Trote regenerativo', tipoActividad: 'running', duracionMin: 25, ritmoTexto: ritmoFacil } }
  if (diasSemana >= 5) {
    dias[6] = { diaSemana: 6, tipo: 'carrera', carrera: { nombre: 'Rodaje suave', tipoActividad: 'running', distanciaKm: Number((fondoKm * 0.35).toFixed(1)), ritmoTexto: ritmoFacil } }
  }

  dias[1] = { diaSemana: 1, tipo: 'fuerza' }
  dias[4] = { diaSemana: 4, tipo: 'fuerza' }
  // Con 5 dias de carrera a la semana ya no queda espacio para pliometria sin
  // sacrificar el unico descanso completo (miercoles) — se prioriza el descanso.
  if ((fase === 'build' || fase === 'peak') && (nivel === 'intermedio' || nivel === 'avanzado') && diasSemana < 5) {
    dias[3] = { diaSemana: 3, tipo: 'pliometria' }
  }

  return dias
}

const FUERZA_CORREDORES = [
  { nombre: 'Sentadilla bulgara', grupo: 'piernas' as GrupoMuscular, series: 3, reps: '12' },
  { nombre: 'Peso muerto rumano a una pierna', grupo: 'piernas' as GrupoMuscular, series: 3, reps: '10' },
  { nombre: 'Puente de gluteos', grupo: 'gluteos' as GrupoMuscular, series: 3, reps: '15' },
  { nombre: 'Zancadas caminando', grupo: 'piernas' as GrupoMuscular, series: 3, reps: '12' },
  { nombre: 'Plancha lateral', grupo: 'core' as GrupoMuscular, series: 3, reps: '30 seg' },
  { nombre: 'Elevacion de talones', grupo: 'gemelos' as GrupoMuscular, series: 3, reps: '15' },
]

const PLIOMETRIA_CORREDORES = [
  { nombre: 'Saltos al cajon', grupo: 'piernas' as GrupoMuscular, series: 3, reps: '8' },
  { nombre: 'Skipping alto', grupo: 'piernas' as GrupoMuscular, series: 3, reps: '20 seg' },
  { nombre: 'Zancadas con salto', grupo: 'piernas' as GrupoMuscular, series: 3, reps: '10' },
  { nombre: 'Saltos laterales', grupo: 'piernas' as GrupoMuscular, series: 3, reps: '12' },
]

export interface OpcionesPlanRunning {
  nivel: NivelRunning
  objetivo: ObjetivoRunning
  fechaObjetivo: string | null
  testInicial?: TestInicialRunning | null
}

// Arma y guarda un plan de running periodizado (o continuo, si no hay
// objetivo de carrera): fuerza 2x/semana, pliometria si aplica, progresion
// del fondo largo con semanas de descarga, series/tempo desde la fase build,
// y taper final. Si se paso un test inicial (distancia + tiempo de una
// carrera reciente o time trial), cada sesion de carrera queda con un ritmo
// objetivo especifico (min/km) ademas de la distancia/duracion. Devuelve el
// plan ya materializado con sus dias y rutinas.
export async function generarPlanRunning(supabase: SupabaseClient, usuarioId: string, opciones: OpcionesPlanRunning): Promise<PlanConDias> {
  const { nivel, objetivo, fechaObjetivo, testInicial } = opciones
  const esContinuo = objetivo === 'general'
  const totalSemanas = esContinuo ? 1 : calcularDuracionPlan(nivel, objetivo, fechaObjetivo)
  const fases = calcularFases(totalSemanas, objetivo)
  const ritmos = testInicial ? calcularRitmos(testInicial.distanciaKm, testInicial.tiempoSeg) : null

  const semanasGeneradas: DiaGenerado[][] = Array.from({ length: totalSemanas }, (_, i) =>
    generarSemana({ semana: i + 1, fases, nivel, objetivo, ritmos })
  )

  await supabase.from('planes_entrenamiento').update({ activo: false }).eq('usuario_id', usuarioId).eq('activo', true)

  // 1. Ejercicios: fuerza + pliometria (si aplica) + un "ejercicio" por cada
  // nombre distinto de sesion de carrera usada en el plan.
  const usaPliometria = (nivel === 'intermedio' || nivel === 'avanzado') && semanasGeneradas.some((s) => s.some((d) => d.tipo === 'pliometria'))
  const nombresCarrera = new Set<string>()
  semanasGeneradas.forEach((s) => s.forEach((d) => d.carrera && nombresCarrera.add(d.carrera.nombre)))

  const nombresNecesarios = new Map<string, GrupoMuscular>()
  FUERZA_CORREDORES.forEach((e) => nombresNecesarios.set(e.nombre, e.grupo))
  if (usaPliometria) PLIOMETRIA_CORREDORES.forEach((e) => nombresNecesarios.set(e.nombre, e.grupo))
  nombresCarrera.forEach((n) => nombresNecesarios.set(n, 'cardio'))

  const { data: existentes } = await supabase.from('ejercicios').select('id, nombre').eq('usuario_id', usuarioId)
  const idPorNombre = new Map<string, string>((existentes ?? []).map((e) => [e.nombre as string, e.id as string]))
  const faltantes = Array.from(nombresNecesarios.entries()).filter(([nombre]) => !idPorNombre.has(nombre))
  if (faltantes.length > 0) {
    const { data: creados, error } = await supabase
      .from('ejercicios')
      .insert(faltantes.map(([nombre, grupo]) => ({ usuario_id: usuarioId, nombre, grupo_muscular: grupo })))
      .select('id, nombre')
    if (error) throw error
    for (const c of creados ?? []) idPorNombre.set(c.nombre as string, c.id as string)
  }

  // 2. Rutinas reutilizables: fuerza y pliometria (una sola vez cada una).
  const nombreObjetivo = OBJETIVOS_RUNNING.find((o) => o.id === objetivo)?.label ?? objetivo
  const nombreNivel = NIVELES_RUNNING.find((n) => n.id === nivel)?.label ?? nivel

  const rutinasReutilizables: { id: string; tipo: 'fuerza' | 'pliometria' }[] = []
  const { data: rutinaFuerza, error: errorFuerza } = await supabase
    .from('rutinas')
    .insert({ usuario_id: usuarioId, nombre: 'Fuerza para corredores', tipo: 'gym', objetivo: 'resistencia', nivel: mapNivel(nivel) })
    .select()
    .single()
  if (errorFuerza || !rutinaFuerza) throw errorFuerza ?? new Error('No se pudo crear la rutina de fuerza')
  rutinasReutilizables.push({ id: rutinaFuerza.id, tipo: 'fuerza' })

  const filasFuerza = FUERZA_CORREDORES.map((e, orden) => ({
    usuario_id: usuarioId,
    rutina_id: rutinaFuerza.id,
    ejercicio_id: idPorNombre.get(e.nombre)!,
    orden,
    series_objetivo: e.series,
    reps_objetivo: e.reps,
    peso_objetivo: null,
    descanso_seg: 60,
  }))
  const { data: itemsFuerza, error: errorItemsFuerza } = await supabase.from('rutina_ejercicios').insert(filasFuerza).select('*, ejercicio:ejercicios(*)')
  if (errorItemsFuerza) throw errorItemsFuerza

  let rutinaPliometria: { id: string } | null = null
  let itemsPliometria: RutinaEjercicio[] = []
  if (usaPliometria) {
    const { data, error } = await supabase
      .from('rutinas')
      .insert({ usuario_id: usuarioId, nombre: 'Pliometria para corredores', tipo: 'gym', objetivo: 'resistencia', nivel: mapNivel(nivel) })
      .select()
      .single()
    if (error || !data) throw error ?? new Error('No se pudo crear la rutina de pliometria')
    rutinaPliometria = data
    rutinasReutilizables.push({ id: data.id, tipo: 'pliometria' })

    const filas = PLIOMETRIA_CORREDORES.map((e, orden) => ({
      usuario_id: usuarioId,
      rutina_id: data.id,
      ejercicio_id: idPorNombre.get(e.nombre)!,
      orden,
      series_objetivo: e.series,
      reps_objetivo: e.reps,
      peso_objetivo: null,
      descanso_seg: 90,
    }))
    const { data: items, error: errorItems } = await supabase.from('rutina_ejercicios').insert(filas).select('*, ejercicio:ejercicios(*)')
    if (errorItems) throw errorItems
    itemsPliometria = (items ?? []) as RutinaEjercicio[]
  }

  // 3. Una rutina de cardio por cada dia de carrera de cada semana (el
  // objetivo cambia semana a semana, asi que no se puede reutilizar).
  const diasCarrera = semanasGeneradas.flatMap((dias, i) => dias.filter((d) => d.tipo === 'carrera').map((d) => ({ semana: i + 1, dia: d })))
  const { data: rutinasCarrera, error: errorRutinasCarrera } =
    diasCarrera.length > 0
      ? await supabase
          .from('rutinas')
          .insert(
            diasCarrera.map(({ semana, dia }) => ({
              usuario_id: usuarioId,
              nombre: `${dia.carrera!.nombre} — semana ${semana}`,
              tipo: 'cardio',
              objetivo: 'resistencia',
              nivel: mapNivel(nivel),
            }))
          )
          .select()
      : { data: [], error: null }
  if (errorRutinasCarrera || !rutinasCarrera) throw errorRutinasCarrera ?? new Error('No se pudo crear las rutinas de carrera')

  const filasCarrera = diasCarrera.map(({ dia }, i) => ({
    usuario_id: usuarioId,
    rutina_id: rutinasCarrera[i].id,
    ejercicio_id: idPorNombre.get(dia.carrera!.nombre)!,
    orden: 0,
    series_objetivo: 1,
    reps_objetivo: '',
    peso_objetivo: null,
    descanso_seg: 0,
    tipo_actividad: dia.carrera!.tipoActividad,
    distancia_objetivo_km: dia.carrera!.distanciaKm ?? null,
    duracion_objetivo_min: dia.carrera!.duracionMin ?? null,
    notas_cardio: dia.carrera!.notas ?? null,
    ritmo_objetivo: dia.carrera!.ritmoTexto ?? null,
  }))
  const { data: itemsCarrera, error: errorItemsCarrera } =
    filasCarrera.length > 0 ? await supabase.from('rutina_ejercicios').insert(filasCarrera).select('*, ejercicio:ejercicios(*)') : { data: [], error: null }
  if (errorItemsCarrera) throw errorItemsCarrera

  // 4. El plan y todos sus dias (semana a semana).
  const nombrePlan = esContinuo
    ? `Running — mantenimiento (${nombreNivel})`
    : `Running ${nombreObjetivo} — ${nombreNivel}`

  const { data: plan, error: errorPlan } = await supabase
    .from('planes_entrenamiento')
    .insert({
      usuario_id: usuarioId,
      nombre: nombrePlan,
      objetivo: 'resistencia',
      nivel: mapNivel(nivel),
      activo: true,
      duracion_semanas: esContinuo ? null : totalSemanas,
      fecha_inicio: fechaISO(new Date()),
      fecha_objetivo: esContinuo ? null : fechaObjetivo,
      test_distancia_km: testInicial?.distanciaKm ?? null,
      test_tiempo_seg: testInicial?.tiempoSeg ?? null,
    })
    .select()
    .single()
  if (errorPlan || !plan) throw errorPlan ?? new Error('No se pudo crear el plan')

  let cursorCarrera = 0
  const rutinasPorId = new Map<string, RutinaConEjercicios>()
  const filasDias = semanasGeneradas.flatMap((dias, i) =>
    dias.map((dia) => {
      if (dia.tipo === 'descanso') {
        return { usuario_id: usuarioId, plan_id: plan.id, semana: i + 1, dia_semana: dia.diaSemana, rutina_id: null, descanso: true }
      }
      if (dia.tipo === 'fuerza' || dia.tipo === 'pliometria') {
        const rutinaId = dia.tipo === 'fuerza' ? rutinaFuerza.id : rutinaPliometria!.id
        return { usuario_id: usuarioId, plan_id: plan.id, semana: i + 1, dia_semana: dia.diaSemana, rutina_id: rutinaId, descanso: false }
      }
      const rutinaId = rutinasCarrera[cursorCarrera].id as string
      cursorCarrera++
      return { usuario_id: usuarioId, plan_id: plan.id, semana: i + 1, dia_semana: dia.diaSemana, rutina_id: rutinaId, descanso: false }
    })
  )

  const { data: diasCreados, error: errorDias } = await supabase.from('plan_dias').insert(filasDias).select()
  if (errorDias || !diasCreados) throw errorDias ?? new Error('No se pudo crear el calendario del plan')

  rutinasPorId.set(rutinaFuerza.id, {
    id: rutinaFuerza.id,
    usuario_id: usuarioId,
    nombre: 'Fuerza para corredores',
    tipo: 'gym',
    objetivo: 'resistencia',
    nivel: mapNivel(nivel),
    created_at: new Date().toISOString(),
    ejercicios: (itemsFuerza ?? []) as RutinaEjercicio[],
  })
  if (rutinaPliometria) {
    rutinasPorId.set(rutinaPliometria.id, {
      id: rutinaPliometria.id,
      usuario_id: usuarioId,
      nombre: 'Pliometria para corredores',
      tipo: 'gym',
      objetivo: 'resistencia',
      nivel: mapNivel(nivel),
      created_at: new Date().toISOString(),
      ejercicios: itemsPliometria,
    })
  }
  const itemsCarreraPorRutina = new Map<string, RutinaEjercicio[]>()
  for (const item of (itemsCarrera ?? []) as RutinaEjercicio[]) {
    const lista = itemsCarreraPorRutina.get(item.rutina_id) ?? []
    lista.push(item)
    itemsCarreraPorRutina.set(item.rutina_id, lista)
  }
  diasCarrera.forEach(({ dia }, i) => {
    const r = rutinasCarrera[i]
    rutinasPorId.set(r.id, {
      id: r.id,
      usuario_id: usuarioId,
      nombre: `${dia.carrera!.nombre} — semana ${diasCarrera[i].semana}`,
      tipo: 'cardio',
      objetivo: 'resistencia',
      nivel: mapNivel(nivel),
      created_at: new Date().toISOString(),
      ejercicios: itemsCarreraPorRutina.get(r.id) ?? [],
    })
  })

  const dias = diasCreados.map((d) => ({ ...d, rutina: d.rutina_id ? rutinasPorId.get(d.rutina_id) : undefined }))

  return { ...plan, dias } as PlanConDias
}

function mapNivel(nivel: NivelRunning): NivelEntrenamiento {
  if (nivel === 'avanzado') return 'experto'
  if (nivel === 'intermedio') return 'intermedio'
  return 'principiante'
}

export function resumenPlanRunning(opciones: OpcionesPlanRunning): string {
  const { nivel, objetivo, fechaObjetivo } = opciones
  if (objetivo === 'general') return 'Plan continuo de mantenimiento: rodajes, series, fondo semanal y fuerza 2x/semana.'
  const semanas = calcularDuracionPlan(nivel, objetivo, fechaObjetivo)
  const min = SEMANAS_MIN[objetivo]
  const advertencia = fechaObjetivo && semanas < min ? ` Es menos de lo ideal (${min} semanas minimo recomendado) — el plan se enfoca en llegar sano a la carrera, no en un tiempo record.` : ''
  return `${semanas} semanas de plan, con fuerza 2x/semana${nivel !== 'nunca_corrido' && nivel !== 'principiante' ? ' y pliometria desde la fase de series' : ''}, terminando con un taper antes de la carrera.${advertencia}`
}
