'use client'

import { useRef, useState } from 'react'
import { Heart, Info, MessageCircle, Pause, Play, Send } from 'lucide-react'

import type { PlatformSelection } from '@/components/posts/platform-selector'

type PostPreviewPanelProps = {
  caption: string | undefined
  mediaUrl: string | undefined
  platforms: PlatformSelection[]
  title: string | undefined
}

function isImageUrl(url: string): boolean {
  return /\.(jpg|jpeg|png|gif|webp)(\?|$)/i.test(url)
}

function isVideoUrl(url: string): boolean {
  return /\.(mp4|mov|webm|avi|mkv|m4v)(\?|$)/i.test(url)
}

function getPlatformInitials(platform: PlatformSelection['platform']): string {
  if (platform === 'INSTAGRAM') return 'IG'
  if (platform === 'YOUTUBE') return 'YT'
  if (platform === 'TIKTOK') return 'TT'
  return 'X'
}

export function PostPreviewPanel({ caption, mediaUrl, platforms, title }: PostPreviewPanelProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [playing, setPlaying] = useState(false)

  function togglePlay() {
    const video = videoRef.current
    if (!video) return
    if (video.paused) {
      void video.play()
      setPlaying(true)
    } else {
      video.pause()
      setPlaying(false)
    }
  }

  return (
    <aside className="hidden min-w-0 border-l pl-8 xl:block">
      <div className="sticky top-0 space-y-4">
        <div className="flex justify-center gap-3">
          {platforms.length > 0 ? (
            platforms.map((item) => (
              <span
                key={item.platform}
                className="flex h-9 w-9 items-center justify-center rounded-full border bg-white text-xs font-semibold"
              >
                {getPlatformInitials(item.platform)}
              </span>
            ))
          ) : (
            <span className="text-muted-foreground text-sm">Sélectionnez une plateforme</span>
          )}
        </div>

        <div className="mx-auto flex aspect-[9/16] w-full max-w-[320px] flex-col overflow-hidden rounded-lg bg-black text-white shadow-lg">
          <div className="flex justify-center gap-6 px-4 py-6 text-sm">
            <span className="text-white/50">Abonnements</span>
            <span className="font-medium">Pour toi</span>
          </div>
          <div className="relative flex flex-1 items-center justify-center overflow-hidden">
            {mediaUrl && isImageUrl(mediaUrl) && (
              <div
                className="absolute inset-0 h-full w-full object-cover"
                style={{
                  backgroundImage: `url(${mediaUrl})`,
                  backgroundPosition: 'center',
                  backgroundSize: 'cover',
                }}
              />
            )}
            {mediaUrl && isVideoUrl(mediaUrl) && (
              <>
                <video
                  ref={videoRef}
                  src={mediaUrl}
                  className="absolute inset-0 h-full w-full object-cover"
                  muted
                  playsInline
                  preload="metadata"
                  onEnded={() => setPlaying(false)}
                />
                <button
                  type="button"
                  className="absolute inset-0 flex items-center justify-center transition-opacity hover:opacity-100"
                  style={{ opacity: playing ? 0 : 1 }}
                  onClick={togglePlay}
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-black/40">
                    {playing ? (
                      <Pause className="h-6 w-6 fill-white text-white" />
                    ) : (
                      <Play className="h-6 w-6 fill-white text-white" />
                    )}
                  </span>
                </button>
              </>
            )}
            {!mediaUrl && <span className="text-sm text-white/70">Aucun média</span>}
            <div className="absolute right-4 bottom-20 flex flex-col items-center gap-5">
              <Heart className="h-7 w-7 fill-white" />
              <MessageCircle className="h-7 w-7 fill-white" />
              <Send className="h-7 w-7 fill-white" />
            </div>
            <div className="absolute right-4 bottom-8 h-10 w-10 rounded-full border-2 border-white/20 bg-white/20" />
            <div className="absolute bottom-8 left-4 max-w-[190px] space-y-1 text-sm">
              <p className="font-semibold">Aperçu</p>
              <p className="line-clamp-3 text-white/90">
                {caption || title || 'Votre texte apparaîtra ici.'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-3 rounded-md bg-blue-50 p-4 text-sm text-blue-950">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            Les aperçus sont une approximation du rendu final. La publication peut varier selon la
            plateforme.
          </p>
        </div>
      </div>
    </aside>
  )
}
