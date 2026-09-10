// Motor de gamificacion: XP, niveles y rangos.
// El nivel N requiere que se acumulen N*200 XP desde el nivel N (progresion triangular),
// exactamente igual a la logica de la funcion `add_xp` en supabase/migrations/001_init.sql.

export const XP_TABLE = {
  habito: 30,
  tarea: 30,
  entrenamiento: 40,
  meta_completa: 1000,
  racha_7: 500,
} as const

export const RANGOS = [
  { nivelMin: 1, nombre: 'Novato' },
  { nivelMin: 5, nombre: 'Aprendiz' },
  { nivelMin: 10, nombre: 'Disciplinado' },
  { nivelMin: 15, nombre: 'Guerrero' },
  { nivelMin: 25, nombre: 'Elite' },
  { nivelMin: 40, nombre: 'Macho Alfa' },
  { nivelMin: 60, nombre: 'Titan' },
  { nivelMin: 100, nombre: 'Leyenda' },
] as const

export function getRango(nivel: number) {
  let actual: (typeof RANGOS)[number] = RANGOS[0]
  for (const r of RANGOS) {
    if (nivel >= r.nivelMin) actual = r
  }
  return actual.nombre
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
