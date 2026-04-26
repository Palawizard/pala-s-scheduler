import { NextRequest, NextResponse } from 'next/server'

import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { cancelPostJob } from '@/lib/queue'
import { postInclude, serializePost } from '@/lib/posts/serialize'

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function POST(_request: NextRequest, { params }: RouteContext) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const { id } = await params
  const post = await db.post.findFirst({
    where: { id, userId: user.id },
    select: { id: true, status: true },
  })

  if (!post) {
    return NextResponse.json({ error: 'Publication introuvable' }, { status: 404 })
  }

  if (post.status === 'PUBLISHED' || post.status === 'PUBLISHING') {
    return NextResponse.json({ error: 'Publication non annulable' }, { status: 409 })
  }

  await cancelPostJob(post.id)

  const updatedPost = await db.post.update({
    where: { id: post.id },
    data: { status: 'CANCELLED' },
    include: postInclude,
  })

  return NextResponse.json({ data: serializePost(updatedPost) })
}
