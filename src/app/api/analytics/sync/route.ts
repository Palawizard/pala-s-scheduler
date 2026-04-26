import { NextResponse } from 'next/server'

import { getCurrentUser } from '@/lib/auth'
import { syncUserAnalytics } from '@/lib/analytics/sync'

export async function POST() {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const result = await syncUserAnalytics(user.id)
  return NextResponse.json({ data: result })
}
