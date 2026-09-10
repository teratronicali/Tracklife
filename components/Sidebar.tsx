'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  CheckSquare,
  Wallet,
  Dumbbell,
  Target,
  KanbanSquare,
  Trophy,
  Gift,
  LogOut,
  Zap,
  Flame,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn, formatNumber } from '@/lib/utils'
import { calcularNivelInfo, getRango } from '@/lib/gamification'
import type { Perfil } from '@/lib/types'

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/habitos', label: 'Habitos', icon: CheckSquare },
  { href: '/finanzas', label: 'Finanzas', icon: Wallet },
  { href: '/entrenamiento', label: 'Entrenamiento', icon: Dumbbell },
  { href: '/metas', label: 'Metas', icon: Target },
  { href: '/tareas', label: 'Tareas', icon: KanbanSquare },
  { href: '/leaderboard', label: 'Leaderboard', icon: Trophy },
  { href: '/recompensas', label: 'Recompensas', icon: Gift },
]

export default function Sidebar({ perfil }: { perfil: Perfil }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const info = calcularNivelInfo(perfil.xp_total)

  async function salir() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="w-60 shrink-0 border-r border-border bg-surface flex flex-col h-screen sticky top-0">
      <div className="brand-stripe" />
      <div className="px-4 py-4 flex items-center gap-2 border-b border-border">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: 'var(--tl-blue-dim)' }}
        >
          <Zap size={16} style={{ color: 'var(--tl-blue)' }} />
        </div>
        <span className="font-semibold text-sm">TrackLife</span>
      </div>

      <div className="px-4 py-4 border-b border-border">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-medium truncate">{perfil.nombre}</span>
          <span className="pill">Nv. {info.nivel}</span>
        </div>
        <p className="text-[11px] text-muted mb-2">{getRango(info.nivel)}</p>
        <div className="h-1.5 rounded-full bg-surface-2 overflow-hidden">
          <div
            className="h-full rounded-full"
            style={{ width: `${Math.min(100, info.progreso * 100)}%`, background: 'var(--tl-blue)' }}
          />
        </div>
        <div className="flex items-center justify-between mt-1.5 text-[11px] text-muted">
          <span>
            {formatNumber(info.xpEnNivel)}/{formatNumber(info.xpParaSiguiente)} XP
          </span>
          <span className="flex items-center gap-0.5" style={{ color: '#f59e0b' }}>
            <Flame size={12} /> {perfil.racha_actual}
          </span>
        </div>
      </div>

      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {NAV.map((item) => {
          const Icon = item.icon
          const active = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn('nav-item', active && 'active')}
            >
              <Icon size={16} />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="p-2 border-t border-border">
        <button onClick={salir} className="nav-item w-full text-left">
          <LogOut size={16} />
          Cerrar sesion
        </button>
      </div>
    </aside>
  )
}
