// Service worker minimo para que TrackLife sea instalable (PWA) y cargue
// mas rapido. La app es dinamica y con datos de sesion (Supabase), asi que
// NO cacheamos paginas autenticadas de forma agresiva: siempre se pide la
// red primero para que los datos esten frescos, y solo si no hay conexion
// se usa el respaldo cacheado. Los assets estaticos (iconos, imagenes) si
// se sirven cache-first porque no cambian.

const CACHE_NAME = 'tracklife-v1'
const APP_SHELL = ['/offline', '/manifest.webmanifest', '/icons/icon-192.png', '/icons/icon-512.png']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .catch(() => {})
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  // Navegacion (cargar una pagina completa): red primero, y si falla por
  // estar sin conexion, cae a la pagina /offline que dejamos cacheada.
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).catch(() => caches.match('/offline')))
    return
  }

  // Imagenes/iconos: cache-first, se actualizan solas en segundo plano.
  if (request.destination === 'image') {
    event.respondWith(
      caches.match(request).then((cached) => {
        const fetchPromise = fetch(request)
          .then((response) => {
            const clone = response.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
            return response
          })
          .catch(() => cached)
        return cached || fetchPromise
      })
    )
  }
})
