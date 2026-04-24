'use client'

import { useRef, useState } from 'react'
import { ImageIcon, Trash2, Upload } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { ALLOWED_MEDIA_TYPES } from '@/lib/constants'
import { cn } from '@/lib/utils'

type MediaUploaderProps = {
  value: string[]
  onChange: (urls: string[]) => void
}

async function uploadMedia(file: File): Promise<string> {
  const formData = new FormData()
  formData.append('file', file)

  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  })
  const body = (await response.json().catch(() => null)) as
    | { data?: { url: string }; error?: unknown }
    | null

  if (!response.ok) {
    throw new Error(typeof body?.error === 'string' ? body.error : 'Upload impossible')
  }

  if (!body?.data?.url) {
    throw new Error('Upload impossible')
  }

  return body.data.url
}

async function deleteMedia(url: string): Promise<void> {
  const response = await fetch('/api/upload', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  })

  if (!response.ok) {
    throw new Error('Suppression impossible')
  }
}

export function MediaUploader({ value, onChange }: MediaUploaderProps) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)

  async function handleFiles(files: FileList | File[]) {
    const selectedFiles = Array.from(files)
    if (selectedFiles.length === 0) return

    setUploading(true)
    try {
      const uploadedUrls = await Promise.all(selectedFiles.map(uploadMedia))
      onChange([...value, ...uploadedUrls])
      toast.success('Média ajouté')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Upload impossible')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  async function handleRemove(url: string) {
    try {
      await deleteMedia(url)
      onChange(value.filter((item) => item !== url))
      toast.success('Média supprimé')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Suppression impossible')
    }
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        className={cn(
          'border-input bg-background hover:bg-accent flex w-full flex-col items-center justify-center gap-2 rounded-md border border-dashed p-5 text-center text-sm transition-colors',
          dragging && 'border-foreground bg-accent'
        )}
        onClick={() => inputRef.current?.click()}
        onDragEnter={(event) => {
          event.preventDefault()
          setDragging(true)
        }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault()
          setDragging(false)
          handleFiles(event.dataTransfer.files)
        }}
        disabled={uploading}
      >
        <Upload className="text-muted-foreground h-5 w-5" />
        <span>{uploading ? 'Upload en cours...' : 'Déposer ou choisir un média'}</span>
      </button>
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept={ALLOWED_MEDIA_TYPES.join(',')}
        multiple
        onChange={(event) => {
          if (event.target.files) handleFiles(event.target.files)
        }}
      />

      {value.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          {value.map((url) => (
            <div key={url} className="group relative overflow-hidden rounded-md border bg-white">
              {url.match(/\.(jpg|jpeg|png|gif|webp)(\?|$)/i) ? (
                <div
                  className="h-28 w-full bg-cover bg-center"
                  style={{ backgroundImage: `url(${url})` }}
                />
              ) : (
                <div className="bg-muted flex h-28 items-center justify-center">
                  <ImageIcon className="text-muted-foreground h-6 w-6" />
                </div>
              )}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="absolute top-2 right-2 h-8 w-8 bg-white p-0"
                onClick={() => handleRemove(url)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
