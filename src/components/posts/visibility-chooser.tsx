'use client'

import { Button } from '@/components/ui/button'
import { POST_VISIBILITY_LABELS } from '@/lib/constants'
import type { Platform, PostVisibility } from '@/types'

type VisibilityChooserProps = {
  label: string
  onChange: (platform: Platform, visibility: PostVisibility) => void
  options: PostVisibility[]
  platform: Platform
  value: PostVisibility | null | undefined
}

export function VisibilityChooser({
  label,
  onChange,
  options,
  platform,
  value,
}: VisibilityChooserProps) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium">{label}</label>
      <div className="flex flex-wrap gap-2">
        {options.map((visibility) => (
          <Button
            key={visibility}
            type="button"
            variant={value === visibility ? 'default' : 'outline'}
            size="sm"
            onClick={() => onChange(platform, visibility)}
          >
            {POST_VISIBILITY_LABELS[visibility]}
          </Button>
        ))}
      </div>
    </div>
  )
}
