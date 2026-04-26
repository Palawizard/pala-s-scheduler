import { NextRequest, NextResponse } from 'next/server'

import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'
import type { Platform } from '@/types'

type PlatformDay = {
  date: string
} & Partial<Record<Platform, number>>

type AnalyticsPost = {
  id: string
  platform: Platform
  platformPostId: string | null
  caption: string | null
  mediaType: string | null
  thumbnailUrl: string | null
  publishedAt: Date | null
  views: number
  likes: number
  comments: number
  shares: number
  saves: number
  impressions: number
  reach: number
}

function getPeriodStart(period: number): Date {
  const d = new Date()
  d.setDate(d.getDate() - period)
  d.setHours(0, 0, 0, 0)
  return d
}

function toDateString(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function buildDayMap(period: number): Map<string, number> {
  const map = new Map<string, number>()
  for (let i = period - 1; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    map.set(toDateString(d), 0)
  }
  return map
}

function buildPlatformDayRows(period: number, platforms: Platform[]): PlatformDay[] {
  return Array.from(buildDayMap(period).keys()).map((date) => {
    const row: PlatformDay = { date }
    for (const platform of platforms) row[platform] = 0
    return row
  })
}

function addPlatformDayValue(
  rows: PlatformDay[],
  date: string,
  platform: Platform,
  value: number
): void {
  const row = rows.find((item) => item.date === date)
  if (!row) return
  row[platform] = (row[platform] ?? 0) + value
}

function getPostDate(post: AnalyticsPost): string | null {
  return post.publishedAt ? toDateString(post.publishedAt) : null
}

function getInteractions(post: AnalyticsPost): number {
  return post.likes + post.comments + post.shares + post.saves
}

function getImpressions(post: AnalyticsPost): number {
  return post.impressions > 0 ? post.impressions : post.views
}

function getImpressionValue(impressions: number, views: number): number {
  return impressions > 0 ? impressions : views
}

export async function GET(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const rawPeriod = request.nextUrl.searchParams.get('period')
  const period = [7, 30, 90].includes(Number(rawPeriod)) ? Number(rawPeriod) : 30
  const since = getPeriodStart(period)

  const connectedPlatforms = await db.connectedPlatform.findMany({
    where: { userId: user.id, isActive: true },
    select: { platform: true },
    orderBy: { platform: 'asc' },
  })
  const activePlatforms = connectedPlatforms.map((item) => item.platform)

  const snapshots = await db.accountSnapshot.findMany({
    where: { userId: user.id },
    orderBy: { snapshotDate: 'asc' },
  })

  const latestSnapshotByPlatform = new Map<Platform, { followers: number; impressions: number }>()
  for (const s of snapshots) {
    latestSnapshotByPlatform.set(s.platform, { followers: s.followers, impressions: s.impressions })
  }

  const platforms = Array.from(
    new Set<Platform>([...activePlatforms, ...Array.from(latestSnapshotByPlatform.keys())])
  )
  const followersOverTime = buildPlatformDayRows(period, platforms)
  const impressionsOverTime = buildPlatformDayRows(period, platforms)

  for (const s of snapshots) {
    const date = toDateString(s.snapshotDate)
    if (s.snapshotDate < since) {
      continue
    }

    const followersRow = followersOverTime.find((item) => item.date === date)
    const impressionsRow = impressionsOverTime.find((item) => item.date === date)
    if (followersRow) followersRow[s.platform] = s.followers
    if (impressionsRow) impressionsRow[s.platform] = s.impressions
  }

  for (const platform of platforms) {
    let current = snapshots
      .filter((snapshot) => snapshot.platform === platform && snapshot.snapshotDate < since)
      .at(-1)

    for (let index = 0; index < followersOverTime.length; index++) {
      const date = followersOverTime[index].date
      const snapshot = snapshots.find(
        (item) => item.platform === platform && toDateString(item.snapshotDate) === date
      )
      if (snapshot) current = snapshot
      if (current) {
        followersOverTime[index][platform] = current.followers
        impressionsOverTime[index][platform] = current.impressions
      }
    }
  }

  const externalPosts = await db.platformPost.findMany({
    where: { userId: user.id, publishedAt: { gte: since } },
    orderBy: { publishedAt: 'desc' },
  })

  const appPostPlatforms = await db.postPlatform.findMany({
    where: {
      post: { userId: user.id, publishedAt: { gte: since } },
      status: 'PUBLISHED',
    },
    include: {
      post: {
        select: {
          id: true,
          title: true,
          caption: true,
          thumbnailUrl: true,
          publishedAt: true,
        },
      },
      analytics: {
        orderBy: { fetchedAt: 'desc' },
        take: 1,
      },
    },
    orderBy: { publishedAt: 'desc' },
  })

  const postsByKey = new Map<string, AnalyticsPost>()

  for (const p of externalPosts) {
    postsByKey.set(`${p.platform}:${p.platformPostId}`, {
      id: p.id,
      platform: p.platform,
      platformPostId: p.platformPostId,
      caption: p.caption,
      mediaType: p.mediaType,
      thumbnailUrl: p.thumbnailUrl,
      publishedAt: p.publishedAt,
      views: p.views,
      likes: p.likes,
      comments: p.comments,
      shares: p.shares,
      saves: 0,
      impressions: getImpressionValue(p.impressions, p.views),
      reach: p.reach,
    })
  }

  for (const pp of appPostPlatforms) {
    const analytics = pp.analytics[0]
    const key = pp.platformPostId ? `${pp.platform}:${pp.platformPostId}` : `app:${pp.id}`
    postsByKey.set(key, {
      id: pp.id,
      platform: pp.platform,
      platformPostId: pp.platformPostId,
      caption: pp.post.caption ?? pp.post.title,
      mediaType: pp.contentType?.toLowerCase() ?? null,
      thumbnailUrl: pp.post.thumbnailUrl,
      publishedAt: pp.publishedAt ?? pp.post.publishedAt,
      views: analytics?.views ?? 0,
      likes: analytics?.likes ?? 0,
      comments: analytics?.comments ?? 0,
      shares: analytics?.shares ?? 0,
      saves: analytics?.saves ?? 0,
      impressions: getImpressionValue(analytics?.impressions ?? 0, analytics?.views ?? 0),
      reach: analytics?.reach ?? 0,
    })
  }

  const platformPosts = Array.from(postsByKey.values()).sort(
    (a, b) => (b.publishedAt?.getTime() ?? 0) - (a.publishedAt?.getTime() ?? 0)
  )
  const postPlatforms = Array.from(
    new Set<Platform>([...platforms, ...platformPosts.map((post) => post.platform)])
  )
  const interactionsByDay = buildPlatformDayRows(period, postPlatforms)
  const postsByDay = buildPlatformDayRows(period, postPlatforms)
  const platformTotals = new Map<
    Platform,
    { interactions: number; postsCount: number; impressions: number }
  >()

  for (const p of platformPosts) {
    const date = getPostDate(p)
    if (date) {
      addPlatformDayValue(interactionsByDay, date, p.platform, getInteractions(p))
      addPlatformDayValue(postsByDay, date, p.platform, 1)
    }

    const current = platformTotals.get(p.platform) ?? {
      interactions: 0,
      postsCount: 0,
      impressions: 0,
    }
    current.postsCount++
    current.interactions += getInteractions(p)
    current.impressions += getImpressions(p)
    platformTotals.set(p.platform, current)
  }

  return NextResponse.json({
    data: {
      period,
      account: {
        byPlatform: platforms.map((platform) => ({
          platform,
          followers: latestSnapshotByPlatform.get(platform)?.followers ?? 0,
          impressions: latestSnapshotByPlatform.get(platform)?.impressions ?? 0,
        })),
        followersOverTime,
        impressionsOverTime,
        totalFollowers: platforms.reduce(
          (sum, platform) => sum + (latestSnapshotByPlatform.get(platform)?.followers ?? 0),
          0
        ),
        totalImpressions: platforms.reduce(
          (sum, platform) => sum + (latestSnapshotByPlatform.get(platform)?.impressions ?? 0),
          0
        ),
      },
      posts: {
        byPlatform: postPlatforms.map((platform) => ({
          platform,
          interactions: platformTotals.get(platform)?.interactions ?? 0,
          postsCount: platformTotals.get(platform)?.postsCount ?? 0,
          impressions: platformTotals.get(platform)?.impressions ?? 0,
        })),
        interactionsByDay,
        postsByDay,
        totalInteractions: Array.from(platformTotals.values()).reduce(
          (s, v) => s + v.interactions,
          0
        ),
        totalPostsCount: platformPosts.length,
        items: platformPosts.map((p) => ({
          id: p.id,
          platform: p.platform,
          caption: p.caption,
          mediaType: p.mediaType,
          thumbnailUrl: p.thumbnailUrl,
          publishedAt: p.publishedAt,
          views: p.views,
          likes: p.likes,
          comments: p.comments,
          shares: p.shares,
          impressions: p.impressions,
          reach: p.reach,
        })),
      },
    },
  })
}
