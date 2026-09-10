'use client'

import { useState } from 'react'
import { Plus, X, Check, Loader2, Trash2, ArrowRight, ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import type { EstadoTarea, Tarea, TareaSubtarea } from '@/lib/types'

const COLUMNAS: { estado: EstadoTarea; label: string }[] = [
  { estado: 'pendiente', label: 'Pendiente' },
  { estado: 'en_progreso', label: 'En progreso' },
  { estado: 'hecho', label: 'Hecho' },
]

const ETIQUETAS = ['Urgente', 'Diseno', 'Personal', 'Trabajo', 'Salud']
const ETIQUETA_COLOR: Record<string, string> = {
  Urgente: '#ef4444',
  Diseno: '#a78bfa',
  Personal: '#2f6bff',
  Trabajo: '#f59e0b',
  Salud: '#22c55e',
}

function siguienteEstado(e: EstadoTarea): EstadoTarea | null {
  if (e === 'pendiente') return 'en_progreso'
  if (e === 'en_progreso') return 'hecho'
  return null
}
function anteriorEstado(e: EstadoTarea): EstadoTarea | null {
  if (e === 'hecho') return 'en_progreso'
  if (e === 'en_progreso') return 'pendiente'
  return null
}

export default function TareasView({
  tareasIniciales,
  subtareasIniciales,
  usuarioId,
}: {
  tareasIniciales: Tarea[]
  subtareasIniciales: TareaSubtarea[]
  usuarioId: string
}) {
  const supabase = createClient()
  const [tareas, setTareas] = useState(tareasIniciales)
  const [subtareas, setSubtareas] = useState(subtareasIniciales)
  const [modalAbierto, setModalAbierto] = useState(false)
  const [detalle, setDetalle] = useState<Tarea | null>(null)
  const [guardando, setGuardando] = useState(false)
  const [nuevaSubtarea, setNuevaSubtarea] = useState('')

  const [titulo, setTitulo] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [etiqueta, setEtiqueta] = useState<string>('')
  const [xpValor, setXpValor] = useState(30)

  function abrirCrear() {
    setTitulo('')
    setDescripcion('')
    setEtiqueta('')
    setXpValor(30)
    setModalAbierto(true)
  }

  async function crear() {
    if (!titulo.trim()) {
      toast.error('Ponle un titulo a la tarea')
      return
    }
    setGuardando(true)
    const { data, error } = await supabase
      .from('tareas')
      .insert({ usuario_id: usuarioId, titulo, descripcion: descripcion || null, etiqueta: etiqueta || null, xp_valor: xpValor })
      .select()
      .single()
    if (error) {
      toast.error('No se pudo crear la tarea')
      setGuardando(false)
      return
    }
    setTareas((prev) => [...prev, data as Tarea])
    toast.success('Tarea creada')
    setGuardando(false)
    setModalAbierto(false)
  }

  async function cambiarEstado(t: Tarea, nuevoEstado: EstadoTarea) {
    const { error } = await supabase.from('tareas').update({ estado: nuevoEstado }).eq('id', t.id)
    if (error) {
      toast.error('No se pudo actualizar')
      return
    }
    setTareas((prev) => prev.map((x) => (x.id === t.id ? { ...x, estado: nuevoEstado } : x)))
    if (nuevoEstado === 'hecho' && t.estado !== 'hecho') {
      await supabase.rpc('add_xp', { p_xp: t.xp_valor, p_tipo: 'tarea', p_descripcion: t.titulo })
      toast.success(`+${t.xp_valor} XP`)
    }
  }

  async function eliminar(id: string) {
    const { error } = await supabase.from('tareas').delete().eq('id', id)
    if (error) {
      toast.error('No se pudo eliminar')
      return
    }
    setTareas((prev) => prev.filter((t) => t.id !== id))
    setSubtareas((prev) => prev.filter((s) => s.tarea_id !== id))
    if (detalle?.id === id) setDetalle(null)
  }

  async function agregarSubtarea() {
    if (!detalle || !nuevaSubtarea.trim()) return
    const { data, error } = await supabase
      .from('tareas_subtareas')
      .insert({ tarea_id: detalle.id, usuario_id: usuarioId, titulo: nuevaSubtarea })
      .select()
      .single()
    if (error) {
      toast.error('No se pudo agregar')
      return
    }
    setSubtareas((prev) => [...prev, data as TareaSubtarea])
    setNuevaSubtarea('')
  }

  async function toggleSubtarea(s: TareaSubtarea) {
    const { error } = await supabase.from('tareas_subtareas').update({ completado: !s.completado }).eq('id', s.id)
    if (error) return
    setSubtareas((prev) => prev.map((x) => (x.id === s.id ? { ...x, completado: !x.completado } : x)))
  }

  async function eliminarSubtarea(id: string) {
    await supabase.from('tareas_subtareas').delete().eq('id', id)
    setSubtareas((prev) => prev.filter((s) => s.id !== id))
  }

  return (
    <div className="flex flex-col min-h-full bg-background">
      <div className="brand-stripe" />
      <div className="bg-surface border-b border-border px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-base font-medium">Tareas</h1>
          <p className="text-xs text-muted mt-0.5">Domina la complejidad, paso a paso</p>
        </div>
        <button onClick={abrirCrear} className="btn-tl-blue">
          <Plus size={14} /> Nueva tarea
        </button>
      </div>

      <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-4">
        {COLUMNAS.map((col) => {
          const items = tareas.filter((t) => t.estado === col.estado)
          return (
            <div key={col.estado} className="card p-3">
              <div className="flex items-center gap-2 mb-3 px-1">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{
                    background:
                      col.estado === 'pendiente' ? '#f59e0b' : col.estado === 'en_progreso' ? 'var(--tl-blue)' : 'var(--tl-green)',
                  }}
                />
                <h2 className="text-xs font-semibold uppercase tracking-wide">{col.label}</h2>
                <span className="text-[11px] text-muted ml-auto bg-surface-2 rounded-full px-2 py-0.5">{items.length}</span>
              </div>
              <div className="space-y-2 min-h-[60px]">
                {items.map((t) => {
                  const subs = subtareas.filter((s) => s.tarea_id === t.id)
                  const hechas = subs.filter((s) => s.completado).length
                  const prev = anteriorEstado(t.estado)
                  const next = siguienteEstado(t.estado)
                  return (
                    <div
                      key={t.id}
                      className="p-3 rounded-lg border border-border bg-surface-2 cursor-pointer hover:border-blue transition-colors"
                      onClick={() => setDetalle(t)}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        {t.etiqueta && (
                          <span
                            className="px-2 py-0.5 rounded-full text-[10px] font-medium"
                            style={{ background: `${ETIQUETA_COLOR[t.etiqueta] ?? '#8892a6'}22`, color: ETIQUETA_COLOR[t.etiqueta] ?? '#8892a6' }}
                          >
                            {t.etiqueta}
                          </span>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            eliminar(t.id)
                          }}
                          className="text-muted hover:text-red-500 ml-auto"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                      <p className="text-sm font-medium mb-1">{t.titulo}</p>
                      {subs.length > 0 && (
                        <p className="text-[11px] text-muted mb-2">
                          {hechas} / {subs.length} etapas
                        </p>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="pill">+{t.xp_valor} XP</span>
                        <div className="flex items-center gap-1">
                          {prev && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                cambiarEstado(t, prev)
                              }}
                              className="text-muted hover:text-foreground"
                            >
                              <ArrowLeft size={14} />
                            </button>
                          )}
                          {next && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                cambiarEstado(t, next)
                              }}
                              className="text-muted hover:text-foreground"
                            >
                              <ArrowRight size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {modalAbierto && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h2 className="font-medium text-sm">Nueva tarea</h2>
              <button onClick={() => setModalAbierto(false)} className="text-muted hover:text-foreground">
                <X size={18} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-muted mb-1">Titulo</label>
                <input className="input-tl" value={titulo} onChange={(e) => setTitulo(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted mb-1">Descripcion (opcional)</label>
                <textarea className="input-tl" rows={3} value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-muted mb-1">Etiqueta</label>
                  <select className="input-tl" value={etiqueta} onChange={(e) => setEtiqueta(e.target.value)}>
                    <option value="">Sin etiqueta</option>
                    {ETIQUETAS.map((e) => (
                      <option key={e} value={e}>
                        {e}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted mb-1">XP</label>
                  <input type="number" className="input-tl" value={xpValor} onChange={(e) => setXpValor(Number(e.target.value))} />
                </div>
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

      {detalle && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h2 className="font-medium text-sm">{detalle.titulo}</h2>
              <button onClick={() => setDetalle(null)} className="text-muted hover:text-foreground">
                <X size={18} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              {detalle.descripcion && <p className="text-xs text-muted">{detalle.descripcion}</p>}

              <div className="flex items-center gap-2">
                {COLUMNAS.map((c) => (
                  <button
                    key={c.estado}
                    onClick={() => {
                      cambiarEstado(detalle, c.estado)
                      setDetalle({ ...detalle, estado: c.estado })
                    }}
                    className={cn('btn-tl text-[11px]')}
                    style={detalle.estado === c.estado ? { background: 'var(--tl-blue)', color: 'white', borderColor: 'var(--tl-blue)' } : {}}
                  >
                    {c.label}
                  </button>
                ))}
              </div>

              <div>
                <p className="text-xs font-medium text-muted mb-2">Subtareas / etapas</p>
                <div className="space-y-1.5 mb-2">
                  {subtareas
                    .filter((s) => s.tarea_id === detalle.id)
                    .map((s) => (
                      <div key={s.id} className="flex items-center gap-2 text-sm">
                        <button
                          onClick={() => toggleSubtarea(s)}
                          className="w-4 h-4 rounded border flex items-center justify-center shrink-0"
                          style={{
                            background: s.completado ? 'var(--tl-blue)' : 'transparent',
                            borderColor: s.completado ? 'var(--tl-blue)' : 'var(--tl-border)',
                          }}
                        >
                          {s.completado && <Check size={11} className="text-white" />}
                        </button>
                        <span className={cn('flex-1', s.completado && 'line-through text-muted')}>{s.titulo}</span>
                        <button onClick={() => eliminarSubtarea(s.id)} className="text-muted hover:text-red-500">
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                </div>
                <div className="flex gap-2">
                  <input
                    className="input-tl"
                    placeholder="Nueva etapa"
                    value={nuevaSubtarea}
                    onChange={(e) => setNuevaSubtarea(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && agregarSubtarea()}
                  />
                  <button onClick={agregarSubtarea} className="btn-tl shrink-0">
                    <Plus size={14} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
