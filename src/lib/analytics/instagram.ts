import type { ConnectedPlatform } from '@prisma/client'

import type { PlatformStats } from '@/lib/analytics/youtube'

type InstagramInsight = {
  name?: string
  values?: { value?: number }[]
}

function sumInsight(insights: InstagramInsight[], metric: string): number {
  return (
    insights
      .find((insight) => insight.name === metric)
      ?.values?.reduce((sum, item) => sum + (item.value ?? 0), 0) ?? 0
  )
}

async function fetchInstagramInsights(
  mediaId: string,
  token: string,
  metrics: string[]
): Promise<InstagramInsight[]> {
  const params = new URLSearchParams({
    metric: metrics.join(','),
    access_token: token,
  })
  const res = await fetch(`https://graph.instagram.com/v22.0/${mediaId}/insights?${params}`)

  if (!res.ok) {
    console.warn(`[analytics] instagram insights fetch failed (${res.status}) for ${mediaId}`)
    return []
  }

  const body = (await res.json()) as { data?: InstagramInsight[] }
  return body.data ?? []
}

export async function fetchInstagramStats(
  mediaId: string,
  platform: ConnectedPlatform
): Promise<PlatformStats | null> {
  const params = new URLSearchParams({
    fields: 'like_count,comments_count,media_type',
    access_token: platform.accessToken,
  })
  const res = await fetch(`https://graph.instagram.com/v22.0/${mediaId}?${params}`)

  if (!res.ok) {
    console.warn(`[analytics] instagram stats fetch failed (${res.status}) for ${mediaId}`)
    return null
  }

  const body = (await res.json()) as {
    like_count?: number
    comments_count?: number
    media_type?: string
  }
  const mediaType = body.media_type?.toUpperCase()
  const metrics =
    mediaType === 'VIDEO' || mediaType === 'REELS'
      ? ['reach', 'shares', 'saved', 'views']
      : ['impressions', 'reach', 'shares', 'saved']
  const insights = await fetchInstagramInsights(mediaId, platform.accessToken, metrics)
  const views = sumInsight(insights, 'views')
  const impressions = sumInsight(insights, 'impressions') || views

  return {
    views,
    likes: body.like_count ?? 0,
    comments: body.comments_count ?? 0,
    shares: sumInsight(insights, 'shares'),
    saves: sumInsight(insights, 'saved'),
    reach: sumInsight(insights, 'reach'),
    impressions,
  }
}
