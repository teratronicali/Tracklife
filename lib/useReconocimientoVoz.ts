'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

// Wrapper minimo sobre la Web Speech API del navegador (nativa, sin costo ni
// backend) para transcribir voz en vivo. No esta en los tipos DOM estandar
// de TypeScript, asi que se declara aqui solo lo que se usa.
interface ResultadoVoz {
  isFinal: boolean
  0: { transcript: string }
}
interface EventoResultadoVoz {
  resultIndex: number
  results: { length: number; [i: number]: ResultadoVoz }
}
interface ReconocedorVoz {
  lang: string
  continuous: boolean
  interimResults: boolean
  onresult: ((event: EventoResultadoVoz) => void) | null
  onend: (() => void) | null
  onerror: ((event: { error: string }) => void) | null
  start: () => void
  stop: () => void
}
type ConstructorReconocedor = new () => ReconocedorVoz
interface VentanaConVoz extends Window {
  SpeechRecognition?: ConstructorReconocedor
  webkitSpeechRecognition?: ConstructorReconocedor
}

export function useReconocimientoVoz(onTranscripcionFinal: (texto: string) => void) {
  const [escuchando, setEscuchando] = useState(false)
  const [soportado, setSoportado] = useState(false)
  const [transcripcionParcial, setTranscripcionParcial] = useState('')
  const recognitionRef = useRef<ReconocedorVoz | null>(null)
  const callbackRef = useRef(onTranscripcionFinal)
  callbackRef.current = onTranscripcionFinal

  useEffect(() => {
    const w = window as VentanaConVoz
    setSoportado(Boolean(w.SpeechRecognition ?? w.webkitSpeechRecognition))
  }, [])

  const iniciar = useCallback(() => {
    const w = window as VentanaConVoz
    const Constructor = w.SpeechRecognition ?? w.webkitSpeechRecognition
    if (!Constructor) return

    const recognition = new Constructor()
    recognition.lang = 'es-CO'
    recognition.continuous = false
    recognition.interimResults = true

    recognition.onresult = (event) => {
      let final = ''
      let parcial = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const resultado = event.results[i]
        if (resultado.isFinal) final += resultado[0].transcript
        else parcial += resultado[0].transcript
      }
      setTranscripcionParcial(final || parcial)
      if (final.trim()) callbackRef.current(final.trim())
    }
    recognition.onerror = () => setEscuchando(false)
    recognition.onend = () => setEscuchando(false)

    recognitionRef.current = recognition
    setTranscripcionParcial('')
    setEscuchando(true)
    recognition.start()
  }, [])

  const detener = useCallback(() => {
    recognitionRef.current?.stop()
  }, [])

  return { escuchando, soportado, transcripcionParcial, iniciar, detener }
}
