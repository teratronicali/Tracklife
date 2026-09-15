'use client'

import { useEffect, useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import { useRouter } from 'next/navigation'
import { Calendar, Play, Loader2, X, Sparkles, Trash2, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'
import type { Ejercicio, NivelEntrenamiento, Perfil, PlanConDias, RutinaConEjercicios } from '@/lib/types'
import {
  DIAS_SEMANA,
  NIVELES_ENTRENAMIENTO,
  OBJETIVOS_ENTRENAMIENTO,
  PLANES_PLANTILLA,
  aplicarPlantilla,
  type ObjetivoEntrenamiento,
  type PlanPlantilla,
} from '@/lib/plantillas-entrenamiento'
import SesionActiva from './SesionActiva'

export default function PlanEntrenamientoView({
  planInicial,
  rutinasDisponibles,
  setRutinasDisponibles,
  ejercicios,
  usuarioId,
  perfil,
}: {
  planInicial: PlanConDias | null
  rutinasDisponibles: RutinaConEjercicios[]
  setRutinasDisponibles: Dispatch<SetStateAction<RutinaConEjercicios[]>>
  ejercicios: Ejercicio[]
  usuarioId: string
  perfil: Perfil
}) {
  const supabase = createClient()
  const router = useRouter()
  const [plan, setPlan] = useState(planInicial)
  const [modal, setModal] = useState(false)
  const [modo, setModo] = useState<'plantillas' | 'personalizado'>('plantillas')
  const [filtroObjetivo, setFiltroObjetivo] = useState<ObjetivoEntrenamiento | 'todos'>('todos')
  const [filtroNivel, setFiltroNivel] = useState<NivelEntrenamiento | 'todos'>('todos')
  const [aplicando, setAplicando] = useState<string | null>(null)
  const [nombrePersonalizado, setNombrePersonalizado] = useState('')
  const [objetivoPersonalizado, setObjetivoPersonalizado] = useState<ObjetivoEntrenamiento>('fuerza')
  const [nivelPersonalizado, setNivelPersonalizado] = useState<NivelEntrenamiento>('principiante')
  const [sesionRutina, setSesionRutina] = useState<RutinaConEjercicios | null>(null)

  useEffect(() => setPlan(planInicial), [planInicial])

  const plantillasFiltradas = PLANES_PLANTILLA.filter(
    (p) => (filtroObjetivo === 'todos' || p.objetivo === filtroObjetivo) && (filtroNivel === 'todos' || p.nivel === filtroNivel)
  )

  async function usarPlantilla(plantilla: PlanPlantilla) {
    setAplicando(plantilla.id)
    try {
      const nuevoPlan = await aplicarPlantilla(supabase, usuarioId, plantilla)
      setPlan(nuevoPlan)
      const rutinasNuevas = nuevoPlan.dias.map((d) => d.rutina).filter((r): r is RutinaConEjercicios => Boolean(r))
      setRutinasDisponibles((prev) => [...rutinasNuevas, ...prev])
      setModal(false)
      toast.success(`Plan cargado: ${plantilla.nombre}`)
      router.refresh()
    } catch {
      toast.error('No se pudo cargar el plan')
    } finally {
      setAplicando(null)
    }
  }

  async function crearPlanPersonalizado() {
    if (!nombrePersonalizado.trim()) {
      toast.error('Ponle un nombre a tu plan')
      return
    }
    setAplicando('personalizado')
    await supabase.from('planes_entrenamiento').update({ activo: false }).eq('usuario_id', usuarioId).eq('activo', true)
    const { data: nuevoPlan, error } = await supabase
      .from('planes_entrenamiento')
      .insert({ usuario_id: usuarioId, nombre: nombrePersonalizado.trim(), objetivo: objetivoPersonalizado, nivel: nivelPersonalizado, activo: true })
      .select()
      .single()
    if (error || !nuevoPlan) {
      toast.error('No se pudo crear el plan')
      setAplicando(null)
      return
    }
    const filas = Array.from({ length: 7 }, (_, dia_semana) => ({ usuario_id: usuarioId, plan_id: nuevoPlan.id, dia_semana, descanso: true }))
    const { data: dias } = await supabase.from('plan_dias').insert(filas).select()
    setPlan({ ...nuevoPlan, dias: (dias ?? []).sort((a, b) => a.dia_semana - b.dia_semana) })
    setNombrePersonalizado('')
    setAplicando(null)
    setModal(false)
    toast.success('Plan creado, asigna una rutina a cada dia')
    router.refresh()
  }

  async function asignarRutinaADia(diaSemana: number, rutinaId: string | null) {
    if (!plan) return
    const diaActual = plan.dias.find((d) => d.dia_semana === diaSemana)
    if (!diaActual) return
    const { error } = await supabase
      .from('plan_dias')
      .update({ rutina_id: rutinaId, descanso: rutinaId === null })
      .eq('id', diaActual.id)
    if (error) {
      toast.error('No se pudo actualizar el dia')
      return
    }
    const rutina = rutinaId ? rutinasDisponibles.find((r) => r.id === rutinaId) : undefined
    setPlan({
      ...plan,
      dias: plan.dias.map((d) => (d.dia_semana === diaSemana ? { ...d, rutina_id: rutinaId, descanso: rutinaId === null, rutina } : d)),
    })
    router.refresh()
  }

  async function eliminarPlan() {
    if (!plan) return
    const { error } = await supabase.from('planes_entrenamiento').delete().eq('id', plan.id)
    if (error) {
      toast.error('No se pudo eliminar el plan')
      return
    }
    setPlan(null)
    toast.success('Plan eliminado')
    router.refresh()
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium flex items-center gap-2">
          <Calendar size={15} /> Tu plan de entrenamiento
        </h2>
        <div className="flex items-center gap-2">
          {plan && (
            <button onClick={eliminarPlan} className="btn-tl text-xs hover:text-red-500">
              <Trash2 size={13} /> Eliminar plan
            </button>
          )}
          <button onClick={() => setModal(true)} className="btn-tl-blue text-xs">
            {plan ? <RefreshCw size={13} /> : <Sparkles size={13} />} {plan ? 'Cambiar plan' : 'Elegir plan'}
          </button>
        </div>
      </div>

      {!plan ? (
        <div className="card p-6 text-center">
          <Calendar size={22} className="mx-auto mb-2 text-muted" />
          <p className="text-sm font-medium mb-1">Aun no tienes un plan de entrenamiento</p>
          <p className="text-xs text-muted max-w-sm mx-auto">
            Elige un plan predeterminado segun tu objetivo (fuerza, hipertrofia, perdida de peso o running) y tu nivel, o arma uno
            personalizado asignando tus propias rutinas a cada dia de la semana.
          </p>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <span className="pill">{OBJETIVOS_ENTRENAMIENTO.find((o) => o.id === plan.objetivo)?.label ?? plan.objetivo}</span>
            <span className="pill capitalize">{plan.nivel}</span>
            <span className="text-xs text-muted">{plan.nombre}</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
            {DIAS_SEMANA.map((nombreDia, diaSemana) => {
              const dia = plan.dias.find((d) => d.dia_semana === diaSemana)
              const rutina = dia?.rutina
              return (
                <div key={diaSemana} className="card p-3 flex flex-col gap-2 min-h-[140px]">
                  <p className="text-[11px] text-muted uppercase tracking-wide">{nombreDia}</p>
                  {rutina ? (
                    <>
                      <p className="text-xs font-medium leading-tight">{rutina.nombre}</p>
                      <span className="pill w-fit">{rutina.tipo === 'cardio' ? 'Cardio' : 'Gym'}</span>
                      <button onClick={() => setSesionRutina(rutina)} className="btn-tl-blue text-[11px] mt-auto">
                        <Play size={11} /> Iniciar
                      </button>
                    </>
                  ) : (
                    <p className="text-xs text-muted mt-auto">Descanso</p>
                  )}
                  <select
                    className="input-tl text-[10px] py-1"
                    value={dia?.rutina_id ?? ''}
                    onChange={(e) => asignarRutinaADia(diaSemana, e.target.value || null)}
                  >
                    <option value="">Descanso</option>
                    {rutinasDisponibles.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              )
            })}
          </div>
        </>
      )}

      {modal && (
        <div className="fixed inset-0 bg-black/70 z-[60] flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h2 className="font-medium text-sm">Elige tu plan de entrenamiento</h2>
              <button onClick={() => setModal(false)} className="text-muted hover:text-foreground">
                <X size={18} />
              </button>
            </div>

            <div className="px-5 pt-4">
              <div className="inline-flex rounded-full border border-border p-0.5">
                <button
                  onClick={() => setModo('plantillas')}
                  className="px-3 py-1.5 rounded-full text-xs font-medium"
                  style={modo === 'plantillas' ? { background: 'var(--tl-blue)', color: 'white' } : { color: 'var(--tl-muted)' }}
                >
                  Plantillas predeterminadas
                </button>
                <button
                  onClick={() => setModo('personalizado')}
                  className="px-3 py-1.5 rounded-full text-xs font-medium"
                  style={modo === 'personalizado' ? { background: 'var(--tl-blue)', color: 'white' } : { color: 'var(--tl-muted)' }}
                >
                  Personalizado
                </button>
              </div>
            </div>

            <div className="p-5 overflow-y-auto space-y-3">
              {modo === 'plantillas' ? (
                <>
                  <div className="flex flex-wrap gap-2">
                    <select className="input-tl text-xs w-auto" value={filtroObjetivo} onChange={(e) => setFiltroObjetivo(e.target.value as ObjetivoEntrenamiento | 'todos')}>
                      <option value="todos">Todos los objetivos</option>
                      {OBJETIVOS_ENTRENAMIENTO.map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.emoji} {o.label}
                        </option>
                      ))}
                    </select>
                    <select className="input-tl text-xs w-auto" value={filtroNivel} onChange={(e) => setFiltroNivel(e.target.value as NivelEntrenamiento | 'todos')}>
                      <option value="todos">Todos los niveles</option>
                      {NIVELES_ENTRENAMIENTO.map((n) => (
                        <option key={n.id} value={n.id}>
                          {n.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    {plantillasFiltradas.map((p) => (
                      <div key={p.id} className="card p-3 flex flex-col gap-2">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-medium">{p.nombre}</p>
                            <p className="text-[11px] text-muted mt-0.5">{p.descripcion}</p>
                          </div>
                          <button onClick={() => usarPlantilla(p)} disabled={aplicando === p.id} className="btn-tl-blue text-xs shrink-0">
                            {aplicando === p.id ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
                            Usar
                          </button>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="pill">{OBJETIVOS_ENTRENAMIENTO.find((o) => o.id === p.objetivo)?.label}</span>
                          <span className="pill capitalize">{p.nivel}</span>
                          <div className="flex gap-0.5 ml-auto">
                            {[...p.dias]
                              .sort((a, b) => a.dia_semana - b.dia_semana)
                              .map((d, i) => (
                                <span
                                  key={i}
                                  className="w-4 h-4 rounded-sm"
                                  title={DIAS_SEMANA[d.dia_semana]}
                                  style={{ background: d.gym ? 'var(--tl-blue)' : d.cardio ? 'var(--tl-green)' : 'var(--tl-surface-3)' }}
                                />
                              ))}
                          </div>
                        </div>
                      </div>
                    ))}
                    {plantillasFiltradas.length === 0 && <p className="text-xs text-muted text-center py-4">No hay plantillas con esos filtros</p>}
                  </div>
                </>
              ) : (
                <div className="space-y-4 max-w-sm">
                  <div>
                    <label className="block text-xs font-medium text-muted mb-1">Nombre del plan</label>
                    <input className="input-tl" value={nombrePersonalizado} onChange={(e) => setNombrePersonalizado(e.target.value)} placeholder="Ej. Mi plan de verano" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted mb-1">Objetivo</label>
                    <select className="input-tl" value={objetivoPersonalizado} onChange={(e) => setObjetivoPersonalizado(e.target.value as ObjetivoEntrenamiento)}>
                      {OBJETIVOS_ENTRENAMIENTO.map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.emoji} {o.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted mb-1">Nivel</label>
                    <select className="input-tl" value={nivelPersonalizado} onChange={(e) => setNivelPersonalizado(e.target.value as NivelEntrenamiento)}>
                      {NIVELES_ENTRENAMIENTO.map((n) => (
                        <option key={n.id} value={n.id}>
                          {n.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <p className="text-[11px] text-muted">
                    Se crea una semana vacia (7 dias de descanso) para que asignes tus propias rutinas dia por dia desde el calendario.
                  </p>
                  <button onClick={crearPlanPersonalizado} disabled={aplicando === 'personalizado'} className="btn-tl-blue text-xs">
                    {aplicando === 'personalizado' ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
                    Crear plan vacio
                  </button>
                </div>
              )}
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
