import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { generateState, generateTikTokPKCE } from '@/lib/platforms/oauth-helpers'
import { getTikTokAuthUrl } from '@/lib/platforms/tiktok'

export async function GET() {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  if (!process.env.TIKTOK_CLIENT_KEY || !process.env.TIKTOK_CLIENT_SECRET) {
    return NextResponse.json({ error: 'Configuration TikTok manquante' }, { status: 400 })
  }

  const state = generateState()
  const { verifier, challenge } = generateTikTokPKCE()
  const url = getTikTokAuthUrl(state, challenge)

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
