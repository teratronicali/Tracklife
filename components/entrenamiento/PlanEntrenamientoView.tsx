'use client'

import { useEffect, useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  Calendar,
  Play,
  Loader2,
  X,
  Sparkles,
  Trash2,
  RefreshCw,
  Check,
  CalendarClock,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Pencil,
  ArrowLeftRight,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'
import type { Ejercicio, NivelEntrenamiento, Perfil, PlanConDias, PlanDiaEstado, RutinaConEjercicios, RutinaEjercicio } from '@/lib/types'
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
  calcularSemanaPrograma,
  construirCalendarioRango,
  fechaISO,
  fetchEstadosPlan,
  inicioCuadriculaMes,
  inicioSemana,
  marcarCumplidoRetroactivo,
  marcarIncumplidoYCompensar,
  planFinalizado,
  revisarDiasPendientes,
  sumarDias,
  type DiaCalendario,
  type DiaPorRevisar,
} from '@/lib/plan-semana'
import {
  NIVELES_RUNNING,
  OBJETIVOS_RUNNING,
  calcularRitmos,
  formatoRitmo,
  generarPlanRunning,
  resumenPlanRunning,
  ritmoObjetivoSegKm,
  semanasHastaFecha,
  type NivelRunning,
  type ObjetivoRunning,
} from '@/lib/plan-running'
import SesionActiva from './SesionActiva'

function formatoFecha(fecha: string) {
  return format(new Date(`${fecha}T00:00:00`), "EEEE d 'de' MMMM", { locale: es })
}

type TipoEdicionDia = 'descanso' | 'existente' | 'carrera'

