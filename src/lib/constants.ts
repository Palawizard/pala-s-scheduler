import type { Platform, PostStatus } from '@/types'

export const PLATFORM_LABELS: Record<Platform, string> = {
  YOUTUBE: 'YouTube',
  INSTAGRAM: 'Instagram',
  TIKTOK: 'TikTok',
  TWITTER: 'X',
}

export const PLATFORM_COLORS: Record<Platform, string> = {
  YOUTUBE: '#FF0000',
  INSTAGRAM: '#E1306C',
  TIKTOK: '#000000',
  TWITTER: '#1DA1F2',
}

export const POST_STATUS_LABELS: Record<PostStatus, string> = {
  DRAFT: 'Brouillon',
  SCHEDULED: 'Planifie',
  PUBLISHING: 'En cours',
  PUBLISHED: 'Publie',
  FAILED: 'Echec',
  CANCELLED: 'Annule',
}

export const POST_STATUS_COLORS: Record<PostStatus, string> = {
  DRAFT: 'bg-neutral-100 text-neutral-700',
  SCHEDULED: 'bg-blue-100 text-blue-700',
  PUBLISHING: 'bg-yellow-100 text-yellow-700',
  PUBLISHED: 'bg-green-100 text-green-700',
  FAILED: 'bg-red-100 text-red-700',
  CANCELLED: 'bg-neutral-100 text-neutral-500',
}

export const MAX_MEDIA_SIZE_BYTES = 500 * 1024 * 1024

export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
export const ALLOWED_VIDEO_TYPES = [
  'video/mp4',
  'video/quicktime',
  'video/x-msvideo',
  'video/webm',
]
export const ALLOWED_MEDIA_TYPES = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES]

export const ANALYTICS_SYNC_CRON = '0 */6 * * *'
