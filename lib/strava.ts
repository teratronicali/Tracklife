import { STRAVA_TIPO_MAP } from '@/lib/onboarding'
import type { IntegracionStrava } from '@/lib/types'

export async function obtenerAccessTokenValido(
  integracion: IntegracionStrava,
  actualizar: (nuevo: { access_token: string; refresh_token: string; expira_en: string }) => Promise<void>
): Promise<string> {
  const expiraEn = new Date(integracion.expira_en).getTime()
  if (expiraEn - Date.now() > 5 * 60 * 1000) {
    return integracion.access_token
  }

  const res = await fetch('https://www.strava.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      grant_type: 'refresh_token',
      refresh_token: integracion.refresh_token,
    }),
  })
  if (!res.ok) throw new Error('No se pudo renovar el token de Strava')

  const data = await res.json()
  await actualizar({
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expira_en: new Date(data.expires_at * 1000).toISOString(),
  })
  return data.access_token as string
}

export interface ActividadStrava {
  id: number
  name: string
  type: string
  distance: number
  moving_time: number
  start_date: string
}

export async function obtenerActividades(accessToken: string, despuesDeEpoch: number): Promise<ActividadStrava[]> {
  const res = await fetch(`https://www.strava.com/api/v3/athlete/activities?after=${despuesDeEpoch}&per_page=50`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) throw new Error('No se pudieron obtener las actividades de Strava')
  return res.json()
}

export function mapearTipoActividad(tipoStrava: string): string {
  return STRAVA_TIPO_MAP[tipoStrava] ?? 'otro'
}
