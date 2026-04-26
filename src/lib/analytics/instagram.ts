import type { ConnectedPlatform } from '@prisma/client'

import type { PlatformStats } from '@/lib/analytics/youtube'

export async function fetchInstagramStats(
  mediaId: string,
  platform: ConnectedPlatform
): Promise<PlatformStats | null> {
  // instagram_business_basic allows reading like_count and comments_count on own media
  const params = new URLSearchParams({
    fields: 'like_count,comments_count',
    access_token: platform.accessToken,
  })
  const res = await fetch(`https://graph.instagram.com/v22.0/${mediaId}?${params}`)

  if (!res.ok) {
    console.warn(`[analytics] instagram stats fetch failed (${res.status}) for ${mediaId}`)
    return null
  }

  const body = (await res.json()) as { like_count?: number; comments_count?: number }

  return {
    views: 0,
    likes: body.like_count ?? 0,
    comments: body.comments_count ?? 0,
    shares: 0,
    saves: 0,
    reach: 0,
    impressions: 0,
  }
}
