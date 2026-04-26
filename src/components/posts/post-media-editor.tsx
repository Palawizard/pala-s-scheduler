'use client'

import type { UseFormRegisterReturn } from 'react-hook-form'

import { MediaEditorToolbar } from '@/components/posts/media-editor-toolbar'
import { MediaThumbnail } from '@/components/posts/media-thumbnail'
import { useMediaEditor } from '@/components/posts/use-media-editor'
import { ALLOWED_MEDIA_TYPES } from '@/lib/constants'
import { cn } from '@/lib/utils'

type PostMediaEditorProps = {
  caption: string | undefined
  captionRegister: UseFormRegisterReturn
  mediaUrls: string[]
  onCaptionChange: (caption: string) => void
  onMediaUrlsChange: (urls: string[]) => void
}

export function PostMediaEditor({
  caption,
  captionRegister,
  mediaUrls,
  onCaptionChange,
  onMediaUrlsChange,
}: PostMediaEditorProps) {
  const {
    appendEmoji,
    draggingMedia,
    handleMediaFiles,
    handleMediaRemove,
    hashtagCount,
    mediaInputRef,
    setDraggingMedia,
    uploadingMedia,
  } = useMediaEditor({ caption, mediaUrls, onCaptionChange, onMediaUrlsChange })

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
              <MediaThumbnail key={url} url={url} onRemove={handleMediaRemove} />
            ))}
          </div>
        )}
        <MediaEditorToolbar
          captionLength={(caption ?? '').length}
          hashtagCount={hashtagCount}
          onEmojiSelect={appendEmoji}
          onMediaClick={() => mediaInputRef.current?.click()}
          uploadingMedia={uploadingMedia}
        />
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
