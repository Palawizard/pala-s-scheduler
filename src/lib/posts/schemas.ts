import { z } from 'zod'

import { PLATFORMS, POST_STATUSES } from '@/types'

const platformSchema = z.enum(PLATFORMS)
const postStatusSchema = z.enum(POST_STATUSES)

const scheduledAtSchema = z
  .string()
  .datetime()
  .nullable()
  .optional()

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
  mediaUrls: z.array(z.string().url()).max(10).default([]),
  thumbnailUrl: z.string().url().nullable().optional(),
  scheduledAt: scheduledAtSchema,
  platforms: z.array(platformSchema).max(PLATFORMS.length).default([]),
})

export const updatePostSchema = createPostSchema.partial().extend({
  status: postStatusSchema.optional(),
})

export type PostQueryInput = z.infer<typeof postQuerySchema>
export type CreatePostInput = z.infer<typeof createPostSchema>
export type UpdatePostInput = z.infer<typeof updatePostSchema>
