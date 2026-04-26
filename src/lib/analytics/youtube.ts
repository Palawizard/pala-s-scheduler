import type { ConnectedPlatform } from '@prisma/client'

export type PlatformStats = {
  views: number
  likes: number
  comments: number
  shares: number
  saves: number
  reach: number
  impressions: number
}

export async function fetchYoutubeStats(
  videoId: string,
  platform: ConnectedPlatform
): Promise<PlatformStats | null> {
  const url = `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${encodeURIComponent(videoId)}`
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${platform.accessToken}` },
  })

  if (!res.ok) {
    console.warn(`[analytics] youtube stats fetch failed (${res.status}) for ${videoId}`)
    return null
  }

  const body = (await res.json()) as { items?: { statistics?: Record<string, string> }[] }
  const stats = body.items?.[0]?.statistics
  if (!stats) return null

  return {
    views: parseInt(stats.viewCount ?? '0', 10),
    likes: parseInt(stats.likeCount ?? '0', 10),
    comments: parseInt(stats.commentCount ?? '0', 10),
    shares: 0,
    saves: parseInt(stats.favoriteCount ?? '0', 10),
    reach: 0,
    impressions: 0,
  }
}
