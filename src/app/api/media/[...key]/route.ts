import { NextRequest, NextResponse } from 'next/server'

import { readFileFromStorage } from '@/lib/storage'

type RouteContext = {
  params: Promise<{ key: string[] }>
}

const CONTENT_TYPES: Record<string, string> = {
  '.gif': 'image/gif',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.mov': 'video/quicktime',
  '.mp4': 'video/mp4',
  '.png': 'image/png',
  '.webm': 'video/webm',
  '.webp': 'image/webp',
}

function getContentType(key: string): string {
  const extension = key.slice(key.lastIndexOf('.')).toLowerCase()
  return CONTENT_TYPES[extension] ?? 'application/octet-stream'
}

export async function GET(_request: NextRequest, { params }: RouteContext) {
  const { key: keyParts } = await params
  const key = keyParts.join('/')

  try {
    const file = await readFileFromStorage(key)

    return new NextResponse(new Uint8Array(file), {
      headers: {
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Content-Type': getContentType(key),
      },
    })
  } catch {
    return NextResponse.json({ error: 'Fichier introuvable' }, { status: 404 })
  }
}
