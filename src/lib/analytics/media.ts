import type { ConnectedPlatform } from '@prisma/client'

import { fetchInstagramStats } from '@/lib/analytics/instagram'

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
    items?: {
      id?: { videoId?: string }
      snippet?: { title?: string; publishedAt?: string; thumbnails?: { medium?: { url?: string } } }
    }[]
  }
  const items = searchBody.items ?? []
  if (items.length === 0) return []

  const videoIds = items
    .map((i) => i.id?.videoId)
    .filter(Boolean)
    .join(',')

  const statsRes = await fetch(
    `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${videoIds}`,
    { headers: { Authorization: `Bearer ${platform.accessToken}` } }
  )
  const statsBody = statsRes.ok
    ? ((await statsRes.json()) as {
        items?: { id?: string; statistics?: Record<string, string> }[]
      })
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

export async function fetchInstagramPosts(
  platform: ConnectedPlatform
): Promise<PlatformMediaPost[]> {
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
  return Promise.all(
    (body.data ?? []).map(async (item) => {
      const stats = await fetchInstagramStats(item.id, platform)
      return {
        platformPostId: item.id,
        caption: item.caption ?? null,
        mediaType: item.media_type?.toLowerCase() ?? null,
        thumbnailUrl: item.thumbnail_url ?? null,
        publishedAt: item.timestamp ? new Date(item.timestamp) : null,
        views: stats?.views ?? 0,
        likes: stats?.likes ?? item.like_count ?? 0,
        comments: stats?.comments ?? item.comments_count ?? 0,
        shares: stats?.shares ?? 0,
        impressions: stats?.impressions ?? 0,
        reach: stats?.reach ?? 0,
      }
    })
  )
}

export async function fetchTikTokPosts(platform: ConnectedPlatform): Promise<PlatformMediaPost[]> {
  const fields = [
    'id',
    'title',
    'video_description',
    'cover_image_url',
    'create_time',
    'view_count',
    'like_count',
    'comment_count',
    'share_count',
  ].join(',')
  const posts: PlatformMediaPost[] = []
  let cursor = 0
  let hasMore = true

  for (let page = 0; page < 5 && hasMore; page += 1) {
    const res = await fetch(`https://open.tiktokapis.com/v2/video/list/?fields=${fields}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${platform.accessToken}`,
        'Content-Type': 'application/json; charset=UTF-8',
      },
      body: JSON.stringify({
        max_count: 20,
        cursor,
      }),
    })

    if (!res.ok) {
      console.warn(`[analytics] tiktok video list failed (${res.status})`)
      return posts
    }

    const body = (await res.json()) as {
      data?: {
        videos?: {
          id: string
          title?: string
          video_description?: string
          cover_image_url?: string
          create_time?: number
          view_count?: number
          like_count?: number
          comment_count?: number
          share_count?: number
        }[]
        cursor?: number
        has_more?: boolean
      }
      error?: { code?: string }
    }

    if (body.error?.code && body.error.code !== 'ok') {
      console.warn(`[analytics] tiktok video list error: ${body.error.code}`)
      return posts
    }

    for (const video of body.data?.videos ?? []) {
      posts.push({
        platformPostId: video.id,
        caption: video.video_description ?? video.title ?? null,
        mediaType: 'video',
        thumbnailUrl: video.cover_image_url ?? null,
        publishedAt: video.create_time ? new Date(video.create_time * 1000) : null,
        views: video.view_count ?? 0,
        likes: video.like_count ?? 0,
        comments: video.comment_count ?? 0,
        shares: video.share_count ?? 0,
        impressions: video.view_count ?? 0,
        reach: 0,
      })
    }

    cursor = body.data?.cursor ?? cursor
    hasMore = body.data?.has_more ?? false
  }

  return posts
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
