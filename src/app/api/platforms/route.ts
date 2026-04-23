import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET() {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
  }

  const platforms = await db.connectedPlatform.findMany({
    where: { userId: user.id },
    select: {
      id: true,
      platform: true,
      platformUserId: true,
      platformUsername: true,
      platformAvatar: true,
      isActive: true,
      tokenExpiry: true,
      createdAt: true,
    },
  })

  return NextResponse.json({ data: platforms })
}
