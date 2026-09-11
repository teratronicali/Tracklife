'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check } from 'lucide-react'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'
import { otorgarXP } from '@/lib/xp-client'
import type { Habito, Perfil } from '@/lib/types'

const MOMENTO_LABEL: Record<string, string> = {
  manana: 'Manana',
  tarde: 'Tarde',
  noche: 'Noche',
}

export default function HabitosHoyWidget({
  habitos,
  completadosHoy,
  perfil,
}: {
  habitos: Habito[]
  completadosHoy: string[]
  perfil: Perfil
}) {
  const supabase = createClient()
  const router = useRouter()
  const [hechos, setHechos] = useState(new Set(completadosHoy))
  const [cargando, setCargando] = useState<string | null>(null)

  async function marcar(habito: Habito) {
    if (cargando) return
    const yaHecho = hechos.has(habito.id)
    setCargando(habito.id)

    if (yaHecho) {
      await supabase
        .from('habito_registros')
        .delete()
        .eq('habito_id', habito.id)
        .eq('fecha', new Date().toISOString().slice(0, 10))
      await otorgarXP(supabase, perfil, { p_xp: -habito.xp_valor, p_tipo: 'habito_revertido' })
    } else {
      const { error } = await supabase.from('habito_registros').insert({
        habito_id: habito.id,
        usuario_id: habito.usuario_id,
      })
      if (error) {
        toast.error('No se pudo registrar el habito')
        setCargando(null)
        return
      }
      await otorgarXP(supabase, perfil, {
        p_xp: habito.xp_valor,
        p_tipo: 'habito',
        p_descripcion: habito.nombre,
      })
    }

    await supabase.rpc('recalcular_racha')

    setHechos((prev) => {
      const next = new Set(prev)
      if (yaHecho) next.delete(habito.id)
      else next.add(habito.id)
      return next
    })
    setCargando(null)
    router.refresh()
  }

  if (habitos.length === 0) {
    return <p className="text-xs text-muted">Aun no tienes habitos. Crea el primero en la seccion Habitos.</p>
  }

  return (
    <div className="space-y-1.5">
      {habitos.map((h) => {
        const hecho = hechos.has(h.id)
        return (
          <button
            key={h.id}
            onClick={() => marcar(h)}
            disabled={cargando === h.id}
            className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-surface-2 transition-colors border border-border text-left disabled:opacity-60"
          >
            <span
              className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 border ${
                hecho ? 'text-white' : 'text-transparent'
              }`}
              style={{
                background: hecho ? 'var(--tl-blue)' : 'transparent',
                borderColor: hecho ? 'var(--tl-blue)' : 'var(--tl-border)',
              }}
            >
              <Check size={13} />
            </span>
            <span className="text-lg leading-none">{h.emoji}</span>
            <span className={`flex-1 text-sm ${hecho ? 'line-through text-muted' : ''}`}>{h.nombre}</span>
            <span className="text-[10px] text-muted">{MOMENTO_LABEL[h.momento]}</span>
            <span className="pill">+{h.xp_valor} XP</span>
          </button>
        )
      })}
    </div>
  )
}
