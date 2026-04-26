'use client'

import { useState } from 'react'
import { ImageIcon, MoreHorizontal, Play, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

type MediaThumbnailProps = {
  onRemove: (url: string) => void
  url: string
}

function isImageUrl(url: string): boolean {
  return /\.(jpg|jpeg|png|gif|webp)(\?|$)/i.test(url)
}

function isVideoUrl(url: string): boolean {
  return /\.(mp4|mov|webm|avi|mkv|m4v)(\?|$)/i.test(url)
}

export function MediaThumbnail({ onRemove, url }: MediaThumbnailProps) {
  const [open, setOpen] = useState(false)
  const video = isVideoUrl(url)

  return (
    <>
      <div className="group bg-muted relative h-24 w-20 overflow-hidden rounded-xl border shadow-sm">
        {isImageUrl(url) && (
          <div
            className="h-full w-full bg-cover bg-center"
            style={{ backgroundImage: `url(${url})` }}
          />
        )}
        {video && (
          <>
            <video src={url} className="h-full w-full object-cover" muted preload="metadata" />
            <button
              type="button"
              className="absolute inset-0 flex items-center justify-center bg-black/30 transition-colors hover:bg-black/50"
              onClick={() => setOpen(true)}
            >
              <Play className="h-6 w-6 fill-white text-white drop-shadow" />
            </button>
          </>
        )}
        {!isImageUrl(url) && !video && (
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
              onClick={() => onRemove(url)}
            >
              <Trash2 className="h-4 w-4" />
              Supprimer
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {video && (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-xl p-0 overflow-hidden bg-black">
            <DialogTitle className="sr-only">Aperçu vidéo</DialogTitle>
            <video
              src={url}
              className="max-h-[80vh] w-full"
              controls
              autoPlay
              playsInline
            />
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
