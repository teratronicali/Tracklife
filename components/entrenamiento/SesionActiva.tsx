'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { X, Check, ChevronLeft, ChevronRight, Plus, Trash2, Repeat, Loader2, TimerReset, Timer } from 'lucide-react'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'
import type { Ejercicio, Perfil, RutinaConEjercicios } from '@/lib/types'
import { XP_TABLE } from '@/lib/gamification'
import { otorgarXP } from '@/lib/xp-client'

interface SetEnCurso {
  reps: string
  peso: string
  rir: string
  completado: boolean
}

interface CardioEnCurso {
  distancia: string
  duracion: string
  completado: boolean
}

interface ExercicioSesion {
  rutinaEjercicioId: string
  ejercicio: Ejercicio
  seriesObjetivo: number
  repsObjetivo: string
  pesoObjetivo: number | null
  descansoSeg: number
  sets: SetEnCurso[]
  previa: string | null
  tipoActividad: string | null
  distanciaObjetivoKm: number | null
  duracionObjetivoMin: number | null
  notasCardio: string | null
  cardio: CardioEnCurso
}

function mmss(totalSeg: number) {
  const m = Math.floor(totalSeg / 60)
  const s = totalSeg % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

export default function SesionActiva({
  rutina,
  ejerciciosDisponibles,
  usuarioId,
  perfil,
  onCerrar,
  onFinalizada,
}: {
  rutina: RutinaConEjercicios
  ejerciciosDisponibles: Ejercicio[]
  usuarioId: string
  perfil: Perfil
  onCerrar: () => void
  onFinalizada?: (sesionId: string | null) => void
}) {
  const supabase = createClient()
  const router = useRouter()
  const iniciadaEn = useRef(Date.now())
  const esCardio = rutina.tipo === 'cardio'

  const [sesionId, setSesionId] = useState<string | null>(null)
  const [activo, setActivo] = useState(0)
  const [segundos, setSegundos] = useState(0)
  const [descanso, setDescanso] = useState<number | null>(null)
  const [picadorAbierto, setPicadorAbierto] = useState(false)
  const [terminando, setTerminando] = useState(false)

  const [ejercicios, setEjercicios] = useState<ExercicioSesion[]>(() =>
    rutina.ejercicios.map((re) => ({
      rutinaEjercicioId: re.id,
      ejercicio: re.ejercicio as Ejercicio,
      seriesObjetivo: re.series_objetivo,
      repsObjetivo: re.reps_objetivo,
      pesoObjetivo: re.peso_objetivo,
      descansoSeg: re.descanso_seg,
      previa: null,
      tipoActividad: re.tipo_actividad,
      distanciaObjetivoKm: re.distancia_objetivo_km,
      duracionObjetivoMin: re.duracion_objetivo_min,
      notasCardio: re.notas_cardio,
      sets: Array.from({ length: re.series_objetivo }, () => ({
        reps: '',
        peso: re.peso_objetivo ? String(re.peso_objetivo) : '',
        rir: '',
        completado: false,
      })),
      cardio: {
        distancia: re.distancia_objetivo_km ? String(re.distancia_objetivo_km) : '',
        duracion: re.duracion_objetivo_min ? String(re.duracion_objetivo_min) : '',
        completado: false,
      },
    }))
  )

  useEffect(() => {
    const t = setInterval(() => setSegundos(Math.floor((Date.now() - iniciadaEn.current) / 1000)), 1000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    if (descanso === null) return
    if (descanso <= 0) {
      setDescanso(null)
      return
    }
    const t = setTimeout(() => setDescanso((d) => (d === null ? null : d - 1)), 1000)
    return () => clearTimeout(t)
  }, [descanso])

  useEffect(() => {
    async function iniciar() {
      const { data } = await supabase
        .from('sesiones_entrenamiento')
        .insert({ usuario_id: usuarioId, rutina_id: rutina.id, nombre: rutina.nombre })
        .select()
        .single()
      if (data) setSesionId(data.id)
    }
    iniciar()

    async function cargarPrevias() {
      const ids = rutina.ejercicios.map((re) => re.ejercicio_id)
      const { data } = await supabase
        .from('entrenamiento_registros')
        .select('ejercicio_id, peso, reps, distancia_km, duracion_min')
        .eq('usuario_id', usuarioId)
        .in('ejercicio_id', ids)
        .order('created_at', { ascending: false })
        .limit(200)
      if (!data) return
      const ultimaPorEjercicio = new Map<string, { peso: number; reps: number; distancia_km: number | null; duracion_min: number | null }>()
      for (const r of data as { ejercicio_id: string; peso: number; reps: number; distancia_km: number | null; duracion_min: number | null }[]) {
        if (!ultimaPorEjercicio.has(r.ejercicio_id)) ultimaPorEjercicio.set(r.ejercicio_id, r)
      }
      setEjercicios((prev) =>
        prev.map((e) => {
          const u = ultimaPorEjercicio.get(e.ejercicio.id)
          if (!u) return e
          const previa = esCardio
            ? [u.distancia_km ? `${u.distancia_km} km` : null, u.duracion_min ? `${u.duracion_min} min` : null].filter(Boolean).join(' en ')
            : `${u.peso} kg x ${u.reps}`
          return { ...e, previa: previa || null }
        })
      )
    }
    cargarPrevias()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const actual = ejercicios[activo]
  const totalSets = esCardio ? ejercicios.length : ejercicios.reduce((s, e) => s + e.sets.length, 0)
  const setsCompletados = esCardio
    ? ejercicios.filter((e) => e.cardio.completado).length
    : ejercicios.reduce((s, e) => s + e.sets.filter((x) => x.completado).length, 0)

  function actualizarSet(idxSet: number, campo: keyof SetEnCurso, valor: string) {
    setEjercicios((prev) =>
      prev.map((e, i) =>
        i !== activo
          ? e
          : { ...e, sets: e.sets.map((s, j) => (j === idxSet ? { ...s, [campo]: valor } : s)) }
      )
    )
  }

  function actualizarCardio(campo: 'distancia' | 'duracion', valor: string) {
    setEjercicios((prev) => prev.map((e, i) => (i !== activo ? e : { ...e, cardio: { ...e.cardio, [campo]: valor } })))
  }

  function toggleCardioCompletado() {
    setEjercicios((prev) =>
      prev.map((e, i) => {
        if (i !== activo) return e
        const nuevoCompletado = !e.cardio.completado
        if (nuevoCompletado && !e.cardio.distancia && !e.cardio.duracion) {
          toast.error('Registra distancia o duracion antes de marcarlo')
          return e
        }
        return { ...e, cardio: { ...e.cardio, completado: nuevoCompletado } }
      })
    )
  }

  function toggleCompletado(idxSet: number) {
    setEjercicios((prev) =>
      prev.map((e, i) => {
        if (i !== activo) return e
        const set = e.sets[idxSet]
        const nuevoCompletado = !set.completado
        if (nuevoCompletado && (!set.reps || Number(set.reps) <= 0)) {
          toast.error('Ponle las reps antes de marcarla')
          return e
        }
        if (nuevoCompletado) setDescanso(e.descansoSeg)
        return { ...e, sets: e.sets.map((s, j) => (j === idxSet ? { ...s, completado: nuevoCompletado } : s)) }
      })
    )
  }

  function agregarSerie() {
    setEjercicios((prev) =>
      prev.map((e, i) => {
        if (i !== activo) return e
        const ultima = e.sets[e.sets.length - 1]
        return { ...e, sets: [...e.sets, { reps: ultima?.reps ?? '', peso: ultima?.peso ?? '', rir: '', completado: false }] }
      })
    )
  }

  function quitarSerie(idxSet: number) {
    setEjercicios((prev) => prev.map((e, i) => (i !== activo ? e : { ...e, sets: e.sets.filter((_, j) => j !== idxSet) })))
  }

  function cambiarEjercicio(nuevo: Ejercicio) {
    setEjercicios((prev) =>
      prev.map((e, i) => (i !== activo ? e : { ...e, ejercicio: nuevo, previa: null }))
    )
    setPicadorAbierto(false)
  }

  async function terminarSesion() {
    setTerminando(true)
    const filas = esCardio
      ? ejercicios
          .filter((e) => e.cardio.completado)
          .map((e) => ({
            usuario_id: usuarioId,
            ejercicio_id: e.ejercicio.id,
            peso: 0,
            reps: 0,
            series: 1,
            numero_serie: 1,
            rir: null,
            sesion_id: sesionId,
            distancia_km: e.cardio.distancia ? Number(e.cardio.distancia) : null,
            duracion_min: e.cardio.duracion ? Number(e.cardio.duracion) : null,
            tipo_actividad: e.tipoActividad ?? 'general',
          }))
      : ejercicios.flatMap((e) =>
          e.sets
            .map((s, idx) => ({ ...s, numero: idx + 1 }))
            .filter((s) => s.completado)
            .map((s) => ({
              usuario_id: usuarioId,
              ejercicio_id: e.ejercicio.id,
              peso: Number(s.peso) || 0,
              reps: Number(s.reps) || 0,
              series: 1,
              numero_serie: s.numero,
              rir: s.rir ? Number(s.rir) : null,
              sesion_id: sesionId,
            }))
        )

    if (filas.length === 0) {
      toast.error(esCardio ? 'No marcaste ninguna actividad como hecha' : 'No marcaste ninguna serie como hecha')
      setTerminando(false)
      return
    }

    const { error } = await supabase.from('entrenamiento_registros').insert(filas)
    if (error) {
      toast.error('No se pudo guardar el entrenamiento')
      setTerminando(false)
      return
    }

    if (sesionId) {
      await supabase.from('sesiones_entrenamiento').update({ finalizada_en: new Date().toISOString() }).eq('id', sesionId)
    }

    await otorgarXP(supabase, perfil, {
      p_xp: XP_TABLE.entrenamiento * filas.length,
      p_tipo: 'entrenamiento',
      p_descripcion: esCardio ? rutina.nombre : `${rutina.nombre} · ${filas.length} series`,
    })

    toast.success(esCardio ? 'Entrenamiento cardio guardado' : `Entrenamiento guardado: ${filas.length} series`)
    router.refresh()
    setTerminando(false)
    onFinalizada?.(sesionId)
    onCerrar()
  }

  if (!actual) return null

  return (
    <div className="fixed inset-0 bg-background z-[70] flex flex-col">
      <div className="brand-stripe" />
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <button onClick={onCerrar} className="text-muted hover:text-foreground">
          <X size={20} />
        </button>
        <div className="text-center">
          <p className="text-sm font-medium font-mono">{mmss(segundos)}</p>
          <p className="text-[10px] text-muted">
            {setsCompletados}/{totalSets} {esCardio ? 'actividades' : 'series'}
          </p>
        </div>
        <button onClick={terminarSesion} disabled={terminando} className="btn-tl-blue">
          {terminando ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
          Terminar
        </button>
      </div>

      {ejercicios.length > 1 && (
        <div className="flex items-center gap-2 px-4 py-3 overflow-x-auto border-b border-border">
          {ejercicios.map((e, i) => {
            const hecho = esCardio ? e.cardio.completado : e.sets.length > 0 && e.sets.every((s) => s.completado)
            return (
              <button
                key={e.rutinaEjercicioId}
                onClick={() => setActivo(i)}
                className="shrink-0 w-11 h-11 rounded-full border-2 flex items-center justify-center text-xs font-medium relative"
                style={{
                  borderColor: i === activo ? 'var(--tl-blue)' : 'var(--tl-border)',
                  background: i === activo ? 'var(--tl-blue-dim)' : 'transparent',
                }}
                title={e.ejercicio.nombre}
              >
                {hecho ? <Check size={16} style={{ color: 'var(--tl-green)' }} /> : i + 1}
              </button>
            )
          })}
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        <div>
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-medium">{actual.ejercicio.nombre}</h2>
              <span className="pill capitalize mt-1 inline-block">{esCardio ? actual.tipoActividad ?? 'cardio' : actual.ejercicio.grupo_muscular}</span>
            </div>
            {!esCardio && (
              <button onClick={() => setPicadorAbierto(true)} className="btn-tl shrink-0">
                <Repeat size={13} /> Cambiar
              </button>
            )}
          </div>
          {esCardio ? (
            <div className="text-xs text-muted mt-2 space-y-0.5">
              <p>
                Objetivo:{' '}
                {[actual.distanciaObjetivoKm ? `${actual.distanciaObjetivoKm} km` : null, actual.duracionObjetivoMin ? `${actual.duracionObjetivoMin} min` : null]
                  .filter(Boolean)
                  .join(' en ') || 'a tu ritmo'}
                {actual.previa && <span> · Anterior: {actual.previa}</span>}
              </p>
              {actual.notasCardio && <p>{actual.notasCardio}</p>}
            </div>
          ) : (
            <p className="text-xs text-muted mt-2">
              Objetivo: {actual.seriesObjetivo} series x {actual.repsObjetivo} reps
              {actual.previa && <span> · Anterior: {actual.previa}</span>}
            </p>
          )}
        </div>

        {esCardio ? (
          <div className="card p-4 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-muted mb-1">Distancia (km)</label>
                <input
                  type="number"
                  inputMode="decimal"
                  className="input-tl"
                  value={actual.cardio.distancia}
                  onChange={(e) => actualizarCardio('distancia', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted mb-1">Duracion (min)</label>
                <input
                  type="number"
                  inputMode="numeric"
                  className="input-tl"
                  value={actual.cardio.duracion}
                  onChange={(e) => actualizarCardio('duracion', e.target.value)}
                />
              </div>
            </div>
            <button
              onClick={toggleCardioCompletado}
              className="w-full py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2 border"
              style={{
                borderColor: actual.cardio.completado ? 'var(--tl-green)' : 'var(--tl-border)',
                background: actual.cardio.completado ? 'var(--tl-green)' : 'transparent',
                color: actual.cardio.completado ? 'white' : 'inherit',
              }}
            >
              <Check size={15} /> {actual.cardio.completado ? 'Marcado como hecho' : 'Marcar como hecho'}
            </button>
          </div>
        ) : (
          <div className="card overflow-hidden">
            <table className="tl-table">
              <thead>
                <tr>
                  <th className="w-8">#</th>
                  <th>Kg</th>
                  <th>Reps</th>
                  <th>RIR</th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody>
                {actual.sets.map((s, idx) => (
                  <tr key={idx} style={s.completado ? { background: 'var(--tl-blue-dim)' } : undefined}>
                    <td className="text-muted">{idx + 1}</td>
                    <td>
                      <input
                        type="number"
                        inputMode="decimal"
                        className="input-tl py-1"
                        value={s.peso}
                        placeholder={actual.previa ? actual.previa.split(' kg')[0] : '0'}
                        onChange={(e) => actualizarSet(idx, 'peso', e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        inputMode="numeric"
                        className="input-tl py-1"
                        value={s.reps}
                        placeholder={actual.repsObjetivo}
                        onChange={(e) => actualizarSet(idx, 'reps', e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        inputMode="numeric"
                        className="input-tl py-1"
                        value={s.rir}
                        placeholder="—"
                        onChange={(e) => actualizarSet(idx, 'rir', e.target.value)}
                      />
                    </td>
                    <td className="flex items-center gap-2 justify-end">
                      <button
                        onClick={() => toggleCompletado(idx)}
                        className="w-7 h-7 rounded-md border flex items-center justify-center shrink-0"
                        style={{
                          borderColor: s.completado ? 'var(--tl-green)' : 'var(--tl-border)',
                          background: s.completado ? 'var(--tl-green)' : 'transparent',
                        }}
                      >
                        {s.completado && <Check size={14} className="text-white" />}
                      </button>
                      {actual.sets.length > 1 && (
                        <button onClick={() => quitarSerie(idx)} className="text-muted hover:text-red-500">
                          <Trash2 size={13} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button onClick={agregarSerie} className="w-full py-2.5 text-xs font-medium text-muted hover:text-foreground flex items-center justify-center gap-1.5 border-t border-border">
              <Plus size={13} /> Añadir serie
            </button>
          </div>
        )}
      </div>

      {ejercicios.length > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-border">
          <button
            onClick={() => setActivo((a) => Math.max(0, a - 1))}
            disabled={activo === 0}
            className="btn-tl disabled:opacity-0"
          >
            <ChevronLeft size={14} /> Anterior
          </button>
          <button
            onClick={() => setActivo((a) => Math.min(ejercicios.length - 1, a + 1))}
            disabled={activo === ejercicios.length - 1}
            className="btn-tl disabled:opacity-0"
          >
            Siguiente <ChevronRight size={14} />
          </button>
        </div>
      )}

      {descanso !== null && (
        <div
          className="fixed bottom-20 left-1/2 -translate-x-1/2 rounded-full px-4 py-2 flex items-center gap-3 shadow-2xl border"
          style={{ background: 'var(--tl-surface-2)', borderColor: 'var(--tl-blue)' }}
        >
          <TimerReset size={15} style={{ color: 'var(--tl-blue)' }} />
          <span className="text-sm font-mono font-medium">{mmss(descanso)}</span>
          <button onClick={() => setDescanso((d) => (d ?? 0) + 15)} className="text-[11px] text-muted hover:text-foreground">
            +15s
          </button>
          <button onClick={() => setDescanso(null)} className="text-[11px] font-medium" style={{ color: 'var(--tl-blue)' }}>
            Saltar
          </button>
        </div>
      )}

      {esCardio && (
        <div className="flex items-center justify-center gap-1.5 pb-3 text-[11px] text-muted">
          <Timer size={12} /> Registra tu actividad real al terminar, sin importar si difiere del objetivo
        </div>
      )}

      {picadorAbierto && (
        <div className="fixed inset-0 bg-black/70 z-[80] flex items-end sm:items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-2xl shadow-2xl w-full max-w-sm max-h-[70vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border sticky top-0 bg-surface">
              <h2 className="font-medium text-sm">Cambiar ejercicio</h2>
              <button onClick={() => setPicadorAbierto(false)} className="text-muted hover:text-foreground">
                <X size={18} />
              </button>
            </div>
            <div className="p-2">
              {ejerciciosDisponibles.map((ej) => (
                <button
                  key={ej.id}
                  onClick={() => cambiarEjercicio(ej)}
                  className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-surface-2 text-sm flex items-center justify-between"
                >
                  {ej.nombre}
                  <span className="pill capitalize">{ej.grupo_muscular}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
