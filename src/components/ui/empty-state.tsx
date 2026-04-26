import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

type EmptyStateProps = {
  action?: ReactNode
  className?: string
  description?: string
  icon?: ReactNode
  title: string
}

export function EmptyState({ action, className, description, icon, title }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex min-h-40 flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center',
        className
      )}
    >
      {icon && <div className="text-muted-foreground mb-3">{icon}</div>}
      <h2 className="text-base font-medium">{title}</h2>
      {description && <p className="text-muted-foreground mt-1 max-w-md text-sm">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
