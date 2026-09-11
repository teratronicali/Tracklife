import type { Perfil } from '@/lib/types'

// Ajusta este precio a lo que quieras cobrar por el Acceso Vitalicio.
// unit_amount va en centavos (1900 = $19.00 USD).
export const PRECIO = {
  unit_amount: 1900,
  moneda: 'usd',
  display: '$19',
  nombreProducto: 'TrackLife — Acceso Vitalicio',
}

export const LIMITES_GRATIS = {
  habitos: 3,
  metas: 2,
  tareas: 5,
} as const

export function esVitalicio(perfil: Pick<Perfil, 'plan'>) {
  return perfil.plan === 'vitalicio'
}

export function puedeCrear(perfil: Pick<Perfil, 'plan'>, tipo: keyof typeof LIMITES_GRATIS, cantidadActual: number) {
  if (esVitalicio(perfil)) return true
  return cantidadActual < LIMITES_GRATIS[tipo]
}

export const MENSAJE_LIMITE: Record<keyof typeof LIMITES_GRATIS, string> = {
  habitos: `Con el plan gratis puedes tener hasta ${LIMITES_GRATIS.habitos} habitos activos. Mejora a Vitalicio para tener habitos ilimitados.`,
  metas: `Con el plan gratis puedes tener hasta ${LIMITES_GRATIS.metas} metas activas. Mejora a Vitalicio para tener metas ilimitadas.`,
  tareas: `Con el plan gratis puedes tener hasta ${LIMITES_GRATIS.tareas} tareas. Mejora a Vitalicio para tareas ilimitadas.`,
}
