'use client'

import { useState } from 'react'
import type { UseFormRegisterReturn } from 'react-hook-form'

import type { PlatformSelection } from '@/components/posts/platform-selector'
import {
  GlobalSettingsCard,
  InstagramSettingsCard,
  PostErrorsCard,
  TiktokSettingsCard,
  YoutubeSettingsCard,
} from '@/components/posts/post-settings-cards'
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
      <GlobalSettingsCard
        dateRegister={dateRegister}
        open={openSections.global}
        onToggle={() => toggleSection('global')}
      />

      {instagramSelection && (
        <InstagramSettingsCard
          open={openSections.instagram}
          onToggle={() => toggleSection('instagram')}
          selection={instagramSelection}
        />
      )}

      {tiktokSelection && (
        <TiktokSettingsCard
          open={openSections.tiktok}
          onToggle={() => toggleSection('tiktok')}
          onVisibilityChange={onVisibilityChange}
          selection={tiktokSelection}
        />
      )}

      {youtubeSelection && (
        <YoutubeSettingsCard
          open={openSections.youtube}
          onToggle={() => toggleSection('youtube')}
          onVisibilityChange={onVisibilityChange}
          selection={youtubeSelection}
        />
      )}

      {errorMessages.length > 0 && (
        <PostErrorsCard
          errorMessages={errorMessages}
          open={openSections.errors}
          onToggle={() => toggleSection('errors')}
        />
      )}
    </div>
  )
}
