import type { ConnectedPlatform } from '@prisma/client'
import type { Platform } from '@/types'

export type PublishPayload = {
  title: string | null
  caption: string | null
  hashtags: string[]
  mediaUrls: string[]
  thumbnailUrl: string | null
}

export type PublishResult = {
  platformPostId: string
}

export interface PlatformPublisher {
  publish(payload: PublishPayload, platform: ConnectedPlatform): Promise<PublishResult>
}

// Implementations injected in Epic 4
export function getPlatformClient(_platform: Platform): PlatformPublisher {
  throw new Error(`Publisher not yet implemented for ${_platform}`)
}
