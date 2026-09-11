'use client'

import { useState } from 'react'
import { Plus, X, Check, Loader2, Archive, Trash2, Image as ImageIcon } from 'lucide-react'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { formatMoney } from '@/lib/utils'
import { puedeCrear, MENSAJE_LIMITE } from '@/lib/planes'
import type { Meta, Perfil, TipoMeta } from '@/lib/types'
import { XP_TABLE } from '@/lib/gamification'

export default function MetasView({
  metasIniciales,
  usuarioId,
  perfil,
}: {
  metasIniciales: Meta[]
  usuarioId: string
  perfil: Perfil
}) {
  const supabase = createClient()
  const [metas, setMetas] = useState(metasIniciales)
  const [tab, setTab] = useState<'activas' | 'archivadas'>('activas')
  const [modalAbierto, setModalAbierto] = useState(false)
  const [modalAporte, setModalAporte] = useState<Meta | null>(null)
  const [guardando, setGuardando] = useState(false)

  const [titulo, setTitulo] = useState('')
  const [tipo, setTipo] = useState<TipoMeta>('personal')
  const [montoObjetivo, setMontoObjetivo] = useState('')
  const [diasObjetivo, setDiasObjetivo] = useState('')
  const [imagenUrl, setImagenUrl] = useState('')
  const [montoAporte, setMontoAporte] = useState('')

  const visibles = metas.filter((m) => (tab === 'activas' ? !m.archivada : m.archivada))

  function abrirCrear() {
    setTitulo('')
    setTipo('personal')
    setMontoObjetivo('')
    setDiasObjetivo('')
    setImagenUrl('')
    setModalAbierto(true)
  }

  const metasActivas = metas.filter((m) => !m.archivada).length

  async function crear() {
    if (!titulo.trim()) {
      toast.error('Ponle un titulo a la meta')
      return
    }
    if (!puedeCrear(perfil, 'metas', metasActivas)) {
      toast.error(MENSAJE_LIMITE.metas)
      return
    }
    setGuardando(true)
    const { data, error } = await supabase
      .from('metas')
      .insert({
        usuario_id: usuarioId,
        titulo,
        tipo,
        monto_objetivo: Number(montoObjetivo) || 0,
        dias_objetivo: diasObjetivo ? Number(diasObjetivo) : null,
        imagen_url: imagenUrl || null,
      })
      .select()
      .single()
    if (error) {
      toast.error('No se pudo crear la meta')
      setGuardando(false)
      return
    }
    setMetas((prev) => [data as Meta, ...prev])
    toast.success('Meta creada')
    setGuardando(false)
    setModalAbierto(false)
  }

  async function aportar() {
    if (!modalAporte) return
    const monto = Number(montoAporte)
    if (!monto || monto <= 0) {
      toast.error('Ingresa un monto valido')
      return
    }
    setGuardando(true)
    const nuevoMonto = Number(modalAporte.monto_actual) + monto
    const yaCompletada = Number(modalAporte.monto_actual) >= modalAporte.monto_objetivo
    const { error } = await supabase.from('metas').update({ monto_actual: nuevoMonto }).eq('id', modalAporte.id)
    if (error) {
      toast.error('No se pudo registrar el aporte')
      setGuardando(false)
      return
    }
    await supabase.from('metas_aportes').insert({ meta_id: modalAporte.id, usuario_id: usuarioId, monto })

    if (!yaCompletada && nuevoMonto >= modalAporte.monto_objetivo && modalAporte.monto_objetivo > 0) {
      await supabase.rpc('add_xp', { p_xp: XP_TABLE.meta_completa, p_tipo: 'meta_completa', p_descripcion: modalAporte.titulo })
      toast.success(`Meta completada! +${XP_TABLE.meta_completa} XP`)
    } else {
      toast.success('Aporte registrado')
    }

    setMetas((prev) => prev.map((m) => (m.id === modalAporte.id ? { ...m, monto_actual: nuevoMonto } : m)))
    setGuardando(false)
    setModalAporte(null)
    setMontoAporte('')
  }

  async function archivar(m: Meta) {
    const { error } = await supabase.from('metas').update({ archivada: !m.archivada }).eq('id', m.id)
    if (error) {
      toast.error('No se pudo actualizar')
      return
    }
    setMetas((prev) => prev.map((meta) => (meta.id === m.id ? { ...meta, archivada: !meta.archivada } : meta)))
  }

  async function eliminar(id: string) {
    const { error } = await supabase.from('metas').delete().eq('id', id)
    if (error) {
      toast.error('No se pudo eliminar')
      return
    }
    setMetas((prev) => prev.filter((m) => m.id !== id))
  }

  return (
    <div className="flex flex-col min-h-full bg-background">
      <div className="brand-stripe" />
      <div className="bg-surface border-b border-border px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-base font-medium">Metas</h1>
          <p className="text-xs text-muted mt-0.5">Tus suenos, bajo control matematico</p>
        </div>
        <button onClick={abrirCrear} className="btn-tl-blue">
          <Plus size={14} /> Nueva meta
        </button>
      </div>

      {!puedeCrear(perfil, 'metas', metasActivas) && (
        <div className="px-6 pt-4">
          <Link
            href="/precio"
            className="flex items-center justify-between text-xs px-3 py-2 rounded-lg border hover:underline"
            style={{ borderColor: 'var(--tl-blue)', background: 'var(--tl-blue-dim)', color: 'var(--tl-blue)' }}
          >
            <span>{MENSAJE_LIMITE.metas}</span>
            <span className="shrink-0 ml-2">Mejorar →</span>
          </Link>
        </div>
      )}

      <div className="px-6 pt-4">
        <div className="inline-flex rounded-full border border-border p-0.5">
          <button
            onClick={() => setTab('activas')}
            className="px-3 py-1.5 rounded-full text-xs font-medium"
            style={tab === 'activas' ? { background: 'var(--tl-blue)', color: 'white' } : { color: 'var(--tl-muted)' }}
          >
            Activas
          </button>
          <button
            onClick={() => setTab('archivadas')}
            className="px-3 py-1.5 rounded-full text-xs font-medium"
            style={tab === 'archivadas' ? { background: 'var(--tl-blue)', color: 'white' } : { color: 'var(--tl-muted)' }}
          >
            Archivadas
          </button>
        </div>
      </div>

      <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {visibles.length === 0 && (
          <p className="text-xs text-muted col-span-full">No hay metas {tab === 'activas' ? 'activas' : 'archivadas'} aun.</p>
        )}
        {visibles.map((m) => {
          const progreso = m.monto_objetivo > 0 ? Math.min(1, m.monto_actual / m.monto_objetivo) : 0
          const dias = m.dias_objetivo
            ? Math.min(m.dias_objetivo, Math.floor((Date.now() - new Date(m.fecha_inicio).getTime()) / 86400000))
            : null
          return (
            <div key={m.id} className="card overflow-hidden flex flex-col">
              {m.imagen_url ? (
                <img src={m.imagen_url} alt={m.titulo} className="w-full h-32 object-cover" />
              ) : (
                <div className="w-full h-32 flex items-center justify-center bg-surface-2 text-muted">
                  <ImageIcon size={28} />
                </div>
              )}
              <div className="p-4 flex-1 flex flex-col">
                <div className="flex items-center justify-between mb-1">
                  <span className="pill capitalize">{m.tipo}</span>
                  <div className="flex items-center gap-2">
                    <button onClick={() => archivar(m)} className="text-muted hover:text-foreground">
                      <Archive size={14} />
                    </button>
                    <button onClick={() => eliminar(m.id)} className="text-muted hover:text-red-500">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <h3 className="text-sm font-medium mb-2">{m.titulo}</h3>

                {m.monto_objetivo > 0 && (
                  <>
                    <div className="h-1.5 rounded-full bg-surface-2 overflow-hidden mb-1.5">
                      <div className="h-full rounded-full" style={{ width: `${progreso * 100}%`, background: 'var(--tl-blue)' }} />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-muted mb-2">
                      <span>{formatMoney(m.monto_actual)}</span>
                      <span>{Math.round(progreso * 100)}%</span>
                      <span>{formatMoney(m.monto_objetivo)}</span>
                    </div>
                  </>
                )}

                {m.dias_objetivo && (
                  <p className="text-[11px] text-muted mb-2">
                    {dias}/{m.dias_objetivo} dias · Faltan {Math.max(0, m.dias_objetivo - (dias ?? 0))} dias
                  </p>
                )}

                {!m.archivada && m.monto_objetivo > 0 && (
                  <button
                    onClick={() => {
                      setModalAporte(m)
                      setMontoAporte('')
                    }}
                    className="btn-tl mt-auto"
                  >
                    Registrar aporte
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {modalAbierto && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h2 className="font-medium text-sm">Nueva meta</h2>
              <button onClick={() => setModalAbierto(false)} className="text-muted hover:text-foreground">
                <X size={18} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-muted mb-1">Titulo</label>
                <input className="input-tl" value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ej. Comprar un auto" />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted mb-1">Tipo</label>
                <select className="input-tl" value={tipo} onChange={(e) => setTipo(e.target.value as TipoMeta)}>
                  <option value="personal">Personal</option>
                  <option value="financiera">Financiera</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-muted mb-1">Monto objetivo</label>
                  <input
                    type="number"
                    className="input-tl"
                    value={montoObjetivo}
                    onChange={(e) => setMontoObjetivo(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted mb-1">Dias limite (opcional)</label>
                  <input
                    type="number"
                    className="input-tl"
                    value={diasObjetivo}
                    onChange={(e) => setDiasObjetivo(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted mb-1">URL de imagen (opcional)</label>
                <input className="input-tl" value={imagenUrl} onChange={(e) => setImagenUrl(e.target.value)} placeholder="https://..." />
              </div>
            </div>
            <div className="flex justify-end gap-2 px-5 py-4 border-t border-border">
              <button onClick={() => setModalAbierto(false)} className="btn-tl">
                Cancelar
              </button>
              <button onClick={crear} disabled={guardando} className="btn-tl-blue">
                {guardando ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                Crear
              </button>
            </div>
          </div>
        </div>
      )}

      {modalAporte && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-2xl shadow-2xl w-full max-w-sm">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h2 className="font-medium text-sm">Aporte a {modalAporte.titulo}</h2>
              <button onClick={() => setModalAporte(null)} className="text-muted hover:text-foreground">
                <X size={18} />
              </button>
            </div>
            <div className="p-5">
              <label className="block text-xs font-medium text-muted mb-1">Monto</label>
              <input type="number" className="input-tl" value={montoAporte} onChange={(e) => setMontoAporte(e.target.value)} />
            </div>
            <div className="flex justify-end gap-2 px-5 py-4 border-t border-border">
              <button onClick={() => setModalAporte(null)} className="btn-tl">
                Cancelar
              </button>
              <button onClick={aportar} disabled={guardando} className="btn-tl-blue">
                {guardando ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                Registrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
