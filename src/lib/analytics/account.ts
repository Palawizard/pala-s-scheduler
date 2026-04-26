import type { ConnectedPlatform } from '@prisma/client'

export type AccountStats = {
  followers: number
  impressions: number
  reach: number
}

export async function fetchYoutubeAccountStats(platform: ConnectedPlatform): Promise<AccountStats | null> {
  const res = await fetch(
    'https://www.googleapis.com/youtube/v3/channels?part=statistics&mine=true',
    { headers: { Authorization: `Bearer ${platform.accessToken}` } }
  )
  if (!res.ok) {
    console.warn(`[analytics] youtube account stats failed (${res.status})`)
    return null
  }
  const body = (await res.json()) as { items?: { statistics?: Record<string, string> }[] }
  const stats = body.items?.[0]?.statistics
  if (!stats) return null
  return {
    followers: parseInt(stats.subscriberCount ?? '0', 10),
    impressions: parseInt(stats.viewCount ?? '0', 10),
    reach: 0,
  }
}

export async function fetchInstagramAccountStats(platform: ConnectedPlatform): Promise<AccountStats | null> {
  const params = new URLSearchParams({ fields: 'followers_count', access_token: platform.accessToken })
  const res = await fetch(`https://graph.instagram.com/v22.0/me?${params}`)
  if (!res.ok) {
    console.warn(`[analytics] instagram account stats failed (${res.status})`)
    return null
  }
  const body = (await res.json()) as { followers_count?: number }
  return { followers: body.followers_count ?? 0, impressions: 0, reach: 0 }
}

export async function fetchTikTokAccountStats(platform: ConnectedPlatform): Promise<AccountStats | null> {
  const res = await fetch('https://open.tiktokapis.com/v2/user/info/?fields=follower_count,likes_count', {
    method: 'GET',
    headers: { Authorization: `Bearer ${platform.accessToken}` },
  })
  if (!res.ok) {
    console.warn(`[analytics] tiktok account stats failed (${res.status})`)
    return null
  }
  const body = (await res.json()) as { data?: { user?: { follower_count?: number; likes_count?: number } } }
  const user = body.data?.user
  if (!user) return null
  return { followers: user.follower_count ?? 0, impressions: user.likes_count ?? 0, reach: 0 }
}

export async function fetchTwitterAccountStats(platform: ConnectedPlatform): Promise<AccountStats | null> {
  const res = await fetch('https://api.twitter.com/2/users/me?user.fields=public_metrics', {
    headers: { Authorization: `Bearer ${platform.accessToken}` },
  })
  if (!res.ok) {
    console.warn(`[analytics] twitter account stats failed (${res.status})`)
    return null
  }
  const body = (await res.json()) as { data?: { public_metrics?: Record<string, number> } }
  const metrics = body.data?.public_metrics
  if (!metrics) return null
  return { followers: metrics.followers_count ?? 0, impressions: 0, reach: 0 }
}
