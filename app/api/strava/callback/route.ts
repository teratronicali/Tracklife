import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = createServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(new URL('/login', request.url))

  const code = request.nextUrl.searchParams.get('code')
  const oauthError = request.nextUrl.searchParams.get('error')
  if (oauthError || !code) {
    return NextResponse.redirect(new URL('/ajustes?strava=error', request.url))
  }

  const clientId = process.env.STRAVA_CLIENT_ID
  const clientSecret = process.env.STRAVA_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    return NextResponse.redirect(new URL('/ajustes?strava=no_configurado', request.url))
  }

  const tokenRes = await fetch('https://www.strava.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code, grant_type: 'authorization_code' }),
  })

  if (!tokenRes.ok) {
    return NextResponse.redirect(new URL('/ajustes?strava=error', request.url))
  }

  const data = await tokenRes.json()

  const { error: dbError } = await supabase.from('integraciones_strava').upsert({
    usuario_id: user.id,
    athlete_id: data.athlete?.id,
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expira_en: new Date(data.expires_at * 1000).toISOString(),
    scope: request.nextUrl.searchParams.get('scope'),
  })

  if (dbError) {
    return NextResponse.redirect(new URL('/ajustes?strava=error', request.url))
  }

  return NextResponse.redirect(new URL('/ajustes?strava=conectado', request.url))
}
