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

function buildDayMap(period: number): Map<string, number> {
  const map = new Map<string, number>()
  for (let i = period - 1; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    map.set(toDateString(d), 0)
  }
  return map
}

export async function GET(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const rawPeriod = request.nextUrl.searchParams.get('period')
  const period = [7, 30, 90].includes(Number(rawPeriod)) ? Number(rawPeriod) : 30
  const since = getPeriodStart(period)

  // Account snapshots — latest per platform for current followers
  const snapshots = await db.accountSnapshot.findMany({
    where: { userId: user.id, snapshotDate: { gte: since } },
    orderBy: { snapshotDate: 'asc' },
  })

  // Followers per platform (latest snapshot)
  const latestSnapByPlatform = new Map<Platform, { followers: number; impressions: number }>()
  for (const s of snapshots) {
    latestSnapByPlatform.set(s.platform, { followers: s.followers, impressions: s.impressions })
  }

  // Followers over time (one value per day per platform)
  const followersOverTime: Record<string, Record<string, number>> = {}
  for (const s of snapshots) {
    const date = toDateString(s.snapshotDate)
    if (!followersOverTime[date]) followersOverTime[date] = {}
    followersOverTime[date][s.platform] = s.followers
  }

  // All platform posts in period
  const platformPosts = await db.platformPost.findMany({
    where: { userId: user.id, publishedAt: { gte: since } },
    orderBy: { publishedAt: 'desc' },
  })

  // Interactions by day
  const interactionsByDay = buildDayMap(period)
  for (const p of platformPosts) {
    const date = toDateString(p.publishedAt ?? new Date())
    const existing = interactionsByDay.get(date)
    if (existing !== undefined) {
      interactionsByDay.set(date, existing + p.likes + p.comments + p.shares)
    }
  }

  // Posts count by day
  const postsByDay = buildDayMap(period)
  for (const p of platformPosts) {
    const date = toDateString(p.publishedAt ?? new Date())
    const existing = postsByDay.get(date)
    if (existing !== undefined) postsByDay.set(date, existing + 1)
  }

  // Per platform totals
  const platformTotals = new Map<Platform, { interactions: number; postsCount: number; impressions: number }>()
  for (const p of platformPosts) {
    const current = platformTotals.get(p.platform) ?? { interactions: 0, postsCount: 0, impressions: 0 }
    current.postsCount++
    current.interactions += p.likes + p.comments + p.shares
    current.impressions += p.impressions
    platformTotals.set(p.platform, current)
  }

  return NextResponse.json({
    data: {
      period,
      account: {
        byPlatform: Array.from(latestSnapByPlatform.entries()).map(([platform, s]) => ({ platform, ...s })),
        followersOverTime: Array.from(Object.entries(followersOverTime)).map(([date, platforms]) => ({ date, ...platforms })),
        totalFollowers: Array.from(latestSnapByPlatform.values()).reduce((s, v) => s + v.followers, 0),
        totalImpressions: Array.from(latestSnapByPlatform.values()).reduce((s, v) => s + v.impressions, 0),
      },
      posts: {
        byPlatform: Array.from(platformTotals.entries()).map(([platform, s]) => ({ platform, ...s })),
        interactionsByDay: Array.from(interactionsByDay.entries()).map(([date, value]) => ({ date, value })),
        postsByDay: Array.from(postsByDay.entries()).map(([date, value]) => ({ date, value })),
        totalInteractions: Array.from(platformTotals.values()).reduce((s, v) => s + v.interactions, 0),
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
