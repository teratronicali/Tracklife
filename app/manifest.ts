import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'TrackLife — Rastrea tu vida',
    short_name: 'TrackLife',
    description: 'Habitos, finanzas, entrenamiento, metas y tareas en un solo lugar. Gana XP, sube de nivel y compite en el ranking.',
    start_url: '/',
    display: 'standalone',
    background_color: '#161616',
    theme_color: '#161616',
    orientation: 'portrait',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
