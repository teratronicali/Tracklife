'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Loader2, Zap } from 'lucide-react'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [cargando, setCargando] = useState(false)

  async function entrar(e: React.FormEvent) {
    e.preventDefault()
    setCargando(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      toast.error('Credenciales invalidas')
      setCargando(false)
      return
    }
    toast.success('Bienvenido de vuelta')
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3"
            style={{ background: 'var(--tl-blue-dim)' }}
          >
            <Zap size={22} style={{ color: 'var(--tl-blue)' }} />
          </div>
          <h1 className="text-lg font-semibold">TrackLife</h1>
          <p className="text-xs text-muted mt-1">Gamifica tu disciplina</p>
        </div>

        <form onSubmit={entrar} className="card p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-muted mb-1">Correo</label>
            <input
              type="email"
              required
              className="input-tl"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@correo.com"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted mb-1">Contrasena</label>
            <input
              type="password"
              required
              className="input-tl"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          <button type="submit" disabled={cargando} className="btn-tl-blue w-full">
            {cargando ? <Loader2 size={14} className="animate-spin" /> : null}
            Entrar
          </button>
        </form>

        <p className="text-center text-xs text-muted mt-5">
          No tienes cuenta?{' '}
          <Link href="/signup" className="text-blue hover:underline" style={{ color: 'var(--tl-blue)' }}>
            Crea una
          </Link>
        </p>
      </div>
    </div>
  )
}
