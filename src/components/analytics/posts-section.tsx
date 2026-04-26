'use client'

import { useMemo, useState } from 'react'
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronFirst,
  ChevronLast,
  ChevronLeft,
  ChevronRight,
  Columns3,
  Download,
  FileText,
  ImageIcon,
  Search,
  Video,
} from 'lucide-react'
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { PLATFORM_LABELS } from '@/lib/constants'
import { cn } from '@/lib/utils'
import type { PlatformDay, PlatformPostItem, PostPlatformTotals } from '@/hooks/use-analytics'
import type { Platform } from '@/types'

const PLATFORM_STYLES: Record<Platform, { color: string; card: string; text: string }> = {
  YOUTUBE: { color: '#ff6f4f', card: 'bg-[#ff7155]', text: 'text-[#3d1409]' },
  INSTAGRAM: { color: '#f5a3df', card: 'bg-[#f5a3df]', text: 'text-[#481236]' },
  TIKTOK: { color: '#9ba8b0', card: 'bg-[#9ba8b0]', text: 'text-[#162027]' },
  TWITTER: { color: '#60a5fa', card: 'bg-[#93c5fd]', text: 'text-[#0f2f55]' },
}

const COLUMN_LABELS = {
  type: 'Type',
  date: 'Date',
  impressions: 'Impressions',
  interactions: 'Interactions',
  platform: 'Réseau',
} as const

