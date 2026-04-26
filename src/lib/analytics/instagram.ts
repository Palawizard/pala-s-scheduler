import type { ConnectedPlatform } from '@prisma/client'

import type { PlatformStats } from '@/lib/analytics/youtube'

type InstagramInsight = {
  name?: string
  values?: { value?: number }[]
}

function sumInsight(insight: InstagramInsight | null): number {
  return insight?.values?.reduce((sum, item) => sum + (item.value ?? 0), 0) ?? 0
}

async function fetchInstagramInsight(
  mediaId: string,
  token: string,
  metric: string
): Promise<InstagramInsight | null> {
  const params = new URLSearchParams({
    metric,
    access_token: token,
  })
  const res = await fetch(`https://graph.instagram.com/v22.0/${mediaId}/insights?${params}`)

  if (!res.ok) {
    if (res.status !== 400) {
      console.warn(`[analytics] instagram ${metric} insight failed (${res.status}) for ${mediaId}`)
    }
    return null
  }

  const body = (await res.json()) as { data?: InstagramInsight[] }
  return body.data?.[0] ?? null
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
  const views = sumInsight(await fetchInstagramInsight(mediaId, platform.accessToken, 'views'))
  const reach = sumInsight(await fetchInstagramInsight(mediaId, platform.accessToken, 'reach'))
  const shares = sumInsight(await fetchInstagramInsight(mediaId, platform.accessToken, 'shares'))
  const saves = sumInsight(await fetchInstagramInsight(mediaId, platform.accessToken, 'saved'))

  return {
    views,
    likes: body.like_count ?? 0,
    comments: body.comments_count ?? 0,
    shares,
    saves,
    reach,
    impressions: views,
  }
}
