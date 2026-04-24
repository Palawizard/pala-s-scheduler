import { NextRequest, NextResponse } from 'next/server'

import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { getPlatformClient, type PublishMedia, type PublishPayload } from '@/lib/platforms'
import { loadPublishMedia } from '@/lib/platforms/media'
import { postInclude, serializePost } from '@/lib/posts/serialize'
import { PLATFORM_LABELS } from '@/lib/constants'
import type { Platform, PostContentType } from '@/types'

type RouteContext = {
  params: Promise<{ id: string }>
}

function checkPlatformRequirements(
  platform: Platform,
  contentType: PostContentType | null,
  tokenExpiry: Date | null,
  media: PublishMedia[]
): string | null {
  if (tokenExpiry && tokenExpiry < new Date()) {
    return `Token expiré — reconnectez le compte ${PLATFORM_LABELS[platform]} dans les paramètres`
  }

  const hasVideo = media.some((m) => m.contentType.startsWith('video/'))
  const hasImage = media.some((m) => m.contentType.startsWith('image/'))

  if (platform === 'YOUTUBE') {
    if (!hasVideo) return 'YouTube nécessite une vidéo'
    if (media[0] && media[0].size > 256 * 1024 * 1024 * 1024) {
      return 'La vidéo dépasse la limite de 256 Go de YouTube'
    }
  }

  if (platform === 'TIKTOK') {
    if (!hasVideo) return 'TikTok nécessite une vidéo'
    if (media[0] && media[0].size > 4 * 1024 * 1024 * 1024) {
      return 'La vidéo dépasse la limite de 4 Go de TikTok'
    }
  }

  if (platform === 'INSTAGRAM') {
    if (contentType === 'INSTAGRAM_REEL') {
      if (!hasVideo) return 'Un Reel Instagram nécessite une vidéo'
    } else {
      if (!hasImage) return 'Un post Instagram nécessite une image'
    }
  }

  if (platform === 'TWITTER') {
    const totalSize = media.reduce((sum, m) => sum + m.size, 0)
    if (totalSize > 512 * 1024 * 1024) {
      return 'Le média dépasse la limite de 512 Mo de X'
    }
  }

  return null
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

  let media: PublishMedia[]
  try {
    media = await loadPublishMedia(post.mediaUrls)
  } catch (error) {
    await db.post.update({ where: { id: post.id }, data: { status: 'FAILED' } })
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Impossible de charger les médias' },
      { status: 500 }
    )
  }

  const payload: PublishPayload = {
    postId: post.id,
    userId: user.id,
    title: post.title,
    caption: post.caption,
    hashtags: post.hashtags,
    mediaUrls: post.mediaUrls,
    thumbnailUrl: post.thumbnailUrl,
    contentType: null,
    visibility: null,
    media,
  }

  let successCount = 0

  for (const postPlatform of post.platforms) {
    await db.postPlatform.update({
      where: { id: postPlatform.id },
      data: { status: 'PUBLISHING', errorMessage: null },
    })

    const preflightError = checkPlatformRequirements(
      postPlatform.platform,
      postPlatform.contentType,
      postPlatform.connectedPlatform.tokenExpiry,
      media
    )

    if (preflightError) {
      await db.postPlatform.update({
        where: { id: postPlatform.id },
        data: { status: 'FAILED', errorMessage: preflightError },
      })
      continue
    }

    try {
      const result = await getPlatformClient(postPlatform.platform).publish(
        { ...payload, contentType: postPlatform.contentType, visibility: postPlatform.visibility },
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
      const raw = error instanceof Error ? error.message : 'Publication impossible'
      await db.postPlatform.update({
        where: { id: postPlatform.id },
        data: {
          status: 'FAILED',
          errorMessage: extractReadableError(postPlatform.platform, raw),
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

function extractReadableError(platform: Platform, raw: string): string {
  const label = PLATFORM_LABELS[platform]

  // Try to parse JSON error bodies embedded in the message
  const jsonMatch = raw.match(/\{.*\}/)
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]) as Record<string, unknown>
      const msg =
        (parsed.error as Record<string, unknown> | undefined)?.message ??
        (parsed.error as Record<string, unknown> | undefined)?.description ??
        parsed.message ??
        parsed.error_description
      if (typeof msg === 'string' && msg.length > 0) {
        return `${label} : ${msg}`
      }
    } catch {
      // not parseable, fall through
    }
  }

  if (raw.includes('401') || raw.toLowerCase().includes('unauthorized') || raw.toLowerCase().includes('invalid token')) {
    return `${label} : token invalide ou révoqué — reconnectez le compte dans les paramètres`
  }
  if (raw.includes('403') || raw.toLowerCase().includes('forbidden') || raw.toLowerCase().includes('permission')) {
    return `${label} : permissions insuffisantes — vérifiez les droits de l'application`
  }
  if (raw.includes('429') || raw.toLowerCase().includes('rate limit')) {
    return `${label} : limite de requêtes atteinte — réessayez dans quelques minutes`
  }
  if (raw.toLowerCase().includes('quota')) {
    return `${label} : quota API dépassé pour aujourd'hui`
  }
  if (raw.toLowerCase().includes('network') || raw.toLowerCase().includes('fetch failed')) {
    return `${label} : erreur réseau — vérifiez la connexion du serveur`
  }

  return `${label} : ${raw}`
}
