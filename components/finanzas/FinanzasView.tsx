'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, X, Check, Loader2, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { createClient } from '@/lib/supabase/client'
import { formatMoney, lastNDates } from '@/lib/utils'
import { CATEGORIAS_GASTO, CATEGORIAS_INGRESO, type FinanzaTransaccion, type Perfil, type TipoTransaccion } from '@/lib/types'
import { XP_TABLE } from '@/lib/gamification'
import { otorgarXP } from '@/lib/xp-client'

const COLORES_CATEGORIA = ['#2f6bff', '#60a5fa', '#93c5fd', '#f59e0b', '#94a3b8', '#38bdf8', '#a78bfa']

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
          {p.name}: {formatMoney(p.value ?? 0)}
        </p>
      ))}
    </div>
  )
}

export default function FinanzasView({
  transaccionesIniciales,
  usuarioId,
  perfil,
}: {
  transaccionesIniciales: FinanzaTransaccion[]
  usuarioId: string
  perfil: Perfil
}) {
  const supabase = createClient()
  const router = useRouter()
  const [transacciones, setTransacciones] = useState(transaccionesIniciales)
  const [modalAbierto, setModalAbierto] = useState(false)
  const [guardando, setGuardando] = useState(false)

  const [tipo, setTipo] = useState<TipoTransaccion>('gasto')
  const [categoria, setCategoria] = useState<string>('otros')
  const [descripcion, setDescripcion] = useState('')
  const [monto, setMonto] = useState('')
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10))

  const hoy = new Date().toISOString().slice(0, 10)
  const inicioMes = `${hoy.slice(0, 7)}-01`

  const saldoActual = transacciones.reduce((s, t) => s + (t.tipo === 'ingreso' ? Number(t.monto) : -Number(t.monto)), 0)
  const delMes = transacciones.filter((t) => t.fecha >= inicioMes)
  const ingresoMes = delMes.filter((t) => t.tipo === 'ingreso').reduce((s, t) => s + Number(t.monto), 0)
  const gastoMes = delMes.filter((t) => t.tipo === 'gasto').reduce((s, t) => s + Number(t.monto), 0)

  const evolucion = useMemo(() => {
    const dias = lastNDates(30)
    let acumulado = transacciones
      .filter((t) => t.fecha < dias[0])
      .reduce((s, t) => s + (t.tipo === 'ingreso' ? Number(t.monto) : -Number(t.monto)), 0)
    return dias.map((f) => {
      const delDia = transacciones.filter((t) => t.fecha === f)
      acumulado += delDia.reduce((s, t) => s + (t.tipo === 'ingreso' ? Number(t.monto) : -Number(t.monto)), 0)
      return { fecha: f.slice(5), saldo: acumulado }
    })
  }, [transacciones])

  const porCategoria = useMemo(() => {
    const map = new Map<string, number>()
    for (const t of delMes) {
      if (t.tipo !== 'gasto') continue
      map.set(t.categoria, (map.get(t.categoria) ?? 0) + Number(t.monto))
    }
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }))
  }, [delMes])

  const categoriasDisponibles = tipo === 'gasto' ? CATEGORIAS_GASTO : CATEGORIAS_INGRESO

  function abrirModal() {
    setTipo('gasto')
    setCategoria('otros')
    setDescripcion('')
    setMonto('')
    setFecha(new Date().toISOString().slice(0, 10))
    setModalAbierto(true)
  }

  async function guardar() {
    const montoNum = Number(monto)
    if (!montoNum || montoNum <= 0) {
      toast.error('Ingresa un monto valido')
      return
    }
    setGuardando(true)
    const { data, error } = await supabase
      .from('finanzas_transacciones')
      .insert({ usuario_id: usuarioId, tipo, categoria, descripcion: descripcion || null, monto: montoNum, fecha })
      .select()
      .single()
    if (error) {
      toast.error('No se pudo guardar')
      setGuardando(false)
      return
    }
    setTransacciones((prev) => [data as FinanzaTransaccion, ...prev])
    await otorgarXP(supabase, perfil, { p_xp: XP_TABLE.finanzas, p_tipo: 'finanzas', p_descripcion: descripcion || categoria })
    setGuardando(false)
    setModalAbierto(false)
    router.refresh()
  }

  async function eliminar(id: string) {
    const { error } = await supabase.from('finanzas_transacciones').delete().eq('id', id)
    if (error) {
      toast.error('No se pudo eliminar')
      return
    }
    setTransacciones((prev) => prev.filter((t) => t.id !== id))
    toast.success('Eliminado')
  }

  return (
    <div className="flex flex-col min-h-full bg-background">
      <div className="brand-stripe" />
      <div className="bg-surface border-b border-border px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-base font-medium">Finanzas</h1>
          <p className="text-xs text-muted mt-0.5">Control financiero a la velocidad del pensamiento</p>
        </div>
        <button onClick={abrirModal} className="btn-tl-blue">
          <Plus size={14} /> Nueva transaccion
        </button>
      </div>

      <div className="p-5 space-y-5">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="card px-4 py-3">
            <p className="text-[11px] text-muted mb-1">Saldo actual</p>
            <p className="text-xl font-medium" style={{ color: 'var(--tl-blue)' }}>
              {formatMoney(saldoActual)}
            </p>
          </div>
          <div className="card px-4 py-3">
            <p className="text-[11px] text-muted mb-1">Ingresos del mes</p>
            <p className="text-xl font-medium" style={{ color: 'var(--tl-green)' }}>
              {formatMoney(ingresoMes)}
            </p>
          </div>
          <div className="card px-4 py-3">
            <p className="text-[11px] text-muted mb-1">Gastos del mes</p>
            <p className="text-xl font-medium" style={{ color: 'var(--tl-red)' }}>
              {formatMoney(gastoMes)}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="card p-4 lg:col-span-2">
            <h2 className="text-sm font-medium mb-3">Evolucion de saldo (30 dias)</h2>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={evolucion}>
                <defs>
                  <linearGradient id="saldoGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2f6bff" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#2f6bff" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2733" vertical={false} />
                <XAxis dataKey="fecha" tick={{ fontSize: 11, fill: '#8892a6' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#8892a6' }} axisLine={false} tickLine={false} width={40} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="saldo" name="Saldo" stroke="#2f6bff" fill="url(#saldoGradient)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="card p-4">
            <h2 className="text-sm font-medium mb-3">Gastos por categoria</h2>
            {porCategoria.length === 0 ? (
              <p className="text-xs text-muted">Sin gastos este mes</p>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie data={porCategoria} dataKey="value" nameKey="name" innerRadius={45} outerRadius={70} paddingAngle={2}>
                      {porCategoria.map((_, i) => (
                        <Cell key={i} fill={COLORES_CATEGORIA[i % COLORES_CATEGORIA.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => formatMoney(Number(v))} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-1 mt-2">
                  {porCategoria.map((c, i) => (
                    <div key={c.name} className="flex items-center justify-between text-[11px]">
                      <span className="flex items-center gap-1.5 capitalize text-muted">
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ background: COLORES_CATEGORIA[i % COLORES_CATEGORIA.length] }}
                        />
                        {c.name}
                      </span>
                      <span>{formatMoney(c.value)}</span>
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
                <th>Descripcion</th>
                <th>Categoria</th>
                <th>Monto</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {transacciones.slice(0, 30).map((t) => (
                <tr key={t.id}>
                  <td className="text-muted">{t.fecha}</td>
                  <td>{t.descripcion || '—'}</td>
                  <td className="capitalize text-muted">{t.categoria}</td>
                  <td style={{ color: t.tipo === 'ingreso' ? 'var(--tl-green)' : 'var(--tl-red)' }}>
                    {t.tipo === 'ingreso' ? '+' : '-'}
                    {formatMoney(Number(t.monto))}
                  </td>
                  <td>
                    <button onClick={() => eliminar(t.id)} className="text-muted hover:text-red-500 float-right">
                      <Trash2 size={14} />
                    </button>
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
              <h2 className="font-medium text-sm">Nueva transaccion</h2>
              <button onClick={() => setModalAbierto(false)} className="text-muted hover:text-foreground">
                <X size={18} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    setTipo('gasto')
                    setCategoria('otros')
                  }}
                  className="btn-tl"
                  style={
                    tipo === 'gasto'
                      ? { background: 'var(--tl-red)', color: 'white', borderColor: 'var(--tl-red)' }
                      : {}
                  }
                >
                  Gasto
                </button>
                <button
                  onClick={() => {
                    setTipo('ingreso')
                    setCategoria('otros')
                  }}
                  className="btn-tl"
                  style={
                    tipo === 'ingreso'
                      ? { background: 'var(--tl-green)', color: 'white', borderColor: 'var(--tl-green)' }
                      : {}
                  }
                >
                  Ingreso
                </button>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted mb-1">Monto</label>
                <input
                  type="number"
                  className="input-tl"
                  value={monto}
                  onChange={(e) => setMonto(e.target.value)}
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted mb-1">Categoria</label>
                <select className="input-tl" value={categoria} onChange={(e) => setCategoria(e.target.value)}>
                  {categoriasDisponibles.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted mb-1">Descripcion (opcional)</label>
                <input
                  className="input-tl"
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Ej. Supermercado"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted mb-1">Fecha</label>
                <input type="date" className="input-tl" value={fecha} onChange={(e) => setFecha(e.target.value)} />
              </div>
            </div>
            <div className="flex justify-end gap-2 px-5 py-4 border-t border-border">
              <button onClick={() => setModalAbierto(false)} className="btn-tl">
                Cancelar
              </button>
              <button onClick={guardar} disabled={guardando} className="btn-tl-blue">
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
