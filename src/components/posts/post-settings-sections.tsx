'use client'

import { useState } from 'react'
import type { UseFormRegisterReturn } from 'react-hook-form'
import { AlertTriangle, ChevronDown, Settings } from 'lucide-react'

import type { PlatformSelection } from '@/components/posts/platform-selector'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  PLATFORM_VISIBILITY_OPTIONS,
  POST_CONTENT_TYPE_LABELS,
  POST_VISIBILITY_LABELS,
} from '@/lib/constants'
import { cn } from '@/lib/utils'
import type { Platform, PostVisibility } from '@/types'

type SettingsSection = 'global' | 'instagram' | 'tiktok' | 'youtube' | 'errors'

type PostSettingsSectionsProps = {
  dateRegister: UseFormRegisterReturn
  errorMessages: string[]
  instagramSelection: PlatformSelection | null
  onVisibilityChange: (platform: Platform, visibility: PostVisibility) => void
  tiktokSelection: PlatformSelection | null
  youtubeSelection: PlatformSelection | null
}

export function PostSettingsSections({
  dateRegister,
  errorMessages,
  instagramSelection,
  onVisibilityChange,
  tiktokSelection,
  youtubeSelection,
}: PostSettingsSectionsProps) {
  const [openSections, setOpenSections] = useState<Record<SettingsSection, boolean>>({
    errors: true,
    global: true,
    instagram: true,
    tiktok: true,
    youtube: true,
  })

  function toggleSection(section: SettingsSection) {
    setOpenSections((current) => ({ ...current, [section]: !current[section] }))
  }

  return (
    <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-2">
      <div className="rounded-md border bg-white">
        <button
          type="button"
          className="flex w-full items-center justify-between border-b px-4 py-3"
          onClick={() => toggleSection('global')}
        >
          <div className="flex items-center gap-2 text-sm font-medium">
            <Settings className="h-4 w-4" />
            Réglages globaux
          </div>
          <ChevronDown
            className={cn('h-4 w-4 transition-transform', openSections.global && 'rotate-180')}
          />
        </button>
        {openSections.global && (
          <div className="space-y-3 p-4">
            <label className="mb-2 block text-sm font-medium" htmlFor="post-date">
              Date de publication
            </label>
            <Input id="post-date" type="datetime-local" {...dateRegister} />
          </div>
        )}
      </div>

      {instagramSelection && (
        <div className="rounded-md border bg-white">
          <button
            type="button"
            className="flex w-full items-center justify-between border-b px-4 py-3"
            onClick={() => toggleSection('instagram')}
          >
            <div className="flex items-center gap-2 text-sm font-medium">
              <span className="text-pink-600">Instagram</span>
              <span className="text-muted-foreground text-xs">
                {instagramSelection.contentType
                  ? POST_CONTENT_TYPE_LABELS[instagramSelection.contentType]
                  : 'Post'}
              </span>
            </div>
            <ChevronDown
              className={cn('h-4 w-4 transition-transform', openSections.instagram && 'rotate-180')}
            />
          </button>
          {openSections.instagram && (
            <div className="text-muted-foreground p-4 text-sm">
              La description sera utilisée comme légende Instagram.
            </div>
          )}
        </div>
      )}

      {tiktokSelection && (
        <div className="rounded-md border bg-white">
          <button
            type="button"
            className="flex w-full items-center justify-between border-b px-4 py-3"
            onClick={() => toggleSection('tiktok')}
          >
            <div className="flex items-center gap-2 text-sm font-medium">
              <span>TikTok</span>
              <span className="text-muted-foreground text-xs">
                {tiktokSelection.visibility
                  ? POST_VISIBILITY_LABELS[tiktokSelection.visibility]
                  : 'Public'}
              </span>
            </div>
            <ChevronDown
              className={cn('h-4 w-4 transition-transform', openSections.tiktok && 'rotate-180')}
            />
          </button>
          {openSections.tiktok && (
            <div className="space-y-4 p-4">
              <div>
                <label className="mb-2 block text-sm font-medium">Visibilité</label>
                <div className="flex flex-wrap gap-2">
                  {PLATFORM_VISIBILITY_OPTIONS.TIKTOK?.map((visibility) => (
                    <Button
                      key={visibility}
                      type="button"
                      variant={tiktokSelection.visibility === visibility ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => onVisibilityChange('TIKTOK', visibility)}
                    >
                      {POST_VISIBILITY_LABELS[visibility]}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                {['Commentaires', 'Duo', 'Collage'].map((label) => (
                  <div key={label} className="flex items-center gap-2 text-sm">
                    <span className="h-4 w-8 rounded-full bg-blue-500 p-0.5">
                      <span className="block h-3 w-3 translate-x-4 rounded-full bg-white" />
                    </span>
                    {label}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {youtubeSelection && (
        <div className="rounded-md border bg-white">
          <button
            type="button"
            className="flex w-full items-center justify-between border-b px-4 py-3"
            onClick={() => toggleSection('youtube')}
          >
            <div className="flex items-center gap-2 text-sm font-medium">
              <span className="text-red-600">YouTube</span>
              <span className="text-muted-foreground text-xs">
                {youtubeSelection.contentType
                  ? POST_CONTENT_TYPE_LABELS[youtubeSelection.contentType]
                  : 'Vidéo'}
              </span>
            </div>
            <ChevronDown
              className={cn('h-4 w-4 transition-transform', openSections.youtube && 'rotate-180')}
            />
          </button>
          {openSections.youtube && (
            <div className="grid gap-3 p-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-2 block text-sm font-medium">Confidentialité</label>
                <div className="flex flex-wrap gap-2">
                  {PLATFORM_VISIBILITY_OPTIONS.YOUTUBE?.map((visibility) => (
                    <Button
                      key={visibility}
                      type="button"
                      variant={youtubeSelection.visibility === visibility ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => onVisibilityChange('YOUTUBE', visibility)}
                    >
                      {POST_VISIBILITY_LABELS[visibility]}
                    </Button>
                  ))}
                </div>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">Catégorie</label>
                <div className="text-muted-foreground flex h-10 items-center justify-between rounded-md border px-3 text-sm">
                  Non renseignée
                  <ChevronDown className="h-4 w-4" />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {errorMessages.length > 0 && (
        <div className="rounded-md border border-red-200 bg-red-50">
          <button
            type="button"
            className="flex w-full items-center justify-between border-b border-red-200 px-4 py-3 text-sm font-medium text-red-700"
            onClick={() => toggleSection('errors')}
          >
            <span className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              {errorMessages.length} erreur{errorMessages.length > 1 ? 's' : ''}
            </span>
            <ChevronDown
              className={cn('h-4 w-4 transition-transform', openSections.errors && 'rotate-180')}
            />
          </button>
          {openSections.errors && (
            <div className="space-y-2 p-4 text-sm text-red-700">
              {errorMessages.map((message) => (
                <p key={message}>{message}</p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
