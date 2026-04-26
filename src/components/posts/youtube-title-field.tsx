'use client'

import type { FieldError, UseFormRegisterReturn } from 'react-hook-form'

import { Input } from '@/components/ui/input'

type YoutubeTitleFieldProps = {
  error?: FieldError
  register: UseFormRegisterReturn
  title: string | undefined
}

export function YoutubeTitleField({ error, register, title }: YoutubeTitleFieldProps) {
  return (
    <div className="space-y-2 rounded-md border bg-white p-4">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium" htmlFor="post-title">
          Titre YouTube
        </label>
        <span className="text-muted-foreground text-xs">{(title ?? '').length} / 160</span>
      </div>
      <Input id="post-title" {...register} placeholder="Titre de la vidéo" />
      {error && <p className="text-sm text-red-600">{error.message}</p>}
    </div>
  )
}
