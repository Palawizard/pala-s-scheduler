'use client'

import { useRef, useState } from 'react'
import type { UseFormRegisterReturn } from 'react-hook-form'
import { ImageIcon, MoreHorizontal, Smile, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ALLOWED_MEDIA_TYPES } from '@/lib/constants'
import { deleteUploadedMedia, uploadMedia } from '@/lib/media-client'
import { cn } from '@/lib/utils'

const EMOJI_OPTIONS = [
  '😀',
  '😂',
  '😍',
  '🔥',
  '✨',
  '🙌',
  '👏',
  '💪',
  '🎉',
  '❤️',
  '👀',
  '✅',
  '💡',
  '🚀',
  '📌',
  '🎬',
]

type PostMediaEditorProps = {
  caption: string | undefined
  captionRegister: UseFormRegisterReturn
  mediaUrls: string[]
  onCaptionChange: (caption: string) => void
  onMediaUrlsChange: (urls: string[]) => void
}

function isImageUrl(url: string): boolean {
  return /\.(jpg|jpeg|png|gif|webp)(\?|$)/i.test(url)
}

function isVideoUrl(url: string): boolean {
  return /\.(mp4|mov|webm|avi|mkv|m4v)(\?|$)/i.test(url)
}

function countHashtags(text: string | undefined): number {
  return text?.match(/#[\p{L}\p{N}_]+/gu)?.length ?? 0
}

export function PostMediaEditor({
  caption,
  captionRegister,
  mediaUrls,
  onCaptionChange,
  onMediaUrlsChange,
}: PostMediaEditorProps) {
  const mediaInputRef = useRef<HTMLInputElement | null>(null)
  const [draggingMedia, setDraggingMedia] = useState(false)
  const [uploadingMedia, setUploadingMedia] = useState(false)
  const hashtagCount = countHashtags(caption)

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

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium" htmlFor="post-caption">
          Description du post
        </label>
        <span className="text-muted-foreground text-xs">{(caption ?? '').length} / 2200</span>
      </div>
      <div
        className={cn(
          'overflow-hidden rounded-md border bg-white transition-colors',
          draggingMedia && 'border-foreground bg-accent/30'
        )}
        onDragEnter={(event) => {
          event.preventDefault()
          setDraggingMedia(true)
        }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={() => setDraggingMedia(false)}
        onDrop={(event) => {
          event.preventDefault()
          setDraggingMedia(false)
          handleMediaFiles(event.dataTransfer.files)
        }}
      >
        <textarea
          id="post-caption"
          {...captionRegister}
          className="placeholder:text-muted-foreground min-h-64 w-full resize-none bg-transparent px-4 py-3 text-sm outline-none xl:min-h-80"
          placeholder="Texte de la publication"
        />
        {mediaUrls.length > 0 && (
          <div className="flex flex-wrap gap-3 px-4 pb-4">
            {mediaUrls.map((url) => (
              <div
                key={url}
                className="group bg-muted relative h-24 w-20 overflow-hidden rounded-xl border shadow-sm"
              >
                {isImageUrl(url) && (
                  <div
                    className="h-full w-full bg-cover bg-center"
                    style={{ backgroundImage: `url(${url})` }}
                  />
                )}
                {isVideoUrl(url) && (
                  <video
                    src={url}
                    className="h-full w-full object-cover"
                    muted
                    preload="metadata"
                  />
                )}
                {!isImageUrl(url) && !isVideoUrl(url) && (
                  <div className="flex h-full w-full items-center justify-center">
                    <ImageIcon className="text-muted-foreground h-5 w-5" />
                  </div>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="absolute top-1 right-1 h-7 w-7 rounded-full bg-white p-0"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      className="text-red-600 focus:text-red-600"
                      onClick={() => handleMediaRemove(url)}
                    >
                      <Trash2 className="h-4 w-4" />
                      Supprimer
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
          </div>
        )}
        <div className="text-muted-foreground flex h-11 items-center justify-between border-t px-4">
          <div className="flex items-center gap-4">
            <button
              type="button"
              className="hover:text-foreground"
              onClick={() => mediaInputRef.current?.click()}
              disabled={uploadingMedia}
            >
              <ImageIcon className="h-4 w-4" />
            </button>
            <Popover>
              <PopoverTrigger asChild>
                <button type="button" className="hover:text-foreground">
                  <Smile className="h-4 w-4" />
                </button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-56 p-2">
                <div className="grid grid-cols-4 gap-1">
                  {EMOJI_OPTIONS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      className="hover:bg-accent flex h-10 items-center justify-center rounded-md text-xl"
                      onClick={() => appendEmoji(emoji)}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span>{hashtagCount} / 30 #</span>
            <span>{(caption ?? '').length} / 2000</span>
          </div>
        </div>
        <input
          ref={mediaInputRef}
          type="file"
          className="hidden"
          accept={ALLOWED_MEDIA_TYPES.join(',')}
          multiple
          onChange={(event) => {
            if (event.target.files) handleMediaFiles(event.target.files)
          }}
        />
      </div>
    </div>
  )
}
