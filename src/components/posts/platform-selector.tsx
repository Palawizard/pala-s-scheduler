'use client'

import { Check } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { usePlatforms } from '@/hooks/use-platforms'
import { PLATFORM_LABELS } from '@/lib/constants'
import { cn } from '@/lib/utils'
import type { Platform } from '@/types'

type PlatformSelectorProps = {
  value: Platform[]
  onChange: (platforms: Platform[]) => void
}

export function PlatformSelector({ value, onChange }: PlatformSelectorProps) {
  const { platforms, isLoading } = usePlatforms()
  const activePlatforms = platforms.filter((platform) => platform.isActive)

  function togglePlatform(platform: Platform) {
    if (value.includes(platform)) {
      onChange(value.filter((item) => item !== platform))
      return
    }
    onChange([...value, platform])
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
        const selected = value.includes(account.platform)

        return (
          <Button
            key={account.platform}
            type="button"
            variant="outline"
            className={cn('justify-between', selected && 'border-foreground')}
            onClick={() => togglePlatform(account.platform)}
          >
            <span>{PLATFORM_LABELS[account.platform]}</span>
            {selected && <Check className="h-4 w-4" />}
          </Button>
        )
      })}
    </div>
  )
}
