// Helpers para links de YouTube: extraer el id sirve tanto para armar el
// iframe de "Ver tecnica" como para mostrar la miniatura del video sin tener
// que reproducirlo (YouTube expone las miniaturas en una URL publica y
// predecible, sin necesidad de llamar a ninguna API).
export function idYoutube(url: string): string | null {
  try {
    const u = new URL(url)
    if (u.hostname.includes('youtu.be')) return u.pathname.slice(1)
    if (u.hostname.includes('youtube.com')) {
      if (u.pathname.startsWith('/shorts/')) return u.pathname.split('/')[2] ?? null
      const v = u.searchParams.get('v')
      if (v) return v
    }
  } catch {
    return null
  }
  return null
}

export function urlEmbedYoutube(url: string): string | null {
  const id = idYoutube(url)
  return id ? `https://www.youtube.com/embed/${id}` : null
}

export function urlMiniaturaYoutube(url: string): string | null {
  const id = idYoutube(url)
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null
}
