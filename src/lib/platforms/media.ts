import {
  extractKeyFromUrl,
  getAbsolutePublicUrl,
  getFileSizeFromStorage,
  readFileFromStorage,
} from '@/lib/storage'
import type { PublishMedia } from '@/lib/platforms'

const CONTENT_TYPES: Record<string, string> = {
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

function getContentType(key: string): string {
  const extensionIndex = key.lastIndexOf('.')
  if (extensionIndex === -1) return 'application/octet-stream'

  return CONTENT_TYPES[key.slice(extensionIndex).toLowerCase()] ?? 'application/octet-stream'
}

export async function loadPublishMedia(mediaUrls: string[]): Promise<PublishMedia[]> {
  return Promise.all(
    mediaUrls.map(async (url) => {
      const key = extractKeyFromUrl(url)
      if (!key) {
        throw new Error('Média local introuvable')
      }

      return {
        url,
        key,
        publicUrl: getAbsolutePublicUrl(key),
        contentType: getContentType(key),
        size: await getFileSizeFromStorage(key),
        buffer: await readFileFromStorage(key),
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
