'use client'

import { AlertCircle, CheckCircle2, Clock, FileText, Loader2, XCircle } from 'lucide-react'

import { PostPreview } from '@/components/posts/post-preview'
import type { PostView } from '@/hooks/use-posts'
import { PLATFORM_LABELS, POST_STATUS_COLORS, POST_STATUS_LABELS } from '@/lib/constants'
import type { PostStatus } from '@/types'

type PostEventProps = {
  post: PostView
}

const STATUS_ICONS: Record<PostStatus, typeof FileText> = {
  DRAFT: FileText,
  SCHEDULED: Clock,
  PUBLISHING: Loader2,
  PUBLISHED: CheckCircle2,
  FAILED: AlertCircle,
  CANCELLED: XCircle,
}

export function PostEvent({ post }: PostEventProps) {
  const Icon = STATUS_ICONS[post.status]
  const platforms = post.platforms.map((item) => PLATFORM_LABELS[item.platform]).join(', ')

  return (
    <div className="flex min-w-0 items-center gap-1.5">
      <PostPreview post={post} compact />
      <span
        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded ${POST_STATUS_COLORS[post.status]}`}
      >
        <Icon className="h-3 w-3" />
      </span>
      <span className="min-w-0 flex-1 truncate font-medium">
        {post.title || post.caption || 'Publication'}
      </span>
      {platforms && <span className="hidden shrink-0 opacity-80 sm:inline">{platforms}</span>}
      <span className="sr-only">{POST_STATUS_LABELS[post.status]}</span>
    </div>
  )
}
