'use client'

import { useRef, useState } from 'react'
import {
  Bookmark,
  Heart,
  MessageCircle,
  MoreHorizontal,
  Music2,
  Pause,
  Play,
  Repeat2,
  Search,
  Send,
  Share2,
  ThumbsUp,
} from 'lucide-react'

import type { PlatformSelection } from '@/components/posts/platform-selector'
import { cn } from '@/lib/utils'

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

function MediaFill({
  mediaUrl,
  videoRef,
  playing,
  onToggle,
  className,
}: {
  mediaUrl: string | undefined
  videoRef: React.RefObject<HTMLVideoElement | null>
  playing: boolean
  onToggle: () => void
  className?: string
}) {
  if (!mediaUrl) return null

  if (isImageUrl(mediaUrl)) {
    return (
      <div
        className={cn('absolute inset-0 bg-cover bg-center', className)}
        style={{ backgroundImage: `url(${mediaUrl})` }}
      />
    )
  }

  if (isVideoUrl(mediaUrl)) {
    return (
      <>
        <video
          ref={videoRef}
          src={mediaUrl}
          className={cn('absolute inset-0 h-full w-full object-cover', className)}
          muted
          playsInline
          preload="metadata"
        />
        <button
          type="button"
          className="absolute inset-0 flex items-center justify-center transition-opacity hover:opacity-100"
          style={{ opacity: playing ? 0 : 1 }}
          onClick={onToggle}
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-black/40">
            {playing ? (
              <Pause className="h-5 w-5 fill-white text-white" />
            ) : (
              <Play className="h-5 w-5 fill-white text-white" />
            )}
          </span>
        </button>
      </>
    )
  }

  return null
}

function TikTokPreview({
  caption,
  mediaUrl,
  videoRef,
  playing,
  onToggle,
}: {
  caption: string | undefined
  mediaUrl: string | undefined
  videoRef: React.RefObject<HTMLVideoElement | null>
  playing: boolean
  onToggle: () => void
}) {
  return (
    <div className="mx-auto flex aspect-9/16 w-full max-w-[240px] flex-col overflow-hidden rounded-2xl bg-black text-white shadow-lg">
      {/* top bar */}
      <div className="relative flex items-center justify-center px-4 pt-4 pb-2">
        <Search className="absolute left-4 h-5 w-5 text-white/70" />
        <div className="flex gap-5 text-xs font-medium">
          <span className="text-white/50">Abonnements</span>
          <span className="border-b border-white pb-1">Pour toi</span>
        </div>
      </div>

      {/* media area */}
      <div className="relative flex-1 overflow-hidden">
        {mediaUrl ? (
          <MediaFill
            mediaUrl={mediaUrl}
            videoRef={videoRef}
            playing={playing}
            onToggle={onToggle}
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <span className="text-xs text-white/40">Aucun media</span>
          </div>
        )}

        {/* right actions */}
        <div className="absolute right-2 bottom-20 flex flex-col items-center gap-4">
          <div className="flex flex-col items-center gap-0.5">
            <div className="h-7 w-7 rounded-full border-2 border-white bg-white/20" />
          </div>
          <div className="flex flex-col items-center gap-0.5">
            <Heart className="h-6 w-6 fill-white" />
            <span className="text-[10px]">12k</span>
          </div>
          <div className="flex flex-col items-center gap-0.5">
            <MessageCircle className="h-6 w-6 fill-white" />
            <span className="text-[10px]">438</span>
          </div>
          <div className="flex flex-col items-center gap-0.5">
            <Share2 className="h-6 w-6 fill-white" />
            <span className="text-[10px]">Partager</span>
          </div>
          <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white/30 bg-white/10">
            <Music2 className="h-3.5 w-3.5" />
          </div>
        </div>

        {/* bottom info */}
        <div className="absolute bottom-4 left-3 right-12 space-y-1">
          <p className="text-xs font-semibold">@utilisateur</p>
          <p className="line-clamp-3 text-xs text-white/90">
            {caption || 'Votre texte apparaitra ici.'}
          </p>
          <div className="flex items-center gap-1 text-[10px] text-white/70">
            <Music2 className="h-3 w-3" />
            <span>Son original</span>
          </div>
        </div>
      </div>

      {/* nav bar */}
      <div className="flex justify-around px-4 py-3 text-[10px] text-white/50">
        <span>Accueil</span>
        <span>Amis</span>
        <span className="flex h-5 w-5 items-center justify-center rounded bg-white text-black">+</span>
        <span>Boite de reception</span>
        <span>Profil</span>
      </div>
    </div>
  )
}

