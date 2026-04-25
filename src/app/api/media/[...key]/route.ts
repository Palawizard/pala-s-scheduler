import { NextRequest, NextResponse } from 'next/server'

import { readFileFromStorage } from '@/lib/storage'

type RouteContext = {
  params: Promise<{ key: string[] }>
}

const EXTENSION_TYPES: Record<string, string> = {
  '.gif': 'image/gif',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.mov': 'video/quicktime',
  '.mp4': 'video/mp4',
  '.png': 'image/png',
  '.webm': 'video/webm',
  '.webp': 'image/webp',
}

function detectContentType(buf: Buffer, key: string): string {
  // Magic bytes take precedence over file extension
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return 'image/png'
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg'
  if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46) return 'image/gif'
  if (buf[4] === 0x66 && buf[5] === 0x74 && buf[6] === 0x79 && buf[7] === 0x70) return 'video/mp4'
  if (buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46) return 'video/webm'
  const extension = key.slice(key.lastIndexOf('.')).toLowerCase()
  return EXTENSION_TYPES[extension] ?? 'application/octet-stream'
}

export async function GET(_request: NextRequest, { params }: RouteContext) {
  const { key: keyParts } = await params
  const key = keyParts.join('/')

  try {
    const file = await readFileFromStorage(key)

    return new NextResponse(new Uint8Array(file), {
      headers: {
        'Cache-Control': 'no-store, must-revalidate',
        'Content-Type': detectContentType(file, key),
      },
    })
  } catch {
    return NextResponse.json({ error: 'Fichier introuvable' }, { status: 404 })
  }
}
