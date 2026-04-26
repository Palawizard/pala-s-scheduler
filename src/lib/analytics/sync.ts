import { db } from '@/lib/db'
import { fetchInstagramStats } from '@/lib/analytics/instagram'
import { fetchTikTokStats } from '@/lib/analytics/tiktok'
import { fetchTwitterStats } from '@/lib/analytics/twitter'
import { fetchYoutubeStats, type PlatformStats } from '@/lib/analytics/youtube'
import type { Platform } from '@/types'

async function fetchStatsForPlatform(
  platform: Platform,
  platformPostId: string,
  connectedPlatform: { accessToken: string; id: string; [key: string]: unknown }
): Promise<PlatformStats | null> {
  // connectedPlatform is cast here — each fetcher only reads accessToken
  const cp = connectedPlatform as Parameters<typeof fetchYoutubeStats>[1]
  switch (platform) {
    case 'YOUTUBE':
      return fetchYoutubeStats(platformPostId, cp)
    case 'INSTAGRAM':
      return fetchInstagramStats(platformPostId, cp)
    case 'TIKTOK':
      return fetchTikTokStats(platformPostId, cp)
    case 'TWITTER':
      return fetchTwitterStats(platformPostId, cp)
  }
}

export type SyncResult = {
  synced: number
  skipped: number
  errors: number
}

export async function syncUserAnalytics(userId: string): Promise<SyncResult> {
  const postPlatforms = await db.postPlatform.findMany({
    where: {
      post: { userId },
      status: 'PUBLISHED',
      platformPostId: { not: null },
    },
    include: { connectedPlatform: true },
  })

  let synced = 0
  let skipped = 0
  let errors = 0

  for (const pp of postPlatforms) {
    if (!pp.platformPostId) continue

    try {
      const stats = await fetchStatsForPlatform(pp.platform, pp.platformPostId, pp.connectedPlatform)

      if (!stats) {
        skipped++
        continue
      }

      await db.postAnalytics.create({
        data: {
          postPlatformId: pp.id,
          views: stats.views,
          likes: stats.likes,
          comments: stats.comments,
          shares: stats.shares,
          saves: stats.saves,
          reach: stats.reach,
          impressions: stats.impressions,
          fetchedAt: new Date(),
        },
      })
      synced++
    } catch (err) {
      console.error(`[analytics] error syncing ${pp.platform} post ${pp.platformPostId}:`, err instanceof Error ? err.message : err)
      errors++
    }
  }

  console.log(`[analytics] user ${userId}: synced=${synced} skipped=${skipped} errors=${errors}`)
  return { synced, skipped, errors }
}

export async function syncAllUsersAnalytics(): Promise<void> {
  const users = await db.user.findMany({ select: { id: true } })
  for (const user of users) {
    await syncUserAnalytics(user.id).catch((err) => {
      console.error(`[analytics] failed to sync user ${user.id}:`, err instanceof Error ? err.message : err)
    })
  }
}
