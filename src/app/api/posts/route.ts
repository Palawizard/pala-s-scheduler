import { Prisma } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'

import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { createPostSchema, postQuerySchema } from '@/lib/posts/schemas'
import { postInclude, serializePost } from '@/lib/posts/serialize'
import type { Platform, PostContentType, PostVisibility } from '@/types'

function getPostStatus(scheduledAt: string | null | undefined): 'DRAFT' | 'SCHEDULED' {
  return scheduledAt ? 'SCHEDULED' : 'DRAFT'
}

function getDefaultContentType(platform: Platform): PostContentType | null {
  if (platform === 'YOUTUBE') return 'YOUTUBE_VIDEO'
  if (platform === 'INSTAGRAM') return 'INSTAGRAM_POST'
  if (platform === 'TIKTOK') return 'TIKTOK_VIDEO'
  return null
}

function getDefaultVisibility(platform: Platform): PostVisibility | null {
  if (platform === 'YOUTUBE' || platform === 'TIKTOK') return 'PUBLIC'
  return null
}

export async function GET(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const rawQuery = Object.fromEntries(request.nextUrl.searchParams.entries())
  const parsed = postQuerySchema.safeParse(rawQuery)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const where: Prisma.PostWhereInput = {
    userId: user.id,
    status: parsed.data.status,
    scheduledAt: {
      gte: parsed.data.from ? new Date(parsed.data.from) : undefined,
      lte: parsed.data.to ? new Date(parsed.data.to) : undefined,
    },
    platforms: parsed.data.platform
      ? { some: { platform: parsed.data.platform } }
      : undefined,
  }

  const posts = await db.post.findMany({
    where,
    include: postInclude,
    orderBy: [{ scheduledAt: 'asc' }, { createdAt: 'desc' }],
  })

  return NextResponse.json({ data: posts.map(serializePost) })
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const body = (await request.json().catch(() => null)) as unknown
  const parsed = createPostSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const connectedPlatforms = await db.connectedPlatform.findMany({
    where: {
      userId: user.id,
      isActive: true,
      platform: { in: parsed.data.platforms.map((item) => item.platform) },
    },
    select: { id: true, platform: true },
  })

  if (connectedPlatforms.length !== parsed.data.platforms.length) {
    return NextResponse.json({ error: 'Plateforme non connectée' }, { status: 400 })
  }

  const post = await db.post.create({
    data: {
      userId: user.id,
      title: parsed.data.title ?? null,
      caption: parsed.data.caption ?? null,
      hashtags: parsed.data.hashtags,
      mediaUrls: parsed.data.mediaUrls,
      thumbnailUrl: parsed.data.thumbnailUrl ?? null,
      scheduledAt: parsed.data.scheduledAt ? new Date(parsed.data.scheduledAt) : null,
      status: getPostStatus(parsed.data.scheduledAt),
      platforms: {
        create: connectedPlatforms.map((connectedPlatform) => {
          const input = parsed.data.platforms.find(
            (item) => item.platform === connectedPlatform.platform
          )
          return {
            platform: connectedPlatform.platform,
            contentType: input?.contentType ?? getDefaultContentType(connectedPlatform.platform),
            visibility: input?.visibility ?? getDefaultVisibility(connectedPlatform.platform),
            connectedPlatformId: connectedPlatform.id,
          }
        }),
      },
    },
    include: postInclude,
  })

  return NextResponse.json({ data: serializePost(post) }, { status: 201 })
}
