'use client'

import { useEffect, useRef } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import type { PlatformSelection } from '@/components/posts/platform-selector'
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

export type PostFormValues = z.infer<typeof postFormSchema>

type UsePostFormArgs = {
  initialDate?: Date | null
  onCancel?: () => void
  onSuccess?: () => void
  post?: PostView
}

export function formatDateTimeLocal(date: Date | null | undefined): string {
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

export function usePostForm({ initialDate, onCancel, onSuccess, post }: UsePostFormArgs) {
  const createPost = useCreatePost()
  const updatePost = useUpdatePost()
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
  const youtubeSelection = selectedPlatform(watchedPlatforms, 'YOUTUBE')
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

  function setCaption(caption: string) {
    form.setValue('caption', caption, { shouldDirty: true, shouldValidate: true })
  }

  function setMediaUrls(urls: string[]) {
    form.setValue('mediaUrls', urls, { shouldDirty: true, shouldValidate: true })
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

  return {
    errorMessages,
    form,
    handleCancel,
    handleSubmit,
    instagramSelection: selectedPlatform(watchedPlatforms, 'INSTAGRAM'),
    pending: createPost.isPending || updatePost.isPending,
    previewMediaUrl: watchedMediaUrls[0],
    setCaption,
    setMediaUrls,
    tiktokSelection: selectedPlatform(watchedPlatforms, 'TIKTOK'),
    updatePlatformVisibility,
    watchedCaption,
    watchedMediaUrls,
    watchedPlatforms,
    watchedScheduledAt,
    watchedTitle,
    youtubeSelection,
    hasYoutube: Boolean(youtubeSelection),
  }
}
