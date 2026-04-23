import { createHash, randomBytes } from 'crypto'
import type { NextRequest } from 'next/server'

export function generateState(): string {
  return randomBytes(32).toString('hex')
}

export function generatePKCE(): { verifier: string; challenge: string } {
  const verifier = randomBytes(32).toString('base64url')
  const challenge = createHash('sha256').update(verifier).digest('base64url')
  return { verifier, challenge }
}

export function getStateCookie(request: NextRequest): string | undefined {
  return request.cookies.get('oauth_state')?.value
}

export function getPKCEVerifierCookie(request: NextRequest): string | undefined {
  return request.cookies.get('pkce_verifier')?.value
}
