import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = createServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(new URL('/login', request.url))

  const clientId = process.env.STRAVA_CLIENT_ID
  if (!clientId) {
    return NextResponse.redirect(new URL('/ajustes?strava=no_configurado', request.url))
  }

  const redirectUri = `${new URL(request.url).origin}/api/strava/callback`
  const authorizeUrl = new URL('https://www.strava.com/oauth/authorize')
  authorizeUrl.searchParams.set('client_id', clientId)
  authorizeUrl.searchParams.set('redirect_uri', redirectUri)
  authorizeUrl.searchParams.set('response_type', 'code')
  authorizeUrl.searchParams.set('approval_prompt', 'auto')
  authorizeUrl.searchParams.set('scope', 'activity:read_all')

  return NextResponse.redirect(authorizeUrl)
}
