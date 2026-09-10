import { redirect } from 'next/navigation'
import { Lock, CheckCircle2, Shirt, Trophy, Gem, Crown } from 'lucide-react'
import { createServerSupabase } from '@/lib/supabase/server'
import type { Perfil } from '@/lib/types'

const RECOMPENSAS = [
  { nivel: 5, nombre: 'Sticker pack TrackLife', descripcion: 'Set de stickers exclusivos para tu setup.', icon: Gem },
  { nivel: 15, nombre: 'Camiseta TrackLife', descripcion: 'Camiseta oficial con tu rango grabado.', icon: Shirt },
  { nivel: 40, nombre: 'Hoodie Macho Alfa', descripcion: 'Hoodie premium edicion limitada.', icon: Trophy },
  { nivel: 100, nombre: 'Kit Leyenda', descripcion: 'Equipamiento completo + reconocimiento en el ranking global.', icon: Crown },
]

export default async function RecompensasPage() {
  const supabase = createServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: perfil } = await supabase.from('perfiles').select('*').eq('id', user.id).single<Perfil>()
  const nivel = perfil?.nivel ?? 1

  return (
    <div className="flex flex-col min-h-full bg-background">
      <div className="brand-stripe" />
      <div className="bg-surface border-b border-border px-6 py-4">
        <h1 className="text-base font-medium">Recompensas</h1>
        <p className="text-xs text-muted mt-0.5">Tus logros digitales, recompensas reales</p>
      </div>

      <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
        {RECOMPENSAS.map((r) => {
          const desbloqueada = nivel >= r.nivel
          const Icon = r.icon
          return (
            <div key={r.nivel} className={`card p-4 flex items-center gap-4 ${!desbloqueada && 'opacity-60'}`}>
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: desbloqueada ? 'var(--tl-blue-dim)' : 'var(--tl-surface-2)' }}
              >
                <Icon size={22} style={{ color: desbloqueada ? 'var(--tl-blue)' : 'var(--tl-muted)' }} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-sm font-medium">{r.nombre}</p>
                  <span className="pill">Nivel {r.nivel}</span>
                </div>
                <p className="text-[11px] text-muted">{r.descripcion}</p>
              </div>
              {desbloqueada ? (
                <CheckCircle2 size={18} style={{ color: 'var(--tl-green)' }} />
              ) : (
                <div className="flex flex-col items-center gap-1 text-muted">
                  <Lock size={16} />
                  <span className="text-[10px]">Faltan {r.nivel - nivel}</span>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
