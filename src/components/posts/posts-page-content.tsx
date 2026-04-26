'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { AlertCircle, Edit, FileText, Send, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import { PostForm } from '@/components/posts/post-form'
import { PostPreview } from '@/components/posts/post-preview'
import { PostStatusBadge } from '@/components/posts/post-status-badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { EmptyState } from '@/components/ui/empty-state'
import { Skeleton } from '@/components/ui/skeleton'
import { Spinner } from '@/components/ui/spinner'
import {
  useCancelPost,
  useDeletePost,
  usePosts,
  usePublishPost,
  type PostView,
} from '@/hooks/use-posts'
import {
  PLATFORM_LABELS,
  POST_CONTENT_TYPE_LABELS,
  POST_STATUS_LABELS,
  POST_VISIBILITY_LABELS,
} from '@/lib/constants'
import { PLATFORMS, POST_STATUSES, type Platform, type PostStatus } from '@/types'

function formatPostDate(date: string | null): string {
  if (!date) return 'Brouillon'
  return format(new Date(date), 'd MMM yyyy, HH:mm', { locale: fr })
}

function PostsListSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: 4 }).map((_, index) => (
        <Card key={index}>
          <CardContent className="flex flex-col gap-4 p-4 md:flex-row md:items-center">
            <Skeleton className="h-24 w-full rounded-md md:w-40" />
            <div className="flex-1 space-y-3">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-3 w-1/2" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-9 w-20" />
              <Skeleton className="h-9 w-24" />
              <Skeleton className="h-9 w-24" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export function PostsPageContent() {
  const [status, setStatus] = useState<PostStatus | ''>('')
  const [platform, setPlatform] = useState<Platform | ''>('')
  const [editingPost, setEditingPost] = useState<PostView | null>(null)
  const filters = {
    status: status || undefined,
    platform: platform || undefined,
  }
  const { data: posts = [], isLoading } = usePosts(filters)
  const deletePost = useDeletePost()
  const publishPost = usePublishPost()
  const cancelPost = useCancelPost()

  async function handleDelete(post: PostView) {
    if (!window.confirm('Supprimer cette publication ?')) return

    try {
      await deletePost.mutateAsync(post.id)
      toast.success('Publication supprimée')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Suppression impossible')
    }
  }

  async function handlePublish(post: PostView) {
    try {
      const updated = await publishPost.mutateAsync(post.id)
      const failedPlatforms = updated.platforms.filter((p) => p.status === 'FAILED')
      const successPlatforms = updated.platforms.filter((p) => p.status === 'PUBLISHED')

      if (successPlatforms.length > 0 && failedPlatforms.length === 0) {
        toast.success('Publication réussie sur toutes les plateformes')
      } else if (successPlatforms.length > 0 && failedPlatforms.length > 0) {
        toast.warning(
          `Publié sur ${successPlatforms.length} plateforme(s), échec sur ${failedPlatforms.length}`
        )
      } else {
        for (const failed of failedPlatforms) {
          toast.error(failed.errorMessage ?? `Échec sur ${PLATFORM_LABELS[failed.platform]}`, {
            duration: 8000,
          })
        }
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Publication impossible')
    }
  }

  async function handleCancel(post: PostView) {
    try {
      await cancelPost.mutateAsync(post.id)
      toast.success('Publication annulée')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Annulation impossible')
    }
  }

  return (
    <div className="flex h-full flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Publications</h1>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:flex lg:flex-wrap">
        <select
          className="border-input bg-background h-9 rounded-md border px-3 text-sm"
          value={status}
          onChange={(event) => setStatus(event.target.value as PostStatus | '')}
        >
          <option value="">Tous les statuts</option>
          {POST_STATUSES.map((item) => (
            <option key={item} value={item}>
              {POST_STATUS_LABELS[item]}
            </option>
          ))}
        </select>
        <select
          className="border-input bg-background h-9 rounded-md border px-3 text-sm"
          value={platform}
          onChange={(event) => setPlatform(event.target.value as Platform | '')}
        >
          <option value="">Toutes les plateformes</option>
          {PLATFORMS.map((item) => (
            <option key={item} value={item}>
              {PLATFORM_LABELS[item]}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-3">
        {isLoading && <PostsListSkeleton />}
        {!isLoading && posts.length === 0 && (
          <EmptyState
            description={
              status || platform
                ? 'Aucune publication ne correspond aux filtres sélectionnés.'
                : 'Créez une publication depuis le calendrier pour la retrouver ici.'
            }
            icon={<FileText className="h-8 w-8" />}
            title="Aucune publication"
          />
        )}
        {posts.map((post) => (
          <Card key={post.id}>
            <CardContent className="flex flex-col gap-4 p-4 md:flex-row md:items-center">
              <PostPreview post={post} />
              <div className="min-w-0 flex-1">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <h2 className="truncate text-sm font-medium">
                    {post.caption || post.title || 'Publication'}
                  </h2>
                  <PostStatusBadge status={post.status} />
                </div>
                {post.title && (
                  <p className="text-muted-foreground line-clamp-2 text-sm">{post.title}</p>
                )}
                <div className="text-muted-foreground mt-2 flex flex-wrap gap-2 text-xs">
                  <span>{formatPostDate(post.scheduledAt)}</span>
                  {post.platforms.map((item) => (
                    <span key={item.id}>
                      {PLATFORM_LABELS[item.platform]}
                      {item.contentType ? ` · ${POST_CONTENT_TYPE_LABELS[item.contentType]}` : ''}
                      {item.visibility ? ` · ${POST_VISIBILITY_LABELS[item.visibility]}` : ''}
                    </span>
                  ))}
                </div>
                {post.platforms.some((p) => p.status === 'FAILED' && p.errorMessage) && (
                  <div className="mt-2 space-y-1">
                    {post.platforms
                      .filter((p) => p.status === 'FAILED' && p.errorMessage)
                      .map((p) => (
                        <div key={p.id} className="flex items-start gap-1.5 text-xs text-red-600">
                          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                          <span>{p.errorMessage}</span>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              <div className="grid shrink-0 grid-cols-2 gap-2 sm:flex">
                <Button variant="outline" size="sm" onClick={() => setEditingPost(post)}>
                  <Edit className="h-4 w-4" />
                  Éditer
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePublish(post)}
                  disabled={
                    publishPost.isPending ||
                    post.status === 'PUBLISHING' ||
                    post.status === 'PUBLISHED'
                  }
                >
                  {publishPost.isPending && <Spinner />}
                  <Send className="h-4 w-4" />
                  Publier
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCancel(post)}
                  disabled={
                    cancelPost.isPending ||
                    post.status === 'PUBLISHING' ||
                    post.status === 'PUBLISHED'
                  }
                >
                  {cancelPost.isPending && <Spinner />}
                  Annuler
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(post)}
                  disabled={deletePost.isPending}
                >
                  {deletePost.isPending && <Spinner />}
                  <Trash2 className="h-4 w-4" />
                  Supprimer
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={Boolean(editingPost)} onOpenChange={(open) => !open && setEditingPost(null)}>
        <DialogContent className="max-h-[96vh] w-[calc(100vw-1rem)] max-w-[min(1500px,calc(100vw-1rem))] overflow-hidden p-0">
          <DialogHeader>
            <DialogTitle className="px-6 pt-6">Modifier la publication</DialogTitle>
          </DialogHeader>
          {editingPost && (
            <PostForm
              post={editingPost}
              onCancel={() => setEditingPost(null)}
              onSuccess={() => setEditingPost(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
