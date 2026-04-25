'use client'

import type { ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'

import { cn } from '@/lib/utils'

type SettingsSectionCardProps = {
  children: ReactNode
  open: boolean
  onToggle: () => void
  title: ReactNode
}

export function SettingsSectionCard({ children, onToggle, open, title }: SettingsSectionCardProps) {
  return (
    <div className="rounded-md border bg-white">
      <button
        type="button"
        className="flex w-full items-center justify-between border-b px-4 py-3"
        onClick={onToggle}
      >
        {title}
        <ChevronDown className={cn('h-4 w-4 transition-transform', open && 'rotate-180')} />
      </button>
      {open && children}
    </div>
  )
}
