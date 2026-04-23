const TIKTOK_AUTH = 'https://www.tiktok.com/v2/auth/authorize/'
const TIKTOK_TOKEN = 'https://open.tiktokapis.com/v2/oauth/token/'
const TIKTOK_USER = 'https://open.tiktokapis.com/v2/user/info/'

const CALLBACK_URL = () =>
  `${process.env.NEXTAUTH_URL}/api/platforms/tiktok/callback`

export function getTikTokAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_key: process.env.TIKTOK_CLIENT_KEY!,
    redirect_uri: CALLBACK_URL(),
    response_type: 'code',
    scope: 'user.info.basic,video.upload,video.publish',
    state,
  })
  return `${TIKTOK_AUTH}?${params}`
}

export async function exchangeTikTokCode(code: string): Promise<{
  access_token: string
  refresh_token: string
  expires_in: number
  refresh_expires_in: number
  open_id: string
}> {
  const res = await fetch(TIKTOK_TOKEN, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_key: process.env.TIKTOK_CLIENT_KEY!,
      client_secret: process.env.TIKTOK_CLIENT_SECRET!,
      code,
      grant_type: 'authorization_code',
      redirect_uri: CALLBACK_URL(),
    }),
  })
  if (!res.ok) throw new Error(`TikTok token exchange failed: ${await res.text()}`)
  const body = (await res.json()) as {
    data: {
      access_token: string
      refresh_token: string
      expires_in: number
      refresh_expires_in: number
      open_id: string
    }
    error: { code: string }
  }
  if (body.error?.code && body.error.code !== 'ok') {
    throw new Error(`TikTok error: ${JSON.stringify(body.error)}`)
  }
  return body.data
}

export async function refreshTikTokToken(refreshToken: string): Promise<{
  access_token: string
  refresh_token: string
  expires_in: number
  refresh_expires_in: number
}> {
  const res = await fetch(TIKTOK_TOKEN, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_key: process.env.TIKTOK_CLIENT_KEY!,
      client_secret: process.env.TIKTOK_CLIENT_SECRET!,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  })
  if (!res.ok) throw new Error(`TikTok token refresh failed: ${await res.text()}`)
  const body = (await res.json()) as { data: unknown }
  return body.data as {
    access_token: string
    refresh_token: string
    expires_in: number
    refresh_expires_in: number
  }
}

export async function getTikTokUser(
  accessToken: string
): Promise<{ open_id: string; display_name: string; avatar_url: string }> {
  const res = await fetch(`${TIKTOK_USER}?fields=open_id,display_name,avatar_url`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) throw new Error(`TikTok user fetch failed: ${await res.text()}`)
  const body = (await res.json()) as { data: { user: unknown } }
  return body.data.user as { open_id: string; display_name: string; avatar_url: string }
}
