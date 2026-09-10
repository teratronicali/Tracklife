import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Wallet, Dumbbell, Target, KanbanSquare, ArrowRight } from 'lucide-react'
import { createServerSupabase } from '@/lib/supabase/server'
import HabitosHoyWidget from '@/components/habitos/HabitosHoyWidget'
import { formatMoney, formatNumber, lastNDates } from '@/lib/utils'
import { calcularNivelInfo, getRango } from '@/lib/gamification'
import type { Habito, Perfil } from '@/lib/types'

export default async function DashboardPage() {
  const supabase = createServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const hoy = new Date().toISOString().slice(0, 10)
  const inicioMes = `${hoy.slice(0, 7)}-01`
  const inicioSemana = lastNDates(7)[0]

  const [
    { data: perfil },
    { data: habitos },
    { data: registrosHoy },
    { data: finanzasMes },
    { data: entrenoSemana },
    { data: metas },
    { data: tareasPendientes },
  ] = await Promise.all([
    supabase.from('perfiles').select('*').eq('id', user.id).single<Perfil>(),
    supabase
      .from('habitos')
      .select('*')
      .eq('usuario_id', user.id)
      .eq('activo', true)
      .order('created_at'),
    supabase.from('habito_registros').select('habito_id').eq('usuario_id', user.id).eq('fecha', hoy),
    supabase.from('finanzas_transacciones').select('tipo, monto').eq('usuario_id', user.id).gte('fecha', inicioMes),
    supabase
      .from('entrenamiento_registros')
      .select('fecha')
      .eq('usuario_id', user.id)
      .gte('fecha', inicioSemana),
    supabase.from('metas').select('monto_actual, monto_objetivo').eq('usuario_id', user.id).eq('archivada', false),
    supabase.from('tareas').select('id').eq('usuario_id', user.id).neq('estado', 'hecho'),
  ])

  const ingresoMes = (finanzasMes ?? []).filter((t) => t.tipo === 'ingreso').reduce((s, t) => s + Number(t.monto), 0)
  const gastoMes = (finanzasMes ?? []).filter((t) => t.tipo === 'gasto').reduce((s, t) => s + Number(t.monto), 0)
  const balanceMes = ingresoMes - gastoMes

  const sesionesSemana = new Set((entrenoSemana ?? []).map((r) => r.fecha)).size

  const metasList = metas ?? []
  const progresoMetasProm =
    metasList.length > 0
      ? metasList.reduce((s, m) => s + (m.monto_objetivo > 0 ? m.monto_actual / m.monto_objetivo : 0), 0) /
        metasList.length
      : 0

  const info = perfil ? calcularNivelInfo(perfil.xp_total) : null
  const habitosCompletadosHoy = (registrosHoy ?? []).length

  return (
    <div className="flex flex-col min-h-full bg-background">
      <div className="brand-stripe" />

      <div className="bg-surface border-b border-border px-6 py-4">
        <h1 className="text-base font-medium">Hola, {perfil?.nombre ?? 'jugador'}</h1>
        <p className="text-xs text-muted mt-0.5">
          {info ? `${getRango(info.nivel)} · Nivel ${info.nivel}` : ''} · Cada accion de hoy construye el manana
        </p>
      </div>

      <div className="p-5 space-y-5">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="card px-4 py-3">
            <p className="text-[11px] text-muted mb-1">XP total</p>
            <p className="text-xl font-medium" style={{ color: 'var(--tl-blue)' }}>
              {formatNumber(perfil?.xp_total ?? 0)}
            </p>
            <p className="text-[11px] text-muted mt-0.5">Nivel {info?.nivel ?? 1}</p>
          </div>
          <div className="card px-4 py-3">
            <p className="text-[11px] text-muted mb-1">Racha actual</p>
            <p className="text-xl font-medium" style={{ color: '#f59e0b' }}>
              {perfil?.racha_actual ?? 0} dias
            </p>
            <p className="text-[11px] text-muted mt-0.5">Mejor: {perfil?.mejor_racha ?? 0} dias</p>
          </div>
          <div className="card px-4 py-3">
            <p className="text-[11px] text-muted mb-1">Habitos hoy</p>
            <p className="text-xl font-medium">
              {habitosCompletadosHoy}/{habitos?.length ?? 0}
            </p>
            <p className="text-[11px] text-muted mt-0.5">Completados</p>
          </div>
          <div className="card px-4 py-3">
            <p className="text-[11px] text-muted mb-1">Balance del mes</p>
            <p className="text-xl font-medium" style={{ color: balanceMes >= 0 ? 'var(--tl-green)' : 'var(--tl-red)' }}>
              {formatMoney(balanceMes)}
            </p>
            <p className="text-[11px] text-muted mt-0.5">Ingresos - gastos</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="card p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-medium">Habitos de hoy</h2>
              <Link href="/habitos" className="text-xs flex items-center gap-1" style={{ color: 'var(--tl-blue)' }}>
                Ver todos <ArrowRight size={12} />
              </Link>
            </div>
            <HabitosHoyWidget
              habitos={(habitos as Habito[]) ?? []}
              completadosHoy={(registrosHoy ?? []).map((r) => r.habito_id)}
            />
          </div>

          <div className="space-y-4">
            <Link
              href="/finanzas"
              className="card p-4 flex items-center gap-3 hover:border-blue transition-colors block"
            >
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'var(--tl-blue-dim)' }}>
                <Wallet size={16} style={{ color: 'var(--tl-blue)' }} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Finanzas</p>
                <p className="text-[11px] text-muted">
                  Ingresos {formatMoney(ingresoMes)} · Gastos {formatMoney(gastoMes)}
                </p>
              </div>
              <ArrowRight size={14} className="text-muted" />
            </Link>

            <Link
              href="/entrenamiento"
              className="card p-4 flex items-center gap-3 hover:border-blue transition-colors block"
            >
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'var(--tl-blue-dim)' }}>
                <Dumbbell size={16} style={{ color: 'var(--tl-blue)' }} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Entrenamiento</p>
                <p className="text-[11px] text-muted">{sesionesSemana} sesiones esta semana</p>
              </div>
              <ArrowRight size={14} className="text-muted" />
            </Link>

            <Link href="/metas" className="card p-4 flex items-center gap-3 hover:border-blue transition-colors block">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'var(--tl-blue-dim)' }}>
                <Target size={16} style={{ color: 'var(--tl-blue)' }} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Metas activas</p>
                <p className="text-[11px] text-muted">
                  {metasList.length} metas · {Math.round(progresoMetasProm * 100)}% progreso promedio
                </p>
              </div>
              <ArrowRight size={14} className="text-muted" />
            </Link>

            <Link href="/tareas" className="card p-4 flex items-center gap-3 hover:border-blue transition-colors block">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'var(--tl-blue-dim)' }}>
                <KanbanSquare size={16} style={{ color: 'var(--tl-blue)' }} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Tareas pendientes</p>
                <p className="text-[11px] text-muted">{tareasPendientes?.length ?? 0} por completar</p>
              </div>
              <ArrowRight size={14} className="text-muted" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
