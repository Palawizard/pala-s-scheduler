'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useRef } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { Calendar } from 'lucide-react'
import { toast } from 'sonner'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PostMediaEditor } from '@/components/posts/post-media-editor'
import { PostPreviewPanel } from '@/components/posts/post-preview-panel'
import { PostSettingsSections } from '@/components/posts/post-settings-sections'
import { PlatformSelector, type PlatformSelection } from '@/components/posts/platform-selector'
import { type PostView, useCreatePost, useUpdatePost } from '@/hooks/use-posts'
import { deleteUploadedMedia } from '@/lib/media-client'
import {
  PLATFORMS,
  POST_CONTENT_TYPES,
  POST_VISIBILITIES,
  type Platform,
  type PostVisibility,
} from '@/types'

const postFormSchema = z
  .object({
    title: z.string().trim().max(160).optional(),
    caption: z.string().trim().max(2200).optional(),
    scheduledAt: z.string().optional(),
    mediaUrls: z.array(z.string()).max(10),
    platforms: z
      .array(
        z.object({
          platform: z.enum(PLATFORMS),
          contentType: z.enum(POST_CONTENT_TYPES).nullable().optional(),
          visibility: z.enum(POST_VISIBILITIES).nullable().optional(),
        })
      )
      .min(1, 'Sélectionnez au moins une plateforme'),
  })
  .superRefine((values, context) => {
    if (values.platforms.some((item) => item.platform === 'YOUTUBE') && !values.title) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Le titre YouTube est requis',
        path: ['title'],
      })
    }
  })

type PostFormValues = z.infer<typeof postFormSchema>

type PostFormProps = {
  initialDate?: Date | null
  post?: PostView
  onCancel?: () => void
  onSuccess?: () => void
}

function formatDateTimeLocal(date: Date | null | undefined): string {
  if (!date) return ''

  const offset = date.getTimezoneOffset()
  const localDate = new Date(date.getTime() - offset * 60 * 1000)
  return localDate.toISOString().slice(0, 16)
}

function selectedPlatform(
  platforms: PlatformSelection[],
  platform: string
): PlatformSelection | null {
  return platforms.find((item) => item.platform === platform) ?? null
}

