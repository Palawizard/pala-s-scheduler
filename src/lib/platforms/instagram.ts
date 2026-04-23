const META_GRAPH = 'https://graph.facebook.com/v19.0'
const META_OAUTH = 'https://www.facebook.com/v19.0/dialog/oauth'
const META_TOKEN = `${META_GRAPH}/oauth/access_token`

const CALLBACK_URL = () =>
  `${process.env.NEXTAUTH_URL}/api/platforms/instagram/callback`

export function getInstagramAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.META_APP_ID!,
    redirect_uri: CALLBACK_URL(),
    scope: 'instagram_content_publish,instagram_manage_insights,pages_show_list',
    response_type: 'code',
    state,
  })
  return `${META_OAUTH}?${params}`
}

export async function exchangeInstagramCode(code: string): Promise<{
  access_token: string
  token_type: string
}> {
  const res = await fetch(
    `${META_TOKEN}?${new URLSearchParams({
      client_id: process.env.META_APP_ID!,
      client_secret: process.env.META_APP_SECRET!,
      redirect_uri: CALLBACK_URL(),
      code,
    })}`
  )
  if (!res.ok) throw new Error(`Instagram token exchange failed: ${await res.text()}`)
  return res.json() as Promise<{ access_token: string; token_type: string }>
}

export async function getLongLivedInstagramToken(shortToken: string): Promise<{
  access_token: string
  expires_in: number
}> {
  const res = await fetch(
    `${META_GRAPH}/oauth/access_token?${new URLSearchParams({
      grant_type: 'fb_exchange_token',
      client_id: process.env.META_APP_ID!,
      client_secret: process.env.META_APP_SECRET!,
      fb_exchange_token: shortToken,
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
    `${META_GRAPH}/refresh_access_token?${new URLSearchParams({
      grant_type: 'ig_refresh_token',
      access_token: token,
    })}`
  )
  if (!res.ok) throw new Error(`Instagram token refresh failed: ${await res.text()}`)
  return res.json() as Promise<{ access_token: string; expires_in: number }>
}

export async function getInstagramUser(
  token: string
): Promise<{ id: string; name: string; picture?: { data: { url: string } } }> {
  const res = await fetch(
    `${META_GRAPH}/me?fields=id,name,picture&access_token=${token}`
  )
  if (!res.ok) throw new Error(`Instagram user fetch failed: ${await res.text()}`)
  return res.json() as Promise<{
    id: string
    name: string
    picture?: { data: { url: string } }
  }>
}
