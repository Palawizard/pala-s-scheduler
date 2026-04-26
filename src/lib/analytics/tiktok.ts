import type { ConnectedPlatform } from '@prisma/client'

import type { PlatformStats } from '@/lib/analytics/youtube'

export async function fetchTikTokStats(
  videoId: string,
  platform: ConnectedPlatform
): Promise<PlatformStats | null> {
  const fields = ['id', 'view_count', 'like_count', 'comment_count', 'share_count'].join(',')
  const res = await fetch(`https://open.tiktokapis.com/v2/video/query/?fields=${fields}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${platform.accessToken}`,
      'Content-Type': 'application/json; charset=UTF-8',
    },
    body: JSON.stringify({
      filters: { video_ids: [videoId] },
      fields: ['id', 'statistics'],
    }),
  })

  if (!res.ok) {
    console.warn(`[analytics] tiktok stats fetch failed (${res.status}) for ${videoId}`)
    return null
  }

  const body = (await res.json()) as {
    data?: { videos?: Record<string, number>[] }
    error?: { code?: string }
  }

  if (body.error?.code && body.error.code !== 'ok') {
    console.warn(`[analytics] tiktok stats error for ${videoId}: ${body.error.code}`)
    return null
  }

  const stats = body.data?.videos?.[0]
  if (!stats) return null

  return {
    views: stats.view_count ?? 0,
    likes: stats.like_count ?? 0,
    comments: stats.comment_count ?? 0,
    shares: stats.share_count ?? 0,
    saves: 0,
    reach: 0,
    impressions: stats.view_count ?? 0,
  }
}
