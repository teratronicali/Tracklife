'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Zap, ArrowRight, ArrowLeft, Check, Loader2, Plus } from 'lucide-react'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'
import { HABITOS_SUGERIDOS, DEPORTES, ENFOQUES_FINANCIEROS, type HabitoSugerido } from '@/lib/onboarding'
import type { Perfil, TipoMeta } from '@/lib/types'

const PASOS = ['Bienvenida', 'Habitos', 'Deporte', 'Finanzas', 'Meta', 'Listo']

export default function OnboardingWizard({ perfil, usuarioId }: { perfil: Perfil; usuarioId: string }) {
  const supabase = createClient()
  const router = useRouter()
  const [paso, setPaso] = useState(0)
  const [enviando, setEnviando] = useState(false)

  const [nombre, setNombre] = useState(perfil.nombre)
  const [habitos, setHabitos] = useState<HabitoSugerido[]>([HABITOS_SUGERIDOS[0], HABITOS_SUGERIDOS[3]])
  const [habitoCustom, setHabitoCustom] = useState('')
  const [deportes, setDeportes] = useState<string[]>([])
  const [enfoques, setEnfoques] = useState<string[]>([])
  const [presupuesto, setPresupuesto] = useState('')
  const [metaTitulo, setMetaTitulo] = useState('')
  const [metaMonto, setMetaMonto] = useState('')
  const [metaTipo, setMetaTipo] = useState<TipoMeta>('personal')

  function toggleHabito(h: HabitoSugerido) {
    setHabitos((prev) => (prev.some((x) => x.nombre === h.nombre) ? prev.filter((x) => x.nombre !== h.nombre) : [...prev, h]))
  }

  function agregarHabitoCustom() {
    if (!habitoCustom.trim()) return
    setHabitos((prev) => [...prev, { nombre: habitoCustom.trim(), emoji: '✅', momento: 'manana', xp_valor: 20 }])
    setHabitoCustom('')
  }

  function toggleDeporte(id: string) {
    setDeportes((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  function toggleEnfoque(e: string) {
    setEnfoques((prev) => (prev.includes(e) ? prev.filter((x) => x !== e) : [...prev, e]))
  }

  async function finalizar() {
    setEnviando(true)
    try {
      if (habitos.length > 0) {
        const { error } = await supabase.from('habitos').insert(
          habitos.map((h) => ({
            usuario_id: usuarioId,
            nombre: h.nombre,
            emoji: h.emoji,
            momento: h.momento,
            xp_valor: h.xp_valor,
          }))
        )
        if (error) throw error
      }

      const deportesSeleccionados = DEPORTES.filter((d) => deportes.includes(d.id))
      const ejerciciosSemilla = deportesSeleccionados.flatMap((d) => d.ejercicios)
      if (ejerciciosSemilla.length > 0) {
        const { error } = await supabase.from('ejercicios').insert(
          ejerciciosSemilla.map((e) => ({
            usuario_id: usuarioId,
            nombre: e.nombre,
            grupo_muscular: e.grupo_muscular,
          }))
        )
        if (error) throw error
      }

      if (metaTitulo.trim()) {
        const { error } = await supabase.from('metas').insert({
          usuario_id: usuarioId,
          titulo: metaTitulo.trim(),
          tipo: metaTipo,
          monto_objetivo: Number(metaMonto) || 0,
        })
        if (error) throw error
      }

      const { error: perfilError } = await supabase
        .from('perfiles')
        .update({
          nombre: nombre.trim() || perfil.nombre,
          deportes,
          enfoque_financiero: enfoques,
          presupuesto_mensual: presupuesto ? Number(presupuesto) : null,
          onboarding_completado: true,
        })
        .eq('id', usuarioId)
      if (perfilError) throw perfilError

      toast.success('Todo listo. A subir de nivel!')
      router.push('/dashboard')
      router.refresh()
    } catch (err) {
      const mensaje = err && typeof err === 'object' && 'message' in err ? String((err as { message: unknown }).message) : ''
      console.error('Error guardando onboarding:', err)
      toast.error(mensaje ? `No se pudo guardar: ${mensaje}` : 'Algo fallo guardando tus respuestas, intenta de nuevo')
      setEnviando(false)
    }
  }

  function siguiente() {
    if (paso === PASOS.length - 1) {
      finalizar()
      return
    }
    setPaso((p) => p + 1)
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center px-4 py-10">
      <div className="w-full max-w-lg">
        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3" style={{ background: 'var(--tl-blue-dim)' }}>
            <Zap size={22} style={{ color: 'var(--tl-blue)' }} />
          </div>
          <h1 className="text-lg font-semibold">Configuremos tu TrackLife</h1>
          <p className="text-xs text-muted mt-1">Unas preguntas rapidas para ajustar la app a ti</p>
        </div>

        <div className="flex items-center gap-1.5 mb-6">
          {PASOS.map((_, i) => (
            <div
              key={i}
              className="h-1.5 flex-1 rounded-full"
              style={{ background: i <= paso ? 'var(--tl-blue)' : 'var(--tl-surface-2)' }}
            />
          ))}
        </div>

        <div className="card p-6 min-h-[360px] flex flex-col">
          {paso === 0 && (
            <div className="flex-1 flex flex-col justify-center gap-4">
              <h2 className="text-base font-medium">Bienvenido a TrackLife 👋</h2>
              <p className="text-sm text-muted">
                Vamos a personalizar tus habitos, tu deporte, tus finanzas y tus metas para que la app se sienta hecha
                a tu medida. Toma menos de 2 minutos.
              </p>
              <div>
                <label className="block text-xs font-medium text-muted mb-1">Como te llamas?</label>
                <input className="input-tl" value={nombre} onChange={(e) => setNombre(e.target.value)} />
              </div>
            </div>
          )}

          {paso === 1 && (
            <div className="flex-1 flex flex-col gap-3">
              <div>
                <h2 className="text-base font-medium">Que habitos quieres tomar?</h2>
                <p className="text-xs text-muted mt-0.5">Elige los que quieras — puedes agregar mas despues.</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {HABITOS_SUGERIDOS.map((h) => {
                  const activo = habitos.some((x) => x.nombre === h.nombre)
                  return (
                    <button
                      key={h.nombre}
                      onClick={() => toggleHabito(h)}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg border text-left text-xs"
                      style={{
                        borderColor: activo ? 'var(--tl-blue)' : 'var(--tl-border)',
                        background: activo ? 'var(--tl-blue-dim)' : 'transparent',
                      }}
                    >
                      <span>{h.emoji}</span>
                      <span className="flex-1">{h.nombre}</span>
                      {activo && <Check size={13} style={{ color: 'var(--tl-blue)' }} />}
                    </button>
                  )
                })}
                {habitos
                  .filter((h) => !HABITOS_SUGERIDOS.some((s) => s.nombre === h.nombre))
                  .map((h) => (
                    <button
                      key={h.nombre}
                      onClick={() => toggleHabito(h)}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg border text-left text-xs"
                      style={{ borderColor: 'var(--tl-blue)', background: 'var(--tl-blue-dim)' }}
                    >
                      <span>{h.emoji}</span>
                      <span className="flex-1">{h.nombre}</span>
                      <Check size={13} style={{ color: 'var(--tl-blue)' }} />
                    </button>
                  ))}
              </div>
              <div className="flex gap-2 mt-1">
                <input
                  className="input-tl"
                  placeholder="Agregar otro habito..."
                  value={habitoCustom}
                  onChange={(e) => setHabitoCustom(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && agregarHabitoCustom()}
                />
                <button onClick={agregarHabitoCustom} className="btn-tl shrink-0">
                  <Plus size={14} />
                </button>
              </div>
            </div>
          )}

          {paso === 2 && (
            <div className="flex-1 flex flex-col gap-3">
              <div>
                <h2 className="text-base font-medium">Que deporte practicas?</h2>
                <p className="text-xs text-muted mt-0.5">
                  Ajustamos Entrenamiento con ejercicios y metricas segun lo que elijas.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {DEPORTES.map((d) => {
                  const activo = deportes.includes(d.id)
                  return (
                    <button
                      key={d.id}
                      onClick={() => toggleDeporte(d.id)}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg border text-left text-xs"
                      style={{
                        borderColor: activo ? 'var(--tl-blue)' : 'var(--tl-border)',
                        background: activo ? 'var(--tl-blue-dim)' : 'transparent',
                      }}
                    >
                      <span>{d.emoji}</span>
                      <span className="flex-1">{d.label}</span>
                      {activo && <Check size={13} style={{ color: 'var(--tl-blue)' }} />}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {paso === 3 && (
            <div className="flex-1 flex flex-col gap-4">
              <div>
                <h2 className="text-base font-medium">Que quieres controlar de tus finanzas?</h2>
                <p className="text-xs text-muted mt-0.5">Elige lo que aplique — puedes cambiarlo luego.</p>
              </div>
              <div className="flex flex-col gap-2">
                {ENFOQUES_FINANCIEROS.map((e) => {
                  const activo = enfoques.includes(e)
                  return (
                    <button
                      key={e}
                      onClick={() => toggleEnfoque(e)}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg border text-left text-xs"
                      style={{
                        borderColor: activo ? 'var(--tl-blue)' : 'var(--tl-border)',
                        background: activo ? 'var(--tl-blue-dim)' : 'transparent',
                      }}
                    >
                      <span className="flex-1">{e}</span>
                      {activo && <Check size={13} style={{ color: 'var(--tl-blue)' }} />}
                    </button>
                  )
                })}
              </div>
              <div>
                <label className="block text-xs font-medium text-muted mb-1">Presupuesto mensual (opcional)</label>
                <input
                  type="number"
                  className="input-tl"
                  value={presupuesto}
                  onChange={(e) => setPresupuesto(e.target.value)}
                  placeholder="Ej. 2000000"
                />
              </div>
            </div>
          )}

          {paso === 4 && (
            <div className="flex-1 flex flex-col gap-4">
              <div>
                <h2 className="text-base font-medium">Quieres registrar una primera meta?</h2>
                <p className="text-xs text-muted mt-0.5">Opcional — puedes dejarlo en blanco y crearla despues.</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted mb-1">Titulo</label>
                <input
                  className="input-tl"
                  value={metaTitulo}
                  onChange={(e) => setMetaTitulo(e.target.value)}
                  placeholder="Ej. Comprar un carro"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-muted mb-1">Tipo</label>
                  <select className="input-tl" value={metaTipo} onChange={(e) => setMetaTipo(e.target.value as TipoMeta)}>
                    <option value="personal">Personal</option>
                    <option value="financiera">Financiera</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted mb-1">Monto objetivo</label>
                  <input type="number" className="input-tl" value={metaMonto} onChange={(e) => setMetaMonto(e.target.value)} />
                </div>
              </div>
            </div>
          )}

          {paso === 5 && (
            <div className="flex-1 flex flex-col justify-center gap-4">
              <h2 className="text-base font-medium">Todo listo, {nombre.split(' ')[0]} 🎉</h2>
              <div className="text-sm text-muted space-y-1.5">
                <p>
                  Vamos a crear <strong className="text-foreground">{habitos.length}</strong> habitos
                  {deportes.length > 0 && (
                    <>
                      {' '}
                      y ejercicios para{' '}
                      <strong className="text-foreground">
                        {DEPORTES.filter((d) => deportes.includes(d.id))
                          .map((d) => d.label)
                          .join(', ') || 'ningun deporte'}
                      </strong>
                    </>
                  )}
                  .
                </p>
                {metaTitulo.trim() && (
                  <p>
                    Tu primera meta: <strong className="text-foreground">{metaTitulo}</strong>
                  </p>
                )}
              </div>
              <div className="card p-3" style={{ background: 'var(--tl-surface-2)' }}>
                <p className="text-xs font-medium mb-1">Conecta Strava cuando quieras</p>
                <p className="text-[11px] text-muted">
                  Desde Ajustes podras vincular tu cuenta de Strava para importar tus entrenamientos automaticamente.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-between mt-5">
          <button
            onClick={() => setPaso((p) => Math.max(0, p - 1))}
            disabled={paso === 0}
            className="btn-tl disabled:opacity-0"
          >
            <ArrowLeft size={14} /> Atras
          </button>
          <button onClick={siguiente} disabled={enviando} className="btn-tl-blue">
            {enviando ? (
              <Loader2 size={14} className="animate-spin" />
            ) : paso === PASOS.length - 1 ? (
              <Check size={14} />
            ) : (
              <ArrowRight size={14} />
            )}
            {paso === PASOS.length - 1 ? 'Empezar a jugar' : 'Siguiente'}
          </button>
        </div>
      </div>
    </div>
  )
}
