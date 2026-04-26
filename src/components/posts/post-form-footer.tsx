'use client'

import { Calendar } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { formatDateTimeLocal } from '@/components/posts/use-post-form'

type PostFormFooterProps = {
  onCancel?: () => void
  onCancelClick: () => void
  pending: boolean
  scheduledAt: string | undefined
}

function formatScheduledAtDisplay(scheduledAt: string | undefined): string {
  if (!scheduledAt) return 'Non planifié'

  return formatDateTimeLocal(new Date(scheduledAt)).replace('T', ' ')
}

export function PostFormFooter({
  onCancel,
  onCancelClick,
  pending,
  scheduledAt,
}: PostFormFooterProps) {
  return (
    <div className="flex flex-col-reverse gap-3 border-t bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between md:px-6">
      {onCancel ? (
        <Button type="button" variant="outline" onClick={onCancelClick} disabled={pending}>
          Annuler
        </Button>
      ) : (
        <span />
      )}
      <div className="flex items-center justify-end gap-2">
        <div className="hidden items-center gap-2 rounded-md border px-3 py-2 text-sm sm:flex">
          <Calendar className="h-4 w-4" />
          {formatScheduledAtDisplay(scheduledAt)}
        </div>
        <Button type="submit" disabled={pending}>
          {pending && <Spinner />}
          {pending ? 'Enregistrement...' : 'Programmer'}
        </Button>
      </div>
    </div>
  )
}
