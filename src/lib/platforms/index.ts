import type { ConnectedPlatform } from '@prisma/client'
import type { Platform, PostContentType, PostVisibility } from '@/types'
import { instagramPublisher } from '@/lib/platforms/instagram'
import { tiktokPublisher } from '@/lib/platforms/tiktok'
import { twitterPublisher } from '@/lib/platforms/twitter'
import { youtubePublisher } from '@/lib/platforms/youtube'

export type PublishMedia = {
  url: string
  key: string
  publicUrl: string
  contentType: string
  size: number
  buffer: Buffer
}

export type PublishPayload = {
  postId: string
  userId: string
  title: string | null
  caption: string | null
  hashtags: string[]
  mediaUrls: string[]
  thumbnailUrl: string | null
  contentType: PostContentType | null
  visibility: PostVisibility | null
  media: PublishMedia[]
}

export type PublishResult = {
  platformPostId: string
  url?: string
}

export interface PlatformPublisher {
  publish(payload: PublishPayload, platform: ConnectedPlatform): Promise<PublishResult>
  refreshToken(platform: ConnectedPlatform): Promise<ConnectedPlatform>
}

const PLATFORM_PUBLISHERS: Record<Platform, PlatformPublisher> = {
  INSTAGRAM: instagramPublisher,
  TIKTOK: tiktokPublisher,
  TWITTER: twitterPublisher,
  YOUTUBE: youtubePublisher,
}

export function getPlatformClient(platform: Platform): PlatformPublisher {
  return PLATFORM_PUBLISHERS[platform]
}
