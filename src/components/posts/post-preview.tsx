'use client'

import { FileText, ImageIcon, Video } from 'lucide-react'

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
  return /\.(mp4|mov|webm|avi)(\?|$)/i.test(url)
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
          'bg-muted text-muted-foreground flex shrink-0 items-center justify-center rounded-md border',
          compact ? 'h-8 w-8' : 'h-24 w-24'
        )}
        aria-label="Aperçu vidéo"
      >
        <Video className={compact ? 'h-4 w-4' : 'h-6 w-6'} />
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
