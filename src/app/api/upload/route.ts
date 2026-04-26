import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { ALLOWED_MEDIA_TYPES, MAX_MEDIA_SIZE_BYTES } from '@/lib/constants'
import { getCurrentUser } from '@/lib/auth'
import { buildMediaKey, deleteFile, extractKeyFromUrl, uploadFile } from '@/lib/storage'

const deleteUploadSchema = z.object({
  url: z.string().min(1),
})

function isAllowedMediaType(type: string): boolean {
  return ALLOWED_MEDIA_TYPES.includes(type)
}

function isUserMediaKey(key: string, userId: string): boolean {
  return key.startsWith(`media/${userId}/`)
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const media = formData.get('file')

    if (!(media instanceof File)) {
      return NextResponse.json({ error: 'Fichier manquant' }, { status: 400 })
    }

    if (!isAllowedMediaType(media.type)) {
      return NextResponse.json({ error: 'Format de fichier non pris en charge' }, { status: 400 })
    }

    if (media.size > MAX_MEDIA_SIZE_BYTES) {
      return NextResponse.json({ error: 'Fichier trop volumineux' }, { status: 400 })
    }

    const key = buildMediaKey(user.id, media.name)
    const buffer = Buffer.from(await media.arrayBuffer())
    const url = await uploadFile(key, buffer, media.type)

    return NextResponse.json({
      data: {
        url,
        key,
        contentType: media.type,
        size: media.size,
      },
    })
  } catch (error) {
    console.error(
      '[upload] failed to upload media:',
      error instanceof Error ? error.message : error
    )
    return NextResponse.json({ error: 'Upload impossible' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  try {
    const body = (await request.json().catch(() => null)) as unknown
    const parsed = deleteUploadSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const key = extractKeyFromUrl(parsed.data.url)
    if (!isUserMediaKey(key, user.id)) {
      return NextResponse.json({ error: 'Fichier introuvable' }, { status: 404 })
    }

    await deleteFile(key)

    return NextResponse.json({ data: { success: true } })
  } catch (error) {
    console.error(
      '[upload] failed to delete media:',
      error instanceof Error ? error.message : error
    )
    return NextResponse.json({ error: 'Suppression impossible' }, { status: 500 })
  }
}
