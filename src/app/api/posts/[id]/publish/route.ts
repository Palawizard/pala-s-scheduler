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

function isLocalhostUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1'
  } catch {
    return false
  }
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
    if (media.length !== 1) return 'TikTok accepte un seul média pour le moment'
    if (!hasVideo && !hasImage) return 'TikTok nécessite une image ou une vidéo'
    if (media[0] && media[0].size > 4 * 1024 * 1024 * 1024) {
      return 'Le média dépasse la limite de 4 Go de TikTok'
    }
    if (media[0]?.contentType.startsWith('image/') && isLocalhostUrl(media[0].publicUrl)) {
      return 'TikTok ne peut pas accéder aux images en localhost — lancez le tunnel HTTPS (pnpm dev:tunnel) et assurez-vous que NEXTAUTH_URL pointe vers le tunnel'
    }
  }

  if (platform === 'INSTAGRAM') {
    if (contentType === 'INSTAGRAM_REEL') {
      if (!hasVideo) return 'Un Reel Instagram nécessite une vidéo'
    } else {
      if (!hasImage) return 'Un post Instagram nécessite une image'
    }
    // Instagram fetches media by URL — a localhost URL is not accessible from their servers
    const mediaUrl = media[0]?.publicUrl ?? ''
    if (isLocalhostUrl(mediaUrl)) {
      return 'Instagram ne peut pas accéder aux médias en localhost — lancez le tunnel HTTPS (pnpm dev:tunnel) et assurez-vous que NEXTAUTH_URL pointe vers le tunnel'
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

const TIKTOK_ERROR_CODES: Record<string, string> = {
  unaudited_client_can_only_post_to_private_accounts:
    'Application TikTok non approuvée — pour tester, passez votre compte TikTok en "Compte privé" dans l\'app TikTok (Profil → Paramètres → Confidentialité)',
  spam_risk_too_many_posts:
    'Trop de publications récentes — attendez quelques heures avant de réessayer',
  spam_risk_user_banned_from_posting: 'Ce compte TikTok est banni de publication',
  video_pull_failed:
    "TikTok n'a pas pu recuperer la video — verifiez que l'URL est accessible publiquement",
  photo_pull_failed:
    "TikTok n'a pas pu recuperer l'image — verifiez que l'URL est accessible publiquement et que le domaine est autorise dans TikTok Developers",
  video_size_check_failed:
    'La vidéo ne respecte pas les contraintes de taille TikTok (9:16 recommandé, 1080p minimum)',
  video_duration_check_failed: 'La durée de la vidéo est hors limites TikTok (15s–10min)',
  access_token_invalid: 'Token TikTok invalide — reconnectez le compte dans les paramètres',
  scope_not_authorized:
    'Permissions TikTok insuffisantes — reconnectez le compte en autorisant toutes les permissions demandées',
}

const YOUTUBE_ERROR_CODES: Record<string, string> = {
  uploadLimitExceeded: "Limite d'upload YouTube atteinte pour aujourd'hui",
  forbidden: "Permissions YouTube insuffisantes — verifiez les droits de l'application Google",
  quotaExceeded: 'Quota YouTube Data API dépassé (10 000 crédits/jour)',
}

const INSTAGRAM_ERROR_CODES: Record<string, string> = {
  '10': "Permissions Instagram insuffisantes — verifiez les droits de l'application Meta",
  '100': 'Paramètre invalide envoyé à Instagram',
  '190': 'Token Instagram expiré ou invalide — reconnectez le compte dans les paramètres',
  '368': 'Ce compte Instagram est temporairement restreint',
}

function extractReadableError(platform: Platform, raw: string): string {
  const label = PLATFORM_LABELS[platform]

  const jsonMatch = raw.match(/\{[\s\S]*\}/)
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]) as Record<string, unknown>
      const errorObj = parsed.error as Record<string, unknown> | undefined

      if (platform === 'TIKTOK' && typeof errorObj?.code === 'string') {
        const known = TIKTOK_ERROR_CODES[errorObj.code]
        if (known) return `TikTok : ${known}`
      }

      if (platform === 'YOUTUBE') {
        const errors = (parsed.error as Record<string, unknown> | undefined)?.errors
        if (Array.isArray(errors)) {
          const firstReason = (errors[0] as Record<string, unknown>)?.reason
          if (typeof firstReason === 'string' && YOUTUBE_ERROR_CODES[firstReason]) {
            return `YouTube : ${YOUTUBE_ERROR_CODES[firstReason]}`
          }
        }
      }

      if (platform === 'INSTAGRAM') {
        const code = String(errorObj?.code ?? parsed.code ?? '')
        if (INSTAGRAM_ERROR_CODES[code]) {
          return `Instagram : ${INSTAGRAM_ERROR_CODES[code]}`
        }
      }

      const msg =
        errorObj?.message ?? errorObj?.description ?? parsed.message ?? parsed.error_description
      if (typeof msg === 'string' && msg.length > 0) {
        return `${label} : ${msg}`
      }
    } catch {
      // not JSON parseable, fall through to keyword detection
    }
  }

  const lower = raw.toLowerCase()
  if (raw.includes('401') || lower.includes('unauthorized') || lower.includes('invalid token')) {
    return `${label} : token invalide ou révoqué — reconnectez le compte dans les paramètres`
  }
  if (raw.includes('403') || lower.includes('forbidden') || lower.includes('permission denied')) {
    return `${label} : permissions insuffisantes — vérifiez les droits de l'application`
  }
  if (raw.includes('429') || lower.includes('rate limit') || lower.includes('too many requests')) {
    return `${label} : limite de requêtes atteinte — réessayez dans quelques minutes`
  }
  if (lower.includes('quota')) {
    return `${label} : quota API dépassé pour aujourd'hui`
  }
  if (
    lower.includes('network') ||
    lower.includes('fetch failed') ||
    lower.includes('econnrefused')
  ) {
    return `${label} : erreur réseau — vérifiez la connexion du serveur`
  }

  return `${label} : ${raw}`
}
