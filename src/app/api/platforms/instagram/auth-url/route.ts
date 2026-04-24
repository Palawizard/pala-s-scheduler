import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { generateState } from '@/lib/platforms/oauth-helpers'
import { getInstagramAuthUrl } from '@/lib/platforms/instagram'

export async function GET() {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  if (!process.env.META_APP_ID || !process.env.META_APP_SECRET) {
    return NextResponse.json({ error: 'Configuration Instagram manquante' }, { status: 400 })
  }

  const state = generateState()
  const url = getInstagramAuthUrl(state)

  const response = NextResponse.json({ data: { url } })
  response.cookies.set('oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600,
    path: '/',
  })
  return response
}
