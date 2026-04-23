import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { generateState, generatePKCE } from '@/lib/platforms/oauth-helpers'
import { getTwitterAuthUrl } from '@/lib/platforms/twitter'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
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
