'use client'

import { useState } from 'react'
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
  Flame,
  Settings,
  Crown,
  Menu,
  X,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn, formatNumber } from '@/lib/utils'
import { calcularNivelInfo, getRango } from '@/lib/gamification'
import { esVitalicio } from '@/lib/planes'
import type { Perfil } from '@/lib/types'

const PRINCIPALES = [
  { href: '/dashboard', label: 'Inicio', icon: LayoutDashboard },
  { href: '/habitos', label: 'Habitos', icon: CheckSquare },
  { href: '/finanzas', label: 'Finanzas', icon: Wallet },
  { href: '/entrenamiento', label: 'Entreno', icon: Dumbbell },
  { href: '/metas', label: 'Metas', icon: Target },
]

const MAS = [
  { href: '/tareas', label: 'Tareas', icon: KanbanSquare },
  { href: '/leaderboard', label: 'Leaderboard', icon: Trophy },
  { href: '/recompensas', label: 'Recompensas', icon: Gift },
  { href: '/precio', label: 'Precio', icon: Crown },
  { href: '/ajustes', label: 'Ajustes', icon: Settings },
]

export default function BottomNav({ perfil }: { perfil: Perfil }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [abierto, setAbierto] = useState(false)
  const info = calcularNivelInfo(perfil.xp_total)

  async function salir() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <>
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-surface border-t border-border flex items-stretch h-14">
        {PRINCIPALES.map((item) => {
          const Icon = item.icon
          const active = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px]"
              style={{ color: active ? 'var(--tl-blue)' : 'var(--tl-muted)' }}
            >
              <Icon size={18} />
              {item.label}
            </Link>
          )
        })}
        <button
          onClick={() => setAbierto(true)}
          className="flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] text-muted"
        >
          <Menu size={18} />
          Mas
        </button>
      </nav>

      {abierto && (
        <div className="md:hidden fixed inset-0 bg-black/60 z-50 flex items-end" onClick={() => setAbierto(false)}>
          <div className="bg-surface border-t border-border rounded-t-2xl w-full max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h2 className="font-medium text-sm">Menu</h2>
              <button onClick={() => setAbierto(false)} className="text-muted hover:text-foreground">
                <X size={18} />
              </button>
            </div>

            <div className="px-5 py-4 border-b border-border">
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
              {esVitalicio(perfil) ? (
                <div className="flex items-center gap-1 mt-2 text-[11px]" style={{ color: 'var(--tl-blue)' }}>
                  <Crown size={12} /> Acceso Vitalicio
                </div>
              ) : (
                <Link
                  href="/precio"
                  onClick={() => setAbierto(false)}
                  className="flex items-center gap-1 mt-2 text-[11px] hover:underline"
                  style={{ color: 'var(--tl-blue)' }}
                >
                  <Crown size={12} /> Mejorar a Vitalicio
                </Link>
              )}
            </div>

            <div className="p-2">
              {MAS.map((item) => {
                const Icon = item.icon
                const active = pathname.startsWith(item.href)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setAbierto(false)}
                    className={cn('nav-item', active && 'active')}
                  >
                    <Icon size={16} />
                    {item.label}
                  </Link>
                )
              })}
              <button onClick={salir} className="nav-item w-full text-left">
                <LogOut size={16} />
                Cerrar sesion
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
