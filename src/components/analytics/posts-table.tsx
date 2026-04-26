'use client'

import { useState } from 'react'
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PLATFORM_LABELS } from '@/lib/constants'
import type { TopPost } from '@/hooks/use-analytics'

type SortKey = 'views' | 'likes' | 'comments'
type SortDir = 'asc' | 'desc'

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`
  return String(n)
}

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}

type SortButtonProps = {
  label: string
  sortKey: SortKey
  current: SortKey
  dir: SortDir
  onClick: (key: SortKey) => void
}

function SortButton({ label, sortKey, current, dir, onClick }: SortButtonProps) {
  const active = current === sortKey
  return (
    <button
      onClick={() => onClick(sortKey)}
      className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-xs font-medium transition-colors"
    >
      {label}
      {active ? (
        dir === 'desc' ? <ArrowDown className="h-3 w-3" /> : <ArrowUp className="h-3 w-3" />
      ) : (
        <ArrowUpDown className="h-3 w-3 opacity-40" />
      )}
    </button>
  )
}

type Props = {
  posts: TopPost[]
}

export function PostsPerformanceTable({ posts }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>('views')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'))
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

  const sorted = [...posts].sort((a, b) => {
    const diff = a[sortKey] - b[sortKey]
    return sortDir === 'desc' ? -diff : diff
  })

  if (posts.length === 0) {
    return null
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">Performance des publications</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="px-5 py-3 text-left font-medium">Publication</th>
                <th className="px-4 py-3 text-left font-medium">Plateforme</th>
                <th className="px-4 py-3 text-left font-medium">Date</th>
                <th className="px-4 py-3 text-right">
                  <SortButton label="Vues" sortKey="views" current={sortKey} dir={sortDir} onClick={handleSort} />
                </th>
                <th className="px-4 py-3 text-right">
                  <SortButton label="Likes" sortKey="likes" current={sortKey} dir={sortDir} onClick={handleSort} />
                </th>
                <th className="px-4 py-3 pr-5 text-right">
                  <SortButton label="Commentaires" sortKey="comments" current={sortKey} dir={sortDir} onClick={handleSort} />
                </th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((post) => (
                <tr key={post.postPlatformId} className="border-b last:border-0 hover:bg-muted/40 transition-colors">
                  <td className="px-5 py-3">
                    <p className="line-clamp-1 max-w-xs font-medium">
                      {post.caption || post.title || 'Sans titre'}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {PLATFORM_LABELS[post.platform]}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                    {formatDate(post.publishedAt)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums font-medium">
                    {formatNumber(post.views)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums font-medium">
                    {formatNumber(post.likes)}
                  </td>
                  <td className="px-4 py-3 pr-5 text-right tabular-nums font-medium">
                    {formatNumber(post.comments)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
