import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { getAppUrl, getStateCookie, getPKCEVerifierCookie } from '@/lib/platforms/oauth-helpers'
import { exchangeTwitterCode, getTwitterUser } from '@/lib/platforms/twitter'

export async function GET(request: NextRequest) {
  const currentUser = await getCurrentUser()
  if (!currentUser) {
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

  const codeVerifier = getPKCEVerifierCookie(request)
  if (!codeVerifier) {
    return NextResponse.redirect(getAppUrl('/settings/platforms?error=missing_verifier'))
  }

  if (!code) {
    return NextResponse.redirect(getAppUrl('/settings/platforms?error=missing_code'))
  }

  try {
    const tokens = await exchangeTwitterCode(code, codeVerifier)
    const platformUser = await getTwitterUser(tokens.access_token)

    const tokenExpiry = new Date(Date.now() + tokens.expires_in * 1000)

    await db.connectedPlatform.upsert({
      where: { userId_platform: { userId: currentUser.id, platform: 'TWITTER' } },
      update: {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token ?? null,
        tokenExpiry,
        platformUserId: platformUser.id,
        platformUsername: platformUser.username,
        platformAvatar: platformUser.profile_image_url ?? null,
        isActive: true,
      },
      create: {
        userId: currentUser.id,
        platform: 'TWITTER',
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token ?? null,
        tokenExpiry,
        platformUserId: platformUser.id,
        platformUsername: platformUser.username,
        platformAvatar: platformUser.profile_image_url ?? null,
      },
    })

    const response = NextResponse.redirect(getAppUrl('/settings/platforms?success=twitter'))
    response.cookies.delete('oauth_state')
    response.cookies.delete('pkce_verifier')
    return response
  } catch (err) {
    console.error('[twitter] oauth callback failed:', err)
    return NextResponse.redirect(getAppUrl('/settings/platforms?error=token_exchange'))
  }
}
