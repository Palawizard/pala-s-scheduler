import {
  extractKeyFromUrl,
  getAbsolutePublicUrl,
  readFileFromStorage,
} from '@/lib/storage'
import type { PublishMedia } from '@/lib/platforms'

const EXTENSION_TYPES: Record<string, string> = {
  '.avi': 'video/x-msvideo',
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
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return 'image/png'
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg'
  if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46) return 'image/gif'
  if (buf[4] === 0x66 && buf[5] === 0x74 && buf[6] === 0x79 && buf[7] === 0x70) return 'video/mp4'
  const extensionIndex = key.lastIndexOf('.')
  if (extensionIndex === -1) return 'application/octet-stream'
  return EXTENSION_TYPES[key.slice(extensionIndex).toLowerCase()] ?? 'application/octet-stream'
}

export async function loadPublishMedia(mediaUrls: string[]): Promise<PublishMedia[]> {
  return Promise.all(
    mediaUrls.map(async (url) => {
      const key = extractKeyFromUrl(url)
      if (!key) {
        throw new Error('Média introuvable')
      }

      const buffer = await readFileFromStorage(key)
      return {
        url,
        key,
        publicUrl: getAbsolutePublicUrl(key),
        contentType: detectContentType(buffer, key),
        size: buffer.length,
        buffer,
      }
    })
  )
}

export function getFirstImageMedia(media: PublishMedia[]): PublishMedia | null {
  return media.find((item) => item.contentType.startsWith('image/')) ?? null
}

export function getFirstVideoMedia(media: PublishMedia[]): PublishMedia | null {
  return media.find((item) => item.contentType.startsWith('video/')) ?? null
}