function InstagramPostPreview({
  caption,
  mediaUrl,
  videoRef,
  playing,
  onToggle,
}: {
  caption: string | undefined
  mediaUrl: string | undefined
  videoRef: React.RefObject<HTMLVideoElement | null>
  playing: boolean
  onToggle: () => void
}) {
  return (
    <div className="mx-auto w-full max-w-[260px] overflow-hidden rounded-xl border bg-white shadow-lg">
      {/* top bar */}
      <div className="flex items-center justify-between px-3 py-2">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-full bg-linear-to-tr from-yellow-400 via-pink-500 to-purple-600 p-0.5">
            <div className="h-full w-full rounded-full bg-white" />
          </div>
          <span className="text-xs font-semibold">utilisateur</span>
        </div>
        <MoreHorizontal className="h-4 w-4 text-gray-500" />
      </div>

      {/* media — 4:5 portrait */}
      <div className="relative aspect-4/5 w-full bg-gray-100">
        {mediaUrl ? (
          <MediaFill
            mediaUrl={mediaUrl}
            videoRef={videoRef}
            playing={playing}
            onToggle={onToggle}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-gray-400">
            Aucun media
          </div>
        )}
      </div>

      {/* actions */}
      <div className="space-y-2 px-3 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Heart className="h-5 w-5" />
            <MessageCircle className="h-5 w-5" />
            <Send className="h-5 w-5" />
          </div>
          <Bookmark className="h-5 w-5" />
        </div>
        <p className="text-[11px] font-semibold">1 234 mentions J&apos;aime</p>
        <p className="line-clamp-2 text-[11px]">
          <span className="font-semibold">utilisateur </span>
          {caption || 'Votre texte apparaitra ici.'}
        </p>
        <p className="text-[10px] uppercase tracking-wide text-gray-400">il y a 1 heure</p>
      </div>
    </div>
  )
}

