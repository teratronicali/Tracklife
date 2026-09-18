import type { createClient } from '@/lib/supabase/client'
import type { GrupoMuscular, NivelEntrenamiento, PlanConDias, RutinaConEjercicios, RutinaEjercicio, TipoRutina } from '@/lib/types'

type SupabaseClient = ReturnType<typeof createClient>

export const DIAS_SEMANA = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo']

export type ObjetivoEntrenamiento = 'fuerza' | 'hipertrofia' | 'perdida_peso' | 'resistencia'

export const OBJETIVOS_ENTRENAMIENTO: { id: ObjetivoEntrenamiento; label: string; emoji: string }[] = [
  { id: 'fuerza', label: 'Fuerza', emoji: '🏋️' },
  { id: 'hipertrofia', label: 'Hipertrofia (ganar musculo)', emoji: '💪' },
  { id: 'perdida_peso', label: 'Perdida de peso', emoji: '🔥' },
  { id: 'resistencia', label: 'Resistencia / Running', emoji: '🏃' },
]

export const NIVELES_ENTRENAMIENTO: { id: NivelEntrenamiento; label: string }[] = [
  { id: 'principiante', label: 'Principiante' },
  { id: 'intermedio', label: 'Intermedio' },
  { id: 'experto', label: 'Experto' },
]

interface EjercicioPlantilla {
  nombre: string
  grupo_muscular: GrupoMuscular
  series: number
  reps: string
  descanso_seg: number
}

interface CardioPlantilla {
  nombre: string
  tipo_actividad: string
  distancia_km?: number
  duracion_min?: number
  notas?: string
}

interface DiaPlantilla {
  dia_semana: number
  nombreRutina?: string
  gym?: EjercicioPlantilla[]
  cardio?: CardioPlantilla
}

export interface PlanPlantilla {
  id: string
  nombre: string
  objetivo: ObjetivoEntrenamiento
  nivel: NivelEntrenamiento
  descripcion: string
  dias: DiaPlantilla[]
}

