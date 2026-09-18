'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Bot, X, Send, Loader2, Check, Mic } from 'lucide-react'
import toast from 'react-hot-toast'
import { useReconocimientoVoz } from '@/lib/useReconocimientoVoz'

interface MensajeChat {
  rol: 'user' | 'assistant'
  texto: string
  acciones?: string[]
}

export default function AsistenteFlotante() {
  const router = useRouter()
  const [abierto, setAbierto] = useState(false)
  const [mensajes, setMensajes] = useState<MensajeChat[]>([])
  const [historial, setHistorial] = useState<unknown[]>([])
  const [input, setInput] = useState('')
  const [enviando, setEnviando] = useState(false)
  const finRef = useRef<HTMLDivElement>(null)
  const {
    escuchando,
    soportado: soportaVoz,
    transcripcionParcial,
    iniciar: iniciarVoz,
    detener: detenerVoz,
  } = useReconocimientoVoz((texto) => enviar(texto))

  useEffect(() => {
    finRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensajes, abierto])

  async function enviar(textoOverride?: string) {
    const texto = (textoOverride ?? input).trim()
    if (!texto || enviando) return
    setMensajes((prev) => [...prev, { rol: 'user', texto }])
    setInput('')
    setEnviando(true)
    try {
      const res = await fetch('/api/asistente', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mensaje: texto, historial }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error ?? 'No se pudo contactar al asistente')
        setMensajes((prev) => [...prev, { rol: 'assistant', texto: data.error ?? 'Algo salio mal, intenta de nuevo.' }])
        return
      }
      setHistorial(data.historial ?? [])
      setMensajes((prev) => [...prev, { rol: 'assistant', texto: data.respuesta, acciones: data.acciones }])
      if (data.xpGanado > 0) toast.success(`+${data.xpGanado} XP`)
      if (data.acciones?.length > 0) router.refresh()
    } catch {
      toast.error('No se pudo contactar al asistente')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setAbierto(true)}
        className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-40 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center text-white transition-transform hover:scale-105"
        style={{ background: 'var(--tl-blue)' }}
        title="Asistente TrackLife"
      >
        <Bot size={24} />
      </button>

      {abierto && (
        <div className="fixed inset-0 bg-black/70 z-[60] flex items-end sm:items-center justify-center">
          <div className="bg-surface border border-border sm:rounded-2xl shadow-2xl w-full sm:max-w-md h-[85vh] sm:h-[600px] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div className="flex items-center gap-2">
                <Bot size={16} style={{ color: 'var(--tl-blue)' }} />
                <h2 className="font-medium text-sm">Asistente TrackLife</h2>
              </div>
              <button onClick={() => setAbierto(false)} className="text-muted hover:text-foreground">
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {mensajes.length === 0 && (
                <div className="text-xs text-muted text-center py-8 space-y-2">
                  <p>Escribeme lo que quieras registrar, en tus palabras:</p>
                  <p className="italic">&quot;Gaste 85 en el restaurante&quot;</p>
                  <p className="italic">&quot;Hice press banca 80kg, 10 reps&quot;</p>
                  <p className="italic">&quot;Mañana llamar a Carlos&quot;</p>
                </div>
              )}
              {mensajes.map((m, i) => (
                <div key={i} className={m.rol === 'user' ? 'flex justify-end' : 'flex justify-start'}>
                  <div
                    className="max-w-[85%] rounded-2xl px-3 py-2 text-xs"
                    style={m.rol === 'user' ? { background: 'var(--tl-blue)', color: 'white' } : { background: 'var(--tl-surface-2)' }}
                  >
                    <p className="whitespace-pre-wrap">{m.texto}</p>
                    {m.acciones && m.acciones.length > 0 && (
                      <div className="mt-1.5 pt-1.5 border-t border-white/10 space-y-0.5">
                        {m.acciones.map((a, j) => (
                          <p key={j} className="flex items-center gap-1 text-[11px]" style={{ color: 'var(--tl-green)' }}>
                            <Check size={11} /> {a}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {enviando && (
                <div className="flex justify-start">
                  <div className="rounded-2xl px-3 py-2" style={{ background: 'var(--tl-surface-2)' }}>
                    <Loader2 size={14} className="animate-spin text-muted" />
                  </div>
                </div>
              )}
              <div ref={finRef} />
            </div>

            {escuchando && (
              <div className="px-3 pt-2">
                <div
                  className="flex items-center gap-1.5 text-[11px] rounded-lg px-2.5 py-1.5"
                  style={{ background: 'rgba(239,68,68,0.12)', color: 'var(--tl-red)' }}
                >
                  <span className="w-1.5 h-1.5 rounded-full animate-pulse shrink-0" style={{ background: 'var(--tl-red)' }} />
                  {transcripcionParcial || 'Escuchando...'}
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 p-3 border-t border-border">
              {soportaVoz && (
                <button
                  onClick={() => (escuchando ? detenerVoz() : iniciarVoz())}
                  disabled={enviando}
                  className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-colors"
                  style={
                    escuchando
                      ? { background: 'var(--tl-red)', color: 'white' }
                      : { background: 'var(--tl-surface-2)', color: 'var(--tl-muted)' }
                  }
                  title={escuchando ? 'Detener' : 'Registrar por voz'}
                >
                  <Mic size={16} className={escuchando ? 'animate-pulse' : undefined} />
                </button>
              )}
              <input
                className="input-tl text-xs flex-1"
                placeholder={escuchando ? 'Escuchando...' : 'Escribe algo...'}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && enviar()}
                disabled={enviando || escuchando}
              />
              <button onClick={() => enviar()} disabled={enviando || !input.trim()} className="btn-tl-blue px-3 py-2">
                <Send size={15} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
