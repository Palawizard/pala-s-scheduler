import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { PLATFORMS } from '@/types'

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ platform: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
  }

  const { platform } = await params
  if (!PLATFORMS.includes(platform as (typeof PLATFORMS)[number])) {
    return NextResponse.json({ error: 'Plateforme invalide' }, { status: 400 })
  }

  const deleted = await db.connectedPlatform.deleteMany({
    where: { userId: session.user.id, platform: platform as (typeof PLATFORMS)[number] },
  })

  if (deleted.count === 0) {
    return NextResponse.json({ error: 'Compte non trouve' }, { status: 404 })
  }

  return NextResponse.json({ data: { success: true } })
}
