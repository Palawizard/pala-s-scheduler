const INSTAGRAM_GRAPH = 'https://graph.instagram.com'
const INSTAGRAM_OAUTH = 'https://www.instagram.com/oauth/authorize'
const INSTAGRAM_TOKEN = 'https://api.instagram.com/oauth/access_token'

const CALLBACK_URL = () =>
  `${process.env.NEXTAUTH_URL}/api/platforms/instagram/callback`

export function getInstagramAuthUrl(state: string): string {
  const params = new URLSearchParams({
    enable_fb_login: '0',
    force_authentication: '1',
    client_id: process.env.META_APP_ID!,
    redirect_uri: CALLBACK_URL(),
    response_type: 'code',
    scope: 'instagram_business_basic,instagram_business_content_publish',
    state,
  })
  return `${INSTAGRAM_OAUTH}?${params}`
}

export async function exchangeInstagramCode(code: string): Promise<{
  access_token: string
  user_id: number
  permissions: string[]
}> {
  const res = await fetch(INSTAGRAM_TOKEN, {
    method: 'POST',
    body: new URLSearchParams({
      client_id: process.env.META_APP_ID!,
      client_secret: process.env.META_APP_SECRET!,
      grant_type: 'authorization_code',
      redirect_uri: CALLBACK_URL(),
      code,
    }),
  })
  if (!res.ok) throw new Error(`Instagram token exchange failed: ${await res.text()}`)
  return res.json() as Promise<{ access_token: string; user_id: number; permissions: string[] }>
}

export async function getLongLivedInstagramToken(shortToken: string): Promise<{
  access_token: string
  expires_in: number
}> {
  const res = await fetch(
    `${INSTAGRAM_GRAPH}/access_token?${new URLSearchParams({
      grant_type: 'ig_exchange_token',
      client_secret: process.env.META_APP_SECRET!,
      access_token: shortToken,
    })}`
  )
  if (!res.ok) throw new Error(`Instagram long-lived token failed: ${await res.text()}`)
  return res.json() as Promise<{ access_token: string; expires_in: number }>
}

export async function refreshInstagramToken(token: string): Promise<{
  access_token: string
  expires_in: number
}> {
  const res = await fetch(
    `${INSTAGRAM_GRAPH}/refresh_access_token?${new URLSearchParams({
      grant_type: 'ig_refresh_token',
      access_token: token,
    })}`
  )
  if (!res.ok) throw new Error(`Instagram token refresh failed: ${await res.text()}`)
  return res.json() as Promise<{ access_token: string; expires_in: number }>
}

export async function getInstagramUser(
  token: string
): Promise<{ id: string; username: string; name?: string; profile_picture_url?: string }> {
  const res = await fetch(
    `${INSTAGRAM_GRAPH}/me?${new URLSearchParams({
      fields: 'id,username,name,profile_picture_url',
      access_token: token,
    })}`
  )
  if (!res.ok) throw new Error(`Instagram user fetch failed: ${await res.text()}`)
  return res.json() as Promise<{
    id: string
    username: string
    name?: string
    profile_picture_url?: string
  }>
}
