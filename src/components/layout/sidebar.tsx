'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BarChart3, CalendarDays, FileText, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/calendar', label: 'Calendrier', icon: CalendarDays },
  { href: '/posts', label: 'Publications', icon: FileText },
  { href: '/analytics', label: 'Analytiques', icon: BarChart3 },
  { href: '/settings', label: 'Paramètres', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="bg-sidebar border-sidebar-border flex h-screen w-56 shrink-0 flex-col border-r">
      <div className="border-sidebar-border flex h-14 items-center border-b px-4">
        <span className="text-sidebar-foreground text-sm font-semibold tracking-tight">
          Pala&apos;s Scheduler
        </span>
      </div>

      <nav className="flex flex-1 flex-col gap-1 p-2">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                active
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