export function PostForm({ initialDate, post, onCancel, onSuccess }: PostFormProps) {
  const createPost = useCreatePost()
  const updatePost = useUpdatePost()
  const pending = createPost.isPending || updatePost.isPending
  const savedRef = useRef(false)
  const mediaUrlsRef = useRef<string[]>(post?.mediaUrls ?? [])
  const initialMediaUrlsRef = useRef(new Set(post?.mediaUrls ?? []))
  const form = useForm<PostFormValues>({
    resolver: zodResolver(postFormSchema),
    defaultValues: {
      title: post?.title ?? '',
      caption: post?.caption ?? '',
      scheduledAt: post?.scheduledAt
        ? formatDateTimeLocal(new Date(post.scheduledAt))
        : formatDateTimeLocal(initialDate),
      mediaUrls: post?.mediaUrls ?? [],
      platforms:
        post?.platforms.map((item) => ({
          platform: item.platform,
          contentType: item.contentType,
          visibility: item.visibility,
        })) ?? [],
    },
  })
  const watchedMediaUrls = form.watch('mediaUrls')
  const watchedCaption = form.watch('caption')
  const watchedTitle = form.watch('title')
  const watchedScheduledAt = form.watch('scheduledAt')
  const watchedPlatforms = form.watch('platforms') as PlatformSelection[]
  const hasYoutube = watchedPlatforms.some((item) => item.platform === 'YOUTUBE')
  const instagramSelection = selectedPlatform(watchedPlatforms, 'INSTAGRAM')
  const tiktokSelection = selectedPlatform(watchedPlatforms, 'TIKTOK')
  const youtubeSelection = selectedPlatform(watchedPlatforms, 'YOUTUBE')
  const previewMediaUrl = watchedMediaUrls[0]
  const errorMessages = [
    form.formState.errors.platforms?.message,
    form.formState.errors.title?.message,
    form.formState.errors.caption?.message,
  ].filter((message): message is string => Boolean(message))

  useEffect(() => {
    mediaUrlsRef.current = watchedMediaUrls
  }, [watchedMediaUrls])

  useEffect(() => {
    const initialMediaUrls = initialMediaUrlsRef.current

    return () => {
      if (savedRef.current) return

      const orphanMediaUrls = mediaUrlsRef.current.filter((url) => !initialMediaUrls.has(url))
      Promise.allSettled(orphanMediaUrls.map(deleteUploadedMedia))
    }
  }, [])

  async function handleSubmit(values: PostFormValues) {
    try {
      const submitsToYoutube = values.platforms.some((item) => item.platform === 'YOUTUBE')
      const payload = {
        title: submitsToYoutube ? values.title || null : null,
        caption: values.caption || null,
        mediaUrls: values.mediaUrls,
        thumbnailUrl: values.mediaUrls[0] ?? null,
        scheduledAt: values.scheduledAt ? new Date(values.scheduledAt).toISOString() : null,
        platforms: values.platforms,
      }

      if (post) {
        await updatePost.mutateAsync({ id: post.id, payload })
        toast.success('Publication modifiée')
      } else {
        await createPost.mutateAsync(payload)
        toast.success('Publication créée')
      }

      savedRef.current = true
      form.reset()
      onSuccess?.()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Enregistrement impossible')
    }
  }

  async function handleCancel() {
    const orphanMediaUrls = form
      .getValues('mediaUrls')
      .filter((url) => !initialMediaUrlsRef.current.has(url))

    await Promise.allSettled(orphanMediaUrls.map(deleteUploadedMedia))
    mediaUrlsRef.current =
      initialMediaUrlsRef.current.size > 0 ? Array.from(initialMediaUrlsRef.current) : []
    savedRef.current = true

    onCancel?.()
  }

  function updatePlatformVisibility(platform: Platform, visibility: PostVisibility) {
    form.setValue(
      'platforms',
      form
        .getValues('platforms')
        .map((item) => (item.platform === platform ? { ...item, visibility } : item)),
      { shouldDirty: true, shouldValidate: true }
    )
  }

  return (
    <form
      onSubmit={form.handleSubmit(handleSubmit)}
      className="flex h-[calc(96vh-92px)] min-h-0 flex-col"
    >
      <div className="grid min-h-0 flex-1 gap-8 overflow-hidden px-6 pb-4 xl:grid-cols-[minmax(0,1fr)_430px]">
        <div className="flex min-h-0 min-w-0 flex-col gap-3">
          <Controller
            control={form.control}
            name="platforms"
            render={({ field }) => (
              <PlatformSelector
                value={field.value as PlatformSelection[]}
                onChange={field.onChange}
              />
            )}
          />

          <PostMediaEditor
            caption={watchedCaption}
            captionRegister={form.register('caption')}
            mediaUrls={watchedMediaUrls}
            onCaptionChange={(caption) =>
              form.setValue('caption', caption, { shouldDirty: true, shouldValidate: true })
            }
            onMediaUrlsChange={(urls) =>
              form.setValue('mediaUrls', urls, { shouldDirty: true, shouldValidate: true })
            }
          />

          {hasYoutube && (
            <div className="space-y-2 rounded-md border bg-white p-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium" htmlFor="post-title">
                  Titre YouTube
                </label>
                <span className="text-muted-foreground text-xs">
                  {(watchedTitle ?? '').length} / 160
                </span>
              </div>
              <Input id="post-title" {...form.register('title')} placeholder="Titre de la vidéo" />
              {form.formState.errors.title && (
                <p className="text-sm text-red-600">{form.formState.errors.title.message}</p>
              )}
            </div>
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

      <div className="flex items-center justify-between gap-3 border-t bg-white px-6 py-4">
        {onCancel ? (
          <Button type="button" variant="outline" onClick={handleCancel} disabled={pending}>
            Annuler
          </Button>
        ) : (
          <span />
        )}
        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-2 rounded-md border px-3 py-2 text-sm sm:flex">
            <Calendar className="h-4 w-4" />
            {watchedScheduledAt
              ? formatDateTimeLocal(new Date(watchedScheduledAt))
              : 'Non planifié'}
          </div>
          <Button type="submit" disabled={pending}>
            {pending ? 'Enregistrement...' : 'Programmer'}
          </Button>
        </div>
      </div>
    </form>
  )
}
