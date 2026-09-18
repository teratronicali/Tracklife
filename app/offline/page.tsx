import { WifiOff } from 'lucide-react'
import { LogoMark, Wordmark } from '@/components/Logo'

export const metadata = {
  title: 'Sin conexion — TrackLife',
}

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm text-center">
        <div className="flex flex-col items-center mb-6">
          <LogoMark size={40} />
          <h1 className="text-lg font-semibold mt-2">
            <Wordmark />
          </h1>
        </div>
        <div className="card p-6">
          <WifiOff size={28} className="mx-auto mb-3 text-muted" />
          <p className="text-sm font-medium mb-1">Sin conexion</p>
          <p className="text-xs text-muted">
            No pudimos cargar esta pagina porque no tienes internet ahora mismo. Revisa tu conexion e intenta
            de nuevo — en cuanto vuelva la señal, todo sigue funcionando normal.
          </p>
        </div>
      </div>
    </div>
  )
}
