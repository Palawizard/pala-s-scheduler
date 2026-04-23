import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { getAppUrl, getStateCookie } from '@/lib/platforms/oauth-helpers'
import {
  exchangeInstagramCode,
  getLongLivedInstagramToken,
  getInstagramUser,
} from '@/lib/platforms/instagram'

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

  if (!code) {
    return NextResponse.redirect(getAppUrl('/settings/platforms?error=missing_code'))
  }

  try {
    const { access_token: shortToken } = await exchangeInstagramCode(code)
    const { access_token, expires_in } = await getLongLivedInstagramToken(shortToken)
    const platformUser = await getInstagramUser(access_token)

    const tokenExpiry = new Date(Date.now() + expires_in * 1000)

    await db.connectedPlatform.upsert({
      where: { userId_platform: { userId: currentUser.id, platform: 'INSTAGRAM' } },
      update: {
        accessToken: access_token,
        refreshToken: null,
        tokenExpiry,
        platformUserId: platformUser.id,
        platformUsername: platformUser.username,
        platformAvatar: platformUser.profile_picture_url ?? null,
        isActive: true,
      },
      create: {
        userId: currentUser.id,
        platform: 'INSTAGRAM',
        accessToken: access_token,
        refreshToken: null,
        tokenExpiry,
        platformUserId: platformUser.id,
        platformUsername: platformUser.username,
        platformAvatar: platformUser.profile_picture_url ?? null,
      },
    })

    const response = NextResponse.redirect(getAppUrl('/settings/platforms?success=instagram'))
    response.cookies.delete('oauth_state')
    return response
  } catch (err) {
    console.error('[instagram] oauth callback failed:', err)
    return NextResponse.redirect(getAppUrl('/settings/platforms?error=token_exchange'))
  }
}
