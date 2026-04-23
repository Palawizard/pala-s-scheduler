const TWITTER_AUTH = 'https://twitter.com/i/oauth2/authorize'
const TWITTER_TOKEN = 'https://api.twitter.com/2/oauth2/token'
const TWITTER_USER = 'https://api.twitter.com/2/users/me'

const CALLBACK_URL = () =>
  `${process.env.NEXTAUTH_URL}/api/platforms/twitter/callback`

const SCOPES = 'tweet.read tweet.write users.read offline.access'

export function getTwitterAuthUrl(state: string, codeChallenge: string): string {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: process.env.TWITTER_CLIENT_ID!,
    redirect_uri: CALLBACK_URL(),
    scope: SCOPES,
    state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  })
  return `${TWITTER_AUTH}?${params}`
}

function basicAuth(): string {
  return Buffer.from(
    `${process.env.TWITTER_CLIENT_ID}:${process.env.TWITTER_CLIENT_SECRET}`
  ).toString('base64')
}

export async function exchangeTwitterCode(
  code: string,
  codeVerifier: string
): Promise<{
  access_token: string
  refresh_token?: string
  expires_in: number
}> {
  const res = await fetch(TWITTER_TOKEN, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${basicAuth()}`,
    },
    body: new URLSearchParams({
      code,
      grant_type: 'authorization_code',
      redirect_uri: CALLBACK_URL(),
      code_verifier: codeVerifier,
    }),
  })
  if (!res.ok) throw new Error(`Twitter token exchange failed: ${await res.text()}`)
  return res.json() as Promise<{
    access_token: string
    refresh_token?: string
    expires_in: number
  }>
}

export async function refreshTwitterToken(refreshToken: string): Promise<{
  access_token: string
  refresh_token?: string
  expires_in: number
}> {
  const res = await fetch(TWITTER_TOKEN, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${basicAuth()}`,
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  })
  if (!res.ok) throw new Error(`Twitter token refresh failed: ${await res.text()}`)
  return res.json() as Promise<{
    access_token: string
    refresh_token?: string
    expires_in: number
  }>
}

export async function getTwitterUser(
  accessToken: string
): Promise<{ id: string; name: string; username: string; profile_image_url?: string }> {
  const res = await fetch(
    `${TWITTER_USER}?user.fields=profile_image_url`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  )
  if (!res.ok) throw new Error(`Twitter user fetch failed: ${await res.text()}`)
  const body = (await res.json()) as {
    data: { id: string; name: string; username: string; profile_image_url?: string }
  }
  return body.data
}
