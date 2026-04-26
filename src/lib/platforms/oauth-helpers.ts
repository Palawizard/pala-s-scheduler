import { createHash, randomBytes } from 'crypto'
import type { NextRequest } from 'next/server'
import { getAbsoluteAppUrl } from '@/lib/base-path'

export function generateState(): string {
  return randomBytes(32).toString('hex')
}

export function generatePKCE(): { verifier: string; challenge: string } {
  const verifier = randomBytes(32).toString('base64url')
  const challenge = createHash('sha256').update(verifier).digest('base64url')
  return { verifier, challenge }
}

export function generateTikTokPKCE(): { verifier: string; challenge: string } {
  const verifier = randomBytes(64).toString('base64url')
  const challenge = createHash('sha256').update(verifier).digest('hex')
  return { verifier, challenge }
}

export function getStateCookie(request: NextRequest): string | undefined {
  return request.cookies.get('oauth_state')?.value
}

export function getPKCEVerifierCookie(request: NextRequest): string | undefined {
  return request.cookies.get('pkce_verifier')?.value
}

export function getAppUrl(path: string): URL {
  return getAbsoluteAppUrl(path)
}
