import type { GrupoMuscular } from '@/lib/types'

export interface HabitoSugerido {
  nombre: string
  emoji: string
  momento: 'manana' | 'tarde' | 'noche'
  xp_valor: number
}

export const HABITOS_SUGERIDOS: HabitoSugerido[] = [
  { nombre: 'Entrenar', emoji: '💪', momento: 'manana', xp_valor: 30 },
  { nombre: 'Meditar', emoji: '🧘', momento: 'manana', xp_valor: 30 },
  { nombre: 'Leer 20 paginas', emoji: '📖', momento: 'tarde', xp_valor: 30 },
  { nombre: 'Beber 2L de agua', emoji: '💧', momento: 'manana', xp_valor: 20 },
  { nombre: 'Dormir 8 horas', emoji: '😴', momento: 'noche', xp_valor: 30 },
  { nombre: 'Ducha fria', emoji: '🚿', momento: 'manana', xp_valor: 20 },
  { nombre: 'Ahorrar algo hoy', emoji: '💰', momento: 'noche', xp_valor: 20 },
  { nombre: 'Sin pantallas antes de dormir', emoji: '📵', momento: 'noche', xp_valor: 20 },
  { nombre: 'Planificar el dia', emoji: '🗓️', momento: 'manana', xp_valor: 20 },
  { nombre: 'Estirar / movilidad', emoji: '🤸', momento: 'noche', xp_valor: 20 },
]

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
  Ride: 'ciclismo',
  VirtualRide: 'ciclismo',
  Swim: 'natacion',
  WeightTraining: 'fuerza',
  Workout: 'fuerza',
  Yoga: 'yoga',
  Soccer: 'futbol',
  Crossfit: 'crossfit',
}
