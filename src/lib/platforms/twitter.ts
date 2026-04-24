import type { ConnectedPlatform } from '@prisma/client'

import { db } from '@/lib/db'
import type { PlatformPublisher, PublishMedia, PublishPayload, PublishResult } from '@/lib/platforms'

const TWITTER_AUTH = 'https://x.com/i/oauth2/authorize'
const TWITTER_TOKEN = 'https://api.x.com/2/oauth2/token'
const TWITTER_USER = 'https://api.x.com/2/users/me'
const TWITTER_TWEETS = 'https://api.x.com/2/tweets'
const TWITTER_MEDIA_INITIALIZE = 'https://api.x.com/2/media/upload/initialize'
const TWITTER_MEDIA_APPEND = (id: string) => `https://api.x.com/2/media/upload/${id}/append`
const TWITTER_MEDIA_FINALIZE = (id: string) => `https://api.x.com/2/media/upload/${id}/finalize`
const TWITTER_MEDIA_STATUS = (id: string) => `https://api.x.com/2/media/upload/${id}`

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

async function ensureTwitterToken(platform: ConnectedPlatform): Promise<ConnectedPlatform> {
  if (!platform.refreshToken) return platform

  const shouldRefresh = platform.tokenExpiry
    ? platform.tokenExpiry.getTime() < Date.now() + 5 * 60 * 1000
    : false
  if (!shouldRefresh) return platform

  const tokens = await refreshTwitterToken(platform.refreshToken)

  return db.connectedPlatform.update({
    where: { id: platform.id },
    data: {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token ?? platform.refreshToken,
      tokenExpiry: new Date(Date.now() + tokens.expires_in * 1000),
    },
  })
}

function getMediaCategory(media: PublishMedia): string {
  if (media.contentType.startsWith('video/')) return 'tweet_video'
  if (media.contentType === 'image/gif') return 'tweet_gif'
  return 'tweet_image'
}

async function uploadTwitterMedia(media: PublishMedia, accessToken: string): Promise<string> {
  const initResponse = await fetch(TWITTER_MEDIA_INITIALIZE, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      media_category: getMediaCategory(media),
      media_type: media.contentType,
      total_bytes: media.size,
    }),
  })

  if (!initResponse.ok) {
    throw new Error(`X media init failed: ${await initResponse.text()}`)
  }

  const initBody = (await initResponse.json()) as {
    data?: { id?: string; media_key?: string }
  }
  const mediaId = initBody.data?.id
  if (!mediaId) {
    throw new Error('X media init response missing ID')
  }

  const formData = new FormData()
  formData.append('segment_index', '0')
  formData.append('media', new Blob([new Uint8Array(media.buffer)], { type: media.contentType }))

  const appendResponse = await fetch(TWITTER_MEDIA_APPEND(mediaId), {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: formData,
  })

  if (!appendResponse.ok) {
    throw new Error(`X media append failed: ${await appendResponse.text()}`)
  }

  const finalizeResponse = await fetch(TWITTER_MEDIA_FINALIZE(mediaId), {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (!finalizeResponse.ok) {
    throw new Error(`X media finalize failed: ${await finalizeResponse.text()}`)
  }

  const finalizeBody = (await finalizeResponse.json()) as {
    data?: { processing_info?: { state?: string; check_after_secs?: number } }
  }
  const processingState = finalizeBody.data?.processing_info?.state

  if (processingState && processingState !== 'succeeded') {
    await waitForTwitterMedia(mediaId, accessToken, finalizeBody.data?.processing_info?.check_after_secs)
  }

  return mediaId
}

async function waitForTwitterMedia(
  mediaId: string,
  accessToken: string,
  initialDelaySeconds = 3
): Promise<void> {
  let delaySeconds = initialDelaySeconds

  for (let attempt = 0; attempt < 12; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, delaySeconds * 1000))

    const response = await fetch(TWITTER_MEDIA_STATUS(mediaId), {
      headers: { Authorization: `Bearer ${accessToken}` },
    })

    if (!response.ok) {
      throw new Error(`X media status failed: ${await response.text()}`)
    }

    const body = (await response.json()) as {
      data?: { processing_info?: { state?: string; check_after_secs?: number; error?: unknown } }
    }
    const processingInfo = body.data?.processing_info
    if (!processingInfo || processingInfo.state === 'succeeded') return
    if (processingInfo.state === 'failed') {
      throw new Error(`X media processing failed: ${JSON.stringify(processingInfo.error)}`)
    }

    delaySeconds = processingInfo.check_after_secs ?? 3
  }

  throw new Error('X prend trop de temps à préparer le média.')
}

function getTweetText(payload: PublishPayload): string {
  return (payload.caption || payload.title || 'Publication').slice(0, 280)
}

async function publishTwitter(
  payload: PublishPayload,
  platform: ConnectedPlatform
): Promise<PublishResult> {
  const refreshedPlatform = await ensureTwitterToken(platform)
  const mediaIds = await Promise.all(
    payload.media.slice(0, 4).map((media) => uploadTwitterMedia(media, refreshedPlatform.accessToken))
  )

  const body: { text: string; media?: { media_ids: string[] } } = {
    text: getTweetText(payload),
  }
  if (mediaIds.length > 0) {
    body.media = { media_ids: mediaIds }
  }

  const response = await fetch(TWITTER_TWEETS, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${refreshedPlatform.accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    throw new Error(`X publish failed: ${await response.text()}`)
  }

  const data = (await response.json()) as { data?: { id?: string } }
  if (!data.data?.id) {
    throw new Error('X publish response missing post ID')
  }

  return {
    platformPostId: data.data.id,
    url: `https://x.com/${refreshedPlatform.platformUsername ?? 'i'}/status/${data.data.id}`,
  }
}

export const twitterPublisher: PlatformPublisher = {
  publish: publishTwitter,
}
