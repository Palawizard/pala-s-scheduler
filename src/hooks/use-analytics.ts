'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import type { Platform } from '@/types'

export type AnalyticsKpis = {
  totalViews: number
  totalLikes: number
  totalComments: number
  totalShares: number
  publishedPosts: number
}

export type EngagementDay = {
  date: string
  views: number
  likes: number
  comments: number
}

export type PlatformStats = {
  platform: Platform
  views: number
  likes: number
  comments: number
  shares: number
  saves: number
  reach: number
  impressions: number
  postsCount: number
}

export type TopPost = {
  postId: string
  postPlatformId: string
  platform: Platform
  title: string | null
  caption: string | null
  thumbnailUrl: string | null
  publishedAt: string | null
  views: number
  likes: number
  comments: number
}

export type AnalyticsData = {
  period: number
  kpis: AnalyticsKpis
  engagementByDay: EngagementDay[]
  byPlatform: PlatformStats[]
  topPosts: TopPost[]
}

async function fetchAnalytics(period: number): Promise<AnalyticsData> {
  const res = await fetch(`/api/analytics?period=${period}`)
  const body = (await res.json()) as { data?: AnalyticsData; error?: unknown }
  if (!res.ok) throw new Error(typeof body.error === 'string' ? body.error : 'Erreur analytiques')
  return body.data as AnalyticsData
}

async function triggerSync(): Promise<{ synced: number; skipped: number; errors: number }> {
  const res = await fetch('/api/analytics/sync', { method: 'POST' })
  const body = (await res.json()) as { data?: { synced: number; skipped: number; errors: number }; error?: unknown }
  if (!res.ok) throw new Error(typeof body.error === 'string' ? body.error : 'Synchronisation impossible')
  return body.data!
}

export function useAnalytics(period: number) {
  return useQuery({
    queryKey: ['analytics', period],
    queryFn: () => fetchAnalytics(period),
  })
}

export function useSyncAnalytics() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: triggerSync,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['analytics'] })
    },
  })
}
