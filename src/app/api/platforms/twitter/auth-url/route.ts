import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { generateState, generatePKCE } from '@/lib/platforms/oauth-helpers'
import { getTwitterAuthUrl } from '@/lib/platforms/twitter'

export async function GET() {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
  }

  if (!process.env.TWITTER_CLIENT_ID || !process.env.TWITTER_CLIENT_SECRET) {
    return NextResponse.json({ error: 'Configuration X manquante' }, { status: 400 })
  }

  const state = generateState()
  const { verifier, challenge } = generatePKCE()
  const url = getTwitterAuthUrl(state, challenge)

  const response = NextResponse.json({ data: { url } })
  response.cookies.set('oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600,
    path: '/',
  })
  response.cookies.set('pkce_verifier', verifier, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600,
    path: '/',
  })
  return response
}
