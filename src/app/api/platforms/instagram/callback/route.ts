import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { getStateCookie } from '@/lib/platforms/oauth-helpers'
import {
  exchangeInstagramCode,
  getLongLivedInstagramToken,
  getInstagramUser,
} from '@/lib/platforms/instagram'

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

  if (!code) {
    return NextResponse.redirect(new URL('/settings/platforms?error=missing_code', request.url))
  }

  try {
    const { access_token: shortToken } = await exchangeInstagramCode(code)
    const { access_token, expires_in } = await getLongLivedInstagramToken(shortToken)
    const user = await getInstagramUser(access_token)

    const tokenExpiry = new Date(Date.now() + expires_in * 1000)

    await db.connectedPlatform.upsert({
      where: { userId_platform: { userId: session.user.id, platform: 'INSTAGRAM' } },
      update: {
        accessToken: access_token,
        refreshToken: null,
        tokenExpiry,
        platformUserId: user.id,
        platformUsername: user.name,
        platformAvatar: user.picture?.data?.url ?? null,
        isActive: true,
      },
      create: {
        userId: session.user.id,
        platform: 'INSTAGRAM',
        accessToken: access_token,
        refreshToken: null,
        tokenExpiry,
        platformUserId: user.id,
        platformUsername: user.name,
        platformAvatar: user.picture?.data?.url ?? null,
      },
    })

    const response = NextResponse.redirect(new URL('/settings/platforms?success=instagram', request.url))
    response.cookies.delete('oauth_state')
    return response
  } catch {
    return NextResponse.redirect(new URL('/settings/platforms?error=token_exchange', request.url))
  }
}
