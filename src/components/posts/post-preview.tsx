'use client'

import { FileText, ImageIcon, Play } from 'lucide-react'

import type { PostView } from '@/hooks/use-posts'
import { cn } from '@/lib/utils'

type PostPreviewProps = {
  post: PostView
  compact?: boolean
}

function isImageUrl(url: string): boolean {
  return /\.(jpg|jpeg|png|gif|webp)(\?|$)/i.test(url)
}

function isVideoUrl(url: string): boolean {
  return /\.(mp4|mov|webm|avi|mkv|m4v)(\?|$)/i.test(url)
}

export function PostPreview({ post, compact = false }: PostPreviewProps) {
  const mediaUrl = post.thumbnailUrl ?? post.mediaUrls[0]
  const text = post.caption || post.title || 'Aucun texte'

  if (mediaUrl && isImageUrl(mediaUrl)) {
    return (
      <div
        className={cn(
          'shrink-0 overflow-hidden rounded-md border bg-cover bg-center',
          compact ? 'h-8 w-8' : 'h-24 w-24'
        )}
        style={{ backgroundImage: `url(${mediaUrl})` }}
        aria-label="Aperçu image"
      />
    )
  }

  if (mediaUrl && isVideoUrl(mediaUrl)) {
    return (
      <div
        className={cn(
          'relative shrink-0 overflow-hidden rounded-md border bg-black',
          compact ? 'h-8 w-8' : 'h-24 w-24'
        )}
        aria-label="Aperçu vidéo"
      >
        <video
          src={mediaUrl}
          className="h-full w-full object-cover"
          muted
          preload="metadata"
        />
        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
          <Play
            className={cn('fill-white text-white drop-shadow', compact ? 'h-3 w-3' : 'h-5 w-5')}
          />
        </div>
      </div>
    )
  }

  if (mediaUrl) {
    return (
      <div
        className={cn(
          'bg-muted text-muted-foreground flex shrink-0 items-center justify-center rounded-md border',
          compact ? 'h-8 w-8' : 'h-24 w-24'
        )}
        aria-label="Aperçu média"
      >
        <ImageIcon className={compact ? 'h-4 w-4' : 'h-6 w-6'} />
      </div>
    )
  }

  return (
    <div
      className={cn(
        'bg-muted text-muted-foreground flex shrink-0 items-center justify-center rounded-md border',
        compact ? 'h-8 w-8' : 'h-24 w-24 p-2'
      )}
    >
      {compact ? (
        <FileText className="h-4 w-4" />
      ) : (
        <p className="line-clamp-4 text-xs leading-snug">{text}</p>
      )}
    </div>
  )
}
