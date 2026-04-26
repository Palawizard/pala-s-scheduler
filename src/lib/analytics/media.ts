import type { ConnectedPlatform } from '@prisma/client'

export type PlatformMediaPost = {
  platformPostId: string
  caption: string | null
  mediaType: string | null
  thumbnailUrl: string | null
  publishedAt: Date | null
  views: number
  likes: number
  comments: number
  shares: number
  impressions: number
  reach: number
}

export async function fetchYoutubePosts(platform: ConnectedPlatform): Promise<PlatformMediaPost[]> {
  // Fetch channel's video list
  const searchRes = await fetch(
    `https://www.googleapis.com/youtube/v3/search?part=snippet&forMine=true&type=video&maxResults=50&order=date`,
    { headers: { Authorization: `Bearer ${platform.accessToken}` } }
  )
  if (!searchRes.ok) {
    console.warn(`[analytics] youtube search failed (${searchRes.status})`)
    return []
  }
  const searchBody = (await searchRes.json()) as {
    items?: { id?: { videoId?: string }; snippet?: { title?: string; publishedAt?: string; thumbnails?: { medium?: { url?: string } } } }[]
  }
  const items = searchBody.items ?? []
  if (items.length === 0) return []

  const videoIds = items.map((i) => i.id?.videoId).filter(Boolean).join(',')

  const statsRes = await fetch(
    `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${videoIds}`,
    { headers: { Authorization: `Bearer ${platform.accessToken}` } }
  )
  const statsBody = statsRes.ok
    ? ((await statsRes.json()) as { items?: { id?: string; statistics?: Record<string, string> }[] })
    : { items: [] }
  const statsMap = new Map(statsBody.items?.map((i) => [i.id, i.statistics]) ?? [])

  return items
    .filter((i) => i.id?.videoId)
    .map((i) => {
      const videoId = i.id!.videoId!
      const stats = statsMap.get(videoId)
      return {
        platformPostId: videoId,
        caption: i.snippet?.title ?? null,
        mediaType: 'video',
        thumbnailUrl: i.snippet?.thumbnails?.medium?.url ?? null,
        publishedAt: i.snippet?.publishedAt ? new Date(i.snippet.publishedAt) : null,
        views: parseInt(stats?.viewCount ?? '0', 10),
        likes: parseInt(stats?.likeCount ?? '0', 10),
        comments: parseInt(stats?.commentCount ?? '0', 10),
        shares: 0,
        impressions: 0,
        reach: 0,
      }
    })
}

export async function fetchInstagramPosts(platform: ConnectedPlatform): Promise<PlatformMediaPost[]> {
  const fields = 'id,caption,media_type,thumbnail_url,timestamp,like_count,comments_count'
  const params = new URLSearchParams({ fields, limit: '50', access_token: platform.accessToken })
  const res = await fetch(`https://graph.instagram.com/v22.0/me/media?${params}`)
  if (!res.ok) {
    console.warn(`[analytics] instagram media list failed (${res.status})`)
    return []
  }
  const body = (await res.json()) as {
    data?: {
      id: string
      caption?: string
      media_type?: string
      thumbnail_url?: string
      timestamp?: string
      like_count?: number
      comments_count?: number
    }[]
  }
  return (body.data ?? []).map((item) => ({
    platformPostId: item.id,
    caption: item.caption ?? null,
    mediaType: item.media_type?.toLowerCase() ?? null,
    thumbnailUrl: item.thumbnail_url ?? null,
    publishedAt: item.timestamp ? new Date(item.timestamp) : null,
    views: 0,
    likes: item.like_count ?? 0,
    comments: item.comments_count ?? 0,
    shares: 0,
    impressions: 0,
    reach: 0,
  }))
}

export async function fetchTwitterPosts(platform: ConnectedPlatform): Promise<PlatformMediaPost[]> {
  const userId = platform.platformUserId
  const res = await fetch(
    `https://api.twitter.com/2/users/${userId}/tweets?tweet.fields=public_metrics,created_at&max_results=100&exclude=retweets,replies`,
    { headers: { Authorization: `Bearer ${platform.accessToken}` } }
  )
  if (!res.ok) {
    console.warn(`[analytics] twitter timeline failed (${res.status})`)
    return []
  }
  const body = (await res.json()) as {
    data?: {
      id: string
      text?: string
      created_at?: string
      public_metrics?: Record<string, number>
    }[]
  }
  return (body.data ?? []).map((tweet) => ({
    platformPostId: tweet.id,
    caption: tweet.text ?? null,
    mediaType: null,
    thumbnailUrl: null,
    publishedAt: tweet.created_at ? new Date(tweet.created_at) : null,
    views: tweet.public_metrics?.impression_count ?? 0,
    likes: tweet.public_metrics?.like_count ?? 0,
    comments: tweet.public_metrics?.reply_count ?? 0,
    shares: (tweet.public_metrics?.retweet_count ?? 0) + (tweet.public_metrics?.quote_count ?? 0),
    impressions: tweet.public_metrics?.impression_count ?? 0,
    reach: 0,
  }))
}
