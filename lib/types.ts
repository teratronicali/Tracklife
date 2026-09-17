export interface Perfil {
  id: string
  nombre: string
  avatar_url: string | null
  xp_total: number
  nivel: number
  racha_actual: number
  mejor_racha: number
  onboarding_completado: boolean
  deportes: string[]
  enfoque_financiero: string[]
  presupuesto_mensual: number | null
  plan: 'gratis' | 'vitalicio'
  plan_actualizado_en: string | null
  created_at: string
}

export interface Compra {
  id: string
  usuario_id: string
  stripe_session_id: string | null
  monto: number
  moneda: string
  estado: string
  created_at: string
}

export interface Habito {
  id: string
  usuario_id: string
  nombre: string
  emoji: string
  momento: 'manana' | 'tarde' | 'noche'
  xp_valor: number
  activo: boolean
  created_at: string
}

export interface HabitoRegistro {
  id: string
  habito_id: string
  usuario_id: string
  fecha: string
  created_at: string
}

export type TipoTransaccion = 'ingreso' | 'gasto'

export interface FinanzaTransaccion {
  id: string
  usuario_id: string
  tipo: TipoTransaccion
  categoria: string
  descripcion: string | null
  monto: number
  fecha: string
  created_at: string
}

export const CATEGORIAS_GASTO = [
  'facturas',
  'comida',
  'transporte',
  'restaurante',
  'salud',
  'entretenimiento',
  'otros',
] as const

export const CATEGORIAS_INGRESO = ['salario', 'freelance', 'inversion', 'otros'] as const

export type GrupoMuscular =
  | 'pecho'
  | 'espalda'
  | 'hombros'
  | 'triceps'
  | 'biceps'
  | 'antebrazos'
  | 'piernas'
  | 'gluteos'
  | 'gemelos'
  | 'core'
  | 'cardio'
  | 'general'

export const GRUPOS_MUSCULARES: GrupoMuscular[] = [
  'pecho',
  'espalda',
  'hombros',
  'triceps',
  'biceps',
  'antebrazos',
  'piernas',
  'gluteos',
  'gemelos',
  'core',
  'cardio',
  'general',
]

export interface Ejercicio {
  id: string
  usuario_id: string
  nombre: string
  grupo_muscular: GrupoMuscular
  video_url: string | null
  created_at: string
}

export type FuenteRegistro = 'manual' | 'strava'

export interface EntrenamientoRegistro {
  id: string
  usuario_id: string
  ejercicio_id: string
  peso: number
  reps: number
  series: number
  fecha: string
  created_at: string
  ejercicio?: Ejercicio
  fuente: FuenteRegistro
  strava_activity_id: number | null
  distancia_km: number | null
  duracion_min: number | null
  tipo_actividad: string
  sesion_id: string | null
  rir: number | null
  numero_serie: number
}

export type TipoRutina = 'gym' | 'cardio'
export type NivelEntrenamiento = 'principiante' | 'intermedio' | 'experto'

export interface Rutina {
  id: string
  usuario_id: string
  nombre: string
  tipo: TipoRutina
  objetivo: string | null
  nivel: NivelEntrenamiento | null
  created_at: string
}

export interface RutinaEjercicio {
  id: string
  usuario_id: string
  rutina_id: string
  ejercicio_id: string
  orden: number
  series_objetivo: number
  reps_objetivo: string
  peso_objetivo: number | null
  descanso_seg: number
  tipo_actividad: string | null
  distancia_objetivo_km: number | null
  duracion_objetivo_min: number | null
  notas_cardio: string | null
  ejercicio?: Ejercicio
}

export interface RutinaConEjercicios extends Rutina {
  ejercicios: RutinaEjercicio[]
}

export interface SesionEntrenamiento {
  id: string
  usuario_id: string
  rutina_id: string | null
  nombre: string
  fecha: string
  iniciada_en: string
  finalizada_en: string | null
}

export interface PlanEntrenamiento {
  id: string
  usuario_id: string
  nombre: string
  objetivo: string
  nivel: NivelEntrenamiento
  activo: boolean
  duracion_semanas: number | null
  fecha_inicio: string
  fecha_objetivo: string | null
  created_at: string
}

export interface PlanDia {
  id: string
  usuario_id: string
  plan_id: string
  semana: number
  dia_semana: number
  rutina_id: string | null
  descanso: boolean
  rutina?: RutinaConEjercicios
}

export interface PlanConDias extends PlanEntrenamiento {
  dias: PlanDia[]
}

export type EstadoDiaPlan = 'pendiente' | 'cumplido' | 'incumplido' | 'compensado'

export interface PlanDiaEstado {
  id: string
  usuario_id: string
  plan_id: string
  fecha: string
  rutina_id: string | null
  estado: EstadoDiaPlan
  origen_fecha: string | null
  sesion_id: string | null
  created_at: string
  updated_at: string
}

export interface IntegracionStrava {
  usuario_id: string
  athlete_id: number
  access_token: string
  refresh_token: string
  expira_en: string
  scope: string | null
  ultima_sincronizacion: string | null
  conectado_en: string
}

export interface NutricionComida {
  id: string
  usuario_id: string
  nombre: string
  proteina: number
  carbohidratos: number
  grasa: number
  kcal: number
  fecha: string
  created_at: string
}

export interface NutricionMeta {
  usuario_id: string
  kcal_objetivo: number
  proteina_objetivo: number
  carbo_objetivo: number
  grasa_objetivo: number
}

export type TipoMeta = 'financiera' | 'deportiva' | 'familiar' | 'salud' | 'profesional' | 'personal'

export const TIPOS_META: { id: TipoMeta; label: string; emoji: string }[] = [
  { id: 'financiera', label: 'Financiera', emoji: '💰' },
  { id: 'deportiva', label: 'Deportiva', emoji: '🏆' },
  { id: 'familiar', label: 'Familiar', emoji: '👨‍👩‍👧' },
  { id: 'salud', label: 'Salud', emoji: '❤️' },
  { id: 'profesional', label: 'Profesional', emoji: '💼' },
  { id: 'personal', label: 'Personal', emoji: '✨' },
]

export interface Meta {
  id: string
  usuario_id: string
  titulo: string
  tipo: TipoMeta
  monto_objetivo: number
  monto_actual: number
  dias_objetivo: number | null
  fecha_inicio: string
  imagen_url: string | null
  archivada: boolean
  created_at: string
}

export interface MetaAporte {
  id: string
  meta_id: string
  usuario_id: string
  monto: number
  nota: string | null
  created_at: string
}

export type EstadoTarea = 'pendiente' | 'en_progreso' | 'hecho'

export interface Tarea {
  id: string
  usuario_id: string
  titulo: string
  descripcion: string | null
  estado: EstadoTarea
  etiqueta: string | null
  xp_valor: number
  orden: number
  created_at: string
}

export interface TareaSubtarea {
  id: string
  tarea_id: string
  usuario_id: string
  titulo: string
  completado: boolean
  orden: number
}
