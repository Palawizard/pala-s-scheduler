import type { ConnectedPlatform } from '@prisma/client'

import type { PlatformStats } from '@/lib/analytics/youtube'

export async function fetchTwitterStats(
  tweetId: string,
  platform: ConnectedPlatform
): Promise<PlatformStats | null> {
  const res = await fetch(
    `https://api.twitter.com/2/tweets/${tweetId}?tweet.fields=public_metrics`,
    { headers: { Authorization: `Bearer ${platform.accessToken}` } }
  )

  if (!res.ok) {
    console.warn(`[analytics] twitter stats fetch failed (${res.status}) for ${tweetId}`)
    return null
  }

  const body = (await res.json()) as {
    data?: { public_metrics?: Record<string, number> }
  }
  const metrics = body.data?.public_metrics
  if (!metrics) return null

  return {
    views: metrics.impression_count ?? 0,
    likes: metrics.like_count ?? 0,
    comments: metrics.reply_count ?? 0,
    shares: (metrics.retweet_count ?? 0) + (metrics.quote_count ?? 0),
    saves: metrics.bookmark_count ?? 0,
    reach: 0,
    impressions: metrics.impression_count ?? 0,
  }
}
