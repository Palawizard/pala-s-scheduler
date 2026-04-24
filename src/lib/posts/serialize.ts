import type { Prisma } from '@prisma/client'

const postWithPlatforms = {
  platforms: {
    select: {
      id: true,
      platform: true,
      contentType: true,
      visibility: true,
      status: true,
      platformPostId: true,
      errorMessage: true,
      publishedAt: true,
      connectedPlatform: {
        select: {
          platformUsername: true,
          platformAvatar: true,
        },
      },
    },
  },
} satisfies Prisma.PostInclude

export type PostWithPlatforms = Prisma.PostGetPayload<{ include: typeof postWithPlatforms }>

export const postInclude = postWithPlatforms

export function serializePost(post: PostWithPlatforms) {
  return {
    id: post.id,
    title: post.title,
    caption: post.caption,
    hashtags: post.hashtags,
    mediaUrls: post.mediaUrls,
    thumbnailUrl: post.thumbnailUrl,
    scheduledAt: post.scheduledAt?.toISOString() ?? null,
    publishedAt: post.publishedAt?.toISOString() ?? null,
    status: post.status,
    createdAt: post.createdAt.toISOString(),
    updatedAt: post.updatedAt.toISOString(),
    platforms: post.platforms.map((platform) => ({
      id: platform.id,
      platform: platform.platform,
      contentType: platform.contentType,
      visibility: platform.visibility,
      status: platform.status,
      platformPostId: platform.platformPostId,
      errorMessage: platform.errorMessage,
      publishedAt: platform.publishedAt?.toISOString() ?? null,
      platformUsername: platform.connectedPlatform.platformUsername,
      platformAvatar: platform.connectedPlatform.platformAvatar,
    })),
  }
}