export const PLANES_PLANTILLA: PlanPlantilla[] = [
  // ============================= FUERZA =============================
  {
    id: 'fuerza-principiante',
    nombre: 'Fuerza Base Full Body',
    objetivo: 'fuerza',
    nivel: 'principiante',
    descripcion: '3 dias a la semana, cuerpo completo. Ideal para tus primeros meses construyendo base.',
    dias: [
      {
        dia_semana: 0,
        nombreRutina: 'Full Body A',
        gym: [
          { nombre: 'Sentadilla goblet', grupo_muscular: 'piernas', series: 3, reps: '10', descanso_seg: 90 },
          { nombre: 'Press banca con mancuernas', grupo_muscular: 'pecho', series: 3, reps: '10', descanso_seg: 90 },
          { nombre: 'Remo con mancuerna', grupo_muscular: 'espalda', series: 3, reps: '10', descanso_seg: 75 },
          { nombre: 'Plancha', grupo_muscular: 'core', series: 3, reps: '30 seg', descanso_seg: 45 },
        ],
      },
      { dia_semana: 1 },
      {
        dia_semana: 2,
        nombreRutina: 'Full Body B',
        gym: [
          { nombre: 'Peso muerto rumano', grupo_muscular: 'piernas', series: 3, reps: '10', descanso_seg: 90 },
          { nombre: 'Press militar con mancuernas', grupo_muscular: 'hombros', series: 3, reps: '10', descanso_seg: 75 },
          { nombre: 'Jalon al pecho', grupo_muscular: 'espalda', series: 3, reps: '10', descanso_seg: 75 },
          { nombre: 'Curl de biceps con mancuernas', grupo_muscular: 'biceps', series: 2, reps: '12', descanso_seg: 60 },
        ],
      },
      { dia_semana: 3 },
      {
        dia_semana: 4,
        nombreRutina: 'Full Body A',
        gym: [
          { nombre: 'Sentadilla goblet', grupo_muscular: 'piernas', series: 3, reps: '10', descanso_seg: 90 },
          { nombre: 'Press banca con mancuernas', grupo_muscular: 'pecho', series: 3, reps: '10', descanso_seg: 90 },
          { nombre: 'Remo con mancuerna', grupo_muscular: 'espalda', series: 3, reps: '10', descanso_seg: 75 },
          { nombre: 'Plancha', grupo_muscular: 'core', series: 3, reps: '30 seg', descanso_seg: 45 },
        ],
      },
      { dia_semana: 5 },
      { dia_semana: 6 },
    ],
  },
  {
    id: 'fuerza-intermedio',
    nombre: 'Fuerza Upper / Lower',
    objetivo: 'fuerza',
    nivel: 'intermedio',
    descripcion: '4 dias divididos en tren superior e inferior, con cargas pesadas y pocas repeticiones.',
    dias: [
      {
        dia_semana: 0,
        nombreRutina: 'Upper A',
        gym: [
          { nombre: 'Press banca', grupo_muscular: 'pecho', series: 4, reps: '6-8', descanso_seg: 120 },
          { nombre: 'Remo con barra', grupo_muscular: 'espalda', series: 4, reps: '6-8', descanso_seg: 120 },
          { nombre: 'Press militar', grupo_muscular: 'hombros', series: 3, reps: '8-10', descanso_seg: 90 },
          { nombre: 'Curl biceps barra Z', grupo_muscular: 'biceps', series: 3, reps: '10', descanso_seg: 60 },
          { nombre: 'Extension triceps en polea', grupo_muscular: 'triceps', series: 3, reps: '10', descanso_seg: 60 },
        ],
      },
      {
        dia_semana: 1,
        nombreRutina: 'Lower A',
        gym: [
          { nombre: 'Sentadilla trasera', grupo_muscular: 'piernas', series: 4, reps: '6-8', descanso_seg: 150 },
          { nombre: 'Peso muerto rumano', grupo_muscular: 'piernas', series: 3, reps: '8-10', descanso_seg: 120 },
          { nombre: 'Zancadas con mancuernas', grupo_muscular: 'piernas', series: 3, reps: '10', descanso_seg: 90 },
          { nombre: 'Elevacion de talones', grupo_muscular: 'piernas', series: 3, reps: '15', descanso_seg: 60 },
          { nombre: 'Plancha con peso', grupo_muscular: 'core', series: 3, reps: '40 seg', descanso_seg: 45 },
        ],
      },
      { dia_semana: 2 },
      {
        dia_semana: 3,
        nombreRutina: 'Upper B',
        gym: [
          { nombre: 'Press inclinado con mancuernas', grupo_muscular: 'pecho', series: 4, reps: '8-10', descanso_seg: 90 },
          { nombre: 'Jalon al pecho', grupo_muscular: 'espalda', series: 4, reps: '8-10', descanso_seg: 90 },
          { nombre: 'Elevaciones laterales', grupo_muscular: 'hombros', series: 3, reps: '12', descanso_seg: 60 },
          { nombre: 'Curl martillo', grupo_muscular: 'biceps', series: 3, reps: '12', descanso_seg: 60 },
          { nombre: 'Fondos en banco', grupo_muscular: 'triceps', series: 3, reps: '12', descanso_seg: 60 },
        ],
      },
      {
        dia_semana: 4,
        nombreRutina: 'Lower B',
        gym: [
          { nombre: 'Prensa de piernas', grupo_muscular: 'piernas', series: 4, reps: '10', descanso_seg: 120 },
          { nombre: 'Peso muerto convencional', grupo_muscular: 'espalda', series: 3, reps: '6', descanso_seg: 150 },
          { nombre: 'Sentadilla bulgara', grupo_muscular: 'piernas', series: 3, reps: '10', descanso_seg: 90 },
          { nombre: 'Curl femoral', grupo_muscular: 'piernas', series: 3, reps: '12', descanso_seg: 60 },
          { nombre: 'Elevacion de piernas colgado', grupo_muscular: 'core', series: 3, reps: '15', descanso_seg: 45 },
        ],
      },
      { dia_semana: 5 },
      { dia_semana: 6 },
    ],
  },
  {
    id: 'fuerza-experto',
    nombre: 'Push Pull Legs',
    objetivo: 'fuerza',
    nivel: 'experto',
    descripcion: '6 dias de entrenamiento con especializacion por patron de movimiento, un solo descanso semanal.',
    dias: [
      {
        dia_semana: 0,
        nombreRutina: 'Push',
        gym: [
          { nombre: 'Press banca', grupo_muscular: 'pecho', series: 5, reps: '5', descanso_seg: 150 },
          { nombre: 'Press militar', grupo_muscular: 'hombros', series: 4, reps: '6-8', descanso_seg: 120 },
          { nombre: 'Press inclinado con mancuernas', grupo_muscular: 'pecho', series: 3, reps: '10', descanso_seg: 90 },
          { nombre: 'Elevaciones laterales', grupo_muscular: 'hombros', series: 4, reps: '12', descanso_seg: 60 },
          { nombre: 'Extension triceps en polea', grupo_muscular: 'triceps', series: 4, reps: '10', descanso_seg: 60 },
        ],
      },
      {
        dia_semana: 1,
        nombreRutina: 'Pull',
        gym: [
          { nombre: 'Dominadas lastradas', grupo_muscular: 'espalda', series: 5, reps: '5', descanso_seg: 150 },
          { nombre: 'Remo con barra', grupo_muscular: 'espalda', series: 4, reps: '8', descanso_seg: 120 },
          { nombre: 'Jalon agarre cerrado', grupo_muscular: 'espalda', series: 3, reps: '10', descanso_seg: 90 },
          { nombre: 'Curl barra Z', grupo_muscular: 'biceps', series: 4, reps: '10', descanso_seg: 60 },
          { nombre: 'Face pull', grupo_muscular: 'hombros', series: 3, reps: '15', descanso_seg: 60 },
        ],
      },
      {
        dia_semana: 2,
        nombreRutina: 'Legs',
        gym: [
          { nombre: 'Sentadilla trasera', grupo_muscular: 'piernas', series: 5, reps: '5', descanso_seg: 180 },
          { nombre: 'Peso muerto rumano', grupo_muscular: 'piernas', series: 4, reps: '8', descanso_seg: 120 },
          { nombre: 'Sentadilla bulgara', grupo_muscular: 'piernas', series: 3, reps: '10', descanso_seg: 90 },
          { nombre: 'Curl femoral', grupo_muscular: 'piernas', series: 3, reps: '12', descanso_seg: 60 },
          { nombre: 'Elevacion de talones', grupo_muscular: 'piernas', series: 4, reps: '15', descanso_seg: 45 },
        ],
      },
      {
        dia_semana: 3,
        nombreRutina: 'Push',
        gym: [
          { nombre: 'Press banca', grupo_muscular: 'pecho', series: 5, reps: '5', descanso_seg: 150 },
          { nombre: 'Press militar', grupo_muscular: 'hombros', series: 4, reps: '6-8', descanso_seg: 120 },
          { nombre: 'Press inclinado con mancuernas', grupo_muscular: 'pecho', series: 3, reps: '10', descanso_seg: 90 },
          { nombre: 'Elevaciones laterales', grupo_muscular: 'hombros', series: 4, reps: '12', descanso_seg: 60 },
          { nombre: 'Extension triceps en polea', grupo_muscular: 'triceps', series: 4, reps: '10', descanso_seg: 60 },
        ],
      },
      {
        dia_semana: 4,
        nombreRutina: 'Pull',
        gym: [
          { nombre: 'Dominadas lastradas', grupo_muscular: 'espalda', series: 5, reps: '5', descanso_seg: 150 },
          { nombre: 'Remo con barra', grupo_muscular: 'espalda', series: 4, reps: '8', descanso_seg: 120 },
          { nombre: 'Jalon agarre cerrado', grupo_muscular: 'espalda', series: 3, reps: '10', descanso_seg: 90 },
          { nombre: 'Curl barra Z', grupo_muscular: 'biceps', series: 4, reps: '10', descanso_seg: 60 },
          { nombre: 'Face pull', grupo_muscular: 'hombros', series: 3, reps: '15', descanso_seg: 60 },
        ],
      },
      {
        dia_semana: 5,
        nombreRutina: 'Legs',
        gym: [
          { nombre: 'Sentadilla trasera', grupo_muscular: 'piernas', series: 5, reps: '5', descanso_seg: 180 },
          { nombre: 'Peso muerto rumano', grupo_muscular: 'piernas', series: 4, reps: '8', descanso_seg: 120 },
          { nombre: 'Sentadilla bulgara', grupo_muscular: 'piernas', series: 3, reps: '10', descanso_seg: 90 },
          { nombre: 'Curl femoral', grupo_muscular: 'piernas', series: 3, reps: '12', descanso_seg: 60 },
          { nombre: 'Elevacion de talones', grupo_muscular: 'piernas', series: 4, reps: '15', descanso_seg: 45 },
        ],
      },
      { dia_semana: 6 },
    ],
  },

  // ============================= HIPERTROFIA =============================
  {
    id: 'hipertrofia-principiante',
    nombre: 'Hipertrofia Full Body',
    objetivo: 'hipertrofia',
    nivel: 'principiante',
    descripcion: '3 dias, cuerpo completo con mas repeticiones para empezar a construir musculo.',
    dias: [
      {
        dia_semana: 0,
        nombreRutina: 'Full Body',
        gym: [
          { nombre: 'Sentadilla goblet', grupo_muscular: 'piernas', series: 3, reps: '12', descanso_seg: 75 },
          { nombre: 'Press banca con mancuernas', grupo_muscular: 'pecho', series: 3, reps: '12', descanso_seg: 75 },
          { nombre: 'Remo con mancuerna', grupo_muscular: 'espalda', series: 3, reps: '12', descanso_seg: 60 },
          { nombre: 'Press militar con mancuernas', grupo_muscular: 'hombros', series: 3, reps: '12', descanso_seg: 60 },
          { nombre: 'Curl de biceps', grupo_muscular: 'biceps', series: 2, reps: '15', descanso_seg: 45 },
          { nombre: 'Fondos en banco', grupo_muscular: 'triceps', series: 2, reps: '15', descanso_seg: 45 },
        ],
      },
      { dia_semana: 1 },
      {
        dia_semana: 2,
        nombreRutina: 'Full Body',
        gym: [
          { nombre: 'Sentadilla goblet', grupo_muscular: 'piernas', series: 3, reps: '12', descanso_seg: 75 },
          { nombre: 'Press banca con mancuernas', grupo_muscular: 'pecho', series: 3, reps: '12', descanso_seg: 75 },
          { nombre: 'Remo con mancuerna', grupo_muscular: 'espalda', series: 3, reps: '12', descanso_seg: 60 },
          { nombre: 'Press militar con mancuernas', grupo_muscular: 'hombros', series: 3, reps: '12', descanso_seg: 60 },
          { nombre: 'Curl de biceps', grupo_muscular: 'biceps', series: 2, reps: '15', descanso_seg: 45 },
          { nombre: 'Fondos en banco', grupo_muscular: 'triceps', series: 2, reps: '15', descanso_seg: 45 },
        ],
      },
      { dia_semana: 3 },
      {
        dia_semana: 4,
        nombreRutina: 'Full Body',
        gym: [
          { nombre: 'Sentadilla goblet', grupo_muscular: 'piernas', series: 3, reps: '12', descanso_seg: 75 },
          { nombre: 'Press banca con mancuernas', grupo_muscular: 'pecho', series: 3, reps: '12', descanso_seg: 75 },
          { nombre: 'Remo con mancuerna', grupo_muscular: 'espalda', series: 3, reps: '12', descanso_seg: 60 },
          { nombre: 'Press militar con mancuernas', grupo_muscular: 'hombros', series: 3, reps: '12', descanso_seg: 60 },
          { nombre: 'Curl de biceps', grupo_muscular: 'biceps', series: 2, reps: '15', descanso_seg: 45 },
          { nombre: 'Fondos en banco', grupo_muscular: 'triceps', series: 2, reps: '15', descanso_seg: 45 },
        ],
      },
      { dia_semana: 5 },
      { dia_semana: 6 },
    ],
  },
  {
    id: 'hipertrofia-intermedio',
    nombre: 'Hipertrofia Torso / Pierna',
    objetivo: 'hipertrofia',
    nivel: 'intermedio',
    descripcion: '4 dias con alto volumen, enfocado en maximizar el crecimiento muscular.',
    dias: [
      {
        dia_semana: 0,
        nombreRutina: 'Torso A',
        gym: [
          { nombre: 'Press banca', grupo_muscular: 'pecho', series: 4, reps: '10', descanso_seg: 90 },
          { nombre: 'Remo en polea', grupo_muscular: 'espalda', series: 4, reps: '10', descanso_seg: 90 },
          { nombre: 'Press inclinado con mancuerna', grupo_muscular: 'pecho', series: 3, reps: '12', descanso_seg: 75 },
          { nombre: 'Jalon al pecho', grupo_muscular: 'espalda', series: 3, reps: '12', descanso_seg: 75 },
          { nombre: 'Curl de biceps', grupo_muscular: 'biceps', series: 3, reps: '15', descanso_seg: 60 },
          { nombre: 'Triceps en cuerda', grupo_muscular: 'triceps', series: 3, reps: '15', descanso_seg: 60 },
        ],
      },
      {
        dia_semana: 1,
        nombreRutina: 'Pierna A',
        gym: [
          { nombre: 'Sentadilla', grupo_muscular: 'piernas', series: 4, reps: '10', descanso_seg: 120 },
          { nombre: 'Peso muerto rumano', grupo_muscular: 'piernas', series: 3, reps: '12', descanso_seg: 90 },
          { nombre: 'Prensa de piernas', grupo_muscular: 'piernas', series: 3, reps: '12', descanso_seg: 90 },
          { nombre: 'Curl femoral', grupo_muscular: 'piernas', series: 3, reps: '15', descanso_seg: 60 },
          { nombre: 'Gemelos de pie', grupo_muscular: 'piernas', series: 4, reps: '15', descanso_seg: 45 },
        ],
      },
      { dia_semana: 2 },
      {
        dia_semana: 3,
        nombreRutina: 'Torso B',
        gym: [
          { nombre: 'Press inclinado con barra', grupo_muscular: 'pecho', series: 4, reps: '10', descanso_seg: 90 },
          { nombre: 'Remo con mancuerna', grupo_muscular: 'espalda', series: 4, reps: '10', descanso_seg: 90 },
          { nombre: 'Elevaciones laterales', grupo_muscular: 'hombros', series: 4, reps: '15', descanso_seg: 60 },
          { nombre: 'Face pull', grupo_muscular: 'hombros', series: 3, reps: '15', descanso_seg: 60 },
          { nombre: 'Curl martillo', grupo_muscular: 'biceps', series: 3, reps: '12', descanso_seg: 60 },
          { nombre: 'Fondos en banco', grupo_muscular: 'triceps', series: 3, reps: '12', descanso_seg: 60 },
        ],
      },
      {
        dia_semana: 4,
        nombreRutina: 'Pierna B',
        gym: [
          { nombre: 'Sentadilla frontal', grupo_muscular: 'piernas', series: 4, reps: '10', descanso_seg: 120 },
          { nombre: 'Zancadas', grupo_muscular: 'piernas', series: 3, reps: '12', descanso_seg: 90 },
          { nombre: 'Hip thrust', grupo_muscular: 'piernas', series: 3, reps: '12', descanso_seg: 90 },
          { nombre: 'Curl femoral', grupo_muscular: 'piernas', series: 3, reps: '15', descanso_seg: 60 },
          { nombre: 'Gemelos de pie', grupo_muscular: 'piernas', series: 4, reps: '15', descanso_seg: 45 },
        ],
      },
      { dia_semana: 5 },
      { dia_semana: 6 },
    ],
  },
  {
    id: 'hipertrofia-experto',
    nombre: 'Hipertrofia Bro Split',
    objetivo: 'hipertrofia',
    nivel: 'experto',
    descripcion: '5 dias, un grupo muscular protagonista por dia, para especializacion maxima.',
    dias: [
      {
        dia_semana: 0,
        nombreRutina: 'Pecho',
        gym: [
          { nombre: 'Press banca', grupo_muscular: 'pecho', series: 4, reps: '8-10', descanso_seg: 90 },
          { nombre: 'Press inclinado con mancuerna', grupo_muscular: 'pecho', series: 4, reps: '10', descanso_seg: 90 },
          { nombre: 'Aperturas con mancuernas', grupo_muscular: 'pecho', series: 3, reps: '15', descanso_seg: 60 },
          { nombre: 'Fondos en paralelas', grupo_muscular: 'pecho', series: 3, reps: '12', descanso_seg: 60 },
          { nombre: 'Press en maquina', grupo_muscular: 'pecho', series: 3, reps: '12', descanso_seg: 60 },
        ],
      },
      {
        dia_semana: 1,
        nombreRutina: 'Espalda',
        gym: [
          { nombre: 'Dominadas', grupo_muscular: 'espalda', series: 4, reps: '8', descanso_seg: 90 },
          { nombre: 'Remo con barra', grupo_muscular: 'espalda', series: 4, reps: '10', descanso_seg: 90 },
          { nombre: 'Jalon al pecho', grupo_muscular: 'espalda', series: 3, reps: '12', descanso_seg: 75 },
          { nombre: 'Remo en maquina', grupo_muscular: 'espalda', series: 3, reps: '12', descanso_seg: 75 },
          { nombre: 'Pull-over', grupo_muscular: 'espalda', series: 3, reps: '15', descanso_seg: 60 },
        ],
      },
      {
        dia_semana: 2,
        nombreRutina: 'Hombros',
        gym: [
          { nombre: 'Press militar', grupo_muscular: 'hombros', series: 4, reps: '8', descanso_seg: 90 },
          { nombre: 'Elevaciones laterales', grupo_muscular: 'hombros', series: 4, reps: '15', descanso_seg: 60 },
          { nombre: 'Elevaciones posteriores', grupo_muscular: 'hombros', series: 4, reps: '15', descanso_seg: 60 },
          { nombre: 'Face pull', grupo_muscular: 'hombros', series: 3, reps: '15', descanso_seg: 60 },
          { nombre: 'Encogimientos', grupo_muscular: 'hombros', series: 3, reps: '15', descanso_seg: 45 },
        ],
      },
      {
        dia_semana: 3,
        nombreRutina: 'Piernas',
        gym: [
          { nombre: 'Sentadilla', grupo_muscular: 'piernas', series: 4, reps: '10', descanso_seg: 120 },
          { nombre: 'Peso muerto rumano', grupo_muscular: 'piernas', series: 4, reps: '10', descanso_seg: 120 },
          { nombre: 'Prensa de piernas', grupo_muscular: 'piernas', series: 3, reps: '12', descanso_seg: 90 },
          { nombre: 'Curl femoral', grupo_muscular: 'piernas', series: 3, reps: '15', descanso_seg: 60 },
          { nombre: 'Gemelos de pie', grupo_muscular: 'piernas', series: 4, reps: '20', descanso_seg: 45 },
        ],
      },
      {
        dia_semana: 4,
        nombreRutina: 'Brazos',
        gym: [
          { nombre: 'Curl con barra', grupo_muscular: 'biceps', series: 4, reps: '10', descanso_seg: 60 },
          { nombre: 'Curl martillo', grupo_muscular: 'biceps', series: 3, reps: '12', descanso_seg: 60 },
          { nombre: 'Curl concentrado', grupo_muscular: 'biceps', series: 3, reps: '15', descanso_seg: 45 },
          { nombre: 'Triceps en polea', grupo_muscular: 'triceps', series: 4, reps: '10', descanso_seg: 60 },
          { nombre: 'Fondos en banco', grupo_muscular: 'triceps', series: 3, reps: '12', descanso_seg: 60 },
          { nombre: 'Triceps frances', grupo_muscular: 'triceps', series: 3, reps: '15', descanso_seg: 45 },
        ],
      },
      { dia_semana: 5 },
      { dia_semana: 6 },
    ],
  },

  // ============================= PERDIDA DE PESO =============================
  {
    id: 'perdida-peso-principiante',
    nombre: 'Quema Grasa Full Body',
    objetivo: 'perdida_peso',
    nivel: 'principiante',
    descripcion: 'Combina circuitos de fuerza con cardio suave, 4 dias activos y buen descanso.',
    dias: [
      {
        dia_semana: 0,
        nombreRutina: 'Circuito Full Body',
        gym: [
          { nombre: 'Sentadilla', grupo_muscular: 'piernas', series: 3, reps: '15', descanso_seg: 45 },
          { nombre: 'Flexiones de rodillas', grupo_muscular: 'pecho', series: 3, reps: '12', descanso_seg: 45 },
          { nombre: 'Remo con mancuerna', grupo_muscular: 'espalda', series: 3, reps: '15', descanso_seg: 45 },
          { nombre: 'Plancha', grupo_muscular: 'core', series: 3, reps: '30 seg', descanso_seg: 30 },
        ],
      },
      {
        dia_semana: 1,
        nombreRutina: 'Cardio suave',
        cardio: { nombre: 'Trote o bicicleta suave', tipo_actividad: 'running', duracion_min: 25, notas: 'Ritmo comodo, puedes hablar sin ahogarte' },
      },
      { dia_semana: 2 },
      {
        dia_semana: 3,
        nombreRutina: 'Circuito Full Body',
        gym: [
          { nombre: 'Sentadilla', grupo_muscular: 'piernas', series: 3, reps: '15', descanso_seg: 45 },
          { nombre: 'Flexiones de rodillas', grupo_muscular: 'pecho', series: 3, reps: '12', descanso_seg: 45 },
          { nombre: 'Remo con mancuerna', grupo_muscular: 'espalda', series: 3, reps: '15', descanso_seg: 45 },
          { nombre: 'Plancha', grupo_muscular: 'core', series: 3, reps: '30 seg', descanso_seg: 30 },
        ],
      },
      {
        dia_semana: 4,
        nombreRutina: 'Cardio suave',
        cardio: { nombre: 'Trote o bicicleta suave', tipo_actividad: 'running', duracion_min: 25, notas: 'Ritmo comodo, puedes hablar sin ahogarte' },
      },
      { dia_semana: 5, nombreRutina: 'Caminata larga', cardio: { nombre: 'Caminata', tipo_actividad: 'running', duracion_min: 45, notas: 'Ritmo ligero, ideal al aire libre' } },
      { dia_semana: 6 },
    ],
  },
  {
    id: 'perdida-peso-intermedio',
    nombre: 'Quema Grasa Fuerza + Cardio',
    objetivo: 'perdida_peso',
    nivel: 'intermedio',
    descripcion: '5 dias combinando fuerza con descansos cortos, un HIIT y cardio de mayor duracion.',
    dias: [
      {
        dia_semana: 0,
        nombreRutina: 'Circuito Full Body A',
        gym: [
          { nombre: 'Sentadilla con salto', grupo_muscular: 'piernas', series: 4, reps: '12', descanso_seg: 40 },
          { nombre: 'Press banca con mancuernas', grupo_muscular: 'pecho', series: 4, reps: '12', descanso_seg: 40 },
          { nombre: 'Remo con barra', grupo_muscular: 'espalda', series: 4, reps: '12', descanso_seg: 40 },
          { nombre: 'Press militar con mancuernas', grupo_muscular: 'hombros', series: 3, reps: '15', descanso_seg: 40 },
        ],
      },
      { dia_semana: 1, nombreRutina: 'Cardio moderado', cardio: { nombre: 'Trote continuo', tipo_actividad: 'running', duracion_min: 30, notas: 'Ritmo moderado sostenido' } },
      { dia_semana: 2 },
      {
        dia_semana: 3,
        nombreRutina: 'Circuito Full Body B',
        gym: [
          { nombre: 'Peso muerto rumano', grupo_muscular: 'piernas', series: 4, reps: '12', descanso_seg: 40 },
          { nombre: 'Fondos en paralelas', grupo_muscular: 'pecho', series: 4, reps: '12', descanso_seg: 40 },
          { nombre: 'Jalon al pecho', grupo_muscular: 'espalda', series: 4, reps: '12', descanso_seg: 40 },
          { nombre: 'Elevaciones laterales', grupo_muscular: 'hombros', series: 3, reps: '15', descanso_seg: 40 },
        ],
      },
      { dia_semana: 4, nombreRutina: 'HIIT', cardio: { nombre: 'Intervalos de alta intensidad', tipo_actividad: 'running', duracion_min: 20, notas: '30s fuerte / 30s suave, repetir' } },
      { dia_semana: 5, nombreRutina: 'Cardio largo', cardio: { nombre: 'Trote o bicicleta', tipo_actividad: 'running', duracion_min: 45, notas: 'Ritmo comodo y sostenido' } },
      { dia_semana: 6 },
    ],
  },
  {
    id: 'perdida-peso-experto',
    nombre: 'Recomposicion Corporal Avanzada',
    objetivo: 'perdida_peso',
    nivel: 'experto',
    descripcion: '6 dias alternando fuerza pesada, HIIT y cardio de baja intensidad para maximizar el gasto calorico.',
    dias: [
      {
        dia_semana: 0,
        nombreRutina: 'Fuerza Full Body A',
        gym: [
          { nombre: 'Sentadilla', grupo_muscular: 'piernas', series: 4, reps: '8', descanso_seg: 90 },
          { nombre: 'Press banca', grupo_muscular: 'pecho', series: 4, reps: '8', descanso_seg: 90 },
          { nombre: 'Remo con barra', grupo_muscular: 'espalda', series: 4, reps: '8', descanso_seg: 90 },
          { nombre: 'Press militar', grupo_muscular: 'hombros', series: 3, reps: '10', descanso_seg: 75 },
        ],
      },
      { dia_semana: 1, nombreRutina: 'HIIT', cardio: { nombre: 'Intervalos de alta intensidad', tipo_actividad: 'running', duracion_min: 25, notas: '40s fuerte / 20s suave, repetir' } },
      {
        dia_semana: 2,
        nombreRutina: 'Fuerza Full Body B',
        gym: [
          { nombre: 'Peso muerto', grupo_muscular: 'piernas', series: 4, reps: '6', descanso_seg: 120 },
          { nombre: 'Press inclinado con mancuerna', grupo_muscular: 'pecho', series: 4, reps: '10', descanso_seg: 90 },
          { nombre: 'Dominadas', grupo_muscular: 'espalda', series: 4, reps: '8', descanso_seg: 90 },
          { nombre: 'Elevaciones laterales', grupo_muscular: 'hombros', series: 3, reps: '15', descanso_seg: 60 },
        ],
      },
      { dia_semana: 3, nombreRutina: 'Cardio moderado', cardio: { nombre: 'Trote continuo', tipo_actividad: 'running', duracion_min: 40, notas: 'Ritmo moderado' } },
      {
        dia_semana: 4,
        nombreRutina: 'Circuito metabolico',
        gym: [
          { nombre: 'Burpees', grupo_muscular: 'general', series: 4, reps: '15', descanso_seg: 30 },
          { nombre: 'Zancadas con salto', grupo_muscular: 'piernas', series: 4, reps: '15', descanso_seg: 30 },
          { nombre: 'Flexiones', grupo_muscular: 'pecho', series: 4, reps: '15', descanso_seg: 30 },
          { nombre: 'Mountain climbers', grupo_muscular: 'core', series: 4, reps: '30 seg', descanso_seg: 30 },
        ],
      },
      { dia_semana: 5, nombreRutina: 'Cardio largo', cardio: { nombre: 'Trote o bicicleta', tipo_actividad: 'running', duracion_min: 60, notas: 'Ritmo comodo y sostenido' } },
      { dia_semana: 6 },
    ],
  },

  // Nota: las plantillas de Resistencia/Running (5K, 10K, media maraton) se
  // quitaron de aqui — quedaron reemplazadas por la pestana "Running" del
  // selector de plan (lib/plan-running.ts), que arma un plan periodizado de
  // verdad (fases base/build/peak/taper, progresion del fondo largo, fuerza
  // y pliometria) con ritmos en min/km calculados de un test inicial, en vez
  // de una sola plantilla generica que se repite igual todas las semanas.
]

