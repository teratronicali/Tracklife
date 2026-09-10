export interface Perfil {
  id: string
  nombre: string
  avatar_url: string | null
  xp_total: number
  nivel: number
  racha_actual: number
  mejor_racha: number
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
  | 'piernas'
  | 'core'
  | 'general'

export const GRUPOS_MUSCULARES: GrupoMuscular[] = [
  'pecho',
  'espalda',
  'hombros',
  'triceps',
  'biceps',
  'piernas',
  'core',
  'general',
]

export interface Ejercicio {
  id: string
  usuario_id: string
  nombre: string
  grupo_muscular: GrupoMuscular
  created_at: string
}

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

export type TipoMeta = 'financiera' | 'personal'

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
