import Link from 'next/link'
import { Compass } from 'lucide-react'

import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <main className="bg-background flex min-h-dvh items-center justify-center p-6">
      <div className="flex max-w-md flex-col items-center text-center">
        <div className="bg-muted text-muted-foreground mb-4 rounded-full p-3">
          <Compass className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-semibold">Page introuvable</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          Cette page n’existe pas ou a été déplacée.
        </p>
        <Button asChild className="mt-6">
          <Link href="/calendar">Retour au calendrier</Link>
        </Button>
      </div>
    </main>
  )
}
