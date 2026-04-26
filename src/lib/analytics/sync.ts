import type { ConnectedPlatform } from '@prisma/client'

import { db } from '@/lib/db'
import {
  fetchInstagramAccountStats,
  fetchTikTokAccountStats,
  fetchTwitterAccountStats,
  fetchYoutubeAccountStats,
} from '@/lib/analytics/account'
import { fetchInstagramStats } from '@/lib/analytics/instagram'
import {
  fetchInstagramPosts,
  fetchTikTokPosts,
  fetchTwitterPosts,
  fetchYoutubePosts,
} from '@/lib/analytics/media'
import { fetchTikTokStats } from '@/lib/analytics/tiktok'
import { fetchTwitterStats } from '@/lib/analytics/twitter'
import { fetchYoutubeStats, type PlatformStats } from '@/lib/analytics/youtube'
import type { Platform } from '@/types'

async function fetchPostStats(
  platform: Platform,
  platformPostId: string,
  connectedPlatform: ConnectedPlatform
): Promise<PlatformStats | null> {
  switch (platform) {
    case 'YOUTUBE':
      return fetchYoutubeStats(platformPostId, connectedPlatform)
    case 'INSTAGRAM':
      return fetchInstagramStats(platformPostId, connectedPlatform)
    case 'TIKTOK':
      return fetchTikTokStats(platformPostId, connectedPlatform)
    case 'TWITTER':
      return fetchTwitterStats(platformPostId, connectedPlatform)
  }
}

async function syncAccountSnapshot(
  userId: string,
  platform: Platform,
  connectedPlatform: ConnectedPlatform
): Promise<void> {
  let stats = null
  switch (platform) {
    case 'YOUTUBE':
      stats = await fetchYoutubeAccountStats(connectedPlatform)
      break
    case 'INSTAGRAM':
      stats = await fetchInstagramAccountStats(connectedPlatform)
      break
    case 'TIKTOK':
      stats = await fetchTikTokAccountStats(connectedPlatform)
      break
    case 'TWITTER':
      stats = await fetchTwitterAccountStats(connectedPlatform)
      break
  }
  if (!stats) return

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  await db.accountSnapshot.upsert({
    where: { userId_platform_snapshotDate: { userId, platform, snapshotDate: today } },
    create: { userId, platform, snapshotDate: today, ...stats },
    update: { ...stats, fetchedAt: new Date() },
  })
}

async function syncPlatformPosts(
  userId: string,
  platform: Platform,
  connectedPlatform: ConnectedPlatform
): Promise<void> {
  let posts: Awaited<ReturnType<typeof fetchYoutubePosts>> = []
  switch (platform) {
    case 'YOUTUBE':
      posts = await fetchYoutubePosts(connectedPlatform)
      break
    case 'INSTAGRAM':
      posts = await fetchInstagramPosts(connectedPlatform)
      break
    case 'TWITTER':
      posts = await fetchTwitterPosts(connectedPlatform)
      break
    case 'TIKTOK':
      posts = await fetchTikTokPosts(connectedPlatform)
      break
  }

  for (const post of posts) {
    await db.platformPost.upsert({
      where: {
        userId_platform_platformPostId: { userId, platform, platformPostId: post.platformPostId },
      },
      create: { userId, platform, ...post },
      update: {
        caption: post.caption,
        thumbnailUrl: post.thumbnailUrl,
        views: post.views,
        likes: post.likes,
        comments: post.comments,
        shares: post.shares,
        impressions: post.impressions,
        reach: post.reach,
        fetchedAt: new Date(),
      },
    })
  }
}

export type SyncResult = {
  synced: number
  skipped: number
  errors: number
}

export async function syncUserAnalytics(userId: string): Promise<SyncResult> {
  const connectedPlatforms = await db.connectedPlatform.findMany({
    where: { userId, isActive: true },
  })

  let synced = 0
  let skipped = 0
  let errors = 0

  for (const cp of connectedPlatforms) {
    try {
      await syncAccountSnapshot(userId, cp.platform, cp)
    } catch (err) {
      console.error(
        `[analytics] account snapshot failed for ${cp.platform}:`,
        err instanceof Error ? err.message : err
      )
      errors++
    }

    try {
      await syncPlatformPosts(userId, cp.platform, cp)
    } catch (err) {
      console.error(
        `[analytics] platform posts sync failed for ${cp.platform}:`,
        err instanceof Error ? err.message : err
      )
      errors++
    }
  }

  // Sync PostAnalytics for posts published via our app
  const postPlatforms = await db.postPlatform.findMany({
    where: {
      post: { userId },
      status: 'PUBLISHED',
      platformPostId: { not: null },
    },
    include: { connectedPlatform: true },
  })

  for (const pp of postPlatforms) {
    if (!pp.platformPostId) continue
    try {
      const stats = await fetchPostStats(pp.platform, pp.platformPostId, pp.connectedPlatform)
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
      console.error(
        `[analytics] post stats failed for ${pp.platform}/${pp.platformPostId}:`,
        err instanceof Error ? err.message : err
      )
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
      console.error(
        `[analytics] failed to sync user ${user.id}:`,
        err instanceof Error ? err.message : err
      )
    })
  }
}
