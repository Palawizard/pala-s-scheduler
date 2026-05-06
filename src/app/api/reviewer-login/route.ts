import { randomBytes } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'

import { db } from '@/lib/db'

const SESSION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60

function getSessionCookieName(): string {
  const useSecureCookie = (process.env.NEXTAUTH_URL ?? '').startsWith('https://')
  return `${useSecureCookie ? '__Secure-' : ''}authjs.session-token`
}

export async function POST(request: NextRequest) {
  const reviewerEmail = process.env.REVIEWER_EMAIL?.trim().toLowerCase()
  const reviewerPassword = process.env.REVIEWER_PASSWORD

  if (!reviewerEmail || !reviewerPassword) {
    return NextResponse.json({ error: 'Acces reviewer non configure' }, { status: 503 })
  }

  const body = (await request.json().catch(() => null)) as { email?: unknown; password?: unknown } | null
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''
  const password = typeof body?.password === 'string' ? body.password : ''

  if (email !== reviewerEmail || password !== reviewerPassword) {
    return NextResponse.json({ error: 'Identifiants invalides' }, { status: 401 })
  }

  const user = await db.user.upsert({
    where: { email: reviewerEmail },
    update: { name: 'TikTok Reviewer', emailVerified: new Date() },
    create: {
      email: reviewerEmail,
      name: 'TikTok Reviewer',
      emailVerified: new Date(),
    },
  })

  await db.session.deleteMany({
    where: {
      userId: user.id,
      expires: { lt: new Date() },
    },
  })

  const expires = new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000)
  const session = await db.session.create({
    data: {
      userId: user.id,
      sessionToken: randomBytes(32).toString('hex'),
      expires,
    },
  })

  const response = NextResponse.json({ ok: true })
  response.cookies.set({
    name: getSessionCookieName(),
    value: session.sessionToken,
    httpOnly: true,
    sameSite: 'lax',
    secure: (process.env.NEXTAUTH_URL ?? '').startsWith('https://'),
    path: '/',
    expires,
    maxAge: SESSION_MAX_AGE_SECONDS,
  })

  return response
}
