import type { ConnectedPlatform } from '@prisma/client'

import { db } from '@/lib/db'
import type { PlatformPublisher, PublishPayload, PublishResult } from '@/lib/platforms'
import { getFirstVideoMedia } from '@/lib/platforms/media'

type YoutubeChannel = {
  id: string
  title: string
  avatar: string | null
}

type JsonRecord = Record<string, unknown>

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function getString(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null
}

function getThumbnailUrl(snippet: JsonRecord): string | null {
  const thumbnails = snippet.thumbnails
  if (!isRecord(thumbnails)) return null

  for (const key of ['high', 'medium', 'default']) {
    const thumbnail = thumbnails[key]
    if (!isRecord(thumbnail)) continue

    const url = getString(thumbnail.url)
    if (url) return url
  }

  return null
}

export async function getYoutubeChannel(accessToken: string): Promise<YoutubeChannel | null> {
  const params = new URLSearchParams({
    part: 'snippet',
    mine: 'true',
  })

  const res = await fetch(`https://www.googleapis.com/youtube/v3/channels?${params}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) throw new Error(`YouTube channel fetch failed: ${await res.text()}`)

  const body = (await res.json()) as unknown
  if (!isRecord(body) || !Array.isArray(body.items)) return null

  const firstChannel = body.items.find(isRecord)
  if (!firstChannel) return null

  const id = getString(firstChannel.id)
  const snippet = firstChannel.snippet
  if (!id || !isRecord(snippet)) return null

  const title = getString(snippet.title)
  if (!title) return null

  return {
    id,
    title,
    avatar: getThumbnailUrl(snippet),
  }
}

async function refreshYoutubeToken(platform: ConnectedPlatform): Promise<ConnectedPlatform> {
  if (!platform.refreshToken) return platform

  const shouldRefresh = platform.tokenExpiry
    ? platform.tokenExpiry.getTime() < Date.now() + 5 * 60 * 1000
    : false
  if (!shouldRefresh) return platform

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      grant_type: 'refresh_token',
      refresh_token: platform.refreshToken,
    }),
  })

  if (!response.ok) {
    throw new Error(`YouTube token refresh failed: ${await response.text()}`)
  }

  const tokens = (await response.json()) as {
    access_token: string
    expires_in?: number
  }

  return db.connectedPlatform.update({
    where: { id: platform.id },
    data: {
      accessToken: tokens.access_token,
      tokenExpiry: tokens.expires_in
        ? new Date(Date.now() + tokens.expires_in * 1000)
        : platform.tokenExpiry,
    },
  })
}

async function uploadYoutubeVideo(
  payload: PublishPayload,
  platform: ConnectedPlatform
): Promise<PublishResult> {
  const refreshedPlatform = await refreshYoutubeToken(platform)
  const video = getFirstVideoMedia(payload.media)
  if (!video) {
    throw new Error('YouTube nécessite une vidéo.')
  }

  const isShort = payload.contentType === 'YOUTUBE_SHORT'
  const title = payload.title || 'Publication'
  const description = payload.caption ?? ''
  const metadata = {
    snippet: {
      title: isShort && !title.toLowerCase().includes('#shorts') ? `${title} #Shorts` : title,
      description: isShort && !description.toLowerCase().includes('#shorts')
        ? `${description}\n\n#Shorts`.trim()
        : description,
      tags: payload.hashtags,
      categoryId: '22',
    },
    status: {
      privacyStatus: 'public',
      selfDeclaredMadeForKids: false,
    },
  }

  const sessionResponse = await fetch(
    'https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${refreshedPlatform.accessToken}`,
        'Content-Type': 'application/json; charset=UTF-8',
        'X-Upload-Content-Length': video.size.toString(),
        'X-Upload-Content-Type': video.contentType,
      },
      body: JSON.stringify(metadata),
    }
  )

  if (!sessionResponse.ok) {
    throw new Error(`YouTube upload session failed: ${await sessionResponse.text()}`)
  }

  const uploadUrl = sessionResponse.headers.get('location')
  if (!uploadUrl) {
    throw new Error('YouTube upload session missing upload URL')
  }

  const uploadResponse = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${refreshedPlatform.accessToken}`,
      'Content-Length': video.size.toString(),
      'Content-Type': video.contentType,
    },
    body: new Uint8Array(video.buffer),
  })

  if (!uploadResponse.ok) {
    throw new Error(`YouTube upload failed: ${await uploadResponse.text()}`)
  }

  const body = (await uploadResponse.json()) as { id?: string }
  if (!body.id) {
    throw new Error('YouTube upload response missing video ID')
  }

  return {
    platformPostId: body.id,
    url: `https://www.youtube.com/watch?v=${body.id}`,
  }
}

export const youtubePublisher: PlatformPublisher = {
  publish: uploadYoutubeVideo,
}
