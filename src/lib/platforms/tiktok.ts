const TIKTOK_AUTH = 'https://www.tiktok.com/v2/auth/authorize/'
const TIKTOK_TOKEN = 'https://open.tiktokapis.com/v2/oauth/token/'
const TIKTOK_USER = 'https://open.tiktokapis.com/v2/user/info/'

const CALLBACK_URL = () =>
  `${process.env.NEXTAUTH_URL}/api/platforms/tiktok/callback`

type TikTokTokenResponse = {
  access_token: string
  refresh_token: string
  expires_in: number
  refresh_expires_in: number
  open_id: string
}

export function getTikTokAuthUrl(state: string, codeChallenge: string): string {
  const params = new URLSearchParams({
    client_key: process.env.TIKTOK_CLIENT_KEY!,
    redirect_uri: CALLBACK_URL(),
    response_type: 'code',
    scope: 'user.info.basic,video.upload,video.publish',
    state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  })
  return `${TIKTOK_AUTH}?${params}`
}

export async function exchangeTikTokCode(code: string, codeVerifier: string): Promise<TikTokTokenResponse> {
  const res = await fetch(TIKTOK_TOKEN, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_key: process.env.TIKTOK_CLIENT_KEY!,
      client_secret: process.env.TIKTOK_CLIENT_SECRET!,
      code,
      grant_type: 'authorization_code',
      redirect_uri: CALLBACK_URL(),
      code_verifier: codeVerifier,
    }),
  })
  if (!res.ok) throw new Error(`TikTok token exchange failed: ${await res.text()}`)
  const body = (await res.json()) as Partial<TikTokTokenResponse> & {
    data?: Partial<TikTokTokenResponse>
    error?: { code?: string; message?: string; log_id?: string }
  }
  if (body.error?.code && body.error.code !== 'ok') {
    throw new Error(`TikTok error: ${JSON.stringify(body.error)}`)
  }

  const tokens = body.data?.access_token ? body.data : body
  if (
    !tokens.access_token ||
    !tokens.refresh_token ||
    typeof tokens.expires_in !== 'number' ||
    typeof tokens.refresh_expires_in !== 'number' ||
    !tokens.open_id
  ) {
    throw new Error(`TikTok token response missing fields: ${Object.keys(body).join(', ')}`)
  }

  return {
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expires_in: tokens.expires_in,
    refresh_expires_in: tokens.refresh_expires_in,
    open_id: tokens.open_id,
  }
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
  const body = (await res.json()) as Partial<TikTokTokenResponse> & {
    data?: Partial<TikTokTokenResponse>
  }
  const tokens = body.data?.access_token ? body.data : body
  if (
    !tokens.access_token ||
    !tokens.refresh_token ||
    typeof tokens.expires_in !== 'number' ||
    typeof tokens.refresh_expires_in !== 'number'
  ) {
    throw new Error(`TikTok refresh response missing fields: ${Object.keys(body).join(', ')}`)
  }
  return {
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expires_in: tokens.expires_in,
    refresh_expires_in: tokens.refresh_expires_in,
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
