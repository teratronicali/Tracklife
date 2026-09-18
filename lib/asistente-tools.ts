import type Anthropic from '@anthropic-ai/sdk'
import { CATEGORIAS_GASTO, CATEGORIAS_INGRESO, TIPOS_META } from '@/lib/types'

// Herramientas que el asistente de IA puede usar. Cada una mapea 1:1 a una
// mutacion controlada (ver lib/asistente-ejecutar.ts) — el modelo nunca toca
// la base de datos directamente, solo elige la herramienta y sus argumentos.
export const HERRAMIENTAS_ASISTENTE: Anthropic.Tool[] = [
  {
    name: 'crear_gasto',
    description: 'Registra un gasto de dinero. Usala cuando la persona diga que gasto, pago, compro o debe algo.',
    input_schema: {
      type: 'object',
      properties: {
        monto: { type: 'number', description: 'Monto gastado (numero positivo, sin simbolo de moneda)' },
        categoria: { type: 'string', enum: [...CATEGORIAS_GASTO] },
        descripcion: { type: 'string', description: 'Breve descripcion, ej. "restaurante con amigos"' },
        fecha: { type: 'string', description: 'Fecha en formato YYYY-MM-DD. Si no se menciona, omite este campo (se usa hoy).' },
      },
      required: ['monto', 'categoria'],
    },
  },
  {
    name: 'crear_ingreso',
    description: 'Registra un ingreso de dinero. Usala cuando la persona diga que recibio, gano o le pagaron algo.',
    input_schema: {
      type: 'object',
      properties: {
        monto: { type: 'number', description: 'Monto recibido (numero positivo)' },
        categoria: { type: 'string', enum: [...CATEGORIAS_INGRESO] },
        descripcion: { type: 'string' },
        fecha: { type: 'string', description: 'Fecha en formato YYYY-MM-DD. Si no se menciona, omite este campo (se usa hoy).' },
      },
      required: ['monto', 'categoria'],
    },
  },
  {
    name: 'registrar_entrenamiento',
    description:
      'Registra un entrenamiento ya realizado: un ejercicio de gimnasio (peso/repeticiones) o una actividad de cardio (distancia/duracion). Usala cuando la persona diga que hizo un ejercicio o una actividad fisica.',
    input_schema: {
      type: 'object',
      properties: {
        ejercicio: { type: 'string', description: 'Nombre del ejercicio o actividad, ej. "Press de banca" o "Trote"' },
        peso: { type: 'number', description: 'Peso levantado, en la unidad que use la persona (si aplica)' },
        reps: { type: 'number', description: 'Repeticiones de esa serie (si aplica)' },
        series: { type: 'number', description: 'Numero de series (si no se especifica, asume 1)' },
        distancia_km: { type: 'number', description: 'Distancia recorrida en km (si es una actividad de cardio)' },
        duracion_min: { type: 'number', description: 'Duracion en minutos (si es una actividad de cardio)' },
      },
      required: ['ejercicio'],
    },
  },
  {
    name: 'crear_tarea',
    description: 'Crea una tarea pendiente. Usala cuando la persona diga que tiene que hacer algo, recordar algo o pendiente por hacer.',
    input_schema: {
      type: 'object',
      properties: {
        titulo: { type: 'string', description: 'Que hay que hacer, en pocas palabras' },
        descripcion: { type: 'string', description: 'Detalle adicional si lo hay (ej. con quien, por que)' },
        etiqueta: { type: 'string', description: 'Categoria corta libre, ej. "trabajo", "personal", "casa"' },
      },
      required: ['titulo'],
    },
  },
  {
    name: 'crear_meta',
    description: 'Crea una meta/objetivo nuevo con un monto a alcanzar. Usala cuando la persona diga que quiere lograr, ahorrar o alcanzar algo.',
    input_schema: {
      type: 'object',
      properties: {
        titulo: { type: 'string' },
        tipo: { type: 'string', enum: TIPOS_META.map((t) => t.id) },
        monto_objetivo: { type: 'number', description: 'Monto o cantidad a alcanzar (numero positivo)' },
        dias_objetivo: { type: 'number', description: 'En cuantos dias quiere lograrlo, si lo menciona' },
      },
      required: ['titulo', 'tipo', 'monto_objetivo'],
    },
  },
  {
    name: 'crear_habito',
    description: 'Crea un habito nuevo para seguir dia a dia. Usala cuando la persona diga que quiere empezar a hacer algo regularmente.',
    input_schema: {
      type: 'object',
      properties: {
        nombre: { type: 'string' },
        emoji: { type: 'string', description: 'Un solo emoji representativo del habito' },
        momento: { type: 'string', enum: ['manana', 'tarde', 'noche'], description: 'Cuando se hace el habito. Si no se menciona, usa "manana".' },
      },
      required: ['nombre'],
    },
  },
  {
    name: 'consultar_progreso',
    description:
      'Consulta el progreso actual de la persona: nivel, XP, racha, gastos del mes, tareas pendientes y habitos de hoy. Usala cuando pregunten como van, su progreso, resumen o estadisticas.',
    input_schema: { type: 'object', properties: {} },
  },
]
