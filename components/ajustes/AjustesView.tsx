'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { RefreshCw, Unlink, Loader2, Activity, ListChecks } from 'lucide-react'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'
import { formatMoney } from '@/lib/utils'
import { DEPORTES } from '@/lib/onboarding'
import type { IntegracionStrava, Perfil } from '@/lib/types'

export default function AjustesView({
  perfil,
  integracionStrava,
}: {
  perfil: Perfil
  integracionStrava: IntegracionStrava | null
}) {
  const supabase = createClient()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [integracion, setIntegracion] = useState(integracionStrava)
  const [sincronizando, setSincronizando] = useState(false)
  const [desconectando, setDesconectando] = useState(false)
  const [rehaciendo, setRehaciendo] = useState(false)

  useEffect(() => {
    const estado = searchParams.get('strava')
    if (estado === 'conectado') toast.success('Strava conectado')
    if (estado === 'error') toast.error('No se pudo conectar con Strava')
    if (estado === 'no_configurado') toast.error('La integracion de Strava aun no esta configurada')
  }, [searchParams])

  async function sincronizar() {
    setSincronizando(true)
    try {
      const res = await fetch('/api/strava/sync', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Error al sincronizar')
      toast.success(`${data.importadas} actividad(es) importada(s)`)
      router.refresh()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error al sincronizar')
    } finally {
      setSincronizando(false)
    }
  }

  async function desconectar() {
    setDesconectando(true)
    const res = await fetch('/api/strava/disconnect', { method: 'POST' })
    if (res.ok) {
      setIntegracion(null)
      toast.success('Strava desconectado')
    } else {
      toast.error('No se pudo desconectar')
    }
    setDesconectando(false)
  }

  async function rehacerOnboarding() {
    setRehaciendo(true)
    const { error } = await supabase.from('perfiles').update({ onboarding_completado: false }).eq('id', perfil.id)
    if (error) {
      toast.error('No se pudo reiniciar el cuestionario')
      setRehaciendo(false)
      return
    }
    router.push('/onboarding')
  }

  return (
    <div className="flex flex-col min-h-full bg-background">
      <div className="brand-stripe" />
      <div className="bg-surface border-b border-border px-6 py-4">
        <h1 className="text-base font-medium">Ajustes</h1>
        <p className="text-xs text-muted mt-0.5">Tu perfil, personalizacion e integraciones</p>
      </div>

      <div className="p-5 space-y-5 max-w-2xl">
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium flex items-center gap-2">
              <ListChecks size={15} /> Tu personalizacion
            </h2>
            <button onClick={rehacerOnboarding} disabled={rehaciendo} className="btn-tl text-[11px]">
              {rehaciendo ? <Loader2 size={13} className="animate-spin" /> : null}
              Rehacer cuestionario
            </button>
          </div>
          <div className="space-y-3 text-xs">
            <div className="flex justify-between">
              <span className="text-muted">Nombre</span>
              <span>{perfil.nombre}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Deportes</span>
              <span>
                {perfil.deportes.length > 0
                  ? perfil.deportes.map((id) => DEPORTES.find((d) => d.id === id)?.label ?? id).join(', ')
                  : 'Ninguno seleccionado'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Enfoque financiero</span>
              <span>{perfil.enfoque_financiero.length > 0 ? perfil.enfoque_financiero.join(', ') : '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Presupuesto mensual</span>
              <span>{perfil.presupuesto_mensual ? formatMoney(perfil.presupuesto_mensual) : '—'}</span>
            </div>
          </div>
        </div>

        <div className="card p-5">
          <h2 className="text-sm font-medium flex items-center gap-2 mb-1">
            <Activity size={15} /> Strava
          </h2>
          <p className="text-[11px] text-muted mb-4">
            Conecta tu cuenta para importar tus entrenamientos (running, ciclismo, natacion y mas) automaticamente.
          </p>

          {integracion ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted">Estado</span>
                <span className="pill">Conectado</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted">Ultima sincronizacion</span>
                <span>{integracion.ultima_sincronizacion ? new Date(integracion.ultima_sincronizacion).toLocaleString('es-CO') : 'Nunca'}</span>
              </div>
              <div className="flex gap-2 pt-1">
                <button onClick={sincronizar} disabled={sincronizando} className="btn-tl-blue text-[11px]">
                  {sincronizando ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
                  Sincronizar ahora
                </button>
                <button onClick={desconectar} disabled={desconectando} className="btn-tl text-[11px]">
                  {desconectando ? <Loader2 size={13} className="animate-spin" /> : <Unlink size={13} />}
                  Desconectar
                </button>
              </div>
            </div>
          ) : (
            <a href="/api/strava/connect" className="btn-tl-blue text-[11px] inline-flex">
              <Activity size={13} /> Conectar con Strava
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
