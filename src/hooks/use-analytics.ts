'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { withBasePath } from '@/lib/base-path'

import type { Platform } from '@/types'

export type AccountPlatformStats = {
  platform: Platform
  followers: number
  impressions: number
}

export type PlatformDay = {
  date: string
  [platform: string]: string | number
}

export type PostPlatformTotals = {
  platform: Platform
  interactions: number
  postsCount: number
  impressions: number
}

export type PlatformPostItem = {
  id: string
  platform: Platform
  caption: string | null
  mediaType: string | null
  thumbnailUrl: string | null
  publishedAt: string | null
  views: number
  likes: number
  comments: number
  shares: number
  saves: number
  impressions: number
  reach: number
}

export type AnalyticsData = {
  period: number
  account: {
    byPlatform: AccountPlatformStats[]
    followersOverTime: PlatformDay[]
    impressionsOverTime: PlatformDay[]
    totalFollowers: number
    totalImpressions: number
  }
  posts: {
    byPlatform: PostPlatformTotals[]
    interactionsByDay: PlatformDay[]
    postsByDay: PlatformDay[]
    totalInteractions: number
    totalPostsCount: number
    items: PlatformPostItem[]
  }
}

async function readJsonSafely<T>(res: Response): Promise<T | null> {
  const text = await res.text()
  if (!text) return null

  try {
    return JSON.parse(text) as T
  } catch {
    return null
  }
}

async function fetchAnalytics(period: number): Promise<AnalyticsData> {
  const res = await fetch(withBasePath(`/api/analytics?period=${period}`))
  const body = await readJsonSafely<{ data?: AnalyticsData; error?: unknown }>(res)
  if (!res.ok) {
    throw new Error(
      typeof body?.error === 'string' ? body.error : 'Erreur analytiques'
    )
  }
  if (!body?.data) {
    throw new Error('Réponse invalide du serveur analytics')
  }
  return body.data as AnalyticsData
}

async function triggerSync(): Promise<{ synced: number; skipped: number; errors: number }> {
  const res = await fetch(withBasePath('/api/analytics/sync'), { method: 'POST' })
  const body = await readJsonSafely<{
    data?: { synced: number; skipped: number; errors: number }
    error?: unknown
  }>(res)
  if (!res.ok) {
    throw new Error(
      typeof body?.error === 'string' ? body.error : 'Synchronisation impossible'
    )
  }
  if (!body?.data) {
    throw new Error('Réponse invalide du serveur pendant la synchronisation')
  }
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
