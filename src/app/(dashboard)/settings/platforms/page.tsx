'use client'

import { Suspense, useEffect, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { toast } from 'sonner'
import { PlatformConnectionCard } from '@/components/platforms/platform-connection-card'
import { PLATFORMS } from '@/types'
import { PLATFORM_LABELS } from '@/lib/constants'
import { usePlatforms } from '@/hooks/use-platforms'
import type { Platform } from '@/types'

const AUTH_URL_MAP: Record<Platform, string> = {
  YOUTUBE: '/api/auth/signin/google',
  INSTAGRAM: '/api/platforms/instagram/auth-url',
  TIKTOK: '/api/platforms/tiktok/auth-url',
  TWITTER: '/api/platforms/twitter/auth-url',
}

const SUCCESS_MESSAGES: Record<string, string> = {
  youtube: 'YouTube connecté avec succès',
  instagram: 'Instagram connecté avec succès',
  tiktok: 'TikTok connecté avec succès',
  twitter: 'X connecté avec succès',
}

const ERROR_MESSAGES: Record<string, string> = {
  access_denied: 'Connexion annulée',
  invalid_state: 'Erreur de sécurité, veuillez réessayer',
  missing_code: 'Code d\'autorisation manquant',
  missing_verifier: 'Erreur PKCE, veuillez réessayer',
  token_exchange: 'Échec de la connexion au compte',
}

function PlatformsSettingsContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { platforms, isLoading, refetch } = usePlatforms()

  useEffect(() => {
    const success = searchParams.get('success')
    const error = searchParams.get('error')

    if (success) {
      toast.success(SUCCESS_MESSAGES[success] ?? 'Compte connecté avec succès')
      router.replace('/settings/platforms')
    } else if (error) {
      toast.error(ERROR_MESSAGES[error] ?? 'Une erreur est survenue')
      router.replace('/settings/platforms')
    }
  }, [searchParams, router])

  const handleConnect = useCallback(async (platform: Platform) => {
    if (platform === 'YOUTUBE') {
      await signIn('google', { callbackUrl: '/settings/platforms?success=youtube' })
      return
    }

    const res = await fetch(AUTH_URL_MAP[platform])
    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as { error?: string } | null
      toast.error(body?.error ?? 'Impossible de lancer la connexion')
      return
    }
    const body = (await res.json()) as { data: { url: string } }
    router.push(body.data.url)
  }, [router])

  const handleDisconnect = useCallback(async (platform: Platform) => {
    const res = await fetch(`/api/platforms/${platform.toLowerCase()}`, { method: 'DELETE' })
    if (!res.ok) {
      toast.error('Échec de la déconnexion')
      return
    }
    toast.success(`${PLATFORM_LABELS[platform]} déconnecté`)
    refetch()
  }, [refetch])

  const accountMap = Object.fromEntries(
    (platforms ?? []).map((p) => [p.platform, p])
  ) as Partial<Record<Platform, (typeof platforms)[number]>>

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">Comptes connectés</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Connectez vos comptes pour planifier et publier du contenu.
        </p>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-3">
          {PLATFORMS.map((p) => (
            <div key={p} className="bg-muted h-20 animate-pulse rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {PLATFORMS.map((platform) => (
            <PlatformConnectionCard
              key={platform}
              platform={platform}
              account={accountMap[platform] ?? null}
              onConnect={handleConnect}
              onDisconnect={handleDisconnect}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default function PlatformsSettingsPage() {
  return (
    <Suspense fallback={null}>
      <PlatformsSettingsContent />
    </Suspense>
  )
}
