'use client'

import { Smile } from 'lucide-react'

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

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

type EmojiPickerProps = {
  onSelect: (emoji: string) => void
}

export function EmojiPicker({ onSelect }: EmojiPickerProps) {
  return (
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
              onClick={() => onSelect(emoji)}
            >
              {emoji}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
