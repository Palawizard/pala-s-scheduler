import type { ConnectedPlatform } from '@prisma/client'
import sharp from 'sharp'

import { db } from '@/lib/db'
import type {
  PlatformPublisher,
  PublishMedia,
  PublishPayload,
  PublishResult,
} from '@/lib/platforms'
import { deleteFile, getAbsolutePublicUrl, uploadFile } from '@/lib/storage'

const TIKTOK_AUTH = 'https://www.tiktok.com/v2/auth/authorize/'
const TIKTOK_TOKEN = 'https://open.tiktokapis.com/v2/oauth/token/'
const TIKTOK_USER = 'https://open.tiktokapis.com/v2/user/info/'
const TIKTOK_PUBLISH_INIT = 'https://open.tiktokapis.com/v2/post/publish/video/init/'
const TIKTOK_CONTENT_INIT = 'https://open.tiktokapis.com/v2/post/publish/content/init/'
const TIKTOK_PUBLISH_STATUS = 'https://open.tiktokapis.com/v2/post/publish/status/fetch/'

const CALLBACK_URL = () => `${process.env.NEXTAUTH_URL}/api/platforms/tiktok/callback`

type TikTokTokenResponse = {
  access_token: string
  refresh_token: string
  expires_in: number
  refresh_expires_in: number
  open_id: string
}

type TikTokApiError = {
  code?: string
  message?: string
  log_id?: string
}

function throwTikTokApiError(body: { error?: TikTokApiError }): never {
  throw new Error(`TikTok error: ${JSON.stringify(body)}`)
}

export function getTikTokAuthUrl(state: string, codeChallenge: string): string {
  const params = new URLSearchParams({
    client_key: process.env.TIKTOK_CLIENT_KEY!,
    redirect_uri: CALLBACK_URL(),
    response_type: 'code',
    scope: 'user.info.basic,user.info.stats,video.list,video.upload,video.publish',
    state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    disable_auto_auth: '1',
  })
  return `${TIKTOK_AUTH}?${params}`
}

export async function exchangeTikTokCode(
  code: string,
  codeVerifier: string
): Promise<TikTokTokenResponse> {
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

async function ensureTikTokToken(platform: ConnectedPlatform): Promise<ConnectedPlatform> {
  if (!platform.refreshToken) return platform

  const shouldRefresh = platform.tokenExpiry
    ? platform.tokenExpiry.getTime() < Date.now() + 5 * 60 * 1000
    : false
  if (!shouldRefresh) return platform

  const tokens = await refreshTikTokToken(platform.refreshToken)

  return db.connectedPlatform.update({
    where: { id: platform.id },
    data: {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      tokenExpiry: new Date(Date.now() + tokens.expires_in * 1000),
    },
  })
}

function toTikTokPrivacy(visibility: PublishPayload['visibility']): string {
  if (visibility === 'PRIVATE') return 'SELF_ONLY'
  if (visibility === 'FRIENDS_ONLY') return 'MUTUAL_FOLLOW_FRIENDS'
  return 'PUBLIC_TO_EVERYONE'
}

function getTikTokTitle(payload: PublishPayload): string {
  return (payload.caption || payload.title || 'Publication').slice(0, 2200)
}

function getTikTokPhotoTitle(payload: PublishPayload): string {
  return (payload.caption || payload.title || 'Photo').slice(0, 90)
}

// TikTok requires images to be at most 1080x1920px.
// If the image exceeds these dimensions, resize it and upload a temporary copy to R2.
async function resizeImageForTikTok(
  image: PublishMedia
): Promise<{ url: string; tempKey: string | null }> {
  const TIKTOK_MAX_WIDTH = 1080
  const TIKTOK_MAX_HEIGHT = 1920

  const metadata = await sharp(image.buffer).metadata()
  const { width = 0, height = 0 } = metadata

  if (width <= TIKTOK_MAX_WIDTH && height <= TIKTOK_MAX_HEIGHT) {
    return { url: image.publicUrl, tempKey: null }
  }

  console.log(
    `[TikTok] resizing image from ${width}x${height} to fit ${TIKTOK_MAX_WIDTH}x${TIKTOK_MAX_HEIGHT}`
  )

  const resized = await sharp(image.buffer)
    .resize(TIKTOK_MAX_WIDTH, TIKTOK_MAX_HEIGHT, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 90 })
    .toBuffer()

  const tempKey = image.key.replace(/(\.[^./]+)$/, '-tiktok.jpg')
  await uploadFile(tempKey, resized, 'image/jpeg')
  const url = getAbsolutePublicUrl(tempKey)

  console.log(`[TikTok] resized image uploaded as ${tempKey}`)
  return { url, tempKey }
}

