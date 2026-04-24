'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Edit, Send, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import { PostForm } from '@/components/posts/post-form'
import { PostPreview } from '@/components/posts/post-preview'
import { PostStatusBadge } from '@/components/posts/post-status-badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useDeletePost, usePosts, type PostView } from '@/hooks/use-posts'
import { PLATFORM_LABELS, POST_STATUS_LABELS } from '@/lib/constants'
import { PLATFORMS, POST_STATUSES, type Platform, type PostStatus } from '@/types'

function formatPostDate(date: string | null): string {
  if (!date) return 'Brouillon'
  return format(new Date(date), 'd MMM yyyy, HH:mm', { locale: fr })
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

  async function handleDelete(post: PostView) {
    if (!window.confirm('Supprimer cette publication ?')) return

    try {
      await deletePost.mutateAsync(post.id)
      toast.success('Publication supprimée')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Suppression impossible')
    }
  }

  return (
    <div className="flex h-full flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Publications</h1>
      </div>

      <div className="flex flex-wrap gap-3">
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
        {isLoading && <p className="text-muted-foreground text-sm">Chargement des publications...</p>}
        {!isLoading && posts.length === 0 && (
          <p className="text-muted-foreground text-sm">Aucune publication.</p>
        )}
        {posts.map((post) => (
          <Card key={post.id}>
            <CardContent className="flex flex-col gap-4 p-4 md:flex-row md:items-center">
              <PostPreview post={post} />
              <div className="min-w-0 flex-1">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <h2 className="truncate text-sm font-medium">
                    {post.title || post.caption || 'Publication'}
                  </h2>
                  <PostStatusBadge status={post.status} />
                </div>
                <p className="text-muted-foreground line-clamp-2 text-sm">
                  {post.caption || 'Aucun texte'}
                </p>
                <div className="text-muted-foreground mt-2 flex flex-wrap gap-2 text-xs">
                  <span>{formatPostDate(post.scheduledAt)}</span>
                  {post.platforms.map((item) => (
                    <span key={item.id}>{PLATFORM_LABELS[item.platform]}</span>
                  ))}
                </div>
              </div>

              <div className="flex shrink-0 gap-2">
                <Button variant="outline" size="sm" onClick={() => setEditingPost(post)}>
                  <Edit className="h-4 w-4" />
                  Éditer
                </Button>
                <Button variant="outline" size="sm" disabled>
                  <Send className="h-4 w-4" />
                  Publier
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleDelete(post)}>
                  <Trash2 className="h-4 w-4" />
                  Supprimer
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={Boolean(editingPost)} onOpenChange={(open) => !open && setEditingPost(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier la publication</DialogTitle>
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
