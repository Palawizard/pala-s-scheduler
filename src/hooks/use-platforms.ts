'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { withBasePath } from '@/lib/base-path'
import type { Platform } from '@/types'

interface ConnectedPlatform {
  id: string
  platform: Platform
  platformUserId: string
  platformUsername: string | null
  platformAvatar: string | null
  isActive: boolean
  tokenExpiry: string | null
  createdAt: string
}

async function fetchPlatforms(): Promise<ConnectedPlatform[]> {
  const res = await fetch(withBasePath('/api/platforms'))
  if (!res.ok) throw new Error('Failed to fetch platforms')
  const body = (await res.json()) as { data: ConnectedPlatform[] }
  return body.data
}

export function usePlatforms() {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['platforms'],
    queryFn: fetchPlatforms,
  })

  return {
    platforms: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: () => queryClient.invalidateQueries({ queryKey: ['platforms'] }),
  }
}
