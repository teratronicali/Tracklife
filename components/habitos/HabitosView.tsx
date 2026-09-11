'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, X, Check, Loader2, Pencil, Trash2, Flame } from 'lucide-react'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { DIAS_SEMANA, lastNDates } from '@/lib/utils'
import { puedeCrear, MENSAJE_LIMITE } from '@/lib/planes'
import { otorgarXP } from '@/lib/xp-client'
import type { Habito, Perfil } from '@/lib/types'

type Registro = { habito_id: string; fecha: string }

const MOMENTOS = [
  { value: 'manana', label: 'Manana' },
  { value: 'tarde', label: 'Tarde' },
  { value: 'noche', label: 'Noche' },
] as const

const EMOJIS = ['✅', '💪', '📖', '🧘', '💧', '🥗', '🚿', '😴', '🎯', '💰']

export default function HabitosView({
  habitosIniciales,
  registrosIniciales,
  perfil,
  usuarioId,
}: {
  habitosIniciales: Habito[]
  registrosIniciales: Registro[]
  perfil: Perfil
  usuarioId: string
}) {
  const supabase = createClient()
  const router = useRouter()
  const [habitos, setHabitos] = useState(habitosIniciales)
  const [registros, setRegistros] = useState(registrosIniciales)
  const [modalAbierto, setModalAbierto] = useState(false)
  const [modoEditar, setModoEditar] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)
  const [pendiente, setPendiente] = useState<string | null>(null)

  const [nombre, setNombre] = useState('')
  const [emoji, setEmoji] = useState('✅')
  const [momento, setMomento] = useState<'manana' | 'tarde' | 'noche'>('manana')
  const [xpValor, setXpValor] = useState(30)

  const dias7 = useMemo(() => lastNDates(7), [])
  const dias84 = useMemo(() => lastNDates(84), [])

  const registroSet = useMemo(() => new Set(registros.map((r) => `${r.habito_id}_${r.fecha}`)), [registros])

  const habitosActivos = habitos.filter((h) => h.activo)

  const porDia = useMemo(() => {
    const map = new Map<string, number>()
    for (const fecha of dias84) map.set(fecha, 0)
    for (const r of registros) map.set(r.fecha, (map.get(r.fecha) ?? 0) + 1)
    return map
  }, [registros, dias84])

  const totalActivos = habitosActivos.length || 1
  const promedioSemanal =
    dias7.reduce((s, f) => s + (porDia.get(f) ?? 0) / totalActivos, 0) / dias7.length
  const diasPerfectos = dias84.filter((f) => (porDia.get(f) ?? 0) >= totalActivos && totalActivos > 0).length

  function abrirCrear() {
    setModoEditar(null)
    setNombre('')
    setEmoji('✅')
    setMomento('manana')
    setXpValor(30)
    setModalAbierto(true)
  }

  function abrirEditar(h: Habito) {
    setModoEditar(h.id)
    setNombre(h.nombre)
    setEmoji(h.emoji)
    setMomento(h.momento)
    setXpValor(h.xp_valor)
    setModalAbierto(true)
  }

  async function guardar() {
    if (!nombre.trim()) {
      toast.error('Ponle un nombre al habito')
      return
    }
    if (!modoEditar && !puedeCrear(perfil, 'habitos', habitos.length)) {
      toast.error(MENSAJE_LIMITE.habitos)
      return
    }
    setGuardando(true)
    if (modoEditar) {
      const { data, error } = await supabase
        .from('habitos')
        .update({ nombre, emoji, momento, xp_valor: xpValor })
        .eq('id', modoEditar)
        .select()
        .single()
      if (error) {
        toast.error('No se pudo actualizar')
        setGuardando(false)
        return
      }
      setHabitos((prev) => prev.map((h) => (h.id === modoEditar ? (data as Habito) : h)))
      toast.success('Habito actualizado')
    } else {
      const { data, error } = await supabase
        .from('habitos')
        .insert({ usuario_id: usuarioId, nombre, emoji, momento, xp_valor: xpValor })
        .select()
        .single()
      if (error) {
        toast.error('No se pudo crear el habito')
        setGuardando(false)
        return
      }
      setHabitos((prev) => [...prev, data as Habito])
      toast.success('Habito creado')
    }
    setGuardando(false)
    setModalAbierto(false)
  }

  async function eliminar(id: string) {
    const { error } = await supabase.from('habitos').delete().eq('id', id)
    if (error) {
      toast.error('No se pudo eliminar')
      return
    }
    setHabitos((prev) => prev.filter((h) => h.id !== id))
    setRegistros((prev) => prev.filter((r) => r.habito_id !== id))
    toast.success('Habito eliminado')
  }

  async function toggleDia(h: Habito, fecha: string) {
    const key = `${h.id}_${fecha}`
    if (pendiente) return
    setPendiente(key)
    const hecho = registroSet.has(key)

    if (hecho) {
      await supabase.from('habito_registros').delete().eq('habito_id', h.id).eq('fecha', fecha)
      await otorgarXP(supabase, perfil, { p_xp: -h.xp_valor, p_tipo: 'habito_revertido' })
      setRegistros((prev) => prev.filter((r) => !(r.habito_id === h.id && r.fecha === fecha)))
    } else {
      const { error } = await supabase.from('habito_registros').insert({
        habito_id: h.id,
        usuario_id: usuarioId,
        fecha,
      })
      if (error) {
        toast.error('No se pudo registrar')
        setPendiente(null)
        return
      }
      await otorgarXP(supabase, perfil, { p_xp: h.xp_valor, p_tipo: 'habito', p_descripcion: h.nombre })
      setRegistros((prev) => [...prev, { habito_id: h.id, fecha }])
    }
    await supabase.rpc('recalcular_racha')
    setPendiente(null)
    router.refresh()
  }

  function intensidad(fecha: string) {
    const n = porDia.get(fecha) ?? 0
    if (n === 0) return 'var(--tl-surface-2)'
    const ratio = Math.min(1, n / totalActivos)
    if (ratio < 0.34) return 'rgba(47,107,255,0.35)'
    if (ratio < 0.67) return 'rgba(47,107,255,0.6)'
    if (ratio < 1) return 'rgba(47,107,255,0.85)'
    return 'var(--tl-blue)'
  }

  return (
    <div className="flex flex-col min-h-full bg-background">
      <div className="brand-stripe" />
      <div className="bg-surface border-b border-border px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-base font-medium">Habitos</h1>
          <p className="text-xs text-muted mt-0.5">Construye habitos que realmente duren</p>
        </div>
        <button onClick={abrirCrear} className="btn-tl-blue">
          <Plus size={14} /> Nuevo habito
        </button>
      </div>

      {!puedeCrear(perfil, 'habitos', habitos.length) && (
        <div className="px-6 pt-4">
          <Link
            href="/precio"
            className="flex items-center justify-between text-xs px-3 py-2 rounded-lg border hover:underline"
            style={{ borderColor: 'var(--tl-blue)', background: 'var(--tl-blue-dim)', color: 'var(--tl-blue)' }}
          >
            <span>{MENSAJE_LIMITE.habitos}</span>
            <span className="shrink-0 ml-2">Mejorar →</span>
          </Link>
        </div>
      )}

      <div className="p-5 space-y-5">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="card px-4 py-3">
            <p className="text-[11px] text-muted mb-1">Racha actual</p>
            <p className="text-xl font-medium flex items-center gap-1" style={{ color: '#f59e0b' }}>
              <Flame size={16} /> {perfil.racha_actual}
            </p>
            <p className="text-[11px] text-muted mt-0.5">dias seguidos</p>
          </div>
          <div className="card px-4 py-3">
            <p className="text-[11px] text-muted mb-1">Mejor racha</p>
            <p className="text-xl font-medium" style={{ color: 'var(--tl-blue)' }}>
              {perfil.mejor_racha}
            </p>
            <p className="text-[11px] text-muted mt-0.5">dias seguidos</p>
          </div>
          <div className="card px-4 py-3">
            <p className="text-[11px] text-muted mb-1">Promedio semanal</p>
            <p className="text-xl font-medium">{Math.round(promedioSemanal * 100)}%</p>
            <p className="text-[11px] text-muted mt-0.5">ultimos 7 dias</p>
          </div>
          <div className="card px-4 py-3">
            <p className="text-[11px] text-muted mb-1">Dias perfectos</p>
            <p className="text-xl font-medium">{diasPerfectos}</p>
            <p className="text-[11px] text-muted mt-0.5">ultimos 84 dias</p>
          </div>
        </div>

        <div className="card p-4 overflow-x-auto">
          <h2 className="text-sm font-medium mb-3">Cuadricula de habitos</h2>
          {habitosActivos.length === 0 ? (
            <p className="text-xs text-muted">Crea tu primer habito para empezar a ganar XP.</p>
          ) : (
            <table className="min-w-full text-xs">
              <thead>
                <tr>
                  <th className="text-left font-medium text-muted pb-2">Habito</th>
                  {dias7.map((f) => (
                    <th key={f} className="text-center font-medium text-muted pb-2 w-10">
                      {DIAS_SEMANA[new Date(f + 'T00:00:00').getDay()]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {habitosActivos.map((h) => (
                  <tr key={h.id}>
                    <td className="py-1.5 pr-3 whitespace-nowrap">
                      <span className="mr-1.5">{h.emoji}</span>
                      {h.nombre}
                    </td>
                    {dias7.map((f) => {
                      const key = `${h.id}_${f}`
                      const hecho = registroSet.has(key)
                      return (
                        <td key={f} className="text-center py-1.5">
                          <button
                            onClick={() => toggleDia(h, f)}
                            disabled={pendiente === key}
                            className="w-6 h-6 rounded-full border inline-flex items-center justify-center transition-colors"
                            style={{
                              background: hecho ? 'var(--tl-blue)' : 'transparent',
                              borderColor: hecho ? 'var(--tl-blue)' : 'var(--tl-border)',
                            }}
                          >
                            {hecho && <Check size={12} className="text-white" />}
                          </button>
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="card p-4">
          <h2 className="text-sm font-medium mb-3">Ultimos 84 dias</h2>
          <div className="grid grid-cols-12 gap-1.5">
            {dias84.map((f) => (
              <div
                key={f}
                title={f}
                className="aspect-square rounded-sm"
                style={{ background: intensidad(f) }}
              />
            ))}
          </div>
        </div>

        <div className="card overflow-hidden">
          <table className="tl-table">
            <thead>
              <tr>
                <th>Habito</th>
                <th>Momento</th>
                <th>XP</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {habitos.map((h) => (
                <tr key={h.id}>
                  <td>
                    <span className="mr-1.5">{h.emoji}</span>
                    {h.nombre}
                  </td>
                  <td className="capitalize text-muted">{h.momento}</td>
                  <td>+{h.xp_valor} XP</td>
                  <td>
                    <div className="flex items-center gap-2 justify-end">
                      <button onClick={() => abrirEditar(h)} className="text-muted hover:text-foreground">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => eliminar(h.id)} className="text-muted hover:text-red-500">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modalAbierto && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h2 className="font-medium text-sm">{modoEditar ? 'Editar habito' : 'Nuevo habito'}</h2>
              <button onClick={() => setModalAbierto(false)} className="text-muted hover:text-foreground">
                <X size={18} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-muted mb-1">Nombre</label>
                <input
                  className="input-tl"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej. Entrenar"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted mb-1">Icono</label>
                <div className="flex flex-wrap gap-2">
                  {EMOJIS.map((e) => (
                    <button
                      key={e}
                      onClick={() => setEmoji(e)}
                      className="w-9 h-9 rounded-lg border flex items-center justify-center text-lg"
                      style={{
                        borderColor: emoji === e ? 'var(--tl-blue)' : 'var(--tl-border)',
                        background: emoji === e ? 'var(--tl-blue-dim)' : 'transparent',
                      }}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-muted mb-1">Momento</label>
                  <select
                    className="input-tl"
                    value={momento}
                    onChange={(e) => setMomento(e.target.value as typeof momento)}
                  >
                    {MOMENTOS.map((m) => (
                      <option key={m.value} value={m.value}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted mb-1">XP por dia</label>
                  <input
                    type="number"
                    min={5}
                    step={5}
                    className="input-tl"
                    value={xpValor}
                    onChange={(e) => setXpValor(Number(e.target.value))}
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 px-5 py-4 border-t border-border">
              <button onClick={() => setModalAbierto(false)} className="btn-tl">
                Cancelar
              </button>
              <button onClick={guardar} disabled={guardando} className="btn-tl-blue">
                {guardando ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                {modoEditar ? 'Guardar cambios' : 'Crear'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
