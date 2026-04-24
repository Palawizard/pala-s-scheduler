import { Badge } from '@/components/ui/badge'
import { POST_STATUS_COLORS, POST_STATUS_LABELS } from '@/lib/constants'
import type { PostStatus } from '@/types'

type PostStatusBadgeProps = {
  status: PostStatus
}

export function PostStatusBadge({ status }: PostStatusBadgeProps) {
  return <Badge className={POST_STATUS_COLORS[status]}>{POST_STATUS_LABELS[status]}</Badge>
}
