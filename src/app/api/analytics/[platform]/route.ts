import { NextRequest, NextResponse } from 'next/server'

import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { PLATFORMS } from '@/types'

type RouteContext = { params: Promise<{ platform: string }> }
type AnalyticsTotals = {
  views: number
  likes: number
  comments: number
  shares: number
  saves: number
  reach: number
  impressions: number
}

function getPeriodStart(period: number): Date {
  const d = new Date()
  d.setDate(d.getDate() - period)
  d.setHours(0, 0, 0, 0)
  return d
}

export async function GET(request: NextRequest, { params }: RouteContext) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const { platform: rawPlatform } = await params
  const platform = rawPlatform.toUpperCase()
  if (!PLATFORMS.includes(platform as (typeof PLATFORMS)[number])) {
    return NextResponse.json({ error: 'Plateforme invalide' }, { status: 400 })
  }

  const rawPeriod = request.nextUrl.searchParams.get('period')
  const period = [7, 30, 90].includes(Number(rawPeriod)) ? Number(rawPeriod) : 30
  const since = getPeriodStart(period)

  const postPlatforms = await db.postPlatform.findMany({
    where: {
      platform: platform as (typeof PLATFORMS)[number],
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
    orderBy: { publishedAt: 'desc' },
  })

  const posts = postPlatforms.map((pp: (typeof postPlatforms)[number]) => {
    const a = pp.analytics[0]
    return {
      postId: pp.post.id,
      postPlatformId: pp.id,
      title: pp.post.title,
      caption: pp.post.caption,
      thumbnailUrl: pp.post.thumbnailUrl,
      publishedAt: pp.post.publishedAt,
      views: a?.views ?? 0,
      likes: a?.likes ?? 0,
      comments: a?.comments ?? 0,
      shares: a?.shares ?? 0,
      saves: a?.saves ?? 0,
      reach: a?.reach ?? 0,
      impressions: a?.impressions ?? 0,
    }
  })

  const totals = posts.reduce(
    (acc: AnalyticsTotals, p: (typeof posts)[number]) => ({
      views: acc.views + p.views,
      likes: acc.likes + p.likes,
      comments: acc.comments + p.comments,
      shares: acc.shares + p.shares,
      saves: acc.saves + p.saves,
      reach: acc.reach + p.reach,
      impressions: acc.impressions + p.impressions,
    }),
    { views: 0, likes: 0, comments: 0, shares: 0, saves: 0, reach: 0, impressions: 0 }
  )

  return NextResponse.json({ data: { platform, period, totals, posts } })
}
