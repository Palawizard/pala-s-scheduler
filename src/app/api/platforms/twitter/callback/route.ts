import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { getStateCookie, getPKCEVerifierCookie } from '@/lib/platforms/oauth-helpers'
import { exchangeTwitterCode, getTwitterUser } from '@/lib/platforms/twitter'

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  const { searchParams } = request.nextUrl
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  if (error) {
    return NextResponse.redirect(new URL('/settings/platforms?error=access_denied', request.url))
  }

  const storedState = getStateCookie(request)
  if (!state || !storedState || state !== storedState) {
    return NextResponse.redirect(new URL('/settings/platforms?error=invalid_state', request.url))
  }

  const codeVerifier = getPKCEVerifierCookie(request)
  if (!codeVerifier) {
    return NextResponse.redirect(new URL('/settings/platforms?error=missing_verifier', request.url))
  }

  if (!code) {
    return NextResponse.redirect(new URL('/settings/platforms?error=missing_code', request.url))
  }

  try {
    const tokens = await exchangeTwitterCode(code, codeVerifier)
    const user = await getTwitterUser(tokens.access_token)

    const tokenExpiry = new Date(Date.now() + tokens.expires_in * 1000)

    await db.connectedPlatform.upsert({
      where: { userId_platform: { userId: session.user.id, platform: 'TWITTER' } },
      update: {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token ?? null,
        tokenExpiry,
        platformUserId: user.id,
        platformUsername: user.username,
        platformAvatar: user.profile_image_url ?? null,
        isActive: true,
      },
      create: {
        userId: session.user.id,
        platform: 'TWITTER',
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token ?? null,
        tokenExpiry,
        platformUserId: user.id,
        platformUsername: user.username,
        platformAvatar: user.profile_image_url ?? null,
      },
    })

    const response = NextResponse.redirect(new URL('/settings/platforms?success=twitter', request.url))
    response.cookies.delete('oauth_state')
    response.cookies.delete('pkce_verifier')
    return response
  } catch {
    return NextResponse.redirect(new URL('/settings/platforms?error=token_exchange', request.url))
  }
}
