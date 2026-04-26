import type { ConnectedPlatform } from '@prisma/client'

import { db } from '@/lib/db'
import type { PlatformPublisher, PublishPayload, PublishResult } from '@/lib/platforms'
import { getFirstImageMedia, getFirstVideoMedia } from '@/lib/platforms/media'

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

async function ensureInstagramToken(platform: ConnectedPlatform): Promise<ConnectedPlatform> {
  const shouldRefresh = platform.tokenExpiry
    ? platform.tokenExpiry.getTime() < Date.now() + 7 * 24 * 60 * 60 * 1000
    : false
  if (!shouldRefresh) return platform

  const tokens = await refreshInstagramToken(platform.accessToken)

  return db.connectedPlatform.update({
    where: { id: platform.id },
    data: {
      accessToken: tokens.access_token,
      tokenExpiry: new Date(Date.now() + tokens.expires_in * 1000),
    },
  })
}

async function createInstagramContainer(
  payload: PublishPayload,
  platform: ConnectedPlatform
): Promise<{ id: string; isVideo: boolean }> {
  const image = getFirstImageMedia(payload.media)
  const video = getFirstVideoMedia(payload.media)
  const publishAsReel = payload.contentType === 'INSTAGRAM_REEL'
  const media = publishAsReel ? video : image
  if (!media) {
    throw new Error(
      publishAsReel
        ? 'Un Reel Instagram nécessite une vidéo.'
        : 'Un post Instagram nécessite une image.'
    )
  }

  const body = new URLSearchParams({
    access_token: platform.accessToken,
    caption: payload.caption ?? payload.title ?? '',
  })

  if (publishAsReel) {
    body.set('media_type', 'REELS')
    body.set('video_url', media.publicUrl)
  } else {
    body.set('media_type', 'IMAGE')
    body.set('image_url', media.publicUrl)
  }
  console.log(`[instagram] media url sent: ${media.publicUrl}`)

  const response = await fetch(`${INSTAGRAM_GRAPH}/${platform.platformUserId}/media`, {
    method: 'POST',
    body,
  })

  const responseText = await response.text()
  console.log(`[instagram] container response: ${responseText}`)
  if (!response.ok) {
    throw new Error(`Instagram container creation failed: ${responseText}`)
  }

  const data = JSON.parse(responseText) as { id?: string }
  if (!data.id) {
    throw new Error('Instagram container response missing ID')
  }

  return { id: data.id, isVideo: publishAsReel }
}

async function waitForInstagramContainer(containerId: string, token: string): Promise<void> {
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const response = await fetch(
      `${INSTAGRAM_GRAPH}/${containerId}?${new URLSearchParams({
        fields: 'status_code',
        access_token: token,
      })}`
    )

    if (!response.ok) {
      throw new Error(`Instagram container status failed: ${await response.text()}`)
    }

    const data = (await response.json()) as { status_code?: string }
    if (data.status_code === 'FINISHED') return
    if (data.status_code === 'ERROR' || data.status_code === 'EXPIRED') {
      throw new Error('Instagram n’a pas pu préparer le média.')
    }

    await new Promise((resolve) => setTimeout(resolve, 5000))
  }

  throw new Error('Instagram prend trop de temps à préparer le média.')
}

async function publishInstagram(
  payload: PublishPayload,
  platform: ConnectedPlatform
): Promise<PublishResult> {
  const refreshedPlatform = await ensureInstagramToken(platform)
  const container = await createInstagramContainer(payload, refreshedPlatform)

  await waitForInstagramContainer(container.id, refreshedPlatform.accessToken)

  const response = await fetch(`${INSTAGRAM_GRAPH}/${refreshedPlatform.platformUserId}/media_publish`, {
    method: 'POST',
    body: new URLSearchParams({
      access_token: refreshedPlatform.accessToken,
      creation_id: container.id,
    }),
  })

  if (!response.ok) {
    throw new Error(`Instagram publish failed: ${await response.text()}`)
  }

  const data = (await response.json()) as { id?: string }
  if (!data.id) {
    throw new Error('Instagram publish response missing ID')
  }

  return { platformPostId: data.id }
}

export const instagramPublisher: PlatformPublisher = {
  publish: publishInstagram,
}
