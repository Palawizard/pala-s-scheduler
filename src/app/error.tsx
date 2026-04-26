'use client'

import { AlertTriangle, RotateCcw } from 'lucide-react'

import { Button } from '@/components/ui/button'

type ErrorPageProps = {
  error: Error & { digest?: string }
  reset: () => void
}

export default function ErrorPage({ reset }: ErrorPageProps) {
  return (
    <main className="bg-background flex min-h-dvh items-center justify-center p-6">
      <div className="flex max-w-md flex-col items-center text-center">
        <div className="bg-muted text-muted-foreground mb-4 rounded-full p-3">
          <AlertTriangle className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-semibold">Une erreur est survenue</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          La page n’a pas pu être affichée. Réessayez dans un instant.
        </p>
        <Button className="mt-6" onClick={reset}>
          <RotateCcw className="h-4 w-4" />
          Réessayer
        </Button>
      </div>
    </main>
  )
}
