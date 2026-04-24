import type { ConnectedPlatform } from '@prisma/client'
import type { Platform } from '@/types'

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
  media: PublishMedia[]
}

export type PublishResult = {
  platformPostId: string
  url?: string
}

export interface PlatformPublisher {
  publish(payload: PublishPayload, platform: ConnectedPlatform): Promise<PublishResult>
}

// Implementations injected in Epic 4
export function getPlatformClient(_platform: Platform): PlatformPublisher {
  throw new Error(`Publisher not yet implemented for ${_platform}`)
}
