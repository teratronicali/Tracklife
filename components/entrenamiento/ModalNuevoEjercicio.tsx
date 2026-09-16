'use client'

import { useState } from 'react'
import { X, Check, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'
import { GRUPOS_MUSCULARES, type Ejercicio } from '@/lib/types'

// Modal reutilizable para crear un ejercicio nuevo (nombre libre, cualquier
// grupo muscular, link de tecnica opcional) desde cualquier punto de la app:
// el registro rapido, el armador de rutinas o el picador de "cambiar
// ejercicio" dentro de una sesion activa.
export default function ModalNuevoEjercicio({
  usuarioId,
  onCerrar,
  onCreado,
}: {
  usuarioId: string
  onCerrar: () => void
  onCreado: (ejercicio: Ejercicio) => void
}) {
  const supabase = createClient()
  const [nombre, setNombre] = useState('')
  const [grupo, setGrupo] = useState<Ejercicio['grupo_muscular']>('general')
  const [videoUrl, setVideoUrl] = useState('')
  const [guardando, setGuardando] = useState(false)

  async function crear() {
    if (!nombre.trim()) {
      toast.error('Ponle un nombre al ejercicio')
      return
    }
    setGuardando(true)
    const { data, error } = await supabase
      .from('ejercicios')
      .insert({ usuario_id: usuarioId, nombre: nombre.trim(), grupo_muscular: grupo, video_url: videoUrl.trim() || null })
      .select()
      .single()
    if (error || !data) {
      toast.error('No se pudo crear el ejercicio')
      setGuardando(false)
      return
    }
    toast.success('Ejercicio creado')
    onCreado(data as Ejercicio)
    setGuardando(false)
  }

  return (
    <div className="fixed inset-0 bg-black/70 z-[95] flex items-center justify-center p-4">
      <div className="bg-surface border border-border rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="font-medium text-sm">Nuevo ejercicio</h2>
          <button onClick={onCerrar} className="text-muted hover:text-foreground">
            <X size={18} />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-muted mb-1">Nombre</label>
            <input
              className="input-tl"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Cualquier ejercicio — sin limite"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted mb-1">Grupo muscular</label>
            <select className="input-tl capitalize" value={grupo} onChange={(e) => setGrupo(e.target.value as Ejercicio['grupo_muscular'])}>
              {GRUPOS_MUSCULARES.map((g) => (
                <option key={g} value={g} className="capitalize">
                  {g}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted mb-1">Link de tecnica (opcional)</label>
            <input className="input-tl" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="Ej. link de YouTube" />
          </div>
        </div>
        <div className="flex justify-end gap-2 px-5 py-4 border-t border-border">
          <button onClick={onCerrar} className="btn-tl">
            Cancelar
          </button>
          <button onClick={crear} disabled={guardando} className="btn-tl-blue">
            {guardando ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
            Crear
          </button>
        </div>
      </div>
    </div>
  )
}
