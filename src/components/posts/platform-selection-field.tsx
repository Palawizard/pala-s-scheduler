'use client'

import { Controller, type Control } from 'react-hook-form'

import { PlatformSelector, type PlatformSelection } from '@/components/posts/platform-selector'
import type { PostFormValues } from '@/components/posts/use-post-form'

type PlatformSelectionFieldProps = {
  control: Control<PostFormValues>
}

export function PlatformSelectionField({ control }: PlatformSelectionFieldProps) {
  return (
    <Controller
      control={control}
      name="platforms"
      render={({ field }) => (
        <PlatformSelector value={field.value as PlatformSelection[]} onChange={field.onChange} />
      )}
    />
  )
}