interface RutinaEjercicioInsert {
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
}

// Crea en la cuenta del usuario todas las rutinas/ejercicios/plan/calendario
// que describe una plantilla, y la deja como el plan activo. Devuelve el
// plan completo (con sus dias y rutinas) listo para pintar en pantalla.
export async function aplicarPlantilla(
  supabase: SupabaseClient,
  usuarioId: string,
  plantilla: PlanPlantilla
): Promise<PlanConDias> {
  await supabase.from('planes_entrenamiento').update({ activo: false }).eq('usuario_id', usuarioId).eq('activo', true)

  const nombresNecesarios = new Map<string, GrupoMuscular>()
  for (const dia of plantilla.dias) {
    if (dia.gym) for (const ej of dia.gym) nombresNecesarios.set(ej.nombre, ej.grupo_muscular)
    if (dia.cardio) nombresNecesarios.set(dia.cardio.nombre, 'piernas')
  }

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

  const diasConRutina = plantilla.dias.filter((d) => d.gym || d.cardio)
  const tipoPorDia: TipoRutina[] = diasConRutina.map((d) => (d.gym ? 'gym' : 'cardio'))

  const { data: rutinasCreadas, error: errorRutinas } = await supabase
    .from('rutinas')
    .insert(
      diasConRutina.map((d, i) => ({
        usuario_id: usuarioId,
        nombre: (d.nombreRutina ?? d.cardio?.nombre ?? 'Entrenamiento') as string,
        tipo: tipoPorDia[i],
        objetivo: plantilla.objetivo,
        nivel: plantilla.nivel,
      }))
    )
    .select('id')
  if (errorRutinas || !rutinasCreadas) throw errorRutinas ?? new Error('No se pudo crear la rutina')

  const filasEjercicios: RutinaEjercicioInsert[] = []
  diasConRutina.forEach((d, i) => {
    const rutinaId = rutinasCreadas[i].id as string
    if (d.gym) {
      d.gym.forEach((ej, orden) => {
        filasEjercicios.push({
          usuario_id: usuarioId,
          rutina_id: rutinaId,
          ejercicio_id: idPorNombre.get(ej.nombre)!,
          orden,
          series_objetivo: ej.series,
          reps_objetivo: ej.reps,
          peso_objetivo: null,
          descanso_seg: ej.descanso_seg,
          tipo_actividad: null,
          distancia_objetivo_km: null,
          duracion_objetivo_min: null,
          notas_cardio: null,
        })
      })
    } else if (d.cardio) {
      filasEjercicios.push({
        usuario_id: usuarioId,
        rutina_id: rutinaId,
        ejercicio_id: idPorNombre.get(d.cardio.nombre)!,
        orden: 0,
        series_objetivo: 1,
        reps_objetivo: '',
        peso_objetivo: null,
        descanso_seg: 0,
        tipo_actividad: d.cardio.tipo_actividad,
        distancia_objetivo_km: d.cardio.distancia_km ?? null,
        duracion_objetivo_min: d.cardio.duracion_min ?? null,
        notas_cardio: d.cardio.notas ?? null,
      })
    }
  })

  const { data: filasCreadas, error: errorFilas } = await supabase
    .from('rutina_ejercicios')
    .insert(filasEjercicios)
    .select('*, ejercicio:ejercicios(*)')
  if (errorFilas) throw errorFilas

  const ejerciciosPorRutina = new Map<string, RutinaEjercicio[]>()
  for (const fila of (filasCreadas ?? []) as RutinaEjercicio[]) {
    const lista = ejerciciosPorRutina.get(fila.rutina_id) ?? []
    lista.push(fila)
    ejerciciosPorRutina.set(fila.rutina_id, lista)
  }

  const rutinasPorId = new Map<string, RutinaConEjercicios>()
  diasConRutina.forEach((d, i) => {
    const id = rutinasCreadas[i].id as string
    rutinasPorId.set(id, {
      id,
      usuario_id: usuarioId,
      nombre: (d.nombreRutina ?? d.cardio?.nombre ?? 'Entrenamiento') as string,
      tipo: tipoPorDia[i],
      objetivo: plantilla.objetivo,
      nivel: plantilla.nivel,
      created_at: new Date().toISOString(),
      ejercicios: ejerciciosPorRutina.get(id) ?? [],
    })
  })

  const { data: plan, error: errorPlan } = await supabase
    .from('planes_entrenamiento')
    .insert({ usuario_id: usuarioId, nombre: plantilla.nombre, objetivo: plantilla.objetivo, nivel: plantilla.nivel, activo: true })
    .select()
    .single()
  if (errorPlan || !plan) throw errorPlan ?? new Error('No se pudo crear el plan')

  let cursor = 0
  const filasDias = plantilla.dias.map((d) => {
    if (d.gym || d.cardio) {
      const rutinaId = rutinasCreadas[cursor].id as string
      cursor++
      return { usuario_id: usuarioId, plan_id: plan.id, dia_semana: d.dia_semana, rutina_id: rutinaId, descanso: false }
    }
    return { usuario_id: usuarioId, plan_id: plan.id, dia_semana: d.dia_semana, rutina_id: null, descanso: true }
  })

  const { data: diasCreados, error: errorDias } = await supabase.from('plan_dias').insert(filasDias).select()
  if (errorDias || !diasCreados) throw errorDias ?? new Error('No se pudo crear el calendario del plan')

  const dias = diasCreados
    .map((d) => ({ ...d, rutina: d.rutina_id ? rutinasPorId.get(d.rutina_id) : undefined }))
    .sort((a, b) => a.dia_semana - b.dia_semana)

  return { ...plan, dias } as PlanConDias
}
