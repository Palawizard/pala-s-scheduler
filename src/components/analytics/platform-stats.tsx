'use client'

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PLATFORM_LABELS } from '@/lib/constants'
import type { PlatformStats } from '@/hooks/use-analytics'

const PLATFORM_COLORS: Record<string, string> = {
  YOUTUBE: '#ef4444',
  INSTAGRAM: '#ec4899',
  TIKTOK: '#000000',
  TWITTER: '#3b82f6',
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`
  return String(n)
}

type Props = {
  platforms: PlatformStats[]
}

export function PlatformStatsSection({ platforms }: Props) {
  if (platforms.length === 0) {
    return null
  }

  const chartData = platforms.map((p) => ({
    name: PLATFORM_LABELS[p.platform],
    Vues: p.views,
    Likes: p.likes,
    Commentaires: p.comments,
  }))

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {platforms.map((p) => (
          <Card key={p.platform}>
            <CardContent className="p-5">
              <div className="mb-3 flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: PLATFORM_COLORS[p.platform] ?? '#888' }}
                />
                <span className="text-sm font-medium">{PLATFORM_LABELS[p.platform]}</span>
                <span className="text-muted-foreground ml-auto text-xs">{p.postsCount} post{p.postsCount !== 1 ? 's' : ''}</span>
              </div>
              <div className="grid grid-cols-2 gap-y-2 text-sm">
                <span className="text-muted-foreground">Vues</span>
                <span className="text-right font-medium tabular-nums">{formatNumber(p.views)}</span>
                <span className="text-muted-foreground">Likes</span>
                <span className="text-right font-medium tabular-nums">{formatNumber(p.likes)}</span>
                <span className="text-muted-foreground">Commentaires</span>
                <span className="text-right font-medium tabular-nums">{formatNumber(p.comments)}</span>
                {p.shares > 0 && (
                  <>
                    <span className="text-muted-foreground">Partages</span>
                    <span className="text-right font-medium tabular-nums">{formatNumber(p.shares)}</span>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {platforms.length > 1 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Comparaison par plateforme</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={36} />
                <Tooltip
                  formatter={(value: number, name: string) => [value.toLocaleString('fr-FR'), name]}
                  contentStyle={{ fontSize: 12 }}
                />
                <Bar dataKey="Vues" fill="#6366f1" radius={[3, 3, 0, 0]} />
                <Bar dataKey="Likes" fill="#ec4899" radius={[3, 3, 0, 0]} />
                <Bar dataKey="Commentaires" fill="#f59e0b" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
