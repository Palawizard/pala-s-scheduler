'use client'

import { Check } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { usePlatforms } from '@/hooks/use-platforms'
import {
  PLATFORM_LABELS,
  PLATFORM_VISIBILITY_OPTIONS,
  POST_CONTENT_TYPE_LABELS,
  POST_VISIBILITY_LABELS,
  TWITTER_API_COST_NOTICE,
} from '@/lib/constants'
import { cn } from '@/lib/utils'
import type { Platform, PostContentType, PostVisibility } from '@/types'

export type PlatformSelection = {
  platform: Platform
  contentType?: PostContentType | null
  visibility?: PostVisibility | null
}

type PlatformSelectorProps = {
  value: PlatformSelection[]
  onChange: (platforms: PlatformSelection[]) => void
}

const CONTENT_TYPE_OPTIONS: Partial<Record<Platform, PostContentType[]>> = {
  INSTAGRAM: ['INSTAGRAM_POST', 'INSTAGRAM_REEL'],
  YOUTUBE: ['YOUTUBE_VIDEO', 'YOUTUBE_SHORT'],
}

function getDefaultContentType(platform: Platform): PostContentType | null {
  if (platform === 'YOUTUBE') return 'YOUTUBE_VIDEO'
  if (platform === 'INSTAGRAM') return 'INSTAGRAM_POST'
  return null
}

function getDefaultVisibility(platform: Platform): PostVisibility | null {
  if (platform === 'YOUTUBE' || platform === 'TIKTOK') return 'PUBLIC'
  return null
}

export function PlatformSelector({ value, onChange }: PlatformSelectorProps) {
  const { platforms, isLoading } = usePlatforms()
  const activePlatforms = platforms.filter((platform) => platform.isActive)

  function togglePlatform(platform: Platform) {
    if (value.some((item) => item.platform === platform)) {
      onChange(value.filter((item) => item.platform !== platform))
      return
    }
    onChange([
      ...value,
      {
        platform,
        contentType: getDefaultContentType(platform),
        visibility: getDefaultVisibility(platform),
      },
    ])
  }

  function updateContentType(platform: Platform, contentType: PostContentType) {
    onChange(
      value.map((item) => (item.platform === platform ? { ...item, contentType } : item))
    )
  }

  function updateVisibility(platform: Platform, visibility: PostVisibility) {
    onChange(
      value.map((item) => (item.platform === platform ? { ...item, visibility } : item))
    )
  }

  if (isLoading) {
    return <p className="text-muted-foreground text-sm">Chargement des comptes...</p>
  }

  if (activePlatforms.length === 0) {
    return <p className="text-muted-foreground text-sm">Aucun compte connecté.</p>
  }

  return (
    <div className="grid grid-cols-2 gap-2">
      {activePlatforms.map((account) => {
        const selected = value.find((item) => item.platform === account.platform)
        const contentTypeOptions = CONTENT_TYPE_OPTIONS[account.platform]

        const visibilityOptions = PLATFORM_VISIBILITY_OPTIONS[account.platform]

        return (
          <div key={account.platform} className="space-y-1">
            <Button
              type="button"
              variant="outline"
              className={cn('w-full justify-between', selected && 'border-foreground')}
              onClick={() => togglePlatform(account.platform)}
            >
              <span>{PLATFORM_LABELS[account.platform]}</span>
              {selected && <Check className="h-4 w-4" />}
            </Button>
            {account.platform === 'TWITTER' && (
              <p className="text-xs leading-snug text-amber-700">{TWITTER_API_COST_NOTICE}</p>
            )}
            {selected && contentTypeOptions && (
              <div className="grid grid-cols-2 gap-1">
                {contentTypeOptions.map((contentType) => (
                  <Button
                    key={contentType}
                    type="button"
                    variant="outline"
                    size="sm"
                    className={cn(
                      'h-8 px-2 text-xs',
                      selected.contentType === contentType && 'border-foreground bg-accent'
                    )}
                    onClick={() => updateContentType(account.platform, contentType)}
                  >
                    {POST_CONTENT_TYPE_LABELS[contentType]}
                  </Button>
                ))}
              </div>
            )}
            {selected && visibilityOptions && (
              <div className="grid grid-cols-3 gap-1">
                {visibilityOptions.map((visibility) => (
                  <Button
                    key={visibility}
                    type="button"
                    variant="outline"
                    size="sm"
                    className={cn(
                      'h-8 px-2 text-xs',
                      selected.visibility === visibility && 'border-foreground bg-accent'
                    )}
                    onClick={() => updateVisibility(account.platform, visibility)}
                  >
                    {POST_VISIBILITY_LABELS[visibility]}
                  </Button>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
