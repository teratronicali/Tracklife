import toast from 'react-hot-toast'
import { ETIQUETA_XP, getRangoInfo } from '@/lib/gamification'
import type { createClient } from '@/lib/supabase/client'
import type { Perfil } from '@/lib/types'

type SupabaseClient = ReturnType<typeof createClient>

interface OtorgarXPArgs {
  p_xp: number
  p_tipo: string
  p_descripcion?: string
}

// Envuelve el RPC add_xp: muestra el toast de "+XP" con su etiqueta tematica,
// y si el nivel sube, festeja con un segundo toast (mas fuerte si cambia de rango).
export async function otorgarXP(
  supabase: SupabaseClient,
  perfilActual: Pick<Perfil, 'nivel'> | null | undefined,
  args: OtorgarXPArgs
): Promise<Perfil | null> {
  const { data, error } = await supabase.rpc('add_xp', args)
  if (error || !data) return null
  const perfil = data as Perfil

  if (args.p_xp > 0) {
    const etiqueta = ETIQUETA_XP[args.p_tipo] ?? 'XP'
    toast.success(`+${args.p_xp} XP · ${etiqueta}`)
  }

  const nivelAnterior = perfilActual?.nivel
  if (nivelAnterior !== undefined && perfil.nivel > nivelAnterior) {
    const rangoAnterior = getRangoInfo(nivelAnterior)
    const rangoNuevo = getRangoInfo(perfil.nivel)
    const cambioDeRango = rangoNuevo.nombre !== rangoAnterior.nombre
    setTimeout(() => {
      toast.success(
        cambioDeRango
          ? `${rangoNuevo.emoji} ¡Ahora eres ${rangoNuevo.nombre}! Nivel ${perfil.nivel}`
          : `🎮 ¡Subiste a Nivel ${perfil.nivel}!`,
        { duration: 6000 }
      )
    }, 450)
  }

  return perfil
}
