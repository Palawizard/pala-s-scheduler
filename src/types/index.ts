export const PLATFORMS = ['YOUTUBE', 'INSTAGRAM', 'TIKTOK', 'TWITTER'] as const
export type Platform = (typeof PLATFORMS)[number]

export const POST_STATUSES = [
  'DRAFT',
  'SCHEDULED',
  'PUBLISHING',
  'PUBLISHED',
  'FAILED',
  'CANCELLED',
] as const
export type PostStatus = (typeof POST_STATUSES)[number]

export const POST_PLATFORM_STATUSES = ['PENDING', 'PUBLISHING', 'PUBLISHED', 'FAILED'] as const
export type PostPlatformStatus = (typeof POST_PLATFORM_STATUSES)[number]

export const POST_CONTENT_TYPES = [
  'YOUTUBE_VIDEO',
  'YOUTUBE_SHORT',
  'INSTAGRAM_POST',
  'INSTAGRAM_REEL',
] as const
export type PostContentType = (typeof POST_CONTENT_TYPES)[number]

export type ConnectedPlatform = {
  id: string
  platform: Platform
  platformUserId: string
  platformUsername: string | null
  platformAvatar: string | null
  isActive: boolean
  tokenExpiry: Date | null
}

export type Post = {
  id: string
  title: string | null
  caption: string | null
  hashtags: string[]
  mediaUrls: string[]
  thumbnailUrl: string | null
  scheduledAt: Date | null
  publishedAt: Date | null
  status: PostStatus
  createdAt: Date
  updatedAt: Date
  platforms: PostPlatformSummary[]
}

export type PostPlatformSummary = {
  id: string
  platform: Platform
  contentType: PostContentType | null
  status: PostPlatformStatus
  platformPostId: string | null
  errorMessage: string | null
  publishedAt: Date | null
}

export type PostAnalytics = {
  id: string
  postPlatformId: string
  views: number
  likes: number
  comments: number
  shares: number
  saves: number
  reach: number
  impressions: number
  fetchedAt: Date
}