type ColumnKey = keyof typeof COLUMN_LABELS
type SortKey = 'publishedAt' | 'impressions' | 'interactions'
type SortDir = 'asc' | 'desc'

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(n >= 10_000 ? 1 : 2)}k`
  return String(n)
}

function formatDate(date: string): string {
  const d = new Date(date + 'T00:00:00')
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

function formatDateFull(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function formatTime(iso: string | null): string {
  if (!iso) return ''
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

function getInteractions(post: PlatformPostItem): number {
  return post.likes + post.comments + post.shares + post.saves
}

function getImpressions(post: PlatformPostItem): number {
  return post.impressions > 0 ? post.impressions : post.views
}

function getMediaIcon(mediaType: string | null) {
  const type = mediaType?.toLowerCase() ?? ''
  if (type.includes('video') || type.includes('reel') || type.includes('short')) return Video
  if (type.includes('image') || type.includes('photo')) return ImageIcon
  return FileText
}

type StatSummaryCardProps = {
  label: string
  total: number
  byPlatform: { platform: Platform; value: number }[]
}

function StatSummaryCard({ label, total, byPlatform }: StatSummaryCardProps) {
  const visiblePlatforms = byPlatform.filter(({ value }) => value > 0)
  const safeTotal = Math.max(total, 1)

  return (
    <div className="bg-muted flex min-h-24 items-center justify-between rounded-lg px-5 py-4">
      <div className="min-w-0 flex-1">
        <p className="mb-3 text-sm font-semibold">{label}</p>
        <div className="bg-background/70 flex h-5 max-w-72 overflow-hidden rounded-full">
          {visiblePlatforms.length === 0 ? (
            <span className="bg-muted-foreground/25 h-full w-full" />
          ) : (
            visiblePlatforms.map(({ platform, value }) => (
              <span
                key={platform}
                className="h-full"
                style={{
                  width: `${Math.max((value / safeTotal) * 100, 2)}%`,
                  backgroundColor: PLATFORM_STYLES[platform].color,
                }}
              />
            ))
          )}
        </div>
      </div>
      <p className="ml-6 text-3xl font-medium tabular-nums">{formatNumber(total)}</p>
    </div>
  )
}

function PlatformMetricCard({ platform, value }: { platform: Platform; value: number }) {
  const style = PLATFORM_STYLES[platform]

  return (
    <div
      className={`min-w-36 rounded-lg px-6 py-3 text-center shadow-sm ${style.card} ${style.text}`}
    >
      <p className="text-3xl font-medium tabular-nums">{value > 0 ? formatNumber(value) : '—'}</p>
      <p className="text-sm">{PLATFORM_LABELS[platform]}</p>
    </div>
  )
}

function MetricPanel({
  label,
  total,
  data,
  byPlatform,
}: {
  label: string
  total: number
  data: PlatformDay[]
  byPlatform: { platform: Platform; value: number }[]
}) {
  const platforms = byPlatform.map((item) => item.platform)
  const hasData = data.some((day) => platforms.some((platform) => Number(day[platform] ?? 0) > 0))

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="w-full max-w-xl">
          <StatSummaryCard label={label} total={total} byPlatform={byPlatform} />
        </div>

        <div className="flex flex-wrap justify-start gap-3 lg:justify-end">
          {byPlatform.map(({ platform, value }) => (
            <PlatformMetricCard key={platform} platform={platform} value={value} />
          ))}
        </div>
      </div>

      {!hasData ? (
        <div className="text-muted-foreground flex h-56 items-center justify-center text-sm">
          Synchronisez les données pour afficher cette courbe.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
            <XAxis
              dataKey="date"
              tickFormatter={formatDate}
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fontSize: 12 }}
              tickFormatter={formatNumber}
              tickLine={false}
              axisLine={false}
              width={56}
            />
            <Tooltip
              labelFormatter={formatDate}
              formatter={(v: number, name: string) => [
                v.toLocaleString('fr-FR'),
                PLATFORM_LABELS[name as Platform] ?? name,
              ]}
              contentStyle={{ borderRadius: 8, fontSize: 12 }}
            />
            {platforms.map((platform) => (
              <Line
                key={platform}
                type="monotone"
                dataKey={platform}
                stroke={PLATFORM_STYLES[platform].color}
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}

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
      className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-xs font-medium transition-colors"
    >
      {label}
      {active ? (
        dir === 'desc' ? (
          <ArrowDown className="h-3 w-3" />
        ) : (
          <ArrowUp className="h-3 w-3" />
        )
      ) : (
        <ArrowUpDown className="h-3 w-3 opacity-40" />
      )}
    </button>
  )
}

function downloadCsv(items: PlatformPostItem[]): void {
  const headers = ['Publication', 'Type', 'Date', 'Impressions', 'Interactions', 'Réseau']
  const rows = items.map((post) => [
    post.caption ?? '',
    post.mediaType ?? '',
    post.publishedAt ?? '',
    String(getImpressions(post)),
    String(getInteractions(post)),
    PLATFORM_LABELS[post.platform],
  ])
  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(','))
    .join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'publications-analytics.csv'
  link.click()
  URL.revokeObjectURL(url)
}

function PostsList({ items }: { items: PlatformPostItem[] }) {
  const [sortKey, setSortKey] = useState<SortKey>('impressions')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(5)
  const [visibleColumns, setVisibleColumns] = useState<Record<ColumnKey, boolean>>({
    type: true,
    date: true,
    impressions: true,
    interactions: true,
    platform: true,
  })

  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'))
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return items
    return items.filter((post) => {
      const caption = post.caption?.toLowerCase() ?? ''
      const platform = PLATFORM_LABELS[post.platform].toLowerCase()
      return caption.includes(normalized) || platform.includes(normalized)
    })
  }, [items, query])

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let diff = 0
      if (sortKey === 'publishedAt') {
        diff = (a.publishedAt ?? '').localeCompare(b.publishedAt ?? '')
      } else if (sortKey === 'impressions') {
        diff = getImpressions(a) - getImpressions(b)
      } else {
        diff = getInteractions(a) - getInteractions(b)
      }
      return sortDir === 'desc' ? -diff : diff
    })
  }, [filtered, sortDir, sortKey])

  const pageCount = Math.max(Math.ceil(sorted.length / pageSize), 1)
  const safePage = Math.min(page, pageCount)
  const pageItems = sorted.slice((safePage - 1) * pageSize, safePage * pageSize)
  const firstItem = sorted.length === 0 ? 0 : (safePage - 1) * pageSize + 1
  const lastItem = Math.min(safePage * pageSize, sorted.length)

  function setColumn(key: ColumnKey, value: boolean) {
    setVisibleColumns((current) => ({ ...current, [key]: value }))
  }

  if (items.length === 0) {
    return (
      <div className="text-muted-foreground flex h-48 items-center justify-center text-sm">
        Aucune publication synchronisée pour cette période.
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 lg:flex-row">
        <div className="relative flex-1">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input
            value={query}
            onChange={(event) => {
              setQuery(event.target.value)
              setPage(1)
            }}
            className="pl-9"
            placeholder="Rechercher"
          />
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => downloadCsv(sorted)}>
            <Download className="h-4 w-4" />
            Télécharger CSV
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="outline">
                <Columns3 className="h-4 w-4" />
                Colonnes
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {(Object.keys(COLUMN_LABELS) as ColumnKey[]).map((key) => (
                <DropdownMenuCheckboxItem
                  key={key}
                  checked={visibleColumns[key]}
                  onCheckedChange={(checked) => setColumn(key, Boolean(checked))}
                >
                  {COLUMN_LABELS[key]}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[920px] border-separate border-spacing-y-1 text-sm">
          <thead>
            <tr className="text-muted-foreground">
              <th className="px-5 py-3 text-left font-medium">Publication</th>
              {visibleColumns.type && <th className="px-4 py-3 text-left font-medium">Type</th>}
              {visibleColumns.date && (
                <th className="px-4 py-3 text-left">
                  <SortButton
                    label="Date"
                    sortKey="publishedAt"
                    current={sortKey}
                    dir={sortDir}
                    onClick={handleSort}
                  />
                </th>
              )}
              {visibleColumns.impressions && (
                <th className="px-4 py-3 text-right">
                  <SortButton
                    label="Impressions"
                    sortKey="impressions"
                    current={sortKey}
                    dir={sortDir}
                    onClick={handleSort}
                  />
                </th>
              )}
              {visibleColumns.interactions && (
                <th className="px-4 py-3 text-right">
                  <SortButton
                    label="Interactions"
                    sortKey="interactions"
                    current={sortKey}
                    dir={sortDir}
                    onClick={handleSort}
                  />
                </th>
              )}
              {visibleColumns.platform && (
                <th className="px-5 py-3 text-center font-medium">Réseau</th>
              )}
            </tr>
          </thead>
          <tbody>
            {pageItems.map((post) => {
              const MediaIcon = getMediaIcon(post.mediaType)
              return (
                <tr key={post.id} className="group">
                  <td className="group-hover:bg-muted/30 rounded-l-lg border-y border-l px-5 py-3">
                    <div className="flex min-w-0 items-center gap-3">
                      {post.thumbnailUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={post.thumbnailUrl}
                          alt=""
                          className="h-10 w-10 flex-shrink-0 rounded-md object-cover"
                        />
                      ) : (
                        <div className="bg-muted flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md">
                          <FileText className="text-muted-foreground h-4 w-4" />
                        </div>
                      )}
                      <p className="line-clamp-1 max-w-xl text-sm text-slate-700">
                        {post.caption || 'Sans texte'}
                      </p>
                    </div>
                  </td>
                  {visibleColumns.type && (
                    <td className="group-hover:bg-muted/30 border-y px-4 py-3">
                      <MediaIcon className="h-5 w-5" />
                    </td>
                  )}
                  {visibleColumns.date && (
                    <td className="group-hover:bg-muted/30 border-y px-4 py-3">
                      <div className="text-right whitespace-nowrap lg:text-left">
                        <p>{formatDateFull(post.publishedAt)}</p>
                        <p className="text-muted-foreground">{formatTime(post.publishedAt)}</p>
                      </div>
                    </td>
                  )}
                  {visibleColumns.impressions && (
                    <td className="group-hover:bg-muted/30 border-y px-4 py-3 text-right tabular-nums">
                      {formatNumber(getImpressions(post))}
                    </td>
                  )}
                  {visibleColumns.interactions && (
                    <td className="group-hover:bg-muted/30 border-y px-4 py-3 text-right tabular-nums">
                      {formatNumber(getInteractions(post))}
                    </td>
                  )}
                  {visibleColumns.platform && (
                    <td className="group-hover:bg-muted/30 rounded-r-lg border-y border-r px-5 py-3 text-center">
                      <span
                        className={cn(
                          'inline-flex rounded-full px-2.5 py-1 text-xs font-medium',
                          PLATFORM_STYLES[post.platform].card,
                          PLATFORM_STYLES[post.platform].text
                        )}
                      >
                        {PLATFORM_LABELS[post.platform]}
                      </span>
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col items-center justify-end gap-3 text-sm sm:flex-row">
        <label className="text-muted-foreground flex items-center gap-2">
          Éléments par page
          <select
            value={pageSize}
            onChange={(event) => {
              setPageSize(Number(event.target.value))
              setPage(1)
            }}
            className="bg-background h-10 rounded-md border px-3"
          >
            {[5, 10, 25].map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </label>
        <p className="text-muted-foreground tabular-nums">
          {firstItem}-{lastItem} sur {sorted.length}
        </p>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={safePage === 1}
            onClick={() => setPage(1)}
          >
            <ChevronFirst className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={safePage === 1}
            onClick={() => setPage((current) => Math.max(current - 1, 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={safePage === pageCount}
            onClick={() => setPage((current) => Math.min(current + 1, pageCount))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={safePage === pageCount}
            onClick={() => setPage(pageCount)}
          >
            <ChevronLast className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

type Props = {
  byPlatform: PostPlatformTotals[]
  interactionsByDay: PlatformDay[]
  postsByDay: PlatformDay[]
  totalInteractions: number
  totalPostsCount: number
  items: PlatformPostItem[]
}

export function PostsSection({
  byPlatform,
  interactionsByDay,
  postsByDay,
  totalInteractions,
  totalPostsCount,
  items,
}: Props) {
  return (
    <section className="bg-background space-y-8 rounded-lg border p-5 shadow-sm">
      <h2 className="text-lg font-semibold">Publications</h2>

      <MetricPanel
        label="Interactions"
        total={totalInteractions}
        data={interactionsByDay}
        byPlatform={byPlatform.map((p) => ({ platform: p.platform, value: p.interactions }))}
      />
      <MetricPanel
        label="Nombre de publications"
        total={totalPostsCount}
        data={postsByDay}
        byPlatform={byPlatform.map((p) => ({ platform: p.platform, value: p.postsCount }))}
      />

      <div className="border-t pt-8">
        <h3 className="mb-5 text-lg font-semibold">Liste des publications</h3>
        <PostsList items={items} />
      </div>
    </section>
  )
}
