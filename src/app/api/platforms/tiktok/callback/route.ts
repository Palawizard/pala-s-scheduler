import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { getStateCookie } from '@/lib/platforms/oauth-helpers'
import { exchangeTikTokCode, getTikTokUser } from '@/lib/platforms/tiktok'

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
    const tokens = await exchangeTikTokCode(code)
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

    const response = NextResponse.redirect(new URL('/settings/platforms?success=tiktok', request.url))
    response.cookies.delete('oauth_state')
    return response
  } catch {
    return NextResponse.redirect(new URL('/settings/platforms?error=token_exchange', request.url))
  }
}
