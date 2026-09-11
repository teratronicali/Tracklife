// Motor de gamificacion: XP, niveles y rangos.
// El nivel N requiere que se acumulen N*200 XP desde el nivel N (progresion triangular),
// exactamente igual a la logica de la funcion `add_xp` en supabase/migrations/001_init.sql.

export const XP_TABLE = {
  habito: 30,
  tarea: 30,
  entrenamiento: 40,
  finanzas: 10,
  nutricion: 10,
  meta_completa: 1000,
  racha_7: 500,
} as const

// Etiqueta tematica que acompana el toast de "+XP" segun el tipo de accion.
export const ETIQUETA_XP: Record<string, string> = {
  habito: 'Disciplina',
  habito_revertido: 'Disciplina',
  tarea: 'Enfoque',
  entrenamiento: 'Fuerza',
  entrenamiento_strava: 'Fuerza',
  finanzas: 'Riqueza',
  nutricion: 'Nutricion',
  meta_completa: 'Vision',
  racha_bonus: 'Racha',
}

// Rangos: entre mas alto, mas dificil de alcanzar (la curva de XP es triangular,
// asi que los ultimos rangos son deliberadamente aspiracionales).
export const RANGOS = [
  { nivelMin: 1, nombre: 'Novato', emoji: '🌱' },
  { nivelMin: 5, nombre: 'Aprendiz', emoji: '🔰' },
  { nivelMin: 10, nombre: 'Disciplinado', emoji: '🎯' },
  { nivelMin: 15, nombre: 'Guerrero', emoji: '⚔️' },
  { nivelMin: 20, nombre: 'Cazador de Metas', emoji: '🏹' },
  { nivelMin: 28, nombre: 'Estratega', emoji: '🧠' },
  { nivelMin: 36, nombre: 'Elite', emoji: '💎' },
  { nivelMin: 45, nombre: 'Campeon', emoji: '🏆' },
  { nivelMin: 60, nombre: 'Macho Alfa', emoji: '🐺' },
  { nivelMin: 80, nombre: 'Titan', emoji: '🗿' },
  { nivelMin: 110, nombre: 'Maestro', emoji: '👑' },
  { nivelMin: 150, nombre: 'Leyenda', emoji: '🔥' },
  { nivelMin: 200, nombre: 'Inmortal', emoji: '⚡' },
] as const

export function getRango(nivel: number) {
  let actual: (typeof RANGOS)[number] = RANGOS[0]
  for (const r of RANGOS) {
    if (nivel >= r.nivelMin) actual = r
  }
  return actual.nombre
}

export function getRangoInfo(nivel: number) {
  let actual: (typeof RANGOS)[number] = RANGOS[0]
  for (const r of RANGOS) {
    if (nivel >= r.nivelMin) actual = r
  }
  return actual
}

export function siguienteRango(nivel: number) {
  const siguiente = RANGOS.find((r) => r.nivelMin > nivel)
  return siguiente?.nombre ?? null
}

export interface NivelInfo {
  nivel: number
  xpTotal: number
  xpEnNivel: number
  xpParaSiguiente: number
  progreso: number // 0..1
}

export function calcularNivelInfo(xpTotal: number): NivelInfo {
  let nivel = 1
  let restante = xpTotal
  while (restante >= nivel * 200) {
    restante -= nivel * 200
    nivel += 1
  }
  const xpParaSiguiente = nivel * 200
  return {
    nivel,
    xpTotal,
    xpEnNivel: restante,
    xpParaSiguiente,
    progreso: xpParaSiguiente > 0 ? restante / xpParaSiguiente : 0,
  }
}
