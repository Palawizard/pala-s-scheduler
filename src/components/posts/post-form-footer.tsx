'use client'

import { Calendar } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { formatDateTimeLocal } from '@/components/posts/use-post-form'

type PostFormFooterProps = {
  onCancel?: () => void
  onCancelClick: () => void
  pending: boolean
  scheduledAt: string | undefined
}

export function PostFormFooter({
  onCancel,
  onCancelClick,
  pending,
  scheduledAt,
}: PostFormFooterProps) {
  return (
    <div className="flex items-center justify-between gap-3 border-t bg-white px-6 py-4">
      {onCancel ? (
        <Button type="button" variant="outline" onClick={onCancelClick} disabled={pending}>
          Annuler
        </Button>
      ) : (
        <span />
      )}
      <div className="flex items-center gap-2">
        <div className="hidden items-center gap-2 rounded-md border px-3 py-2 text-sm sm:flex">
          <Calendar className="h-4 w-4" />
          {scheduledAt ? formatDateTimeLocal(new Date(scheduledAt)) : 'Non planifié'}
        </div>
        <Button type="submit" disabled={pending}>
          {pending ? 'Enregistrement...' : 'Programmer'}
        </Button>
      </div>
    </div>
  )
}