function InstagramReelPreview({
  caption,
  mediaUrl,
  videoRef,
  playing,
  onToggle,
}: {
  caption: string | undefined
  mediaUrl: string | undefined
  videoRef: React.RefObject<HTMLVideoElement | null>
  playing: boolean
  onToggle: () => void
}) {
  return (
    <div className="mx-auto flex aspect-9/16 w-full max-w-[240px] flex-col overflow-hidden rounded-2xl bg-black text-white shadow-lg">
      {/* top */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <span className="text-sm font-bold">Reels</span>
        <div className="flex items-center gap-3">
          <Search className="h-5 w-5 text-white/70" />
          <Share2 className="h-5 w-5 text-white/70" />
        </div>
      </div>

      {/* media */}
      <div className="relative flex-1 overflow-hidden">
        {mediaUrl ? (
          <MediaFill
            mediaUrl={mediaUrl}
            videoRef={videoRef}
            playing={playing}
            onToggle={onToggle}
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <span className="text-xs text-white/40">Aucun media</span>
          </div>
        )}

        {/* right actions */}
        <div className="absolute right-2 bottom-16 flex flex-col items-center gap-4">
          <div className="flex flex-col items-center gap-0.5">
            <Heart className="h-6 w-6 fill-white" />
            <span className="text-[10px]">8,4k</span>
          </div>
          <div className="flex flex-col items-center gap-0.5">
            <MessageCircle className="h-6 w-6 fill-white" />
            <span className="text-[10px]">214</span>
          </div>
          <div className="flex flex-col items-center gap-0.5">
            <Send className="h-6 w-6 fill-white" />
            <span className="text-[10px]">Partager</span>
          </div>
          <MoreHorizontal className="h-5 w-5 text-white/70" />
        </div>

        {/* bottom */}
        <div className="absolute bottom-4 left-3 right-12 space-y-1">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-full border border-white bg-white/20" />
            <span className="text-xs font-semibold">utilisateur</span>
            <span className="rounded border border-white px-1.5 py-0.5 text-[10px]">Suivre</span>
          </div>
          <p className="line-clamp-2 text-xs text-white/90">
            {caption || 'Votre texte apparaitra ici.'}
          </p>
          <div className="flex items-center gap-1 text-[10px] text-white/70">
            <Music2 className="h-3 w-3" />
            <span>Son original · utilisateur</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function YoutubeVideoPreview({
  caption,
  mediaUrl,
  title,
  videoRef,
  playing,
  onToggle,
}: {
  caption: string | undefined
  mediaUrl: string | undefined
  title: string | undefined
  videoRef: React.RefObject<HTMLVideoElement | null>
  playing: boolean
  onToggle: () => void
}) {
  return (
    <div className="mx-auto w-full max-w-[280px] overflow-hidden rounded-xl bg-white shadow-lg">
      {/* thumbnail 16:9 */}
      <div className="relative aspect-video w-full bg-gray-200">
        {mediaUrl ? (
          <MediaFill
            mediaUrl={mediaUrl}
            videoRef={videoRef}
            playing={playing}
            onToggle={onToggle}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-gray-400">
            Aucun media
          </div>
        )}
        <span className="absolute right-2 bottom-2 rounded bg-black/80 px-1 py-0.5 text-[10px] text-white">
          0:30
        </span>
      </div>

      {/* metadata */}
      <div className="flex gap-2 p-3">
        <div className="h-8 w-8 shrink-0 rounded-full bg-red-600" />
        <div className="min-w-0 space-y-0.5">
          <p className="line-clamp-2 text-xs font-semibold leading-snug">
            {title || caption || 'Titre de la video'}
          </p>
          <p className="text-[10px] text-gray-500">Votre chaine</p>
          <p className="text-[10px] text-gray-400">1,2k vues · il y a 1 heure</p>
        </div>
        <MoreHorizontal className="h-4 w-4 shrink-0 text-gray-400" />
      </div>

      {/* actions */}
      <div className="flex justify-around border-t px-2 py-2 text-[10px] text-gray-600">
        <div className="flex flex-col items-center gap-0.5">
          <ThumbsUp className="h-4 w-4" />
          <span>12k</span>
        </div>
        <div className="flex flex-col items-center gap-0.5">
          <MessageCircle className="h-4 w-4" />
          <span>438</span>
        </div>
        <div className="flex flex-col items-center gap-0.5">
          <Share2 className="h-4 w-4" />
          <span>Partager</span>
        </div>
        <div className="flex flex-col items-center gap-0.5">
          <Bookmark className="h-4 w-4" />
          <span>Enregistrer</span>
        </div>
      </div>
    </div>
  )
}

function YoutubeShortPreview({
  caption,
  mediaUrl,
  title,
  videoRef,
  playing,
  onToggle,
}: {
  caption: string | undefined
  mediaUrl: string | undefined
  title: string | undefined
  videoRef: React.RefObject<HTMLVideoElement | null>
  playing: boolean
  onToggle: () => void
}) {
  return (
    <div className="mx-auto flex aspect-9/16 w-full max-w-[240px] flex-col overflow-hidden rounded-2xl bg-black text-white shadow-lg">
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <span className="text-sm font-bold">Shorts</span>
        <Search className="h-5 w-5 text-white/70" />
      </div>

      <div className="relative flex-1 overflow-hidden">
        {mediaUrl ? (
          <MediaFill
            mediaUrl={mediaUrl}
            videoRef={videoRef}
            playing={playing}
            onToggle={onToggle}
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <span className="text-xs text-white/40">Aucun media</span>
          </div>
        )}

        <div className="absolute right-2 bottom-16 flex flex-col items-center gap-4">
          <div className="flex flex-col items-center gap-0.5">
            <ThumbsUp className="h-6 w-6 fill-white" />
            <span className="text-[10px]">12k</span>
          </div>
          <div className="flex flex-col items-center gap-0.5">
            <MessageCircle className="h-6 w-6 fill-white" />
            <span className="text-[10px]">438</span>
          </div>
          <div className="flex flex-col items-center gap-0.5">
            <Share2 className="h-6 w-6 fill-white" />
            <span className="text-[10px]">Partager</span>
          </div>
          <Repeat2 className="h-6 w-6 text-white/70" />
          <div className="h-7 w-7 rounded-sm bg-white/20" />
        </div>

        <div className="absolute bottom-4 left-3 right-12 space-y-1">
          <p className="text-xs font-semibold">@utilisateur</p>
          <p className="line-clamp-2 text-xs text-white/90">
            {title || caption || 'Votre texte apparaitra ici.'}
          </p>
        </div>
      </div>
    </div>
  )
}

function TwitterPreview({
  caption,
  mediaUrl,
  videoRef,
  playing,
  onToggle,
}: {
  caption: string | undefined
  mediaUrl: string | undefined
  videoRef: React.RefObject<HTMLVideoElement | null>
  playing: boolean
  onToggle: () => void
}) {
  return (
    <div className="mx-auto w-full max-w-[280px] overflow-hidden rounded-xl border bg-white shadow-lg">
      <div className="p-3">
        {/* header */}
        <div className="mb-2 flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-gray-300" />
            <div>
              <p className="text-xs font-bold leading-none">Utilisateur</p>
              <p className="text-[10px] text-gray-500">@utilisateur</p>
            </div>
          </div>
          <div className="flex items-center gap-1 rounded-full border border-black px-2 py-0.5">
            <span className="text-[10px] font-bold">Suivre</span>
          </div>
        </div>

        {/* text */}
        <p className="mb-2 line-clamp-4 text-xs">
          {caption || 'Votre texte apparaitra ici.'}
        </p>

        {/* media */}
        {mediaUrl && (
          <div className="relative mb-2 aspect-video w-full overflow-hidden rounded-xl bg-gray-100">
            <MediaFill
              mediaUrl={mediaUrl}
              videoRef={videoRef}
              playing={playing}
              onToggle={onToggle}
            />
          </div>
        )}

        {/* timestamp */}
        <p className="mb-2 text-[10px] text-gray-400">
          00:00 · 26 avr. 2026 · <span className="font-semibold text-gray-700">1,2k</span> vues
        </p>

        {/* actions */}
        <div className="flex justify-around border-t pt-2 text-gray-500">
          <MessageCircle className="h-4 w-4" />
          <Repeat2 className="h-4 w-4" />
          <Heart className="h-4 w-4" />
          <Share2 className="h-4 w-4" />
        </div>
      </div>
    </div>
  )
}

const PLATFORM_LABELS: Record<string, string> = {
  TIKTOK: 'TikTok',
  INSTAGRAM: 'Instagram',
  YOUTUBE: 'YouTube',
  TWITTER: 'X',
}

export function PostPreviewPanel({ caption, mediaUrl, platforms, title }: PostPreviewPanelProps) {
  const [activePlatform, setActivePlatform] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [playing, setPlaying] = useState(false)

  const current = activePlatform
    ? (platforms.find((p) => p.platform === activePlatform) ?? platforms[0])
    : platforms[0]

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

  function handlePlatformSwitch(platform: string) {
    videoRef.current?.pause()
    setPlaying(false)
    setActivePlatform(platform)
  }

  const sharedProps = { caption, mediaUrl, videoRef, playing, onToggle: togglePlay }

  function renderPreview() {
    if (!current) {
      return (
        <div className="flex aspect-9/16 w-full max-w-[240px] mx-auto items-center justify-center rounded-2xl border bg-gray-50">
          <span className="text-muted-foreground text-sm">Selectionnez une plateforme</span>
        </div>
      )
    }

    const ct = current.contentType

    if (current.platform === 'TIKTOK') {
      return <TikTokPreview {...sharedProps} />
    }

    if (current.platform === 'INSTAGRAM') {
      if (ct === 'INSTAGRAM_REEL') return <InstagramReelPreview {...sharedProps} />
      return <InstagramPostPreview {...sharedProps} />
    }

    if (current.platform === 'YOUTUBE') {
      if (ct === 'YOUTUBE_SHORT') return <YoutubeShortPreview {...sharedProps} title={title} />
      return <YoutubeVideoPreview {...sharedProps} title={title} />
    }

    if (current.platform === 'TWITTER') {
      return <TwitterPreview {...sharedProps} />
    }

    return null
  }

  return (
    <aside className="hidden min-w-0 border-l pl-8 xl:block">
      <div className="sticky top-0 space-y-4">
        {platforms.length > 1 && (
          <div className="flex justify-center gap-2">
            {platforms.map((item) => (
              <button
                key={item.platform}
                type="button"
                onClick={() => handlePlatformSwitch(item.platform)}
                className={cn(
                  'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                  current?.platform === item.platform
                    ? 'bg-foreground text-background border-foreground'
                    : 'bg-white text-foreground hover:bg-gray-50'
                )}
              >
                {PLATFORM_LABELS[item.platform]}
              </button>
            ))}
          </div>
        )}

        {platforms.length === 1 && (
          <p className="text-center text-xs font-medium text-gray-500">
            {PLATFORM_LABELS[platforms[0]?.platform ?? '']}
          </p>
        )}

        {renderPreview()}

        <p className="text-muted-foreground text-center text-[11px]">
          Approximation du rendu final.
        </p>
      </div>
    </aside>
  )
}
