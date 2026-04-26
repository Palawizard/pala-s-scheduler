'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { withBasePath } from '@/lib/base-path'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

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
      </div>
    </div>
  )
}
