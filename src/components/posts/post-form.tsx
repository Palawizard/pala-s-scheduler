'use client'

import { PlatformSelectionField } from '@/components/posts/platform-selection-field'
import { PostFormFooter } from '@/components/posts/post-form-footer'
import { PostMediaEditor } from '@/components/posts/post-media-editor'
import { PostPreviewPanel } from '@/components/posts/post-preview-panel'
import { PostSettingsSections } from '@/components/posts/post-settings-sections'
import { usePostForm } from '@/components/posts/use-post-form'
import { YoutubeTitleField } from '@/components/posts/youtube-title-field'
import type { PostView } from '@/hooks/use-posts'

type PostFormProps = {
  initialDate?: Date | null
  post?: PostView
  onCancel?: () => void
  onSuccess?: () => void
}

export function PostForm({ initialDate, post, onCancel, onSuccess }: PostFormProps) {
  const {
    errorMessages,
    form,
    handleCancel,
    handleSubmit,
    hasYoutube,
    instagramSelection,
    pending,
    previewMediaUrl,
    setCaption,
    setMediaUrls,
    tiktokSelection,
    updatePlatformVisibility,
    watchedCaption,
    watchedMediaUrls,
    watchedPlatforms,
    watchedScheduledAt,
    watchedTitle,
    youtubeSelection,
  } = usePostForm({ initialDate, onCancel, onSuccess, post })

  return (
    <form
      onSubmit={form.handleSubmit(handleSubmit)}
      className="flex h-[calc(96vh-92px)] min-h-0 flex-col"
    >
      <div className="grid min-h-0 flex-1 gap-8 overflow-hidden px-6 pb-4 xl:grid-cols-[minmax(0,1fr)_430px]">
        <div className="flex min-h-0 min-w-0 flex-col gap-3">
          <PlatformSelectionField control={form.control} />

          <PostMediaEditor
            caption={watchedCaption}
            captionRegister={form.register('caption')}
            mediaUrls={watchedMediaUrls}
            onCaptionChange={setCaption}
            onMediaUrlsChange={setMediaUrls}
          />

          {hasYoutube && (
            <YoutubeTitleField
              error={form.formState.errors.title}
              register={form.register('title')}
              title={watchedTitle}
            />
          )}

          <PostSettingsSections
            dateRegister={form.register('scheduledAt')}
            errorMessages={errorMessages}
            instagramSelection={instagramSelection}
            onVisibilityChange={updatePlatformVisibility}
            tiktokSelection={tiktokSelection}
            youtubeSelection={youtubeSelection}
          />
        </div>

        <PostPreviewPanel
          caption={watchedCaption}
          mediaUrl={previewMediaUrl}
          platforms={watchedPlatforms}
          title={watchedTitle}
        />
      </div>

      <PostFormFooter
        onCancel={onCancel}
        onCancelClick={handleCancel}
        pending={pending}
        scheduledAt={watchedScheduledAt}
      />
    </form>
  )
}
