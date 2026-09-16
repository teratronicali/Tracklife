import type { GrupoMuscular } from '@/lib/types'

export interface HabitoSugerido {
  nombre: string
  emoji: string
  momento: 'manana' | 'tarde' | 'noche'
  xp_valor: number
}

// Habitos de proposito general, sin relacion con un deporte en particular.
export const HABITOS_GENERALES: HabitoSugerido[] = [
  { nombre: 'Beber 2L de agua', emoji: '💧', momento: 'manana', xp_valor: 20 },
  { nombre: 'Dormir temprano', emoji: '😴', momento: 'noche', xp_valor: 30 },
  { nombre: 'Meditar 10 minutos', emoji: '🧘', momento: 'manana', xp_valor: 30 },
  { nombre: 'Leer 20 paginas', emoji: '📖', momento: 'tarde', xp_valor: 30 },
  { nombre: 'Planificar el dia', emoji: '🗓️', momento: 'manana', xp_valor: 20 },
  { nombre: 'Sin pantallas antes de dormir', emoji: '📵', momento: 'noche', xp_valor: 20 },
  { nombre: 'Ahorrar algo hoy', emoji: '💰', momento: 'noche', xp_valor: 20 },
]

// Habitos especificos segun el deporte elegido en el onboarding — se
// combinan con HABITOS_GENERALES para no mostrar una lista generica que no
// tiene nada que ver con lo que la persona realmente practica.
export const HABITOS_POR_DEPORTE: Record<string, HabitoSugerido[]> = {
  gym: [
    { nombre: 'Calentar antes de entrenar', emoji: '🔥', momento: 'manana', xp_valor: 20 },
    { nombre: 'Estirar despues del gym', emoji: '🤸', momento: 'tarde', xp_valor: 20 },
    { nombre: 'Comer proteina despues de entrenar', emoji: '🍗', momento: 'tarde', xp_valor: 20 },
  ],
  running: [
    { nombre: 'Estirar despues de correr', emoji: '🤸', momento: 'tarde', xp_valor: 20 },
    { nombre: 'Hidratarme antes de salir a correr', emoji: '💧', momento: 'manana', xp_valor: 20 },
    { nombre: 'Revisar mis zapatillas', emoji: '👟', momento: 'manana', xp_valor: 10 },
  ],
  ciclismo: [
    { nombre: 'Revisar la bicicleta antes de salir', emoji: '🔧', momento: 'manana', xp_valor: 10 },
    { nombre: 'Estirar piernas despues de rodar', emoji: '🤸', momento: 'tarde', xp_valor: 20 },
  ],
  natacion: [
    { nombre: 'Hidratarme despues de nadar', emoji: '💧', momento: 'tarde', xp_valor: 20 },
    { nombre: 'Estirar hombros y espalda', emoji: '🤸', momento: 'tarde', xp_valor: 20 },
  ],
  futbol: [
    { nombre: 'Calentar antes de jugar', emoji: '🔥', momento: 'manana', xp_valor: 20 },
    { nombre: 'Estirar despues del partido', emoji: '🤸', momento: 'tarde', xp_valor: 20 },
  ],
  crossfit: [
    { nombre: 'Movilidad antes del WOD', emoji: '🤸', momento: 'manana', xp_valor: 20 },
    { nombre: 'Registrar tu WOD del dia', emoji: '📝', momento: 'tarde', xp_valor: 20 },
  ],
  yoga: [{ nombre: 'Practicar respiracion consciente', emoji: '🧘‍♂️', momento: 'manana', xp_valor: 20 }],
  otro: [],
}

// Junta lo general con lo especifico de cada deporte elegido, sin duplicar
// por nombre si dos deportes sugieren el mismo habito.
export function habitosSugeridosPara(deportesElegidos: string[]): HabitoSugerido[] {
  const especificos = deportesElegidos.flatMap((id) => HABITOS_POR_DEPORTE[id] ?? [])
  const vistos = new Set<string>()
  return [...especificos, ...HABITOS_GENERALES].filter((h) => {
    if (vistos.has(h.nombre)) return false
    vistos.add(h.nombre)
    return true
  })
}

export interface EjercicioSemilla {
  nombre: string
  grupo_muscular: GrupoMuscular
  tipo_actividad: string
}

export interface Deporte {
  id: string
  label: string
  emoji: string
  ejercicios: EjercicioSemilla[]
}

export const DEPORTES: Deporte[] = [
  {
    id: 'gym',
    label: 'Gym / Pesas',
    emoji: '🏋️',
    ejercicios: [
      { nombre: 'Press de banca', grupo_muscular: 'pecho', tipo_actividad: 'fuerza' },
      { nombre: 'Sentadilla', grupo_muscular: 'piernas', tipo_actividad: 'fuerza' },
      { nombre: 'Peso muerto', grupo_muscular: 'espalda', tipo_actividad: 'fuerza' },
      { nombre: 'Press militar', grupo_muscular: 'hombros', tipo_actividad: 'fuerza' },
      { nombre: 'Curl de biceps', grupo_muscular: 'biceps', tipo_actividad: 'fuerza' },
      { nombre: 'Triceps polea', grupo_muscular: 'triceps', tipo_actividad: 'fuerza' },
    ],
  },
  {
    id: 'running',
    label: 'Running',
    emoji: '🏃',
    ejercicios: [{ nombre: 'Carrera', grupo_muscular: 'piernas', tipo_actividad: 'running' }],
  },
  {
    id: 'ciclismo',
    label: 'Ciclismo',
    emoji: '🚴',
    ejercicios: [{ nombre: 'Ciclismo', grupo_muscular: 'piernas', tipo_actividad: 'ciclismo' }],
  },
  {
    id: 'natacion',
    label: 'Natacion',
    emoji: '🏊',
    ejercicios: [{ nombre: 'Natacion', grupo_muscular: 'general', tipo_actividad: 'natacion' }],
  },
  {
    id: 'futbol',
    label: 'Futbol',
    emoji: '⚽',
    ejercicios: [{ nombre: 'Entreno / partido de futbol', grupo_muscular: 'piernas', tipo_actividad: 'futbol' }],
  },
  {
    id: 'crossfit',
    label: 'Crossfit',
    emoji: '🔥',
    ejercicios: [{ nombre: 'WOD', grupo_muscular: 'general', tipo_actividad: 'crossfit' }],
  },
  {
    id: 'yoga',
    label: 'Yoga / Movilidad',
    emoji: '🧘‍♂️',
    ejercicios: [{ nombre: 'Sesion de yoga', grupo_muscular: 'core', tipo_actividad: 'yoga' }],
  },
  { id: 'otro', label: 'Otro', emoji: '✨', ejercicios: [] },
]

export const ENFOQUES_FINANCIEROS = [
  'Controlar gastos diarios',
  'Aumentar mi ahorro',
  'Pagar deudas',
  'Empezar a invertir',
] as const

// Mapea el tipo de actividad de Strava al tipo_actividad interno de TrackLife
export const STRAVA_TIPO_MAP: Record<string, string> = {
  Run: 'running',
  TrailRun: 'running',
  Walk: 'caminata',
  Hike: 'senderismo',
  Ride: 'ciclismo',
  VirtualRide: 'ciclismo',
  EBikeRide: 'ciclismo',
  Swim: 'natacion',
  Rowing: 'remo',
  Elliptical: 'eliptica',
  WeightTraining: 'fuerza',
  Workout: 'fuerza',
  Yoga: 'yoga',
  Soccer: 'futbol',
  Crossfit: 'crossfit',
}
