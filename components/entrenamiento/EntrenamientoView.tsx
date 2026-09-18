'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, X, Check, Loader2, Trash2, Calendar, Dumbbell, Utensils } from 'lucide-react'
import toast from 'react-hot-toast'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell } from 'recharts'
import { createClient } from '@/lib/supabase/client'
import { formatNumber, lastNDates } from '@/lib/utils'
import {
  type Ejercicio,
  type EntrenamientoRegistro,
  type NutricionComida,
  type NutricionMeta,
  type Perfil,
  type PlanConDias,
  type RutinaConEjercicios,
} from '@/lib/types'
import { XP_TABLE } from '@/lib/gamification'
import { otorgarXP } from '@/lib/xp-client'
import RutinasView from './RutinasView'
import PlanEntrenamientoView from './PlanEntrenamientoView'
import ModalNuevoEjercicio from './ModalNuevoEjercicio'
import FraseMotivacional from './FraseMotivacional'

const COLORES = ['#2f6bff', '#60a5fa', '#93c5fd', '#f59e0b', '#94a3b8', '#38bdf8', '#a78bfa', '#34d399']

interface TooltipItem {
  dataKey?: string
  name?: string
  value?: number
  color?: string
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: TooltipItem[]
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-surface-2 border border-border rounded-lg px-3 py-2 text-xs">
      <p className="text-muted mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} style={{ color: p.color }}>
          {p.name}: {formatNumber(p.value ?? 0)}
        </p>
      ))}
    </div>
  )
}

