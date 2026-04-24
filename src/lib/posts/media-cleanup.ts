import { deleteFile, extractKeyFromUrl } from '@/lib/storage'

export async function deletePostMedia(mediaUrls: string[]): Promise<void> {
  await Promise.allSettled(
    mediaUrls.map(async (url) => {
      const key = extractKeyFromUrl(url)
      if (!key) return

      await deleteFile(key)
    })
  )
}
