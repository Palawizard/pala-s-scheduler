import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { generateState } from '@/lib/platforms/oauth-helpers'
import { getInstagramAuthUrl } from '@/lib/platforms/instagram'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
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
