'use client'

import { useState } from 'react'
import { Flame, Shuffle } from 'lucide-react'
import { FRASES_MOTIVACION } from '@/lib/frases-motivacion'

function indiceDelDia() {
  const dia = Math.floor(Date.now() / 86400000)
  return dia % FRASES_MOTIVACION.length
}

export default function FraseMotivacional() {
  const [indice, setIndice] = useState(indiceDelDia)
  const [key, setKey] = useState(0)
  const frase = FRASES_MOTIVACION[indice]

  function otraFrase() {
    setIndice((prev) => {
      if (FRASES_MOTIVACION.length <= 1) return prev
      let siguiente = Math.floor(Math.random() * FRASES_MOTIVACION.length)
      if (siguiente === prev) siguiente = (siguiente + 1) % FRASES_MOTIVACION.length
      return siguiente
    })
    setKey((k) => k + 1)
  }

  return (
    <div
      className="rounded-xl px-4 py-3 flex items-center gap-3 border"
      style={{ borderColor: 'var(--tl-blue)', background: 'linear-gradient(90deg, var(--tl-blue-dim), transparent 85%)' }}
    >
      <Flame size={18} className="shrink-0" style={{ color: 'var(--tl-blue)' }} />
      <div key={key} className="flex-1 min-w-0 animate-fade-in">
        <p className="text-sm font-medium leading-snug">&quot;{frase.texto}&quot;</p>
        {frase.autor && <p className="text-[11px] text-muted mt-0.5">— {frase.autor}</p>}
      </div>
      <button onClick={otraFrase} className="text-muted hover:text-foreground shrink-0 transition-colors" title="Otra frase">
        <Shuffle size={15} />
      </button>
    </div>
  )
}
