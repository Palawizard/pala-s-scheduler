'use client'

import { useState } from 'react'
import Link from 'next/link'
import { signIn } from 'next-auth/react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { withBasePath } from '@/lib/base-path'

function LegalLinks() {
  return (
    <nav
      aria-label="Informations légales"
      className="text-muted-foreground flex flex-wrap justify-center gap-x-4 gap-y-2 text-xs"
    >
      <Link href="/terms" className="hover:text-foreground underline underline-offset-4">
        Conditions d’utilisation
      </Link>
      <Link href="/privacy" className="hover:text-foreground underline underline-offset-4">
        Politique de confidentialité
      </Link>
    </nav>
  )
}

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [reviewerEmail, setReviewerEmail] = useState('')
  const [reviewerPassword, setReviewerPassword] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [reviewerLoading, setReviewerLoading] = useState(false)
  const [reviewerError, setReviewerError] = useState('')
  const [showReviewerForm, setShowReviewerForm] = useState(false)

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    await signIn('nodemailer', {
      email,
      callbackUrl: withBasePath('/calendar'),
      redirect: false,
    })
    setSent(true)
    setLoading(false)
  }

  async function handleReviewerLogin(e: React.FormEvent) {
    e.preventDefault()
    setReviewerError('')
    setReviewerLoading(true)

    const response = await fetch(withBasePath('/api/reviewer-login'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: reviewerEmail, password: reviewerPassword }),
    })

    setReviewerLoading(false)

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null
      setReviewerError(payload?.error ?? 'Connexion impossible')
      return
    }

    window.location.href = withBasePath('/calendar')
  }

  if (sent) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="w-full max-w-sm space-y-4 px-4 text-center">
          <h1 className="text-2xl font-semibold">Vérifiez votre boîte mail</h1>
          <p className="text-muted-foreground text-sm">
            Un lien de connexion a été envoyé à <strong>{email}</strong>.
          </p>
          <button
            className="text-muted-foreground text-sm underline underline-offset-4"
            onClick={() => setSent(false)}
          >
            Utiliser une autre adresse
          </button>
          <LegalLinks />
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-sm space-y-6 px-4">
        <div className="text-center">
          <h1 className="text-2xl font-semibold">Connexion</h1>
        </div>

        <form onSubmit={handleEmail} className="space-y-3">
          <Input
            type="email"
            placeholder="votre@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Envoi en cours...' : 'Continuer avec un lien'}
          </Button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="border-border w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-background text-muted-foreground px-2">ou</span>
          </div>
        </div>

        <Button
          variant="outline"
          className="w-full"
          onClick={() => signIn('google', { callbackUrl: withBasePath('/calendar') })}
        >
          Continuer avec Google
        </Button>

        <div className="border-border space-y-3 border-t pt-5">
          <Button
            type="button"
            variant="secondary"
            className="w-full"
            onClick={() => setShowReviewerForm((value) => !value)}
          >
            Accès reviewer TikTok
          </Button>

          {showReviewerForm ? (
            <form onSubmit={handleReviewerLogin} className="space-y-3">
              <Input
                type="email"
                placeholder="Email reviewer"
                value={reviewerEmail}
                onChange={(e) => setReviewerEmail(e.target.value)}
                required
                autoComplete="username"
              />
              <Input
                type="password"
                placeholder="Mot de passe"
                value={reviewerPassword}
                onChange={(e) => setReviewerPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
              {reviewerError ? (
                <p className="text-destructive text-center text-sm">{reviewerError}</p>
              ) : null}
              <Button type="submit" className="w-full" disabled={reviewerLoading}>
                {reviewerLoading ? 'Connexion...' : 'Se connecter'}
              </Button>
            </form>
          ) : null}
        </div>

        <LegalLinks />
      </div>
    </div>
  )
}
