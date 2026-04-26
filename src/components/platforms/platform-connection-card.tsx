'use client'

import { useState } from 'react'
import { AlertTriangle } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Spinner } from '@/components/ui/spinner'
import type { Platform } from '@/types'
import { PLATFORM_LABELS, PLATFORM_COLORS, TWITTER_API_COST_NOTICE } from '@/lib/constants'

interface ConnectedAccount {
  id: string
  platform: Platform
  platformUsername: string | null
  platformAvatar: string | null
  tokenExpiry: string | null
  isActive: boolean
}

interface PlatformConnectionCardProps {
  platform: Platform
  account: ConnectedAccount | null
  onConnect: (platform: Platform) => Promise<void>
  onDisconnect: (platform: Platform) => Promise<void>
}

const PLATFORM_INITIALS: Record<Platform, string> = {
  YOUTUBE: 'YT',
  INSTAGRAM: 'IG',
  TIKTOK: 'TK',
  TWITTER: 'X',
}

export function PlatformConnectionCard({
  platform,
  account,
  onConnect,
  onDisconnect,
}: PlatformConnectionCardProps) {
  const [loading, setLoading] = useState(false)

  async function handleConnect() {
    setLoading(true)
    try {
      await onConnect(platform)
    } finally {
      setLoading(false)
    }
  }

  async function handleDisconnect() {
    setLoading(true)
    try {
      await onDisconnect(platform)
    } finally {
      setLoading(false)
    }
  }

  const isExpired = account?.tokenExpiry ? new Date(account.tokenExpiry) < new Date() : false

  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-4">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white"
          style={{ backgroundColor: PLATFORM_COLORS[platform] }}
        >
          {PLATFORM_INITIALS[platform]}
        </div>

        <div className="flex flex-1 flex-col gap-1">
          <span className="text-sm font-medium">{PLATFORM_LABELS[platform]}</span>
          {account ? (
            <div className="flex items-center gap-2">
              <Avatar className="h-5 w-5">
                <AvatarImage src={account.platformAvatar ?? undefined} />
                <AvatarFallback className="text-[10px]">
                  {account.platformUsername?.[0]?.toUpperCase() ?? '?'}
                </AvatarFallback>
              </Avatar>
              <span className="text-muted-foreground text-xs">
                {account.platformUsername ?? 'Compte connecté'}
              </span>
              {isExpired && (
                <span className="rounded bg-red-100 px-1.5 py-0.5 text-[10px] text-red-700">
                  Expiré
                </span>
              )}
            </div>
          ) : (
            <span className="text-muted-foreground text-xs">Non connecté</span>
          )}
          {platform === 'TWITTER' && (
            <span className="flex items-center gap-1 text-xs text-amber-700">
              <AlertTriangle className="h-3 w-3" />
              {TWITTER_API_COST_NOTICE}
            </span>
          )}
        </div>

        {account ? (
          <Button variant="outline" size="sm" onClick={handleDisconnect} disabled={loading}>
            {loading && <Spinner />}
            Déconnecter
          </Button>
        ) : (
          <Button size="sm" onClick={handleConnect} disabled={loading}>
            {loading && <Spinner />}
            Connecter
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
