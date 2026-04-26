'use client'

import { AlertTriangle } from 'lucide-react'

import { Button } from '@/components/ui/button'

type GlobalErrorProps = {
  error: Error & { digest?: string }
  reset: () => void
}

export default function GlobalError({ reset }: GlobalErrorProps) {
  return (
    <html lang="fr">
      <body>
        <main className="bg-background text-foreground flex min-h-dvh items-center justify-center p-6">
          <div className="flex max-w-md flex-col items-center text-center">
            <div className="bg-muted text-muted-foreground mb-4 rounded-full p-3">
              <AlertTriangle className="h-8 w-8" />
            </div>
            <h1 className="text-2xl font-semibold">Une erreur est survenue</h1>
            <p className="text-muted-foreground mt-2 text-sm">
              L’application n’a pas pu terminer le chargement.
            </p>
            <Button className="mt-6" onClick={reset}>
              Réessayer
            </Button>
          </div>
        </main>
      </body>
    </html>
  )
}
