import { z } from 'zod'

import { appBasePath } from '@/lib/base-path'
import { PLATFORMS, POST_CONTENT_TYPES, POST_STATUSES, POST_VISIBILITIES } from '@/types'

const platformSchema = z.enum(PLATFORMS)
const postContentTypeSchema = z.enum(POST_CONTENT_TYPES)
const postStatusSchema = z.enum(POST_STATUSES)
const postVisibilitySchema = z.enum(POST_VISIBILITIES)

const scheduledAtSchema = z
  .string()
  .datetime()
  .nullable()
  .optional()

function isAppMediaUrl(value: string): boolean {
  if (value.startsWith('/api/media/')) return true
  return Boolean(appBasePath && value.startsWith(`${appBasePath}/api/media/`))
}

const mediaUrlSchema = z
  .string()
  .refine((value) => isAppMediaUrl(value) || z.string().url().safeParse(value).success, {
    message: 'URL de média invalide',
  })

const postPlatformInputSchema = z
  .object({
    platform: platformSchema,
    contentType: postContentTypeSchema.nullable().optional(),
    visibility: postVisibilitySchema.nullable().optional(),
  })
  .superRefine((value, context) => {
    if (value.platform === 'YOUTUBE' && !value.contentType?.startsWith('YOUTUBE_')) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Format YouTube invalide',
        path: ['contentType'],
      })
    }

    if (value.platform === 'INSTAGRAM' && !value.contentType?.startsWith('INSTAGRAM_')) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Format Instagram invalide',
        path: ['contentType'],
      })
    }

    if (value.platform === 'TIKTOK' && value.contentType && !value.contentType.startsWith('TIKTOK_')) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Format TikTok invalide',
        path: ['contentType'],
      })
    }

    if (value.platform === 'TWITTER' && value.contentType) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Format de plateforme invalide',
        path: ['contentType'],
      })
    }

    if (value.visibility === 'UNLISTED' && value.platform !== 'YOUTUBE') {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Non répertorié disponible uniquement sur YouTube',
        path: ['visibility'],
      })
    }

    if (value.visibility === 'FRIENDS_ONLY' && value.platform !== 'TIKTOK') {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Amis uniquement disponible uniquement sur TikTok',
        path: ['visibility'],
      })
    }
  })

export const postQuerySchema = z.object({
  status: postStatusSchema.optional(),
  platform: platformSchema.optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
})

export const createPostSchema = z.object({
  title: z.string().trim().max(160).nullable().optional(),
  caption: z.string().trim().max(2200).nullable().optional(),
  hashtags: z.array(z.string().trim().min(1).max(80)).max(30).default([]),
  mediaUrls: z.array(mediaUrlSchema).max(10).default([]),
  thumbnailUrl: mediaUrlSchema.nullable().optional(),
  scheduledAt: scheduledAtSchema,
  platforms: z.array(postPlatformInputSchema).max(PLATFORMS.length).default([]),
})

export const updatePostSchema = createPostSchema.partial().extend({
  status: postStatusSchema.optional(),
})

export type PostQueryInput = z.infer<typeof postQuerySchema>
export type CreatePostInput = z.infer<typeof createPostSchema>
export type UpdatePostInput = z.infer<typeof updatePostSchema>
