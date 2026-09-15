'use client'

import { useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import { Plus, X, Check, Loader2, Trash2, Play, Pencil, ChevronUp, ChevronDown, Dumbbell } from 'lucide-react'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'
import type { Ejercicio, Perfil, RutinaConEjercicios, RutinaEjercicio, TipoRutina } from '@/lib/types'
import SesionActiva from './SesionActiva'

const TIPOS_ACTIVIDAD_CARDIO = ['running', 'ciclismo', 'natacion', 'general']

interface RutinaEjercicioInsert {
  usuario_id: string
  rutina_id: string | null
  ejercicio_id: string
  orden: number
  series_objetivo: number
  reps_objetivo: string
  peso_objetivo: number | null
  descanso_seg: number
  tipo_actividad: string | null
  distancia_objetivo_km: number | null
  duracion_objetivo_min: number | null
  notas_cardio: string | null
}

interface ItemForm {
  ejercicio_id: string
  series_objetivo: string
  reps_objetivo: string
  peso_objetivo: string
  descanso_seg: string
  tipo_actividad: string
  distancia_objetivo_km: string
  duracion_objetivo_min: string
  notas_cardio: string
}

function itemVacio(ejercicioId: string): ItemForm {
  return {
    ejercicio_id: ejercicioId,
    series_objetivo: '3',
    reps_objetivo: '10',
    peso_objetivo: '',
    descanso_seg: '90',
    tipo_actividad: 'running',
    distancia_objetivo_km: '',
    duracion_objetivo_min: '',
    notas_cardio: '',
  }
}

export default function RutinasView({
  rutinas,
  setRutinas,
  ejercicios,
  usuarioId,
  perfil,
}: {
  rutinas: RutinaConEjercicios[]
  setRutinas: Dispatch<SetStateAction<RutinaConEjercicios[]>>
  ejercicios: Ejercicio[]
  usuarioId: string
  perfil: Perfil
}) {
  const supabase = createClient()
  const [modal, setModal] = useState(false)
  const [modoEditar, setModoEditar] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)
  const [nombre, setNombre] = useState('')
  const [tipo, setTipo] = useState<TipoRutina>('gym')
  const [items, setItems] = useState<ItemForm[]>([])
  const [ejercicioNuevo, setEjercicioNuevo] = useState(ejercicios[0]?.id ?? '')
  const [sesionRutina, setSesionRutina] = useState<RutinaConEjercicios | null>(null)

  function nombreEjercicio(id: string) {
    return ejercicios.find((e) => e.id === id)?.nombre ?? '—'
  }

  function abrirNueva() {
    setModoEditar(null)
    setNombre('')
    setTipo('gym')
    setItems([])
    setModal(true)
  }

  function abrirEditar(r: RutinaConEjercicios) {
    setModoEditar(r.id)
    setNombre(r.nombre)
    setTipo(r.tipo)
    setItems(
      r.ejercicios.map((re) => ({
        ejercicio_id: re.ejercicio_id,
        series_objetivo: String(re.series_objetivo),
        reps_objetivo: re.reps_objetivo,
        peso_objetivo: re.peso_objetivo ? String(re.peso_objetivo) : '',
        descanso_seg: String(re.descanso_seg),
        tipo_actividad: re.tipo_actividad ?? 'running',
        distancia_objetivo_km: re.distancia_objetivo_km ? String(re.distancia_objetivo_km) : '',
        duracion_objetivo_min: re.duracion_objetivo_min ? String(re.duracion_objetivo_min) : '',
        notas_cardio: re.notas_cardio ?? '',
      }))
    )
    setModal(true)
  }

  function agregarItem() {
    if (!ejercicioNuevo) return
    setItems((prev) => [...prev, itemVacio(ejercicioNuevo)])
  }

  function actualizarItem(idx: number, campo: keyof ItemForm, valor: string) {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, [campo]: valor } : it)))
  }

  function quitarItem(idx: number) {
    setItems((prev) => prev.filter((_, i) => i !== idx))
  }

  function moverItem(idx: number, dir: -1 | 1) {
    setItems((prev) => {
      const copia = [...prev]
      const destino = idx + dir
      if (destino < 0 || destino >= copia.length) return copia
      ;[copia[idx], copia[destino]] = [copia[destino], copia[idx]]
      return copia
    })
  }

  async function guardarRutina() {
    if (!nombre.trim()) {
      toast.error('Ponle un nombre a la rutina')
      return
    }
    if (items.length === 0) {
      toast.error('Agrega al menos un ejercicio')
      return
    }
    setGuardando(true)

    let rutinaId = modoEditar
    if (modoEditar) {
      const { error } = await supabase.from('rutinas').update({ nombre: nombre.trim(), tipo }).eq('id', modoEditar)
      if (error) {
        toast.error('No se pudo actualizar la rutina')
        setGuardando(false)
        return
      }
      await supabase.from('rutina_ejercicios').delete().eq('rutina_id', modoEditar)
    } else {
      const { data, error } = await supabase.from('rutinas').insert({ usuario_id: usuarioId, nombre: nombre.trim(), tipo }).select().single()
      if (error || !data) {
        toast.error('No se pudo crear la rutina')
        setGuardando(false)
        return
      }
      rutinaId = data.id
    }

    const filas: RutinaEjercicioInsert[] =
      tipo === 'gym'
        ? items.map((it, idx) => ({
            usuario_id: usuarioId,
            rutina_id: rutinaId,
            ejercicio_id: it.ejercicio_id,
            orden: idx,
            series_objetivo: Number(it.series_objetivo) || 3,
            reps_objetivo: it.reps_objetivo.trim() || '10',
            peso_objetivo: it.peso_objetivo ? Number(it.peso_objetivo) : null,
            descanso_seg: Number(it.descanso_seg) || 90,
            tipo_actividad: null,
            distancia_objetivo_km: null,
            duracion_objetivo_min: null,
            notas_cardio: null,
          }))
        : items.map((it, idx) => ({
            usuario_id: usuarioId,
            rutina_id: rutinaId,
            ejercicio_id: it.ejercicio_id,
            orden: idx,
            series_objetivo: 1,
            reps_objetivo: '',
            peso_objetivo: null,
            descanso_seg: 0,
            tipo_actividad: it.tipo_actividad,
            distancia_objetivo_km: it.distancia_objetivo_km ? Number(it.distancia_objetivo_km) : null,
            duracion_objetivo_min: it.duracion_objetivo_min ? Number(it.duracion_objetivo_min) : null,
            notas_cardio: it.notas_cardio.trim() || null,
          }))

    const { data: nuevosItems, error: errorItems } = await supabase.from('rutina_ejercicios').insert(filas).select('*, ejercicio:ejercicios(*)')
    if (errorItems || !nuevosItems) {
      toast.error('No se pudo guardar los ejercicios de la rutina')
      setGuardando(false)
      return
    }

    const rutinaCompleta: RutinaConEjercicios = {
      id: rutinaId as string,
      usuario_id: usuarioId,
      nombre: nombre.trim(),
      tipo,
      objetivo: null,
      nivel: null,
      created_at: new Date().toISOString(),
      ejercicios: nuevosItems as RutinaEjercicio[],
    }

    setRutinas((prev) => {
      const sinEsta = prev.filter((r) => r.id !== rutinaId)
      return [rutinaCompleta, ...sinEsta]
    })
    setGuardando(false)
    setModal(false)
    toast.success(modoEditar ? 'Rutina actualizada' : 'Rutina creada')
  }

  async function eliminarRutina(id: string) {
    const { error } = await supabase.from('rutinas').delete().eq('id', id)
    if (error) {
      toast.error('No se pudo eliminar')
      return
    }
    setRutinas((prev) => prev.filter((r) => r.id !== id))
    toast.success('Rutina eliminada')
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium">Tus rutinas</h2>
        <button onClick={abrirNueva} className="btn-tl text-xs">
          <Plus size={13} /> Nueva rutina
        </button>
      </div>

      {rutinas.length === 0 ? (
        <div className="card p-5 text-center">
          <Dumbbell size={22} className="mx-auto mb-2 text-muted" />
          <p className="text-xs text-muted">Arma una rutina (de gimnasio o de cardio) para poder iniciarla e ir marcando cada serie o actividad en el momento.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {rutinas.map((r) => (
            <div key={r.id} className="card p-4 flex flex-col gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-medium">{r.nombre}</h3>
                  <span className="pill">{r.tipo === 'cardio' ? 'Cardio' : 'Gym'}</span>
                </div>
                <p className="text-[11px] text-muted mt-0.5">{r.ejercicios.length} ejercicios</p>
              </div>
              <div className="flex flex-wrap gap-1">
                {r.ejercicios.slice(0, 4).map((re) => (
                  <span key={re.id} className="pill">
                    {re.ejercicio?.nombre}
                  </span>
                ))}
                {r.ejercicios.length > 4 && <span className="pill">+{r.ejercicios.length - 4}</span>}
              </div>
              <div className="flex items-center gap-2 mt-auto">
                <button onClick={() => setSesionRutina(r)} disabled={r.ejercicios.length === 0} className="btn-tl-blue text-xs flex-1">
                  <Play size={13} /> Iniciar
                </button>
                <button onClick={() => abrirEditar(r)} className="btn-tl text-xs">
                  <Pencil size={13} />
                </button>
                <button onClick={() => eliminarRutina(r.id)} className="btn-tl text-xs hover:text-red-500">
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 bg-black/70 z-[60] flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h2 className="font-medium text-sm">{modoEditar ? 'Editar rutina' : 'Nueva rutina'}</h2>
              <button onClick={() => setModal(false)} className="text-muted hover:text-foreground">
                <X size={18} />
              </button>
            </div>
            <div className="p-5 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-xs font-medium text-muted mb-1">Nombre</label>
                <input className="input-tl" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej. Dia de empuje" />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted mb-1">Tipo</label>
                <div className="inline-flex rounded-full border border-border p-0.5">
                  <button
                    onClick={() => setTipo('gym')}
                    className="px-3 py-1.5 rounded-full text-xs font-medium"
                    style={tipo === 'gym' ? { background: 'var(--tl-blue)', color: 'white' } : { color: 'var(--tl-muted)' }}
                  >
                    Gimnasio
                  </button>
                  <button
                    onClick={() => setTipo('cardio')}
                    className="px-3 py-1.5 rounded-full text-xs font-medium"
                    style={tipo === 'cardio' ? { background: 'var(--tl-blue)', color: 'white' } : { color: 'var(--tl-muted)' }}
                  >
                    Cardio / Deporte
                  </button>
                </div>
              </div>

              <div className="flex gap-2">
                <select className="input-tl" value={ejercicioNuevo} onChange={(e) => setEjercicioNuevo(e.target.value)}>
                  {ejercicios.length === 0 && <option value="">Sin ejercicios creados</option>}
                  {ejercicios.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.nombre}
                    </option>
                  ))}
                </select>
                <button onClick={agregarItem} className="btn-tl shrink-0">
                  <Plus size={14} /> Agregar
                </button>
              </div>

              <div className="space-y-2">
                {items.map((it, idx) => (
                  <div key={idx} className="card p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium">{nombreEjercicio(it.ejercicio_id)}</p>
                      <div className="flex items-center gap-1">
                        <button onClick={() => moverItem(idx, -1)} className="text-muted hover:text-foreground">
                          <ChevronUp size={14} />
                        </button>
                        <button onClick={() => moverItem(idx, 1)} className="text-muted hover:text-foreground">
                          <ChevronDown size={14} />
                        </button>
                        <button onClick={() => quitarItem(idx)} className="text-muted hover:text-red-500">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                    {tipo === 'gym' ? (
                      <div className="grid grid-cols-4 gap-2">
                        <div>
                          <label className="block text-[10px] text-muted mb-0.5">Series</label>
                          <input
                            type="number"
                            className="input-tl py-1 text-xs"
                            value={it.series_objetivo}
                            onChange={(e) => actualizarItem(idx, 'series_objetivo', e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-muted mb-0.5">Reps</label>
                          <input
                            className="input-tl py-1 text-xs"
                            value={it.reps_objetivo}
                            placeholder="8-12"
                            onChange={(e) => actualizarItem(idx, 'reps_objetivo', e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-muted mb-0.5">Kg</label>
                          <input
                            type="number"
                            className="input-tl py-1 text-xs"
                            value={it.peso_objetivo}
                            onChange={(e) => actualizarItem(idx, 'peso_objetivo', e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-muted mb-0.5">Descanso (s)</label>
                          <input
                            type="number"
                            className="input-tl py-1 text-xs"
                            value={it.descanso_seg}
                            onChange={(e) => actualizarItem(idx, 'descanso_seg', e.target.value)}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <label className="block text-[10px] text-muted mb-0.5">Actividad</label>
                            <select className="input-tl py-1 text-xs" value={it.tipo_actividad} onChange={(e) => actualizarItem(idx, 'tipo_actividad', e.target.value)}>
                              {TIPOS_ACTIVIDAD_CARDIO.map((t) => (
                                <option key={t} value={t}>
                                  {t}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-[10px] text-muted mb-0.5">Km objetivo</label>
                            <input
                              type="number"
                              className="input-tl py-1 text-xs"
                              value={it.distancia_objetivo_km}
                              onChange={(e) => actualizarItem(idx, 'distancia_objetivo_km', e.target.value)}
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] text-muted mb-0.5">Min objetivo</label>
                            <input
                              type="number"
                              className="input-tl py-1 text-xs"
                              value={it.duracion_objetivo_min}
                              onChange={(e) => actualizarItem(idx, 'duracion_objetivo_min', e.target.value)}
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-[10px] text-muted mb-0.5">Notas (ej. series, ritmo)</label>
                          <input
                            className="input-tl py-1 text-xs"
                            value={it.notas_cardio}
                            placeholder="Ej. 6x400m con 90s de descanso"
                            onChange={(e) => actualizarItem(idx, 'notas_cardio', e.target.value)}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                {items.length === 0 && <p className="text-xs text-muted text-center py-3">Agrega ejercicios a la rutina</p>}
              </div>
            </div>
            <div className="flex justify-end gap-2 px-5 py-4 border-t border-border">
              <button onClick={() => setModal(false)} className="btn-tl">
                Cancelar
              </button>
              <button onClick={guardarRutina} disabled={guardando} className="btn-tl-blue">
                {guardando ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                {modoEditar ? 'Guardar cambios' : 'Crear rutina'}
              </button>
            </div>
          </div>
        </div>
      )}

      {sesionRutina && (
        <SesionActiva
          rutina={sesionRutina}
          ejerciciosDisponibles={ejercicios}
          usuarioId={usuarioId}
          perfil={perfil}
          onCerrar={() => setSesionRutina(null)}
        />
      )}
    </div>
  )
}
