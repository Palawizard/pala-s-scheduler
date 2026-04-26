'use client'

import { useState } from 'react'
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react'
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PLATFORM_LABELS } from '@/lib/constants'
import type { DayValue, PlatformPostItem, PostPlatformTotals } from '@/hooks/use-analytics'

const PLATFORM_COLORS: Record<string, string> = {
  YOUTUBE: '#ef4444',
  INSTAGRAM: '#ec4899',
  TIKTOK: '#18181b',
  TWITTER: '#3b82f6',
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`
  return String(n)
}

function formatDate(date: string): string {
  const d = new Date(date + 'T00:00:00')
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

function formatDateFull(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}

type StatSummaryCardProps = {
  label: string
  total: number
  byPlatform: { platform: string; value: number }[]
}

function StatSummaryCard({ label, total, byPlatform }: StatSummaryCardProps) {
  return (
    <div className="bg-muted/50 rounded-lg p-4">
      <p className="text-muted-foreground mb-1 text-xs">{label}</p>
      <p className="mb-3 text-2xl font-semibold tabular-nums">{formatNumber(total)}</p>
      <div className="flex flex-wrap gap-2">
        {byPlatform.map(({ platform, value }) => (
          <span
            key={platform}
            className="flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium text-white"
            style={{ backgroundColor: PLATFORM_COLORS[platform] ?? '#888' }}
          >
            {formatNumber(value)}
            <span className="opacity-80">{PLATFORM_LABELS[platform as keyof typeof PLATFORM_LABELS]}</span>
          </span>
        ))}
      </div>
    </div>
  )
}

type DayChartProps = {
  title: string
  data: DayValue[]
}

function DayChart({ title, data }: DayChartProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="date" tickFormatter={formatDate} tick={{ fontSize: 11 }} tickLine={false} interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={36} />
            <Tooltip labelFormatter={formatDate} formatter={(v: number) => [v.toLocaleString('fr-FR')]} contentStyle={{ fontSize: 12 }} />
            <Line type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

type SortKey = 'publishedAt' | 'impressions' | 'interactions'
type SortDir = 'asc' | 'desc'

function SortButton({
  label,
  sortKey,
  current,
  dir,
  onClick,
}: {
  label: string
  sortKey: SortKey
  current: SortKey
  dir: SortDir
  onClick: (k: SortKey) => void
}) {
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

type PostsListProps = {
  items: PlatformPostItem[]
}

function PostsList({ items }: PostsListProps) {
  const [sortKey, setSortKey] = useState<SortKey>('publishedAt')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'))
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

  const sorted = [...items].sort((a, b) => {
    let diff = 0
    if (sortKey === 'publishedAt') {
      diff = (a.publishedAt ?? '').localeCompare(b.publishedAt ?? '')
    } else if (sortKey === 'impressions') {
      diff = a.impressions - b.impressions
    } else {
      diff = (a.likes + a.comments + a.shares) - (b.likes + b.comments + b.shares)
    }
    return sortDir === 'desc' ? -diff : diff
  })

  if (items.length === 0) {
    return (
      <div className="text-muted-foreground flex h-32 items-center justify-center text-sm">
        Synchronisez pour voir vos publications.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b">
            <th className="px-5 py-3 text-left font-medium">Publication</th>
            <th className="px-4 py-3 text-left font-medium">Plateforme</th>
            <th className="px-4 py-3 text-left">
              <SortButton label="Date" sortKey="publishedAt" current={sortKey} dir={sortDir} onClick={handleSort} />
            </th>
            <th className="px-4 py-3 text-right">
              <SortButton label="Impressions" sortKey="impressions" current={sortKey} dir={sortDir} onClick={handleSort} />
            </th>
            <th className="px-4 py-3 pr-5 text-right">
              <SortButton label="Interactions" sortKey="interactions" current={sortKey} dir={sortDir} onClick={handleSort} />
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((post) => (
            <tr key={post.id} className="hover:bg-muted/40 border-b last:border-0 transition-colors">
              <td className="px-5 py-3">
                <div className="flex items-center gap-3">
                  {post.thumbnailUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={post.thumbnailUrl}
                      alt=""
                      className="h-10 w-10 flex-shrink-0 rounded object-cover"
                    />
                  ) : (
                    <div className="bg-muted h-10 w-10 flex-shrink-0 rounded" />
                  )}
                  <div className="min-w-0">
                    <p className="line-clamp-1 max-w-xs font-medium">{post.caption || '—'}</p>
                    {post.mediaType && (
                      <p className="text-muted-foreground text-xs capitalize">{post.mediaType}</p>
                    )}
                  </div>
                </div>
              </td>
              <td className="text-muted-foreground px-4 py-3">
                <span
                  className="rounded-full px-2 py-0.5 text-xs font-medium text-white"
                  style={{ backgroundColor: PLATFORM_COLORS[post.platform] ?? '#888' }}
                >
                  {PLATFORM_LABELS[post.platform]}
                </span>
              </td>
              <td className="text-muted-foreground whitespace-nowrap px-4 py-3">
                {formatDateFull(post.publishedAt)}
              </td>
              <td className="px-4 py-3 text-right tabular-nums">
                {formatNumber(post.impressions)}
              </td>
              <td className="px-4 py-3 pr-5 text-right tabular-nums font-medium">
                {formatNumber(post.likes + post.comments + post.shares)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

type Props = {
  byPlatform: PostPlatformTotals[]
  interactionsByDay: DayValue[]
  postsByDay: DayValue[]
  totalInteractions: number
  totalPostsCount: number
  items: PlatformPostItem[]
}

export function PostsSection({ byPlatform, interactionsByDay, postsByDay, totalInteractions, totalPostsCount, items }: Props) {
  return (
    <div className="space-y-4">
      <h2 className="font-medium">Publications</h2>

      <div className="grid gap-4 md:grid-cols-2">
        <StatSummaryCard
          label="Interactions totales"
          total={totalInteractions}
          byPlatform={byPlatform.filter((p) => p.interactions > 0).map((p) => ({ platform: p.platform, value: p.interactions }))}
        />
        <StatSummaryCard
          label="Nombre de publications"
          total={totalPostsCount}
          byPlatform={byPlatform.filter((p) => p.postsCount > 0).map((p) => ({ platform: p.platform, value: p.postsCount }))}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <DayChart title="Interactions dans le temps" data={interactionsByDay} />
        <DayChart title="Publications dans le temps" data={postsByDay} />
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium">Toutes les publications</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <PostsList items={items} />
        </CardContent>
      </Card>
    </div>
  )
}