function resumenSesionCardio(rutina: RutinaConEjercicios): { texto: string; ritmo: string | null } | null {
  if (rutina.tipo !== 'cardio') return null
  const it = rutina.ejercicios[0]
  if (!it) return null
  const partes = [it.distancia_objetivo_km ? `${it.distancia_objetivo_km} km` : null, it.duracion_objetivo_min ? `${it.duracion_objetivo_min} min` : null].filter(Boolean)
  return { texto: partes.join(' · '), ritmo: it.ritmo_objetivo }
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
  const [modo, setModo] = useState<'plantillas' | 'personalizado' | 'running'>('plantillas')
  const [filtroObjetivo, setFiltroObjetivo] = useState<ObjetivoEntrenamiento | 'todos'>('todos')
  const [filtroNivel, setFiltroNivel] = useState<NivelEntrenamiento | 'todos'>('todos')
  const [aplicando, setAplicando] = useState<string | null>(null)
  const [nombrePersonalizado, setNombrePersonalizado] = useState('')
  const [objetivoPersonalizado, setObjetivoPersonalizado] = useState<ObjetivoEntrenamiento>('fuerza')
  const [nivelPersonalizado, setNivelPersonalizado] = useState<NivelEntrenamiento>('principiante')
  const [diasPersonalizado, setDiasPersonalizado] = useState<(string | null)[]>(Array(7).fill(null))
  const [sesionRutina, setSesionRutina] = useState<RutinaConEjercicios | null>(null)

  const [nivelRunning, setNivelRunning] = useState<NivelRunning>('principiante')
  const [objetivoRunning, setObjetivoRunning] = useState<ObjetivoRunning>('5k')
  const [fechaCarreraRunning, setFechaCarreraRunning] = useState('')
  const [omitirTest, setOmitirTest] = useState(false)
  const [testDistancia, setTestDistancia] = useState('3')
  const [testMin, setTestMin] = useState('')
  const [testSeg, setTestSeg] = useState('')

  const [vista, setVista] = useState<'semana' | 'mes'>('semana')
  const [semanaOffset, setSemanaOffset] = useState(0)
  const [mesVista, setMesVista] = useState<Date>(() => new Date())
  const [estadosRango, setEstadosRango] = useState<PlanDiaEstado[]>([])
  const [porRevisar, setPorRevisar] = useState<DiaPorRevisar[]>([])
  const [resolviendo, setResolviendo] = useState(false)
  const [confirmandoHoy, setConfirmandoHoy] = useState<DiaCalendario | null>(null)

  const [diaEditando, setDiaEditando] = useState<DiaCalendario | null>(null)
  const [tipoEdicion, setTipoEdicion] = useState<TipoEdicionDia>('descanso')
  const [rutinaElegida, setRutinaElegida] = useState('')
  const [carreraNombre, setCarreraNombre] = useState('')
  const [carreraDistancia, setCarreraDistancia] = useState('')
  const [carreraDuracion, setCarreraDuracion] = useState('')
  const [carreraRitmo, setCarreraRitmo] = useState('')
  const [carreraNotas, setCarreraNotas] = useState('')
  const [guardandoDia, setGuardandoDia] = useState(false)
  const [destinoIntercambio, setDestinoIntercambio] = useState('')
  const [intercambiando, setIntercambiando] = useState(false)

  useEffect(() => setPlan(planInicial), [planInicial])

  const hoy = new Date()
  const hoyISO = fechaISO(hoy)

  function rangoVisible(): { desde: Date; hasta: Date } {
    if (vista === 'semana') {
      const inicio = sumarDias(inicioSemana(hoy), semanaOffset * 7)
      return { desde: inicio, hasta: sumarDias(inicio, 6) }
    }
    const inicioGrid = inicioCuadriculaMes(mesVista)
    return { desde: inicioGrid, hasta: sumarDias(inicioGrid, 41) }
  }

  useEffect(() => {
    if (!plan) {
      setPorRevisar([])
      return
    }
    let cancelado = false
    async function cargar() {
      if (!plan) return
      const { porRevisar: pendientes } = await revisarDiasPendientes(supabase, usuarioId, plan, rutinasDisponibles)
      if (!cancelado) setPorRevisar(pendientes)
    }
    cargar()
    return () => {
      cancelado = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan?.id])

  useEffect(() => {
    if (!plan) {
      setEstadosRango([])
      return
    }
    let cancelado = false
    async function cargar() {
      if (!plan) return
      const { desde, hasta } = rangoVisible()
      const datos = await fetchEstadosPlan(supabase, plan.id, fechaISO(desde), fechaISO(hasta))
      if (!cancelado) setEstadosRango(datos)
    }
    cargar()
    return () => {
      cancelado = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan?.id, vista, semanaOffset, mesVista])

  async function refrescarEstadosVisibles() {
    if (!plan) return
    const { desde, hasta } = rangoVisible()
    const datos = await fetchEstadosPlan(supabase, plan.id, fechaISO(desde), fechaISO(hasta))
    setEstadosRango(datos)
  }

  const { desde: desdeVisible, hasta: hastaVisible } = rangoVisible()
  const calendario: DiaCalendario[] = plan ? construirCalendarioRango(plan, estadosRango, rutinasDisponibles, desdeVisible, hastaVisible, hoyISO) : []
  const diaHoy = calendario.find((d) => d.esHoy) ?? null
  const revisando = porRevisar[0] ?? null

  const plantillasFiltradas = PLANES_PLANTILLA.filter(
    (p) => (filtroObjetivo === 'todos' || p.objetivo === filtroObjetivo) && (filtroNivel === 'todos' || p.nivel === filtroNivel)
  )

  const testTiempoSegTotal = (Number(testMin) || 0) * 60 + (Number(testSeg) || 0)
  const testValido = !omitirTest && Number(testDistancia) > 0 && testTiempoSegTotal > 0
  const ritmosPreview = testValido ? calcularRitmos(Number(testDistancia), testTiempoSegTotal) : null

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

  async function generarRunning() {
    setAplicando('running')
    try {
      const nuevoPlan = await generarPlanRunning(supabase, usuarioId, {
        nivel: nivelRunning,
        objetivo: objetivoRunning,
        fechaObjetivo: fechaCarreraRunning || null,
        testInicial: testValido ? { distanciaKm: Number(testDistancia), tiempoSeg: testTiempoSegTotal } : null,
      })
      setPlan(nuevoPlan)
      const rutinasNuevas = nuevoPlan.dias.map((d) => d.rutina).filter((r): r is RutinaConEjercicios => Boolean(r))
      setRutinasDisponibles((prev) => {
        const idsNuevos = new Set(rutinasNuevas.map((r) => r.id))
        return [...rutinasNuevas, ...prev.filter((r) => !idsNuevos.has(r.id))]
      })
      setModal(false)
      setSemanaOffset(0)
      setMesVista(new Date())
      toast.success(`Plan de running creado: ${nuevoPlan.nombre}`)
      router.refresh()
    } catch (err) {
      console.error('Error generando plan de running:', err)
      toast.error('No se pudo generar el plan de running')
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
    await refrescarEstadosVisibles()
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
    await refrescarEstadosVisibles()
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
    await refrescarEstadosVisibles()
  }

  // --- Edicion / reasignacion de un dia del calendario ---

  function abrirEdicion(dia: DiaCalendario) {
    setDiaEditando(dia)
    setDestinoIntercambio('')
    if (!dia.rutina) {
      setTipoEdicion('descanso')
      setRutinaElegida('')
      setCarreraNombre('Rodaje suave')
      setCarreraDistancia('')
      setCarreraDuracion('')
      setCarreraRitmo('')
      setCarreraNotas('')
    } else if (dia.rutina.tipo === 'cardio' && dia.rutina.ejercicios.length === 1) {
      const it = dia.rutina.ejercicios[0]
      setTipoEdicion('carrera')
      setRutinaElegida(dia.rutina.id)
      setCarreraNombre(dia.rutina.nombre.replace(/ — semana \d+$/, ''))
      setCarreraDistancia(it.distancia_objetivo_km ? String(it.distancia_objetivo_km) : '')
      setCarreraDuracion(it.duracion_objetivo_min ? String(it.duracion_objetivo_min) : '')
      setCarreraRitmo(it.ritmo_objetivo ?? '')
      setCarreraNotas(it.notas_cardio ?? '')
    } else {
      setTipoEdicion('existente')
      setRutinaElegida(dia.rutina.id)
      setCarreraNombre('Rodaje suave')
      setCarreraDistancia('')
      setCarreraDuracion('')
      setCarreraRitmo('')
      setCarreraNotas('')
    }
  }

  function diasConAsignacion(dias: PlanConDias['dias'], dia: DiaCalendario, rutinaId: string | null, filaId: string): PlanConDias['dias'] {
    const descanso = rutinaId === null
    const rutina = rutinaId ? rutinasDisponibles.find((r) => r.id === rutinaId) : undefined
    if (dia.planDiaId) {
      return dias.map((d) => (d.id === dia.planDiaId ? { ...d, rutina_id: rutinaId, descanso, rutina } : d))
    }
    return [
      ...dias,
      { id: filaId, usuario_id: usuarioId, plan_id: plan!.id, semana: dia.semanaPrograma, dia_semana: dia.diaSemana, rutina_id: rutinaId, descanso, rutina },
    ]
  }

  async function escribirPlanDia(dia: DiaCalendario, rutinaId: string | null): Promise<{ id: string } | null> {
    if (!plan) return null
    const descanso = rutinaId === null
    if (dia.planDiaId) {
      const { error } = await supabase.from('plan_dias').update({ rutina_id: rutinaId, descanso }).eq('id', dia.planDiaId)
      if (error) {
        toast.error('No se pudo actualizar el dia')
        return null
      }
      return { id: dia.planDiaId }
    }
    const { data, error } = await supabase
      .from('plan_dias')
      .insert({ usuario_id: usuarioId, plan_id: plan.id, semana: dia.semanaPrograma, dia_semana: dia.diaSemana, rutina_id: rutinaId, descanso })
      .select()
      .single()
    if (error || !data) {
      toast.error('No se pudo crear el dia')
      return null
    }
    return { id: data.id }
  }

  // Crea o edita una sesion de carrera especifica de este dia. Si el dia ya
  // tenia una rutina de cardio dedicada solo a el (no compartida), edita sus
  // datos en vez de crear una nueva.
  async function guardarSesionCarrera(dia: DiaCalendario): Promise<string | null> {
    if (!plan) return null
    const nombreLimpio = carreraNombre.trim()
    if (!nombreLimpio) {
      toast.error('Ponle un nombre a la sesion')
      return null
    }
    const distanciaNum = carreraDistancia ? Number(carreraDistancia) : null
    const duracionNum = carreraDuracion ? Number(carreraDuracion) : null
    const notasVal = carreraNotas.trim() || null
    const ritmoVal = carreraRitmo.trim() || null

    const puedeEditarExistente = dia.rutina && dia.rutina.tipo === 'cardio' && dia.rutina.ejercicios.length === 1
    if (puedeEditarExistente && dia.rutina) {
      const item = dia.rutina.ejercicios[0]
      const { error: errorItem } = await supabase
        .from('rutina_ejercicios')
        .update({ distancia_objetivo_km: distanciaNum, duracion_objetivo_min: duracionNum, notas_cardio: notasVal, ritmo_objetivo: ritmoVal })
        .eq('id', item.id)
      if (errorItem) {
        toast.error('No se pudo guardar la sesion')
        return null
      }
      if (nombreLimpio !== dia.rutina.nombre) {
        await supabase.from('rutinas').update({ nombre: nombreLimpio }).eq('id', dia.rutina.id)
      }
      const rutinaActualizada: RutinaConEjercicios = {
        ...dia.rutina,
        nombre: nombreLimpio,
        ejercicios: [{ ...item, distancia_objetivo_km: distanciaNum, duracion_objetivo_min: duracionNum, notas_cardio: notasVal, ritmo_objetivo: ritmoVal }],
      }
      setRutinasDisponibles((prev) => prev.map((r) => (r.id === rutinaActualizada.id ? rutinaActualizada : r)))
      return dia.rutina.id
    }

    const { data: ejercicioExistente } = await supabase.from('ejercicios').select('id').eq('usuario_id', usuarioId).eq('nombre', nombreLimpio).maybeSingle()
    let ejercicioId = ejercicioExistente?.id as string | undefined
    if (!ejercicioId) {
      const { data: ejercicioNuevo, error: errorEjercicio } = await supabase
        .from('ejercicios')
        .insert({ usuario_id: usuarioId, nombre: nombreLimpio, grupo_muscular: 'cardio' })
        .select()
        .single()
      if (errorEjercicio || !ejercicioNuevo) {
        toast.error('No se pudo crear el ejercicio')
        return null
      }
      ejercicioId = ejercicioNuevo.id
    }

    const { data: rutinaNueva, error: errorRutina } = await supabase
      .from('rutinas')
      .insert({ usuario_id: usuarioId, nombre: nombreLimpio, tipo: 'cardio', objetivo: plan.objetivo, nivel: plan.nivel })
      .select()
      .single()
    if (errorRutina || !rutinaNueva) {
      toast.error('No se pudo crear la sesion')
      return null
    }

    const { data: itemNuevo, error: errorItemNuevo } = await supabase
      .from('rutina_ejercicios')
      .insert({
        usuario_id: usuarioId,
        rutina_id: rutinaNueva.id,
        ejercicio_id: ejercicioId,
        orden: 0,
        series_objetivo: 1,
        reps_objetivo: '',
        peso_objetivo: null,
        descanso_seg: 0,
        tipo_actividad: 'running',
        distancia_objetivo_km: distanciaNum,
        duracion_objetivo_min: duracionNum,
        notas_cardio: notasVal,
        ritmo_objetivo: ritmoVal,
      })
      .select('*, ejercicio:ejercicios(*)')
      .single()
    if (errorItemNuevo || !itemNuevo) {
      toast.error('No se pudo crear la sesion')
      return null
    }

    const rutinaCompleta: RutinaConEjercicios = { ...rutinaNueva, ejercicios: [itemNuevo as RutinaEjercicio] }
    setRutinasDisponibles((prev) => [rutinaCompleta, ...prev])
    return rutinaNueva.id
  }

  async function guardarEdicion() {
    if (!plan || !diaEditando) return
    setGuardandoDia(true)
    let rutinaId: string | null = null
    if (tipoEdicion === 'existente') {
      if (!rutinaElegida) {
        toast.error('Elige una rutina')
        setGuardandoDia(false)
        return
      }
      rutinaId = rutinaElegida
    } else if (tipoEdicion === 'carrera') {
      rutinaId = await guardarSesionCarrera(diaEditando)
      if (!rutinaId) {
        setGuardandoDia(false)
        return
      }
    }
    const resultado = await escribirPlanDia(diaEditando, rutinaId)
    setGuardandoDia(false)
    if (!resultado) return
    setPlan({ ...plan, dias: diasConAsignacion(plan.dias, diaEditando, rutinaId, resultado.id) })
    setDiaEditando(null)
    toast.success('Dia actualizado')
    router.refresh()
  }

  async function intercambiarDias(destino: DiaCalendario) {
    if (!plan || !diaEditando) return
    setIntercambiando(true)
    const origenRutinaId = diaEditando.rutina?.id ?? null
    const destinoRutinaId = destino.rutina?.id ?? null
    const [resOrigen, resDestino] = await Promise.all([escribirPlanDia(diaEditando, destinoRutinaId), escribirPlanDia(destino, origenRutinaId)])
    setIntercambiando(false)
    if (!resOrigen || !resDestino) return
    let dias = diasConAsignacion(plan.dias, diaEditando, destinoRutinaId, resOrigen.id)
    dias = diasConAsignacion(dias, destino, origenRutinaId, resDestino.id)
    setPlan({ ...plan, dias })
    setDiaEditando(null)
    toast.success('Dias intercambiados')
    router.refresh()
  }

  const opcionesIntercambio = diaEditando
    ? calendario.filter((d) => !d.esPasado && d.fecha !== diaEditando.fecha && d.planDiaId !== diaEditando.planDiaId)
    : []

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
            {plan.duracion_semanas && (
              <span className="pill" style={{ color: 'var(--tl-blue)' }}>
                Semana {Math.min(calcularSemanaPrograma(plan, hoy), plan.duracion_semanas)} de {plan.duracion_semanas}
              </span>
            )}
            {plan.fecha_objetivo && (
              <span className="text-xs text-muted">
                {planFinalizado(plan, hoy)
                  ? '¡Plan completado!'
                  : `Faltan ${Math.max(0, semanasHastaFecha(plan.fecha_objetivo))} semanas para tu carrera (${formatoFecha(plan.fecha_objetivo)})`}
              </span>
            )}
          </div>

          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-1">
              <button
                onClick={() => (vista === 'semana' ? setSemanaOffset((o) => o - 1) : setMesVista((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1)))}
                className="btn-tl px-2 py-1"
              >
                <ChevronLeft size={14} />
              </button>
              <span className="text-xs font-medium min-w-[140px] text-center capitalize">
                {vista === 'semana'
                  ? `${format(desdeVisible, "d 'de' MMM", { locale: es })} – ${format(hastaVisible, "d 'de' MMM", { locale: es })}`
                  : format(mesVista, 'MMMM yyyy', { locale: es })}
              </span>
              <button
                onClick={() => (vista === 'semana' ? setSemanaOffset((o) => o + 1) : setMesVista((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1)))}
                className="btn-tl px-2 py-1"
              >
                <ChevronRight size={14} />
              </button>
              {(semanaOffset !== 0 || format(mesVista, 'yyyy-MM') !== format(hoy, 'yyyy-MM')) && (
                <button
                  onClick={() => {
                    setSemanaOffset(0)
                    setMesVista(new Date())
                  }}
                  className="text-[11px] text-muted underline ml-1"
                >
                  Hoy
                </button>
              )}
            </div>
            <div className="inline-flex rounded-full border border-border p-0.5">
              <button
                onClick={() => setVista('semana')}
                className="px-2.5 py-1 rounded-full text-[11px] font-medium"
                style={vista === 'semana' ? { background: 'var(--tl-blue)', color: 'white' } : { color: 'var(--tl-muted)' }}
              >
                Semana
              </button>
              <button
                onClick={() => setVista('mes')}
                className="px-2.5 py-1 rounded-full text-[11px] font-medium"
                style={vista === 'mes' ? { background: 'var(--tl-blue)', color: 'white' } : { color: 'var(--tl-muted)' }}
              >
                Mes
              </button>
            </div>
          </div>

          {vista === 'mes' ? (
            <div>
              <div className="grid grid-cols-7 gap-1 mb-1">
                {DIAS_SEMANA.map((d) => (
                  <p key={d} className="text-[10px] text-muted text-center uppercase tracking-wide">
                    {d.slice(0, 3)}
                  </p>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {calendario.map((dia) => {
                  const enMes = new Date(`${dia.fecha}T00:00:00`).getMonth() === mesVista.getMonth()
                  const colorTipo = dia.rutina ? (dia.rutina.tipo === 'cardio' ? 'var(--tl-green)' : 'var(--tl-blue)') : null
                  const colorEstado = dia.estado?.estado === 'incumplido' ? 'var(--tl-red)' : dia.estado?.estado === 'compensado' ? 'var(--tl-amber)' : colorTipo
                  return (
                    <button
                      key={dia.fecha}
                      onClick={() => abrirEdicion(dia)}
                      className="aspect-square rounded-lg border p-1 flex flex-col items-center justify-start gap-1 pt-1.5"
                      style={{ borderColor: dia.esHoy ? 'var(--tl-blue)' : 'var(--tl-border)', opacity: enMes ? 1 : 0.35 }}
                    >
                      <span className="text-[10px] text-muted">{Number(dia.fecha.slice(8, 10))}</span>
                      {colorEstado && <span className="w-1.5 h-1.5 rounded-full" style={{ background: colorEstado }} />}
                      {dia.estado?.estado === 'cumplido' && <Check size={10} style={{ color: 'var(--tl-green)' }} />}
                    </button>
                  )
                })}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
              {calendario.map((dia) => {
                const badge = dia.estado && dia.estado.estado !== 'pendiente' ? ESTADO_BADGE[dia.estado.estado] : null
                const resumen = dia.rutina ? resumenSesionCardio(dia.rutina) : null
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
                        {resumen && (resumen.texto || resumen.ritmo) && (
                          <p className="text-[10px] text-muted">{[resumen.texto, resumen.ritmo].filter(Boolean).join(' · ')}</p>
                        )}
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
                      {!dia.esPasado && (
                        <button onClick={() => abrirEdicion(dia)} className="btn-tl text-[11px] w-full">
                          <Pencil size={11} /> {dia.rutina ? 'Editar / mover' : 'Asignar'}
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
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
                <button
                  onClick={() => setModo('running')}
                  className="px-3 py-1.5 rounded-full text-xs font-medium"
                  style={modo === 'running' ? { background: 'var(--tl-blue)', color: 'white' } : { color: 'var(--tl-muted)' }}
                >
                  Running
                </button>
              </div>
            </div>

            <div className="p-5 overflow-y-auto space-y-3">
              {modo === 'running' ? (
                <div className="space-y-4 max-w-sm">
                  <p className="text-xs text-muted">
                    Plan periodizado de verdad: fuerza para corredores 2x/semana, pliometria cuando aplica, progresion del fondo
                    largo con semanas de descarga, y un taper final antes de la carrera.
                  </p>
                  <div>
                    <label className="block text-xs font-medium text-muted mb-1">Nivel</label>
                    <select className="input-tl" value={nivelRunning} onChange={(e) => setNivelRunning(e.target.value as NivelRunning)}>
                      {NIVELES_RUNNING.map((n) => (
                        <option key={n.id} value={n.id}>
                          {n.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted mb-1">Objetivo</label>
                    <select className="input-tl" value={objetivoRunning} onChange={(e) => setObjetivoRunning(e.target.value as ObjetivoRunning)}>
                      {OBJETIVOS_RUNNING.map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  {objetivoRunning !== 'general' && (
                    <div>
                      <label className="block text-xs font-medium text-muted mb-1">Fecha de tu carrera (opcional)</label>
                      <input
                        type="date"
                        className="input-tl"
                        value={fechaCarreraRunning}
                        min={fechaISO(new Date())}
                        onChange={(e) => setFechaCarreraRunning(e.target.value)}
                      />
                    </div>
                  )}

                  {nivelRunning !== 'nunca_corrido' && (
                    <div className="space-y-2 border-t border-border pt-3">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-medium text-muted">Test inicial de ritmo (recomendado)</label>
                        <button type="button" onClick={() => setOmitirTest((v) => !v)} className="text-[11px] underline text-muted shrink-0 ml-2">
                          {omitirTest ? 'Quiero hacer el test' : 'Omitir'}
                        </button>
                      </div>
                      {!omitirTest && (
                        <>
                          <p className="text-[11px] text-muted">
                            Corre lo mas fuerte que puedas una distancia conocida (por ejemplo 3 km) y anota tu tiempo. Con eso calculamos a
                            que ritmo (min/km) debes correr cada sesion del plan.
                          </p>
                          <div className="grid grid-cols-3 gap-2">
                            <div>
                              <label className="block text-[10px] text-muted mb-1">Distancia (km)</label>
                              <input
                                type="number"
                                inputMode="decimal"
                                className="input-tl text-xs"
                                value={testDistancia}
                                onChange={(e) => setTestDistancia(e.target.value)}
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] text-muted mb-1">Minutos</label>
                              <input type="number" inputMode="numeric" className="input-tl text-xs" value={testMin} onChange={(e) => setTestMin(e.target.value)} />
                            </div>
                            <div>
                              <label className="block text-[10px] text-muted mb-1">Segundos</label>
                              <input type="number" inputMode="numeric" className="input-tl text-xs" value={testSeg} onChange={(e) => setTestSeg(e.target.value)} />
                            </div>
                          </div>
                          {ritmosPreview && (
                            <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] text-muted pt-1">
                              <p>
                                Facil / fondo largo: <span className="text-foreground font-medium">{formatoRitmo(ritmosPreview.facilSegKm)}</span>
                              </p>
                              <p>
                                Umbral / tempo: <span className="text-foreground font-medium">{formatoRitmo(ritmosPreview.umbralSegKm)}</span>
                              </p>
                              <p>
                                Series: <span className="text-foreground font-medium">{formatoRitmo(ritmosPreview.repeticionSegKm)}</span>
                              </p>
                              {objetivoRunning !== 'general' && (
                                <p>
                                  Ritmo de {OBJETIVOS_RUNNING.find((o) => o.id === objetivoRunning)?.label}:{' '}
                                  <span className="text-foreground font-medium">{formatoRitmo(ritmoObjetivoSegKm(ritmosPreview, objetivoRunning))}</span>
                                </p>
                              )}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}

                  <p className="text-[11px] text-muted">{resumenPlanRunning({ nivel: nivelRunning, objetivo: objetivoRunning, fechaObjetivo: fechaCarreraRunning || null })}</p>
                  <button onClick={generarRunning} disabled={aplicando === 'running'} className="btn-tl-blue text-xs">
                    {aplicando === 'running' ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
                    Generar plan de running
                  </button>
                </div>
              ) : modo === 'plantillas' ? (
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

      {diaEditando && (
        <div className="fixed inset-0 bg-black/70 z-[65] flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-2xl shadow-2xl w-full max-w-md max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border sticky top-0 bg-surface">
              <h2 className="font-medium text-sm capitalize">{formatoFecha(diaEditando.fecha)}</h2>
              <button onClick={() => setDiaEditando(null)} className="text-muted hover:text-foreground">
                <X size={18} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              {diaEditando.esPasado ? (
                <div className="text-xs text-muted space-y-2">
                  <p>{diaEditando.rutina ? diaEditando.rutina.nombre : 'Descanso'}</p>
                  {diaEditando.estado && (
                    <p style={{ color: ESTADO_BADGE[diaEditando.estado.estado]?.color }}>{ESTADO_BADGE[diaEditando.estado.estado]?.label ?? diaEditando.estado.estado}</p>
                  )}
                  <p className="text-[11px]">Los dias que ya pasaron no se pueden editar.</p>
                </div>
              ) : (
                <>
                  {diaEditando.esHoy && diaEditando.rutina && (
                    <div className="space-y-1.5">
                      <button
                        onClick={() => {
                          setSesionRutina(diaEditando.rutina)
                          setDiaEditando(null)
                        }}
                        className="btn-tl-blue text-xs w-full"
                      >
                        <Play size={13} /> {diaEditando.estado?.estado === 'cumplido' ? 'Repetir entrenamiento' : 'Iniciar entrenamiento'}
                      </button>
                      {!diaEditando.estado && (
                        <button
                          onClick={() => {
                            setConfirmandoHoy(diaEditando)
                            setDiaEditando(null)
                          }}
                          className="text-[11px] text-muted underline block w-full text-center"
                        >
                          No voy a entrenar hoy
                        </button>
                      )}
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-medium text-muted mb-1.5">Que hay este dia</label>
                    <div className="flex gap-1.5 flex-wrap">
                      {(
                        [
                          ['descanso', 'Descanso'],
                          ['existente', 'Una de mis rutinas'],
                          ['carrera', 'Sesion de carrera'],
                        ] as [TipoEdicionDia, string][]
                      ).map(([valor, label]) => (
                        <button
                          key={valor}
                          onClick={() => setTipoEdicion(valor)}
                          className="px-2.5 py-1 rounded-full text-[11px] font-medium border"
                          style={
                            tipoEdicion === valor
                              ? { background: 'var(--tl-blue)', color: 'white', borderColor: 'var(--tl-blue)' }
                              : { borderColor: 'var(--tl-border)', color: 'var(--tl-muted)' }
                          }
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {tipoEdicion === 'existente' && (
                    <div>
                      <label className="block text-xs font-medium text-muted mb-1">Rutina</label>
                      <select className="input-tl" value={rutinaElegida} onChange={(e) => setRutinaElegida(e.target.value)}>
                        <option value="">Elige una rutina</option>
                        {rutinasDisponibles.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.nombre}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {tipoEdicion === 'carrera' && (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-muted mb-1">Nombre de la sesion</label>
                        <input
                          className="input-tl"
                          value={carreraNombre}
                          onChange={(e) => setCarreraNombre(e.target.value)}
                          placeholder="Ej. Rodaje suave, Series, Fondo largo"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-muted mb-1">Distancia (km)</label>
                          <input
                            type="number"
                            inputMode="decimal"
                            className="input-tl"
                            value={carreraDistancia}
                            onChange={(e) => setCarreraDistancia(e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-muted mb-1">Duracion (min)</label>
                          <input
                            type="number"
                            inputMode="numeric"
                            className="input-tl"
                            value={carreraDuracion}
                            onChange={(e) => setCarreraDuracion(e.target.value)}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-muted mb-1">Ritmo objetivo (opcional)</label>
                        <input className="input-tl" value={carreraRitmo} onChange={(e) => setCarreraRitmo(e.target.value)} placeholder="Ej. 5:30 min/km" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-muted mb-1">Notas (opcional)</label>
                        <input
                          className="input-tl"
                          value={carreraNotas}
                          onChange={(e) => setCarreraNotas(e.target.value)}
                          placeholder="Ej. 6 x 400m fuerte, 90s trote suave"
                        />
                      </div>
                    </div>
                  )}

                  <button onClick={guardarEdicion} disabled={guardandoDia} className="btn-tl-blue text-xs w-full">
                    {guardandoDia ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />} Guardar
                  </button>

                  {opcionesIntercambio.length > 0 && (
                    <div className="pt-3 border-t border-border space-y-2">
                      <label className="text-xs font-medium text-muted mb-1 flex items-center gap-1.5">
                        <ArrowLeftRight size={12} /> Intercambiar con otro dia visible en el calendario
                      </label>
                      <div className="flex gap-2">
                        <select className="input-tl text-xs flex-1" value={destinoIntercambio} onChange={(e) => setDestinoIntercambio(e.target.value)}>
                          <option value="">Elige un dia</option>
                          {opcionesIntercambio.map((d) => (
                            <option key={d.fecha} value={d.fecha}>
                              {formatoFecha(d.fecha)} — {d.rutina ? d.rutina.nombre : 'Descanso'}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() => {
                            const destino = opcionesIntercambio.find((d) => d.fecha === destinoIntercambio)
                            if (destino) intercambiarDias(destino)
                          }}
                          disabled={!destinoIntercambio || intercambiando}
                          className="btn-tl text-xs shrink-0"
                        >
                          {intercambiando ? <Loader2 size={13} className="animate-spin" /> : <ArrowLeftRight size={13} />}
                        </button>
                      </div>
                    </div>
                  )}
                </>
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
