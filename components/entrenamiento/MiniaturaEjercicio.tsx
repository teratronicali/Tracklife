import { Dumbbell, HeartPulse } from 'lucide-react'
import { urlMiniaturaYoutube } from '@/lib/video'
import type { Ejercicio } from '@/lib/types'

// Miniatura del ejercicio para guiarse de como se hace de un vistazo: si el
// ejercicio tiene un link de tecnica de YouTube, usa la miniatura real del
// video; si no, un icono generico segun el grupo muscular como referencia
// minima (nunca se deja el espacio vacio).
export default function MiniaturaEjercicio({ ejercicio, size = 44 }: { ejercicio: Ejercicio; size?: number }) {
  const miniatura = ejercicio.video_url ? urlMiniaturaYoutube(ejercicio.video_url) : null
  const Icono = ejercicio.grupo_muscular === 'cardio' ? HeartPulse : Dumbbell

  if (miniatura) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={miniatura}
        alt={ejercicio.nombre}
        className="rounded-lg object-cover shrink-0"
        style={{ width: size, height: size }}
      />
    )
  }

  return (
    <div
      className="rounded-lg flex items-center justify-center shrink-0"
      style={{ width: size, height: size, background: 'var(--tl-surface-2)' }}
    >
      <Icono size={size * 0.45} style={{ color: 'var(--tl-muted)' }} />
    </div>
  )
}
