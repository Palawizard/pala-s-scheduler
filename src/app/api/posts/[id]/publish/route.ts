import { NextRequest, NextResponse } from 'next/server'

import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { getPlatformClient, type PublishPayload } from '@/lib/platforms'
import { loadPublishMedia } from '@/lib/platforms/media'
import { postInclude, serializePost } from '@/lib/posts/serialize'

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function POST(_request: NextRequest, { params }: RouteContext) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const { id } = await params
  const post = await db.post.findFirst({
    where: { id, userId: user.id },
    include: {
      platforms: {
        include: { connectedPlatform: true },
      },
    },
  })

  if (!post) {
    return NextResponse.json({ error: 'Publication introuvable' }, { status: 404 })
  }

  if (post.platforms.length === 0) {
    return NextResponse.json({ error: 'Aucune plateforme sélectionnée' }, { status: 400 })
  }

  await db.post.update({
    where: { id: post.id },
    data: { status: 'PUBLISHING' },
  })

  const media = await loadPublishMedia(post.mediaUrls)
  const payload: PublishPayload = {
    postId: post.id,
    userId: user.id,
    title: post.title,
    caption: post.caption,
    hashtags: post.hashtags,
    mediaUrls: post.mediaUrls,
    thumbnailUrl: post.thumbnailUrl,
    media,
  }

  let successCount = 0

  for (const postPlatform of post.platforms) {
    await db.postPlatform.update({
      where: { id: postPlatform.id },
      data: { status: 'PUBLISHING', errorMessage: null },
    })

    try {
      const result = await getPlatformClient(postPlatform.platform).publish(
        payload,
        postPlatform.connectedPlatform
      )

      await db.postPlatform.update({
        where: { id: postPlatform.id },
        data: {
          status: 'PUBLISHED',
          platformPostId: result.platformPostId,
          publishedAt: new Date(),
          errorMessage: null,
        },
      })
      successCount += 1
    } catch (error) {
      await db.postPlatform.update({
        where: { id: postPlatform.id },
        data: {
          status: 'FAILED',
          errorMessage: error instanceof Error ? error.message : 'Publication impossible',
        },
      })
    }
  }

  const nextStatus = successCount === post.platforms.length ? 'PUBLISHED' : 'FAILED'
  const updatedPost = await db.post.update({
    where: { id: post.id },
    data: {
      status: nextStatus,
      publishedAt: successCount > 0 ? new Date() : null,
    },
    include: postInclude,
  })

  return NextResponse.json({ data: serializePost(updatedPost) })
}