export default function EntrenamientoView({
  ejerciciosIniciales,
  registrosIniciales,
  comidasIniciales,
  metaNutricionInicial,
  rutinasIniciales,
  planInicial,
  usuarioId,
  perfil,
}: {
  ejerciciosIniciales: Ejercicio[]
  registrosIniciales: EntrenamientoRegistro[]
  comidasIniciales: NutricionComida[]
  metaNutricionInicial: NutricionMeta | null
  rutinasIniciales: RutinaConEjercicios[]
  planInicial: PlanConDias | null
  usuarioId: string
  perfil: Perfil
}) {
  const supabase = createClient()
  const router = useRouter()
  const [tab, setTab] = useState<'plan' | 'entrenamiento' | 'dieta'>('plan')

  const [ejercicios, setEjercicios] = useState(ejerciciosIniciales)
  const [rutinas, setRutinas] = useState(rutinasIniciales)
  const [registros, setRegistros] = useState(registrosIniciales)
  const [comidas, setComidas] = useState(comidasIniciales)

  useEffect(() => setEjercicios(ejerciciosIniciales), [ejerciciosIniciales])
  useEffect(() => setRutinas(rutinasIniciales), [rutinasIniciales])
  const [metaNutricion, setMetaNutricion] = useState(
    metaNutricionInicial ?? {
      usuario_id: usuarioId,
      kcal_objetivo: 2000,
      proteina_objetivo: 150,
      carbo_objetivo: 200,
      grasa_objetivo: 60,
    }
  )

  const [modalSet, setModalSet] = useState(false)
  const [modalEjercicio, setModalEjercicio] = useState(false)
  const [modalComida, setModalComida] = useState(false)
  const [modalMeta, setModalMeta] = useState(false)
  const [guardando, setGuardando] = useState(false)

  const [ejercicioId, setEjercicioId] = useState('')
  const [peso, setPeso] = useState('')
  const [reps, setReps] = useState('')
  const [series, setSeries] = useState('3')


  const [comidaNombre, setComidaNombre] = useState('')
  const [comidaProt, setComidaProt] = useState('')
  const [comidaCarbo, setComidaCarbo] = useState('')
  const [comidaGrasa, setComidaGrasa] = useState('')
  const [comidaKcal, setComidaKcal] = useState('')

  const dias7 = useMemo(() => lastNDates(7), [])
  const dias7Prev = useMemo(() => lastNDates(14).slice(0, 7), [])

  function volumen(r: EntrenamientoRegistro) {
    return Number(r.peso) * Number(r.reps) * Number(r.series)
  }

  const volumenPorDia = useMemo(
    () =>
      dias7.map((f) => ({
        fecha: f.slice(5),
        volumen: registros.filter((r) => r.fecha === f).reduce((s, r) => s + volumen(r), 0),
      })),
    [registros, dias7]
  )

  const volumenSemana = volumenPorDia.reduce((s, d) => s + d.volumen, 0)
  const volumenSemanaAnterior = dias7Prev.reduce(
    (s, f) => s + registros.filter((r) => r.fecha === f).reduce((s2, r) => s2 + volumen(r), 0),
    0
  )
  const variacion = volumenSemanaAnterior > 0 ? ((volumenSemana - volumenSemanaAnterior) / volumenSemanaAnterior) * 100 : 0

  const porGrupo = useMemo(() => {
    const map = new Map<string, number>()
    for (const r of registros.filter((r) => dias7.includes(r.fecha))) {
      const grupo = r.ejercicio?.grupo_muscular ?? 'general'
      map.set(grupo, (map.get(grupo) ?? 0) + volumen(r))
    }
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }))
  }, [registros, dias7])

  function abrirModalSet() {
    setEjercicioId(ejercicios[0]?.id ?? '')
    setPeso('')
    setReps('')
    setSeries('3')
    setModalSet(true)
  }

  function ejercicioCreado(ejercicio: Ejercicio) {
    setEjercicios((prev) => [...prev, ejercicio].sort((a, b) => a.nombre.localeCompare(b.nombre)))
    setEjercicioId(ejercicio.id)
    setModalEjercicio(false)
  }

  async function guardarSet() {
    if (!ejercicioId) {
      toast.error('Selecciona o crea un ejercicio')
      return
    }
    const pesoNum = Number(peso)
    const repsNum = Number(reps)
    const seriesNum = Number(series)
    if (!repsNum || !seriesNum) {
      toast.error('Completa reps y series')
      return
    }
    setGuardando(true)
    const { data, error } = await supabase
      .from('entrenamiento_registros')
      .insert({ usuario_id: usuarioId, ejercicio_id: ejercicioId, peso: pesoNum || 0, reps: repsNum, series: seriesNum })
      .select('*, ejercicio:ejercicios(*)')
      .single()
    if (error) {
      toast.error('No se pudo guardar')
      setGuardando(false)
      return
    }
    setRegistros((prev) => [data as EntrenamientoRegistro, ...prev])
    await otorgarXP(supabase, perfil, { p_xp: XP_TABLE.entrenamiento, p_tipo: 'entrenamiento' })
    setGuardando(false)
    setModalSet(false)
    router.refresh()
  }

  async function eliminarRegistro(id: string) {
    const { error } = await supabase.from('entrenamiento_registros').delete().eq('id', id)
    if (error) {
      toast.error('No se pudo eliminar')
      return
    }
    setRegistros((prev) => prev.filter((r) => r.id !== id))
  }

  async function guardarComida() {
    if (!comidaNombre.trim()) {
      toast.error('Ponle un nombre a la comida')
      return
    }
    setGuardando(true)
    const { data, error } = await supabase
      .from('nutricion_comidas')
      .insert({
        usuario_id: usuarioId,
        nombre: comidaNombre,
        proteina: Number(comidaProt) || 0,
        carbohidratos: Number(comidaCarbo) || 0,
        grasa: Number(comidaGrasa) || 0,
        kcal: Number(comidaKcal) || 0,
      })
      .select()
      .single()
    if (error) {
      toast.error('No se pudo guardar la comida')
      setGuardando(false)
      return
    }
    setComidas((prev) => [data as NutricionComida, ...prev])
    setComidaNombre('')
    setComidaProt('')
    setComidaCarbo('')
    setComidaGrasa('')
    setComidaKcal('')
    setGuardando(false)
    setModalComida(false)
    await otorgarXP(supabase, perfil, { p_xp: XP_TABLE.nutricion, p_tipo: 'nutricion' })
    router.refresh()
  }

  async function eliminarComida(id: string) {
    const { error } = await supabase.from('nutricion_comidas').delete().eq('id', id)
    if (error) {
      toast.error('No se pudo eliminar')
      return
    }
    setComidas((prev) => prev.filter((c) => c.id !== id))
  }

  async function guardarMeta() {
    setGuardando(true)
    const { error } = await supabase.from('nutricion_metas').upsert(metaNutricion)
    if (error) {
      toast.error('No se pudo guardar la meta')
      setGuardando(false)
      return
    }
    setGuardando(false)
    setModalMeta(false)
    toast.success('Meta actualizada')
  }

  const hoy = new Date().toISOString().slice(0, 10)
  const comidasHoy = comidas.filter((c) => c.fecha === hoy)
  const totalesHoy = comidasHoy.reduce(
    (acc, c) => ({
      kcal: acc.kcal + Number(c.kcal),
      proteina: acc.proteina + Number(c.proteina),
      carbohidratos: acc.carbohidratos + Number(c.carbohidratos),
      grasa: acc.grasa + Number(c.grasa),
    }),
    { kcal: 0, proteina: 0, carbohidratos: 0, grasa: 0 }
  )
  const deficit = metaNutricion.kcal_objetivo - totalesHoy.kcal

  return (
    <div className="flex flex-col min-h-full bg-background">
      <div className="brand-stripe" />
      <div className="bg-surface border-b border-border px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-base font-medium">Entrenamiento</h1>
          <p className="text-xs text-muted mt-0.5">Tu evolucion fisica, calculada en tiempo real</p>
        </div>
        {tab === 'entrenamiento' && (
          <button onClick={abrirModalSet} className="btn-tl-blue">
            <Plus size={14} /> Registrar serie
          </button>
        )}
        {tab === 'dieta' && (
          <button onClick={() => setModalComida(true)} className="btn-tl-blue">
            <Plus size={14} /> Agregar comida
          </button>
        )}
      </div>

      <div className="px-6 pt-4">
        <div className="inline-flex rounded-full border border-border p-0.5">
          <button
            onClick={() => setTab('plan')}
            className="px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5"
            style={tab === 'plan' ? { background: 'var(--tl-blue)', color: 'white' } : { color: 'var(--tl-muted)' }}
          >
            <Calendar size={13} /> Plan
          </button>
          <button
            onClick={() => setTab('entrenamiento')}
            className="px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5"
            style={tab === 'entrenamiento' ? { background: 'var(--tl-blue)', color: 'white' } : { color: 'var(--tl-muted)' }}
          >
            <Dumbbell size={13} /> Entrenamientos
          </button>
          <button
            onClick={() => setTab('dieta')}
            className="px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5"
            style={tab === 'dieta' ? { background: 'var(--tl-blue)', color: 'white' } : { color: 'var(--tl-muted)' }}
          >
            <Utensils size={13} /> Dieta
          </button>
        </div>
      </div>

      <div className="px-6 pt-4">
        <FraseMotivacional />
      </div>

      {tab === 'plan' && (
        <div className="p-5">
          <PlanEntrenamientoView
            planInicial={planInicial}
            rutinasDisponibles={rutinas}
            setRutinasDisponibles={setRutinas}
            ejercicios={ejercicios}
            usuarioId={usuarioId}
            perfil={perfil}
          />
        </div>
      )}

      {tab === 'entrenamiento' && (
        <div className="p-5 space-y-5">
          <RutinasView
            rutinas={rutinas}
            setRutinas={setRutinas}
            ejercicios={ejercicios}
            setEjercicios={setEjercicios}
            usuarioId={usuarioId}
            perfil={perfil}
          />

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="card px-4 py-3">
              <p className="text-[11px] text-muted mb-1">Volumen semanal</p>
              <p className="text-xl font-medium" style={{ color: 'var(--tl-blue)' }}>
                {formatNumber(volumenSemana)}
              </p>
              <p className="text-[11px] mt-0.5" style={{ color: variacion >= 0 ? 'var(--tl-green)' : 'var(--tl-red)' }}>
                {variacion >= 0 ? '+' : ''}
                {variacion.toFixed(0)}% vs sem. pasada
              </p>
            </div>
            <div className="card px-4 py-3">
              <p className="text-[11px] text-muted mb-1">Sesiones (7 dias)</p>
              <p className="text-xl font-medium">{new Set(registros.filter((r) => dias7.includes(r.fecha)).map((r) => r.fecha)).size}</p>
            </div>
            <div className="card px-4 py-3">
              <p className="text-[11px] text-muted mb-1">Ejercicios registrados</p>
              <p className="text-xl font-medium">{ejercicios.length}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="card p-4 lg:col-span-2">
              <h2 className="text-sm font-medium mb-3">Volumen por dia</h2>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={volumenPorDia}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e2733" vertical={false} />
                  <XAxis dataKey="fecha" tick={{ fontSize: 11, fill: '#8892a6' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#8892a6' }} axisLine={false} tickLine={false} width={40} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="volumen" name="Volumen" fill="#2f6bff" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="card p-4">
              <h2 className="text-sm font-medium mb-3">Grupo muscular (7 dias)</h2>
              {porGrupo.length === 0 ? (
                <p className="text-xs text-muted">Sin registros esta semana</p>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={140}>
                    <PieChart>
                      <Pie data={porGrupo} dataKey="value" nameKey="name" innerRadius={40} outerRadius={65} paddingAngle={2}>
                        {porGrupo.map((_, i) => (
                          <Cell key={i} fill={COLORES[i % COLORES.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v) => formatNumber(Number(v))} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-1 mt-2">
                    {porGrupo.map((c, i) => (
                      <div key={c.name} className="flex items-center justify-between text-[11px]">
                        <span className="flex items-center gap-1.5 capitalize text-muted">
                          <span className="w-2 h-2 rounded-full" style={{ background: COLORES[i % COLORES.length] }} />
                          {c.name}
                        </span>
                        <span>{formatNumber(c.value)}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="card overflow-hidden">
            <table className="tl-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Ejercicio</th>
                  <th>Peso</th>
                  <th>Reps x Series</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {registros.slice(0, 30).map((r) => (
                  <tr key={r.id}>
                    <td className="text-muted">{r.fecha}</td>
                    <td>{r.ejercicio?.nombre ?? '—'}</td>
                    <td>{r.peso} lbs</td>
                    <td>
                      {r.reps} x {r.series}
                    </td>
                    <td>
                      <button onClick={() => eliminarRegistro(r.id)} className="text-muted hover:text-red-500 float-right">
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'dieta' && (
        <div className="p-5 space-y-5">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="card px-4 py-3">
              <p className="text-[11px] text-muted mb-1">Kcal hoy</p>
              <p className="text-xl font-medium" style={{ color: 'var(--tl-blue)' }}>
                {formatNumber(totalesHoy.kcal)}
              </p>
              <p className="text-[11px] text-muted mt-0.5">Meta {formatNumber(metaNutricion.kcal_objetivo)}</p>
            </div>
            <div className="card px-4 py-3">
              <p className="text-[11px] text-muted mb-1">Proteina</p>
              <p className="text-xl font-medium">{formatNumber(totalesHoy.proteina)}g</p>
              <p className="text-[11px] text-muted mt-0.5">Meta {metaNutricion.proteina_objetivo}g</p>
            </div>
            <div className="card px-4 py-3">
              <p className="text-[11px] text-muted mb-1">Carbohidratos</p>
              <p className="text-xl font-medium">{formatNumber(totalesHoy.carbohidratos)}g</p>
              <p className="text-[11px] text-muted mt-0.5">Meta {metaNutricion.carbo_objetivo}g</p>
            </div>
            <div className="card px-4 py-3">
              <p className="text-[11px] text-muted mb-1">Deficit calorico</p>
              <p className="text-xl font-medium" style={{ color: deficit >= 0 ? 'var(--tl-green)' : 'var(--tl-red)' }}>
                {deficit >= 0 ? '-' : '+'}
                {formatNumber(Math.abs(deficit))}
              </p>
              <button onClick={() => setModalMeta(true)} className="text-[11px] mt-0.5" style={{ color: 'var(--tl-blue)' }}>
                Editar metas
              </button>
            </div>
          </div>

          <div className="card overflow-hidden">
            <div className="px-4 py-3 border-b border-border">
              <h2 className="text-sm font-medium">Comidas de hoy</h2>
            </div>
            <table className="tl-table">
              <thead>
                <tr>
                  <th>Comida</th>
                  <th>Prot.</th>
                  <th>Carb.</th>
                  <th>Gord.</th>
                  <th>Kcal</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {comidasHoy.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-muted text-center py-4">
                      Sin comidas registradas hoy
                    </td>
                  </tr>
                ) : (
                  comidasHoy.map((c) => (
                    <tr key={c.id}>
                      <td>{c.nombre}</td>
                      <td>{c.proteina}g</td>
                      <td>{c.carbohidratos}g</td>
                      <td>{c.grasa}g</td>
                      <td>{c.kcal}</td>
                      <td>
                        <button onClick={() => eliminarComida(c.id)} className="text-muted hover:text-red-500 float-right">
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {modalSet && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h2 className="font-medium text-sm">Registrar serie</h2>
              <button onClick={() => setModalSet(false)} className="text-muted hover:text-foreground">
                <X size={18} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-muted mb-1">Ejercicio</label>
                <div className="flex gap-2">
                  <select className="input-tl" value={ejercicioId} onChange={(e) => setEjercicioId(e.target.value)}>
                    {ejercicios.length === 0 && <option value="">Sin ejercicios</option>}
                    {ejercicios.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.nombre}
                      </option>
                    ))}
                  </select>
                  <button onClick={() => setModalEjercicio(true)} className="btn-tl shrink-0">
                    <Plus size={14} />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-muted mb-1">Peso (lbs)</label>
                  <input type="number" className="input-tl" value={peso} onChange={(e) => setPeso(e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted mb-1">Reps</label>
                  <input type="number" className="input-tl" value={reps} onChange={(e) => setReps(e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted mb-1">Series</label>
                  <input type="number" className="input-tl" value={series} onChange={(e) => setSeries(e.target.value)} />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 px-5 py-4 border-t border-border">
              <button onClick={() => setModalSet(false)} className="btn-tl">
                Cancelar
              </button>
              <button onClick={guardarSet} disabled={guardando} className="btn-tl-blue">
                {guardando ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {modalEjercicio && (
        <ModalNuevoEjercicio usuarioId={usuarioId} onCerrar={() => setModalEjercicio(false)} onCreado={ejercicioCreado} />
      )}

      {modalComida && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h2 className="font-medium text-sm">Nueva comida</h2>
              <button onClick={() => setModalComida(false)} className="text-muted hover:text-foreground">
                <X size={18} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-muted mb-1">Nombre</label>
                <input
                  className="input-tl"
                  value={comidaNombre}
                  onChange={(e) => setComidaNombre(e.target.value)}
                  placeholder="Ej. Almuerzo"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-muted mb-1">Proteina (g)</label>
                  <input type="number" className="input-tl" value={comidaProt} onChange={(e) => setComidaProt(e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted mb-1">Carbohidratos (g)</label>
                  <input type="number" className="input-tl" value={comidaCarbo} onChange={(e) => setComidaCarbo(e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted mb-1">Grasa (g)</label>
                  <input type="number" className="input-tl" value={comidaGrasa} onChange={(e) => setComidaGrasa(e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted mb-1">Kcal</label>
                  <input type="number" className="input-tl" value={comidaKcal} onChange={(e) => setComidaKcal(e.target.value)} />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 px-5 py-4 border-t border-border">
              <button onClick={() => setModalComida(false)} className="btn-tl">
                Cancelar
              </button>
              <button onClick={guardarComida} disabled={guardando} className="btn-tl-blue">
                {guardando ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {modalMeta && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-2xl shadow-2xl w-full max-w-sm">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h2 className="font-medium text-sm">Metas de macros</h2>
              <button onClick={() => setModalMeta(false)} className="text-muted hover:text-foreground">
                <X size={18} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-muted mb-1">Kcal objetivo</label>
                <input
                  type="number"
                  className="input-tl"
                  value={metaNutricion.kcal_objetivo}
                  onChange={(e) => setMetaNutricion({ ...metaNutricion, kcal_objetivo: Number(e.target.value) })}
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-muted mb-1">Prot. (g)</label>
                  <input
                    type="number"
                    className="input-tl"
                    value={metaNutricion.proteina_objetivo}
                    onChange={(e) => setMetaNutricion({ ...metaNutricion, proteina_objetivo: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted mb-1">Carb. (g)</label>
                  <input
                    type="number"
                    className="input-tl"
                    value={metaNutricion.carbo_objetivo}
                    onChange={(e) => setMetaNutricion({ ...metaNutricion, carbo_objetivo: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted mb-1">Grasa (g)</label>
                  <input
                    type="number"
                    className="input-tl"
                    value={metaNutricion.grasa_objetivo}
                    onChange={(e) => setMetaNutricion({ ...metaNutricion, grasa_objetivo: Number(e.target.value) })}
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 px-5 py-4 border-t border-border">
              <button onClick={() => setModalMeta(false)} className="btn-tl">
                Cancelar
              </button>
              <button onClick={guardarMeta} disabled={guardando} className="btn-tl-blue">
                {guardando ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