async function initTikTokUpload(
  payload: PublishPayload,
  platform: ConnectedPlatform,
  video: PublishMedia
): Promise<{ publishId: string; uploadUrl: string }> {
  const privacyLevel = toTikTokPrivacy(payload.visibility)
  const response = await fetch(TIKTOK_PUBLISH_INIT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${platform.accessToken}`,
      'Content-Type': 'application/json; charset=UTF-8',
    },
    body: JSON.stringify({
      post_info: {
        title: getTikTokTitle(payload),
        privacy_level: privacyLevel,
        disable_duet: false,
        disable_comment: false,
        disable_stitch: false,
      },
      source_info: {
        source: 'FILE_UPLOAD',
        video_size: video.size,
        chunk_size: video.size,
        total_chunk_count: 1,
      },
    }),
  })

  if (!response.ok) {
    throw new Error(`TikTok publish init failed: ${await response.text()}`)
  }

  const body = (await response.json()) as {
    data?: { publish_id?: string; upload_url?: string }
    error?: { code?: string; message?: string }
  }

  if (body.error?.code && body.error.code !== 'ok') {
    throwTikTokApiError(body)
  }

  if (!body.data?.publish_id || !body.data.upload_url) {
    throw new Error('TikTok publish init response missing fields')
  }

  return {
    publishId: body.data.publish_id,
    uploadUrl: body.data.upload_url,
  }
}

async function initTikTokPhotoPost(
  payload: PublishPayload,
  platform: ConnectedPlatform,
  image: PublishMedia
): Promise<{ publishId: string; tempKey: string | null }> {
  const { url: imageUrl, tempKey } = await resizeImageForTikTok(image)

  const requestBody = {
    post_info: {
      title: getTikTokPhotoTitle(payload),
      ...(payload.title ? { description: payload.title.slice(0, 4000) } : {}),
      privacy_level: toTikTokPrivacy(payload.visibility),
      disable_comment: false,
      auto_add_music: true,
    },
    source_info: {
      source: 'PULL_FROM_URL',
      photo_cover_index: 0,
      photo_images: [imageUrl],
    },
    post_mode: 'DIRECT_POST',
    media_type: 'PHOTO',
  }
  console.log('[TikTok] photo init request:', JSON.stringify(requestBody, null, 2))

  const response = await fetch(TIKTOK_CONTENT_INIT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${platform.accessToken}`,
      'Content-Type': 'application/json; charset=UTF-8',
    },
    body: JSON.stringify(requestBody),
  })

  const rawText = await response.text()
  console.log(`[TikTok] photo init response (${response.status}):`, rawText)

  if (!response.ok) {
    throw new Error(`TikTok photo publish init failed (${response.status}): ${rawText}`)
  }

  const body = JSON.parse(rawText) as {
    data?: { publish_id?: string }
    error?: { code?: string; message?: string }
  }

  if (body.error?.code && body.error.code !== 'ok') {
    throwTikTokApiError(body)
  }

  if (!body.data?.publish_id) {
    throw new Error('TikTok photo publish init response missing fields')
  }

  return { publishId: body.data.publish_id, tempKey }
}

async function waitForTikTokPublish(platform: ConnectedPlatform, publishId: string): Promise<void> {
  for (let attempt = 0; attempt < 18; attempt += 1) {
    const response = await fetch(TIKTOK_PUBLISH_STATUS, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${platform.accessToken}`,
        'Content-Type': 'application/json; charset=UTF-8',
      },
      body: JSON.stringify({ publish_id: publishId }),
    })

    const rawText = await response.text()

    if (!response.ok) {
      console.error(`[TikTok] status poll failed (${response.status}):`, rawText)
      throw new Error(`TikTok publish status failed: ${rawText}`)
    }

    const body = JSON.parse(rawText) as {
      data?: { status?: string; fail_reason?: string }
      error?: { code?: string; message?: string }
    }

    console.log(`[TikTok] status poll attempt ${attempt + 1}:`, JSON.stringify(body))

    if (body.error?.code && body.error.code !== 'ok') {
      throwTikTokApiError(body)
    }

    if (body.data?.status === 'PUBLISH_COMPLETE' || body.data?.status === 'SEND_TO_USER_INBOX') {
      console.log('[TikTok] publish complete')
      return
    }

    if (body.data?.status === 'FAILED') {
      const reason = body.data.fail_reason ?? 'raison inconnue'
      console.error('[TikTok] publish FAILED, full body:', JSON.stringify(body))
      throw new Error(`TikTok n'a pas pu publier le media. Raison : ${reason}`)
    }

    await new Promise((resolve) => setTimeout(resolve, 5000))
  }

  throw new Error('TikTok prend trop de temps à publier le média.')
}

async function publishTikTok(
  payload: PublishPayload,
  platform: ConnectedPlatform
): Promise<PublishResult> {
  const refreshedPlatform = await ensureTikTokToken(platform)

  if (payload.media.length !== 1) {
    throw new Error('TikTok accepte un seul média pour le moment.')
  }

  const media = payload.media[0]
  if (!media) {
    throw new Error('TikTok nécessite un média.')
  }

  if (media.contentType.startsWith('image/')) {
    const { publishId, tempKey } = await initTikTokPhotoPost(payload, refreshedPlatform, media)
    try {
      await waitForTikTokPublish(refreshedPlatform, publishId)
    } finally {
      if (tempKey) await deleteFile(tempKey).catch(() => {})
    }
    return { platformPostId: publishId }
  }

  if (!media.contentType.startsWith('video/')) {
    throw new Error('TikTok nécessite une image ou une vidéo.')
  }

  const upload = await initTikTokUpload(payload, refreshedPlatform, media)
  const uploadResponse = await fetch(upload.uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Length': media.size.toString(),
      'Content-Range': `bytes 0-${media.size - 1}/${media.size}`,
      'Content-Type': media.contentType,
    },
    body: new Uint8Array(media.buffer),
  })

  if (!uploadResponse.ok) {
    throw new Error(`TikTok video upload failed: ${await uploadResponse.text()}`)
  }

  await waitForTikTokPublish(refreshedPlatform, upload.publishId)

  return { platformPostId: upload.publishId }
}

export const tiktokPublisher: PlatformPublisher = {
  publish: publishTikTok,
  refreshToken: ensureTikTokToken,
}
