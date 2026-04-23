import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { getAppUrl, getPKCEVerifierCookie, getStateCookie } from '@/lib/platforms/oauth-helpers'
import { exchangeTikTokCode, getTikTokUser } from '@/lib/platforms/tiktok'

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.redirect(getAppUrl('/login'))
  }

  const { searchParams } = request.nextUrl
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  if (error) {
    return NextResponse.redirect(getAppUrl('/settings/platforms?error=access_denied'))
  }

  const storedState = getStateCookie(request)
  if (!state || !storedState || state !== storedState) {
    return NextResponse.redirect(getAppUrl('/settings/platforms?error=invalid_state'))
  }

  if (!code) {
    return NextResponse.redirect(getAppUrl('/settings/platforms?error=missing_code'))
  }

  const codeVerifier = getPKCEVerifierCookie(request)
  if (!codeVerifier) {
    return NextResponse.redirect(getAppUrl('/settings/platforms?error=missing_verifier'))
  }

  try {
    const tokens = await exchangeTikTokCode(code, codeVerifier)
    const user = await getTikTokUser(tokens.access_token)

    const tokenExpiry = new Date(Date.now() + tokens.expires_in * 1000)

    await db.connectedPlatform.upsert({
      where: { userId_platform: { userId: session.user.id, platform: 'TIKTOK' } },
      update: {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        tokenExpiry,
        platformUserId: user.open_id,
        platformUsername: user.display_name,
        platformAvatar: user.avatar_url,
        isActive: true,
      },
      create: {
        userId: session.user.id,
        platform: 'TIKTOK',
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        tokenExpiry,
        platformUserId: user.open_id,
        platformUsername: user.display_name,
        platformAvatar: user.avatar_url,
      },
    })

    const response = NextResponse.redirect(getAppUrl('/settings/platforms?success=tiktok'))
    response.cookies.delete('oauth_state')
    response.cookies.delete('pkce_verifier')
    return response
  } catch (err) {
    console.error('[tiktok] oauth callback failed:', err)
    return NextResponse.redirect(getAppUrl('/settings/platforms?error=token_exchange'))
  }
}
