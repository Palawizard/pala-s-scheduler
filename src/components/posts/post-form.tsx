'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PlatformSelector } from '@/components/posts/platform-selector'
import { useCreatePost } from '@/hooks/use-posts'
import { PLATFORMS } from '@/types'

const postFormSchema = z.object({
  title: z.string().trim().min(1, 'Le titre est requis').max(160),
  caption: z.string().trim().max(2200).optional(),
  scheduledAt: z.string().optional(),
  platforms: z.array(z.enum(PLATFORMS)).min(1, 'Sélectionnez au moins une plateforme'),
})

type PostFormValues = z.infer<typeof postFormSchema>

type PostFormProps = {
  initialDate?: Date | null
  onSuccess?: () => void
}

function formatDateTimeLocal(date: Date | null | undefined): string {
  if (!date) return ''

  const offset = date.getTimezoneOffset()
  const localDate = new Date(date.getTime() - offset * 60 * 1000)
  return localDate.toISOString().slice(0, 16)
}

export function PostForm({ initialDate, onSuccess }: PostFormProps) {
  const createPost = useCreatePost()
  const form = useForm<PostFormValues>({
    resolver: zodResolver(postFormSchema),
    defaultValues: {
      title: '',
      caption: '',
      scheduledAt: formatDateTimeLocal(initialDate),
      platforms: [],
    },
  })

  async function handleSubmit(values: PostFormValues) {
    try {
      await createPost.mutateAsync({
        title: values.title,
        caption: values.caption || null,
        scheduledAt: values.scheduledAt ? new Date(values.scheduledAt).toISOString() : null,
        platforms: values.platforms,
      })
      toast.success('Publication créée')
      form.reset()
      onSuccess?.()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Création impossible')
    }
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
        <label className="text-sm font-medium">Plateformes</label>
        <Controller
          control={form.control}
          name="platforms"
          render={({ field }) => (
            <PlatformSelector value={field.value} onChange={field.onChange} />
          )}
        />
        {form.formState.errors.platforms && (
          <p className="text-sm text-red-600">{form.formState.errors.platforms.message}</p>
        )}
      </div>

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={createPost.isPending}>
          {createPost.isPending ? 'Enregistrement...' : 'Enregistrer'}
        </Button>
      </div>
    </form>
  )
}
