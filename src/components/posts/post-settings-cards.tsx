'use client'

import type { UseFormRegisterReturn } from 'react-hook-form'
import { AlertTriangle, ChevronDown, Settings } from 'lucide-react'

import type { PlatformSelection } from '@/components/posts/platform-selector'
import { SettingsSectionCard } from '@/components/posts/settings-section-card'
import { VisibilityChooser } from '@/components/posts/visibility-chooser'
import { Input } from '@/components/ui/input'
import {
  PLATFORM_VISIBILITY_OPTIONS,
  POST_CONTENT_TYPE_LABELS,
  POST_VISIBILITY_LABELS,
} from '@/lib/constants'
import type { Platform, PostVisibility } from '@/types'

type PlatformVisibilityChange = (platform: Platform, visibility: PostVisibility) => void

type SettingsCardProps = {
  onToggle: () => void
  open: boolean
}

type GlobalSettingsCardProps = SettingsCardProps & {
  dateRegister: UseFormRegisterReturn
}

export function GlobalSettingsCard({ dateRegister, onToggle, open }: GlobalSettingsCardProps) {
  return (
    <SettingsSectionCard
      open={open}
      onToggle={onToggle}
      title={
        <div className="flex items-center gap-2 text-sm font-medium">
          <Settings className="h-4 w-4" />
          Réglages globaux
        </div>
      }
    >
      <div className="space-y-3 p-4">
        <label className="mb-2 block text-sm font-medium" htmlFor="post-date">
          Date de publication
        </label>
        <Input id="post-date" type="datetime-local" {...dateRegister} />
      </div>
    </SettingsSectionCard>
  )
}

type InstagramSettingsCardProps = SettingsCardProps & {
  selection: PlatformSelection
}

export function InstagramSettingsCard({ onToggle, open, selection }: InstagramSettingsCardProps) {
  return (
    <SettingsSectionCard
      open={open}
      onToggle={onToggle}
      title={
        <div className="flex items-center gap-2 text-sm font-medium">
          <span className="text-pink-600">Instagram</span>
          <span className="text-muted-foreground text-xs">
            {selection.contentType ? POST_CONTENT_TYPE_LABELS[selection.contentType] : 'Post'}
          </span>
        </div>
      }
    >
      <div className="text-muted-foreground p-4 text-sm">
        La description sera utilisée comme légende Instagram.
      </div>
    </SettingsSectionCard>
  )
}

type TiktokSettingsCardProps = SettingsCardProps & {
  descriptionRegister: UseFormRegisterReturn | null
  onVisibilityChange: PlatformVisibilityChange
  selection: PlatformSelection
}

export function TiktokSettingsCard({
  descriptionRegister,
  onToggle,
  onVisibilityChange,
  open,
  selection,
}: TiktokSettingsCardProps) {
  return (
    <SettingsSectionCard
      open={open}
      onToggle={onToggle}
      title={
        <div className="flex items-center gap-2 text-sm font-medium">
          <span>TikTok</span>
          <span className="text-muted-foreground text-xs">
            {selection.visibility ? POST_VISIBILITY_LABELS[selection.visibility] : 'Public'}
          </span>
        </div>
      }
    >
      <div className="space-y-4 p-4">
        <VisibilityChooser
          label="Visibilité"
          onChange={onVisibilityChange}
          options={PLATFORM_VISIBILITY_OPTIONS.TIKTOK ?? []}
          platform="TIKTOK"
          value={selection.visibility}
        />
        {descriptionRegister && (
          <div className="space-y-1.5">
            <label className="text-sm font-medium" htmlFor="tiktok-description">
              Description (optionnel)
            </label>
            <Input
              id="tiktok-description"
              placeholder="Description affichée sur le post TikTok"
              {...descriptionRegister}
            />
          </div>
        )}
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
    </SettingsSectionCard>
  )
}

type YoutubeSettingsCardProps = SettingsCardProps & {
  onVisibilityChange: PlatformVisibilityChange
  selection: PlatformSelection
}

export function YoutubeSettingsCard({
  onToggle,
  onVisibilityChange,
  open,
  selection,
}: YoutubeSettingsCardProps) {
  return (
    <SettingsSectionCard
      open={open}
      onToggle={onToggle}
      title={
        <div className="flex items-center gap-2 text-sm font-medium">
          <span className="text-red-600">YouTube</span>
          <span className="text-muted-foreground text-xs">
            {selection.contentType ? POST_CONTENT_TYPE_LABELS[selection.contentType] : 'Vidéo'}
          </span>
        </div>
      }
    >
      <div className="grid gap-3 p-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <VisibilityChooser
            label="Confidentialité"
            onChange={onVisibilityChange}
            options={PLATFORM_VISIBILITY_OPTIONS.YOUTUBE ?? []}
            platform="YOUTUBE"
            value={selection.visibility}
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium">Catégorie</label>
          <div className="text-muted-foreground flex h-10 items-center justify-between rounded-md border px-3 text-sm">
            Non renseignée
            <ChevronDown className="h-4 w-4" />
          </div>
        </div>
      </div>
    </SettingsSectionCard>
  )
}

type PostErrorsCardProps = SettingsCardProps & {
  errorMessages: string[]
}

export function PostErrorsCard({ errorMessages, onToggle, open }: PostErrorsCardProps) {
  return (
    <SettingsSectionCard
      open={open}
      onToggle={onToggle}
      title={
        <span className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          {errorMessages.length} erreur{errorMessages.length > 1 ? 's' : ''}
        </span>
      }
    >
      <div className="space-y-2 p-4 text-sm text-red-700">
        {errorMessages.map((message) => (
          <p key={message}>{message}</p>
        ))}
      </div>
    </SettingsSectionCard>
  )
}
