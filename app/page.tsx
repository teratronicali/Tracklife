'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ArrowRight,
  Check,
  CheckSquare,
  Wallet,
  Dumbbell,
  Target,
  KanbanSquare,
  Trophy,
  ChevronDown,
  ShieldCheck,
  Flame,
} from 'lucide-react'
import { LogoMark, Wordmark } from '@/components/Logo'
import { PRECIO } from '@/lib/planes'

const PARA_TI = [
  'Entrenaste toda la semana pero no tienes ni idea si estas progresando de verdad.',
  'Te llego el sueldo, y a los pocos dias ya no sabes en que se fue.',
  'Escribes tus metas en notas sueltas y se te pierden entre apps.',
  'Empiezas habitos con toda la motivacion... y los abandonas a los 4 dias.',
]

const FEATURES = [
  {
    icon: CheckSquare,
    label: 'Habitos',
    titulo: 'Construye habitos que se quedan',
    desc: 'Cuadricula semanal, racha de dias seguidos y un heatmap de 84 dias para ver tu constancia de un vistazo.',
  },
  {
    icon: Wallet,
    label: 'Finanzas',
    titulo: 'Sabe a donde se va tu plata',
    desc: 'Registra ingresos y gastos, categoriza automaticamente y mira la evolucion de tu saldo en el tiempo.',
  },
  {
    icon: Dumbbell,
    label: 'Entrenamiento',
    titulo: 'Mide tu progreso real',
    desc: 'Series, peso y repeticiones por ejercicio, volumen semanal, y sincronizacion automatica con Strava.',
  },
  {
    icon: Target,
    label: 'Metas',
    titulo: 'Convierte suenos en numeros',
    desc: 'Metas financieras o personales con barra de progreso y aportes — sabes exactamente cuanto te falta.',
  },
  {
    icon: KanbanSquare,
    label: 'Tareas',
    titulo: 'Organiza tu semana',
    desc: 'Tablero kanban con etiquetas y subtareas, sin cambiar de app para gestionar tu trabajo.',
  },
  {
    icon: Trophy,
    label: 'Gamificacion',
    titulo: 'Gana XP por cada accion',
    desc: 'Sube de nivel, desbloquea recompensas y compite en el leaderboard global con otros usuarios.',
  },
]

const CARACTERISTICAS_PRECIO = [
  'Habitos, metas y tareas ilimitados',
  'Todos los modulos: finanzas, entrenamiento y dieta',
  'Integracion con Strava',
  'Sistema de XP, niveles y leaderboard',
  'Todas las actualizaciones futuras',
]

const FAQS = [
  {
    q: '¿TrackLife funciona en el celular?',
    a: 'Si. Es una aplicacion web responsiva: funciona igual de bien en tu telefono, tablet o computador desde el navegador, sin necesidad de instalar nada.',
  },
  {
    q: '¿Hay un plan gratis?',
    a: 'Si. Puedes usar TrackLife gratis con limites (hasta 3 habitos, 2 metas y 5 tareas activas). El Acceso Vitalicio quita esos limites para siempre con un solo pago.',
  },
  {
    q: '¿Es un pago unico o una suscripcion?',
    a: `El Acceso Vitalicio es un pago unico de ${PRECIO.display}. Pagas una sola vez y el acceso completo es tuyo para siempre, sin mensualidades ni renovaciones automaticas.`,
  },
  {
    q: '¿Y si no me convence?',
    a: 'Tienes 7 dias completos desde tu compra para pedir un reembolso total, sin preguntas.',
  },
  {
    q: '¿Necesito instalar algo?',
    a: 'No. TrackLife corre directamente en tu navegador. Si quieres, puedes guardarlo como acceso directo en tu pantalla de inicio para abrirlo mas rapido.',
  },
]

function FaqItem({ q, a }: { q: string; a: string }) {
  const [abierto, setAbierto] = useState(false)
  return (
    <div className="border-b border-border">
      <button
        onClick={() => setAbierto((v) => !v)}
        className="w-full flex items-center justify-between gap-4 py-5 text-left"
      >
        <span className="text-sm font-medium">{q}</span>
        <ChevronDown
          size={16}
          className="shrink-0 text-muted transition-transform"
          style={{ transform: abierto ? 'rotate(180deg)' : 'none' }}
        />
      </button>
      {abierto && <p className="text-sm text-muted pb-5 leading-relaxed">{a}</p>}
    </div>
  )
}

