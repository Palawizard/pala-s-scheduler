import { NextRequest, NextResponse } from 'next/server'

import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { updatePostSchema } from '@/lib/posts/schemas'
import { postInclude, serializePost } from '@/lib/posts/serialize'
import { deletePostMedia } from '@/lib/posts/media-cleanup'
import type { Platform, PostContentType } from '@/types'

type RouteContext = {
  params: Promise<{ id: string }>
}

function getPostStatus(scheduledAt: string | null | undefined): 'DRAFT' | 'SCHEDULED' {
  return scheduledAt ? 'SCHEDULED' : 'DRAFT'
}

function getDefaultContentType(platform: Platform): PostContentType | null {
  if (platform === 'YOUTUBE') return 'YOUTUBE_VIDEO'
  if (platform === 'INSTAGRAM') return 'INSTAGRAM_POST'
  return null
}

export async function GET(_request: NextRequest, { params }: RouteContext) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const { id } = await params
  const post = await db.post.findFirst({
    where: { id, userId: user.id },
    include: postInclude,
  })

  if (!post) {
    return NextResponse.json({ error: 'Publication introuvable' }, { status: 404 })
  }

  return NextResponse.json({ data: serializePost(post) })
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const { id } = await params
  const existingPost = await db.post.findFirst({
    where: { id, userId: user.id },
    select: { id: true, scheduledAt: true },
  })

  if (!existingPost) {
    return NextResponse.json({ error: 'Publication introuvable' }, { status: 404 })
  }

  const body = (await request.json().catch(() => null)) as unknown
  const parsed = updatePostSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const nextScheduledAt =
    parsed.data.scheduledAt === undefined
      ? existingPost.scheduledAt
      : parsed.data.scheduledAt
        ? new Date(parsed.data.scheduledAt)
        : null

  const connectedPlatforms = parsed.data.platforms
    ? await db.connectedPlatform.findMany({
        where: {
          userId: user.id,
          isActive: true,
          platform: { in: parsed.data.platforms.map((item) => item.platform) },
        },
        select: { id: true, platform: true },
      })
    : null

  if (connectedPlatforms && connectedPlatforms.length !== parsed.data.platforms?.length) {
    return NextResponse.json({ error: 'Plateforme non connectée' }, { status: 400 })
  }

  const post = await db.$transaction(async (tx) => {
    if (connectedPlatforms) {
      await tx.postPlatform.deleteMany({ where: { postId: id } })
    }

    return tx.post.update({
      where: { id },
      data: {
        title: parsed.data.title,
        caption: parsed.data.caption,
        hashtags: parsed.data.hashtags,
        mediaUrls: parsed.data.mediaUrls,
        thumbnailUrl: parsed.data.thumbnailUrl,
        scheduledAt: nextScheduledAt,
        status: parsed.data.status ?? getPostStatus(nextScheduledAt?.toISOString()),
        platforms: connectedPlatforms
          ? {
              create: connectedPlatforms.map((connectedPlatform) => ({
                platform: connectedPlatform.platform,
                contentType:
                  parsed.data.platforms?.find((item) => item.platform === connectedPlatform.platform)
                    ?.contentType ?? getDefaultContentType(connectedPlatform.platform),
                connectedPlatformId: connectedPlatform.id,
              })),
            }
          : undefined,
      },
      include: postInclude,
    })
  })

  return NextResponse.json({ data: serializePost(post) })
}

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const { id } = await params
  const post = await db.post.findFirst({
    where: { id, userId: user.id },
    select: { id: true, mediaUrls: true },
  })

  if (!post) {
    return NextResponse.json({ error: 'Publication introuvable' }, { status: 404 })
  }

  await db.post.delete({ where: { id: post.id } })
  await deletePostMedia(post.mediaUrls)

  return NextResponse.json({ data: { success: true } })
}
