'use client'

import { ImageIcon } from 'lucide-react'

import { EmojiPicker } from '@/components/posts/emoji-picker'

type MediaEditorToolbarProps = {
  captionLength: number
  hashtagCount: number
  onEmojiSelect: (emoji: string) => void
  onMediaClick: () => void
  uploadingMedia: boolean
}

export function MediaEditorToolbar({
  captionLength,
  hashtagCount,
  onEmojiSelect,
  onMediaClick,
  uploadingMedia,
}: MediaEditorToolbarProps) {
  return (
    <div className="text-muted-foreground flex h-11 items-center justify-between border-t px-4">
      <div className="flex items-center gap-4">
        <button
          type="button"
          className="hover:text-foreground"
          onClick={onMediaClick}
          disabled={uploadingMedia}
        >
          <ImageIcon className="h-4 w-4" />
        </button>
        <EmojiPicker onSelect={onEmojiSelect} />
      </div>
      <div className="flex items-center gap-3 text-xs">
        <span>{hashtagCount} / 30 #</span>
        <span>{captionLength} / 2000</span>
      </div>
    </div>
  )
}