export default function LandingPage() {
  return (
    <div className="bg-background text-foreground">
      <div className="brand-stripe" />

      {/* NAV */}
      <header className="max-w-5xl mx-auto px-5 py-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <LogoMark size={28} />
          <Wordmark className="font-semibold text-sm" />
        </div>
        <div className="flex items-center gap-2">
          <Link href="/login" className="btn-tl text-xs">
            Iniciar sesion
          </Link>
          <Link href="/signup" className="btn-tl-blue text-xs">
            Crear cuenta
          </Link>
        </div>
      </header>

      {/* HERO */}
      <section className="max-w-3xl mx-auto px-5 pt-10 pb-16 text-center">
        <span className="pill inline-block mb-5">Habitos · Finanzas · Entrenamiento · Metas · Tareas</span>
        <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight leading-[1.08] mb-5 text-balance">
          Rastrea tu vida.<br />
          Sube de <span style={{ color: 'var(--tl-blue)' }}>nivel</span> haciendolo.
        </h1>
        <p className="text-muted text-base leading-relaxed max-w-xl mx-auto mb-8">
          Deja de saltar entre cinco apps distintas. TrackLife junta tus habitos, finanzas, entrenamiento, metas y
          tareas en un solo lugar — y convierte cada accion en XP, niveles y una racha que no querras romper.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link href="/signup" className="btn-tl-blue text-sm px-6 py-3">
            Crear cuenta gratis <ArrowRight size={15} />
          </Link>
          <a href="#precio" className="btn-tl text-sm px-6 py-3">
            Ver precio
          </a>
        </div>

        {/* Mini preview widget */}
        <div className="card mt-14 p-5 max-w-md mx-auto text-left">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-medium">Habitos de hoy</span>
            <span className="flex items-center gap-1 text-[11px]" style={{ color: '#f59e0b' }}>
              <Flame size={12} /> 5 dias de racha
            </span>
          </div>
          {[
            { n: 'Entrenar', hecho: true },
            { n: 'Meditar', hecho: true },
            { n: 'Leer 20 paginas', hecho: false },
          ].map((h) => (
            <div key={h.n} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
              <span
                className="w-5 h-5 rounded-md border flex items-center justify-center"
                style={{
                  background: h.hecho ? 'var(--tl-blue)' : 'transparent',
                  borderColor: h.hecho ? 'var(--tl-blue)' : 'var(--tl-border)',
                }}
              >
                {h.hecho && <Check size={12} className="text-white" />}
              </span>
              <span className={`flex-1 text-sm ${h.hecho ? 'text-muted line-through' : ''}`}>{h.n}</span>
              <span className="pill">+30 XP</span>
            </div>
          ))}
        </div>
      </section>

      {/* PARA TI */}
      <section className="border-t border-border">
        <div className="max-w-2xl mx-auto px-5 py-16">
          <p className="text-center text-xs font-medium uppercase tracking-widest text-muted mb-10">
            Esto es para ti si...
          </p>
          <div className="space-y-6">
            {PARA_TI.map((q, i) => (
              <div key={i} className="flex items-start gap-4">
                <span style={{ color: 'var(--tl-blue)' }} className="text-lg leading-none mt-0.5">
                  —
                </span>
                <p className="text-base">{q}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="border-t border-border">
        <div className="max-w-5xl mx-auto px-5 py-16">
          <div className="text-center max-w-lg mx-auto mb-12">
            <span className="pill inline-block mb-4">Todo en un solo lugar</span>
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight mb-3">
              Un sistema, no cinco apps sueltas
            </h2>
            <p className="text-sm text-muted">
              Cada modulo suma XP a tu perfil. Entre mas constante seas, mas rapido subes de nivel.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f) => {
              const Icon = f.icon
              return (
                <div key={f.label} className="card p-5">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center mb-4"
                    style={{ background: 'var(--tl-blue-dim)' }}
                  >
                    <Icon size={16} style={{ color: 'var(--tl-blue)' }} />
                  </div>
                  <p className="text-[11px] font-medium uppercase tracking-wide mb-1" style={{ color: 'var(--tl-blue)' }}>
                    {f.label}
                  </p>
                  <h3 className="text-sm font-medium mb-2">{f.titulo}</h3>
                  <p className="text-xs text-muted leading-relaxed">{f.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="precio" className="border-t border-border">
        <div className="max-w-md mx-auto px-5 py-16 text-center">
          <span className="pill inline-block mb-4">Precio simple</span>
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight mb-2">Un pago. Acceso para siempre.</h2>
          <p className="text-sm text-muted mb-10">Empieza gratis. Mejora cuando quieras, sin mensualidades.</p>

          <div className="card p-7 text-left">
            <p className="text-xs text-muted mb-2 text-center">Acceso Vitalicio</p>
            <p className="text-5xl font-semibold mb-1 text-center">{PRECIO.display}</p>
            <p className="text-[11px] text-muted mb-6 text-center">pago unico · acceso de por vida</p>
            <ul className="space-y-2.5 mb-7">
              {CARACTERISTICAS_PRECIO.map((c) => (
                <li key={c} className="flex items-start gap-2 text-xs">
                  <Check size={14} className="shrink-0 mt-0.5" style={{ color: 'var(--tl-blue)' }} />
                  <span>{c}</span>
                </li>
              ))}
            </ul>
            <Link href="/signup" className="btn-tl-blue w-full text-sm py-3 justify-center">
              Crear cuenta y mejorar <ArrowRight size={15} />
            </Link>
            <div className="flex items-center justify-center gap-1.5 text-[11px] text-muted mt-4">
              <ShieldCheck size={13} />
              Garantia de 7 dias — reembolso total si no te convence
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-border">
        <div className="max-w-2xl mx-auto px-5 py-16">
          <div className="text-center mb-8">
            <span className="pill inline-block mb-4">FAQ</span>
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">Preguntas frecuentes</h2>
          </div>
          <div>
            {FAQS.map((f) => (
              <FaqItem key={f.q} q={f.q} a={f.a} />
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-border">
        <div className="max-w-5xl mx-auto px-5 py-10 flex flex-col items-center gap-3 text-center">
          <div className="flex items-center gap-2">
            <LogoMark size={24} />
            <Wordmark className="font-semibold text-sm" />
          </div>
          <p className="text-[11px] text-muted">© {new Date().getFullYear()} TrackLife. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  )
}
