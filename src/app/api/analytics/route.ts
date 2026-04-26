import { NextRequest, NextResponse } from 'next/server'

import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'
import type { Platform } from '@/types'

function getPeriodStart(period: number): Date {
  const d = new Date()
  d.setDate(d.getDate() - period)
  d.setHours(0, 0, 0, 0)
  return d
}

function toDateString(date: Date): string {
  return date.toISOString().slice(0, 10)
}

export async function GET(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const rawPeriod = request.nextUrl.searchParams.get('period')
  const period = [7, 30, 90].includes(Number(rawPeriod)) ? Number(rawPeriod) : 30
  const since = getPeriodStart(period)

  const postPlatforms = await db.postPlatform.findMany({
    where: {
      post: { userId: user.id, publishedAt: { gte: since } },
      status: 'PUBLISHED',
    },
    include: {
      post: { select: { id: true, title: true, caption: true, thumbnailUrl: true, publishedAt: true } },
      analytics: {
        orderBy: { fetchedAt: 'desc' },
        take: 1,
      },
    },
  })

  // KPIs — sum of latest analytics per post-platform
  let totalViews = 0
  let totalLikes = 0
  let totalComments = 0
  let totalShares = 0
  for (const pp of postPlatforms) {
    const a = pp.analytics[0]
    if (a) {
      totalViews += a.views
      totalLikes += a.likes
      totalComments += a.comments
      totalShares += a.shares
    }
  }

  // Engagement by day (group by publishedAt date)
  const byDayMap = new Map<string, { views: number; likes: number; comments: number }>()
  for (let i = period - 1; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    byDayMap.set(toDateString(d), { views: 0, likes: 0, comments: 0 })
  }
  for (const pp of postPlatforms) {
    const date = toDateString(pp.post.publishedAt ?? new Date())
    const entry = byDayMap.get(date)
    if (!entry) continue
    const a = pp.analytics[0]
    if (a) {
      entry.views += a.views
      entry.likes += a.likes
      entry.comments += a.comments
    }
  }
  const engagementByDay = Array.from(byDayMap.entries()).map(([date, v]) => ({ date, ...v }))

  // Per-platform aggregation
  const platformMap = new Map<Platform, { views: number; likes: number; comments: number; shares: number; saves: number; reach: number; impressions: number; postsCount: number }>()
  for (const pp of postPlatforms) {
    const current = platformMap.get(pp.platform) ?? { views: 0, likes: 0, comments: 0, shares: 0, saves: 0, reach: 0, impressions: 0, postsCount: 0 }
    current.postsCount++
    const a = pp.analytics[0]
    if (a) {
      current.views += a.views
      current.likes += a.likes
      current.comments += a.comments
      current.shares += a.shares
      current.saves += a.saves
      current.reach += a.reach
      current.impressions += a.impressions
    }
    platformMap.set(pp.platform, current)
  }
  const byPlatform = Array.from(platformMap.entries()).map(([platform, stats]) => ({ platform, ...stats }))

  // Top posts by views, then likes
  const topPosts = postPlatforms
    .map((pp) => {
      const a = pp.analytics[0]
      return {
        postId: pp.post.id,
        postPlatformId: pp.id,
        platform: pp.platform,
        title: pp.post.title,
        caption: pp.post.caption,
        thumbnailUrl: pp.post.thumbnailUrl,
        publishedAt: pp.post.publishedAt,
        views: a?.views ?? 0,
        likes: a?.likes ?? 0,
        comments: a?.comments ?? 0,
      }
    })
    .sort((a, b) => b.views - a.views || b.likes - a.likes)
    .slice(0, 20)

  return NextResponse.json({
    data: {
      period,
      kpis: {
        totalViews,
        totalLikes,
        totalComments,
        totalShares,
        publishedPosts: postPlatforms.length,
      },
      engagementByDay,
      byPlatform,
      topPosts,
    },
  })
}
