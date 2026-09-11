'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Check, Crown, Loader2, ShieldCheck } from 'lucide-react'
import toast from 'react-hot-toast'
import { PRECIO, esVitalicio } from '@/lib/planes'
import type { Perfil } from '@/lib/types'

const CARACTERISTICAS = [
  'Habitos, metas y tareas ilimitados',
  'Todos los modulos: finanzas, entrenamiento, dieta',
  'Integracion con Strava',
  'Sistema de XP, niveles y leaderboard',
  'Todas las actualizaciones futuras',
]

export default function PrecioView({ perfil }: { perfil: Perfil }) {
  const searchParams = useSearchParams()
  const [cargando, setCargando] = useState(false)
  const vitalicio = esVitalicio(perfil)

  useEffect(() => {
    const estado = searchParams.get('compra')
    if (estado === 'exitosa') toast.success('Pago recibido. Tu acceso se activa en unos segundos.')
    if (estado === 'cancelada') toast('Compra cancelada', { icon: 'ℹ️' })
  }, [searchParams])

  async function comprar() {
    setCargando(true)
    try {
      const res = await fetch('/api/stripe/checkout', { method: 'POST' })
      const data = await res.json()
      if (!res.ok || !data.url) throw new Error(data.error ?? 'No se pudo iniciar el pago')
      window.location.href = data.url
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No se pudo iniciar el pago')
      setCargando(false)
    }
  }

  return (
    <div className="flex flex-col min-h-full bg-background">
      <div className="brand-stripe" />
      <div className="bg-surface border-b border-border px-6 py-4">
        <h1 className="text-base font-medium">Precio</h1>
        <p className="text-xs text-muted mt-0.5">Un pago, acceso de por vida</p>
      </div>

      <div className="p-5 flex justify-center">
        <div className="card p-7 max-w-sm w-full text-center">
          {vitalicio ? (
            <>
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{ background: 'var(--tl-blue-dim)' }}
              >
                <Crown size={26} style={{ color: 'var(--tl-blue)' }} />
              </div>
              <h2 className="text-lg font-medium mb-1">Ya tienes Acceso Vitalicio</h2>
              <p className="text-xs text-muted">
                Gracias por tu apoyo. Tienes acceso ilimitado a todos los modulos de TrackLife para siempre.
              </p>
            </>
          ) : (
            <>
              <p className="text-xs text-muted mb-2">Acceso Vitalicio</p>
              <p className="text-5xl font-semibold mb-1">{PRECIO.display}</p>
              <p className="text-[11px] text-muted mb-6">pago unico · acceso de por vida</p>

              <ul className="text-left space-y-2.5 mb-6">
                {CARACTERISTICAS.map((c) => (
                  <li key={c} className="flex items-start gap-2 text-xs">
                    <Check size={14} className="shrink-0 mt-0.5" style={{ color: 'var(--tl-blue)' }} />
                    <span>{c}</span>
                  </li>
                ))}
              </ul>

              <button onClick={comprar} disabled={cargando} className="btn-tl-blue w-full text-sm py-3">
                {cargando ? <Loader2 size={15} className="animate-spin" /> : <Crown size={15} />}
                Comprar Acceso Vitalicio
              </button>

              <div className="flex items-center justify-center gap-1.5 text-[11px] text-muted mt-4">
                <ShieldCheck size={13} />
                Garantia de 7 dias — si no te convence, te devolvemos tu dinero
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
