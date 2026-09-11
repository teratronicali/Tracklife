'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'
import { LogoMark, Wordmark } from '@/components/Logo'

export default function SignupPage() {
  const router = useRouter()
  const supabase = createClient()
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [cargando, setCargando] = useState(false)

  async function registrar(e: React.FormEvent) {
    e.preventDefault()
    setCargando(true)
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { nombre } },
    })
    if (error) {
      toast.error(error.message || 'No se pudo crear la cuenta')
      setCargando(false)
      return
    }
    toast.success('Cuenta creada. Bienvenido!')
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="mb-3">
            <LogoMark size={48} />
          </div>
          <h1 className="text-lg font-semibold">
            <Wordmark />
          </h1>
          <p className="text-xs text-muted mt-1">Crea tu cuenta y empieza a subir de nivel</p>
        </div>

        <form onSubmit={registrar} className="card p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-muted mb-1">Nombre</label>
            <input
              required
              className="input-tl"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Tu nombre"
            />
          </div>
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
              minLength={6}
              className="input-tl"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimo 6 caracteres"
            />
          </div>
          <button type="submit" disabled={cargando} className="btn-tl-blue w-full">
            {cargando ? <Loader2 size={14} className="animate-spin" /> : null}
            Crear cuenta
          </button>
        </form>

        <p className="text-center text-xs text-muted mt-5">
          Ya tienes cuenta?{' '}
          <Link href="/login" className="hover:underline" style={{ color: 'var(--tl-blue)' }}>
            Inicia sesion
          </Link>
        </p>
      </div>
    </div>
  )
}
