import { redirect } from 'next/navigation'
import { Crown, Medal } from 'lucide-react'
import { createServerSupabase } from '@/lib/supabase/server'
import { formatNumber } from '@/lib/utils'
import { calcularNivelInfo, getRango } from '@/lib/gamification'
import type { Perfil } from '@/lib/types'

const PODIO_COLOR = ['#f5c518', '#c0c0c0', '#cd7f32']

export default async function LeaderboardPage() {
  const supabase = createServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: perfiles } = await supabase
    .from('perfiles')
    .select('*')
    .order('xp_total', { ascending: false })
    .limit(50)

  const lista = (perfiles as Perfil[]) ?? []
  const podio = lista.slice(0, 3)
  const resto = lista.slice(3)

  return (
    <div className="flex flex-col min-h-full bg-background">
      <div className="brand-stripe" />
      <div className="bg-surface border-b border-border px-6 py-4">
        <h1 className="text-base font-medium">Leaderboard</h1>
        <p className="text-xs text-muted mt-0.5">Compite con los mejores y domina el ranking</p>
      </div>

      <div className="p-5 space-y-5">
        {podio.length > 0 && (
          <div className="card p-6 flex items-end justify-center gap-4">
            {[podio[1], podio[0], podio[2]].map((p, idx) => {
              if (!p) return <div key={idx} className="flex-1" />
              const posicionReal = p === podio[0] ? 1 : p === podio[1] ? 2 : 3
              const alturas = { 1: 'h-28', 2: 'h-20', 3: 'h-14' }
              return (
                <div key={p.id} className="flex flex-col items-center flex-1 max-w-[140px]">
                  {posicionReal === 1 && <Crown size={20} style={{ color: PODIO_COLOR[0] }} className="mb-1" />}
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-semibold mb-2 border-2"
                    style={{ borderColor: PODIO_COLOR[posicionReal - 1], background: 'var(--tl-surface-2)' }}
                  >
                    {p.nombre.slice(0, 1).toUpperCase()}
                  </div>
                  <p className="text-xs font-medium truncate w-full text-center">{p.nombre}</p>
                  <p className="text-[11px] text-muted mb-2">{formatNumber(p.xp_total)} XP</p>
                  <div
                    className={`w-full rounded-t-lg flex items-start justify-center pt-2 text-sm font-semibold ${alturas[posicionReal as 1 | 2 | 3]}`}
                    style={{ background: `${PODIO_COLOR[posicionReal - 1]}33`, color: PODIO_COLOR[posicionReal - 1] }}
                  >
                    {posicionReal}°
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <div className="card overflow-hidden">
          <table className="tl-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Jugador</th>
                <th>Rango</th>
                <th>Nivel</th>
                <th>XP</th>
              </tr>
            </thead>
            <tbody>
              {resto.map((p, i) => {
                const info = calcularNivelInfo(p.xp_total)
                const esUsuarioActual = p.id === user.id
                return (
                  <tr key={p.id} style={esUsuarioActual ? { background: 'var(--tl-blue-dim)' } : {}}>
                    <td className="flex items-center gap-1">
                      {i + 4 <= 3 && <Medal size={12} />}
                      {i + 4}
                    </td>
                    <td>{p.nombre}</td>
                    <td className="text-muted">{getRango(info.nivel)}</td>
                    <td>{info.nivel}</td>
                    <td style={{ color: 'var(--tl-blue)' }}>{formatNumber(p.xp_total)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
