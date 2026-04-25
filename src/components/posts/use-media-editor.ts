'use client'

import { useRef, useState } from 'react'
import { toast } from 'sonner'

import { deleteUploadedMedia, uploadMedia } from '@/lib/media-client'

type UseMediaEditorArgs = {
  caption: string | undefined
  mediaUrls: string[]
  onCaptionChange: (caption: string) => void
  onMediaUrlsChange: (urls: string[]) => void
}

function countHashtags(text: string | undefined): number {
  return text?.match(/#[\p{L}\p{N}_]+/gu)?.length ?? 0
}

export function useMediaEditor({
  caption,
  mediaUrls,
  onCaptionChange,
  onMediaUrlsChange,
}: UseMediaEditorArgs) {
  const mediaInputRef = useRef<HTMLInputElement | null>(null)
  const [draggingMedia, setDraggingMedia] = useState(false)
  const [uploadingMedia, setUploadingMedia] = useState(false)

  async function handleMediaFiles(files: FileList | File[]) {
    const selectedFiles = Array.from(files)
    if (selectedFiles.length === 0) return

    setUploadingMedia(true)
    try {
      const uploadedUrls = await Promise.all(selectedFiles.map(uploadMedia))
      onMediaUrlsChange([...mediaUrls, ...uploadedUrls])
      toast.success('Média ajouté')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Upload impossible')
    } finally {
      setUploadingMedia(false)
      if (mediaInputRef.current) mediaInputRef.current.value = ''
    }
  }

  async function handleMediaRemove(url: string) {
    try {
      await deleteUploadedMedia(url)
      onMediaUrlsChange(mediaUrls.filter((item) => item !== url))
      toast.success('Média supprimé')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Suppression impossible')
    }
  }

  function appendEmoji(emoji: string) {
    onCaptionChange(`${caption ?? ''}${emoji}`)
  }

  return {
    appendEmoji,
    draggingMedia,
    handleMediaFiles,
    handleMediaRemove,
    hashtagCount: countHashtags(caption),
    mediaInputRef,
    setDraggingMedia,
    uploadingMedia,
  }
}
