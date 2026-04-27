import Link from 'next/link'
import { BarChart3, CalendarDays, FileText, LifeBuoy, LockKeyhole, Shield } from 'lucide-react'

const productLinks = [
  { href: '/calendar', label: 'Calendrier', icon: CalendarDays },
  { href: '/posts', label: 'Publications', icon: FileText },
  { href: '/analytics', label: 'Analytiques', icon: BarChart3 },
]

const legalLinks = [
  { href: '/terms', label: 'Conditions d’utilisation', icon: Shield },
  { href: '/privacy', label: 'Politique de confidentialité', icon: LockKeyhole },
]

export function SiteFooter() {
  return (
    <footer className="border-border bg-background border-t">
      <div className="mx-auto grid w-full max-w-7xl gap-5 px-4 py-5 md:grid-cols-[1.4fr_1fr_1fr] md:px-6">
        <div className="space-y-2">
          <Link href="/calendar" className="text-sm font-semibold tracking-tight">
            Pala&apos;s Scheduler
          </Link>
          <p className="text-muted-foreground max-w-sm text-xs leading-5">
            Planifiez, publiez et suivez vos contenus sur YouTube, Instagram, TikTok et X depuis un
            espace unique.
          </p>
          <p className="text-muted-foreground text-xs">© 2026 Pala&apos;s Scheduler.</p>
        </div>

        <nav aria-label="Navigation du pied de page">
          <h2 className="text-xs font-medium">Produit</h2>
          <ul className="mt-2 space-y-1.5">
            {productLinks.map(({ href, label, icon: Icon }) => (
              <li key={href}>
                <Link
                  href={href}
                  className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2 text-xs transition-colors"
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Informations légales">
          <h2 className="text-xs font-medium">Informations</h2>
          <ul className="mt-2 space-y-1.5">
            {legalLinks.map(({ href, label, icon: Icon }) => (
              <li key={href}>
                <Link
                  href={href}
                  className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2 text-xs transition-colors"
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </Link>
              </li>
            ))}
            <li>
              <a
                href="mailto:palawi.pro@gmail.com"
                className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2 text-xs transition-colors"
              >
                <LifeBuoy className="h-3.5 w-3.5" />
                Contact
              </a>
            </li>
          </ul>
        </nav>
      </div>
    </footer>
  )
}
