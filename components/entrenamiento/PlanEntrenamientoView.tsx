'use client'

import { useEffect, useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Calendar, Play, Loader2, X, Sparkles, Trash2, RefreshCw, Check, CalendarClock, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'
import type { Ejercicio, NivelEntrenamiento, Perfil, PlanConDias, PlanDiaEstado, RutinaConEjercicios } from '@/lib/types'
import {
  DIAS_SEMANA,
  NIVELES_ENTRENAMIENTO,
  OBJETIVOS_ENTRENAMIENTO,
  PLANES_PLANTILLA,
  aplicarPlantilla,
  type ObjetivoEntrenamiento,
  type PlanPlantilla,
} from '@/lib/plantillas-entrenamiento'
import {
  construirCalendarioSemana,
  fechaISO,
  fetchEstadosPlan,
  inicioSemana,
  marcarCumplidoRetroactivo,
  marcarIncumplidoYCompensar,
  revisarDiasPendientes,
  sumarDias,
  type DiaCalendario,
  type DiaPorRevisar,
} from '@/lib/plan-semana'
import SesionActiva from './SesionActiva'

function formatoFecha(fecha: string) {
  return format(new Date(`${fecha}T00:00:00`), "EEEE d 'de' MMMM", { locale: es })
}

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
  const [diasPersonalizado, setDiasPersonalizado] = useState<(string | null)[]>(Array(7).fill(null))
  const [sesionRutina, setSesionRutina] = useState<RutinaConEjercicios | null>(null)

  const [estadosSemana, setEstadosSemana] = useState<PlanDiaEstado[]>([])
  const [porRevisar, setPorRevisar] = useState<DiaPorRevisar[]>([])
  const [resolviendo, setResolviendo] = useState(false)
  const [confirmandoHoy, setConfirmandoHoy] = useState<DiaCalendario | null>(null)

  useEffect(() => setPlan(planInicial), [planInicial])

  const hoy = new Date()
  const hoyISO = fechaISO(hoy)
  const inicioLunes = inicioSemana(hoy)

  useEffect(() => {
    if (!plan) {
      setEstadosSemana([])
      setPorRevisar([])
      return
    }
    let cancelado = false
    async function cargar() {
      if (!plan) return
      const { porRevisar: pendientes } = await revisarDiasPendientes(supabase, usuarioId, plan, rutinasDisponibles)
      const semana = await fetchEstadosPlan(supabase, plan.id, fechaISO(inicioLunes), fechaISO(sumarDias(inicioLunes, 6)))
      if (!cancelado) {
        setPorRevisar(pendientes)
        setEstadosSemana(semana)
      }
    }
    cargar()
    return () => {
      cancelado = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan?.id])

  const calendario: DiaCalendario[] = plan ? construirCalendarioSemana(plan, estadosSemana, rutinasDisponibles, inicioLunes, hoyISO) : []
  const diaHoy = calendario.find((d) => d.esHoy) ?? null
  const revisando = porRevisar[0] ?? null

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

  function actualizarDiaPersonalizado(diaSemana: number, rutinaId: string | null) {
    setDiasPersonalizado((prev) => prev.map((v, i) => (i === diaSemana ? rutinaId : v)))
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
    const filas = diasPersonalizado.map((rutinaId, dia_semana) => ({
      usuario_id: usuarioId,
      plan_id: nuevoPlan.id,
      dia_semana,
      rutina_id: rutinaId,
      descanso: rutinaId === null,
    }))
    const { data: dias } = await supabase.from('plan_dias').insert(filas).select()
    const diasConRutina = (dias ?? []).map((d) => ({
      ...d,
      rutina: d.rutina_id ? rutinasDisponibles.find((r) => r.id === d.rutina_id) : undefined,
    }))
    setPlan({ ...nuevoPlan, dias: diasConRutina.sort((a, b) => a.dia_semana - b.dia_semana) })
    setNombrePersonalizado('')
    setDiasPersonalizado(Array(7).fill(null))
    setAplicando(null)
    setModal(false)
    toast.success('Plan creado')
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

  async function resolverSiEntrene() {
    if (!plan || !revisando) return
    setResolviendo(true)
    await marcarCumplidoRetroactivo(supabase, usuarioId, plan.id, revisando.fecha, revisando.rutina.id)
    setPorRevisar((prev) => prev.slice(1))
    setResolviendo(false)
    toast.success('Anotado, gracias por confirmar')
  }

  async function resolverNoPude() {
    if (!plan || !revisando) return
    setResolviendo(true)
    const { compensadoEn } = await marcarIncumplidoYCompensar(supabase, usuarioId, plan, revisando.fecha, revisando.rutina.id)
    setPorRevisar((prev) => prev.slice(1))
    const semana = await fetchEstadosPlan(supabase, plan.id, fechaISO(inicioLunes), fechaISO(sumarDias(inicioLunes, 6)))
    setEstadosSemana(semana)
    setResolviendo(false)
    if (compensadoEn) {
      toast.success(`Sin problema. Movimos ${revisando.rutina.nombre} al ${formatoFecha(compensadoEn)}`)
    } else {
      toast('No quedan dias de descanso libres esta semana para compensarlo', { icon: '⚠️' })
    }
  }

  async function confirmarNoHoy() {
    if (!plan || !confirmandoHoy?.rutina) return
    setResolviendo(true)
    const { compensadoEn } = await marcarIncumplidoYCompensar(supabase, usuarioId, plan, confirmandoHoy.fecha, confirmandoHoy.rutina.id)
    const semana = await fetchEstadosPlan(supabase, plan.id, fechaISO(inicioLunes), fechaISO(sumarDias(inicioLunes, 6)))
    setEstadosSemana(semana)
    setResolviendo(false)
    setConfirmandoHoy(null)
    if (compensadoEn) {
      toast.success(`Listo. Movimos ${confirmandoHoy.rutina.nombre} al ${formatoFecha(compensadoEn)}`)
    } else {
      toast('Quedo marcado. No hay dias de descanso libres esta semana para compensarlo', { icon: '⚠️' })
    }
  }

  async function marcarHoyCumplido(sesionId: string | null) {
    if (!plan || !diaHoy?.rutina) return
    await supabase
      .from('plan_dia_estados')
      .upsert(
        { usuario_id: usuarioId, plan_id: plan.id, fecha: hoyISO, rutina_id: diaHoy.rutina.id, estado: 'cumplido', sesion_id: sesionId },
        { onConflict: 'plan_id,fecha' }
      )
    const semana = await fetchEstadosPlan(supabase, plan.id, fechaISO(inicioLunes), fechaISO(sumarDias(inicioLunes, 6)))
    setEstadosSemana(semana)
  }

  const ESTADO_BADGE: Record<string, { label: string; color: string }> = {
    cumplido: { label: 'Cumplido', color: 'var(--tl-green)' },
    incumplido: { label: 'Incumplido', color: 'var(--tl-red)' },
    compensado: { label: 'Compensacion', color: 'var(--tl-amber)' },
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
            {calendario.map((dia) => {
              const plantilla = plan.dias.find((d) => d.dia_semana === dia.diaSemana)
              const badge = dia.estado && dia.estado.estado !== 'pendiente' ? ESTADO_BADGE[dia.estado.estado] : null
              return (
                <div
                  key={dia.fecha}
                  className="card p-3 flex flex-col gap-1.5 min-h-[150px]"
                  style={dia.esHoy ? { borderColor: 'var(--tl-blue)' } : undefined}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] text-muted uppercase tracking-wide">{dia.nombreDia}</p>
                    <p className="text-[10px] text-muted">{dia.fecha.slice(5)}</p>
                  </div>
                  {dia.rutina ? (
                    <>
                      <p className="text-xs font-medium leading-tight">{dia.rutina.nombre}</p>
                      <div className="flex items-center gap-1 flex-wrap">
                        <span className="pill">{dia.rutina.tipo === 'cardio' ? 'Cardio' : 'Gym'}</span>
                        {dia.esCompensacion && (
                          <span className="pill" style={{ color: 'var(--tl-amber)' }}>
                            Compensacion
                          </span>
                        )}
                      </div>
                    </>
                  ) : (
                    <p className="text-xs text-muted">Descanso</p>
                  )}

                  {badge && (
                    <span className="text-[10px] font-medium" style={{ color: badge.color }}>
                      {dia.estado?.estado === 'cumplido' ? '✓ ' : dia.estado?.estado === 'incumplido' ? '✕ ' : '↻ '}
                      {badge.label}
                    </span>
                  )}
                  {dia.esPasado && !dia.estado && dia.rutina && <span className="text-[10px] text-muted">Sin registrar</span>}

                  <div className="mt-auto space-y-1">
                    {dia.esHoy && dia.rutina && !dia.estado && (
                      <button onClick={() => setSesionRutina(dia.rutina)} className="btn-tl-blue text-[11px] w-full">
                        <Play size={11} /> Iniciar
                      </button>
                    )}
                    {dia.esHoy && dia.rutina && dia.estado?.estado === 'cumplido' && (
                      <button onClick={() => setSesionRutina(dia.rutina)} className="btn-tl text-[11px] w-full">
                        <Play size={11} /> Repetir
                      </button>
                    )}
                    {dia.esHoy && dia.rutina && !dia.estado && (
                      <button onClick={() => setConfirmandoHoy(dia)} className="text-[10px] text-muted underline block w-full text-center">
                        No voy a entrenar hoy
                      </button>
                    )}
                    {!dia.esPasado && !dia.esCompensacion && (
                      <select
                        className="input-tl text-[10px] py-1"
                        value={plantilla?.rutina_id ?? ''}
                        onChange={(e) => asignarRutinaADia(dia.diaSemana, e.target.value || null)}
                      >
                        <option value="">Descanso</option>
                        {rutinasDisponibles.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.nombre}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
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
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-lg">
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
                  </div>

                  {rutinasDisponibles.length === 0 ? (
                    <p className="text-[11px] text-muted">
                      Aun no tienes rutinas propias creadas. Crea al menos una desde la pestana &quot;Entrenamientos&quot; y luego
                      vuelve aqui para asignarla a los dias que quieras — o crea el plan vacio y asignalas despues desde el calendario.
                    </p>
                  ) : (
                    <div>
                      <label className="block text-xs font-medium text-muted mb-2">Asigna tus rutinas a cada dia (opcional, puedes ajustarlo despues)</label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
                        {DIAS_SEMANA.map((nombreDia, diaSemana) => (
                          <div key={diaSemana} className="space-y-1">
                            <p className="text-[10px] text-muted uppercase tracking-wide">{nombreDia}</p>
                            <select
                              className="input-tl text-[10px] py-1"
                              value={diasPersonalizado[diaSemana] ?? ''}
                              onChange={(e) => actualizarDiaPersonalizado(diaSemana, e.target.value || null)}
                            >
                              <option value="">Descanso</option>
                              {rutinasDisponibles.map((r) => (
                                <option key={r.id} value={r.id}>
                                  {r.nombre}
                                </option>
                              ))}
                            </select>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <button onClick={crearPlanPersonalizado} disabled={aplicando === 'personalizado'} className="btn-tl-blue text-xs">
                    {aplicando === 'personalizado' ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
                    Crear plan
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {revisando && (
        <div className="fixed inset-0 bg-black/70 z-[65] flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-2xl shadow-2xl w-full max-w-sm">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-border">
              <CalendarClock size={16} style={{ color: 'var(--tl-blue)' }} />
              <h2 className="font-medium text-sm">¿Que paso el {formatoFecha(revisando.fecha)}?</h2>
            </div>
            <div className="p-5 space-y-3">
              <p className="text-xs text-muted">
                Tenias programado <strong className="text-foreground">{revisando.rutina.nombre}</strong> y no quedo registrado.
              </p>
              <button onClick={resolverSiEntrene} disabled={resolviendo} className="btn-tl w-full justify-start">
                {resolviendo ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                Si entrene, se me olvido registrarlo
              </button>
              <button onClick={resolverNoPude} disabled={resolviendo} className="btn-tl w-full justify-start">
                {resolviendo ? <Loader2 size={14} className="animate-spin" /> : <AlertTriangle size={14} />}
                No pude entrenar
              </button>
              <button
                onClick={() => setPorRevisar((prev) => prev.slice(1))}
                disabled={resolviendo}
                className="text-xs text-muted underline block w-full text-center pt-1"
              >
                Ahora no, preguntame despues
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmandoHoy && (
        <div className="fixed inset-0 bg-black/70 z-[65] flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-2xl shadow-2xl w-full max-w-sm">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-border">
              <AlertTriangle size={16} style={{ color: 'var(--tl-amber)' }} />
              <h2 className="font-medium text-sm">¿No vas a entrenar hoy?</h2>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-xs text-muted">
                Vamos a marcar <strong className="text-foreground">{confirmandoHoy.rutina?.nombre}</strong> como incumplido y a buscarte un dia de
                descanso libre esta semana para compensarlo.
              </p>
              <div className="flex justify-end gap-2">
                <button onClick={() => setConfirmandoHoy(null)} className="btn-tl">
                  Cancelar
                </button>
                <button onClick={confirmarNoHoy} disabled={resolviendo} className="btn-tl-blue">
                  {resolviendo ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                  Si, confirmar
                </button>
              </div>
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
          onFinalizada={marcarHoyCumplido}
        />
      )}
    </div>
  )
}
