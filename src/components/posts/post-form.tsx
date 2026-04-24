'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useRef } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MediaUploader } from '@/components/posts/media-uploader'
import { PlatformSelector, type PlatformSelection } from '@/components/posts/platform-selector'
import { type PostView, useCreatePost, useUpdatePost } from '@/hooks/use-posts'
import { deleteUploadedMedia } from '@/lib/media-client'
import { PLATFORMS, POST_CONTENT_TYPES } from '@/types'

const postFormSchema = z.object({
  title: z.string().trim().min(1, 'Le titre est requis').max(160),
  caption: z.string().trim().max(2200).optional(),
  scheduledAt: z.string().optional(),
  mediaUrls: z.array(z.string()).max(10),
  platforms: z
    .array(
      z.object({
        platform: z.enum(PLATFORMS),
        contentType: z.enum(POST_CONTENT_TYPES).nullable().optional(),
      })
    )
    .min(1, 'Sélectionnez au moins une plateforme'),
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
      platforms: post?.platforms.map((item) => ({
        platform: item.platform,
        contentType: item.contentType,
      })) ?? [],
    },
  })
  const watchedMediaUrls = form.watch('mediaUrls')

  useEffect(() => {
    mediaUrlsRef.current = watchedMediaUrls
  }, [watchedMediaUrls])

  useEffect(() => {
    const initialMediaUrls = initialMediaUrlsRef.current

    return () => {
      if (savedRef.current) return

      const orphanMediaUrls = mediaUrlsRef.current.filter(
        (url) => !initialMediaUrls.has(url)
      )
      Promise.allSettled(orphanMediaUrls.map(deleteUploadedMedia))
    }
  }, [])

  async function handleSubmit(values: PostFormValues) {
    try {
      const payload = {
        title: values.title,
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
    mediaUrlsRef.current = initialMediaUrlsRef.current.size > 0
      ? Array.from(initialMediaUrlsRef.current)
      : []
    savedRef.current = true

    onCancel?.()
  }

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="post-title">
          Titre
        </label>
        <Input id="post-title" {...form.register('title')} placeholder="Titre de la publication" />
        {form.formState.errors.title && (
          <p className="text-sm text-red-600">{form.formState.errors.title.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="post-caption">
          Texte
        </label>
        <textarea
          id="post-caption"
          {...form.register('caption')}
          className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring min-h-28 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
          placeholder="Texte de la publication"
        />
        {form.formState.errors.caption && (
          <p className="text-sm text-red-600">{form.formState.errors.caption.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="post-date">
          Date
        </label>
        <Input id="post-date" type="datetime-local" {...form.register('scheduledAt')} />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Médias</label>
        <Controller
          control={form.control}
          name="mediaUrls"
          render={({ field }) => <MediaUploader value={field.value} onChange={field.onChange} />}
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Plateformes</label>
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
        {form.formState.errors.platforms && (
          <p className="text-sm text-red-600">{form.formState.errors.platforms.message}</p>
        )}
      </div>

      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={handleCancel} disabled={pending}>
            Annuler
          </Button>
        )}
        <Button type="submit" disabled={pending}>
          {pending ? 'Enregistrement...' : 'Enregistrer'}
        </Button>
      </div>
    </form>
  )
}
