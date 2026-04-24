import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { PLATFORMS } from '@/types'
import type { Platform } from '@/types'

const PLATFORM_SLUGS: Record<string, Platform> = {
  youtube: 'YOUTUBE',
  instagram: 'INSTAGRAM',
  tiktok: 'TIKTOK',
  twitter: 'TWITTER',
  x: 'TWITTER',
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ platform: string }> }
) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const { platform } = await params
  const normalizedPlatform = PLATFORM_SLUGS[platform.toLowerCase()] ?? platform.toUpperCase()
  if (!PLATFORMS.includes(normalizedPlatform as Platform)) {
    return NextResponse.json({ error: 'Plateforme invalide' }, { status: 400 })
  }

  const deleted = await db.connectedPlatform.deleteMany({
    where: { userId: user.id, platform: normalizedPlatform as Platform },
  })

  if (deleted.count === 0) {
    return NextResponse.json({ error: 'Compte non trouvé' }, { status: 404 })
  }

  return NextResponse.json({ data: { success: true } })
}
