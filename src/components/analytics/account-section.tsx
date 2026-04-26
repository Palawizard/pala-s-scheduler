'use client'

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
import type { AccountPlatformStats, FollowersDay } from '@/hooks/use-analytics'

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

type Props = {
  byPlatform: AccountPlatformStats[]
  followersOverTime: FollowersDay[]
  totalFollowers: number
  totalImpressions: number
}

export function AccountSection({ byPlatform, followersOverTime, totalFollowers, totalImpressions }: Props) {
  const platforms = byPlatform.map((p) => p.platform)
  const hasFollowersHistory = followersOverTime.some((d) => platforms.some((p) => d[p] != null))

  return (
    <div className="space-y-4">
      <h2 className="font-medium">Compte</h2>

      <div className="grid gap-4 md:grid-cols-2">
        <StatSummaryCard
          label="Abonnés"
          total={totalFollowers}
          byPlatform={byPlatform.map((p) => ({ platform: p.platform, value: p.followers }))}
        />
        <StatSummaryCard
          label="Impressions totales"
          total={totalImpressions}
          byPlatform={byPlatform.filter((p) => p.impressions > 0).map((p) => ({ platform: p.platform, value: p.impressions }))}
        />
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium">Évolution des abonnés</CardTitle>
        </CardHeader>
        <CardContent>
          {!hasFollowersHistory ? (
            <div className="text-muted-foreground flex h-40 items-center justify-center text-sm">
              Synchronisez pour voir l&apos;évolution dans le temps.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={followersOverTime} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="date" tickFormatter={formatDate} tick={{ fontSize: 11 }} tickLine={false} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={40} />
                <Tooltip labelFormatter={formatDate} formatter={(v: number, name: string) => [v.toLocaleString('fr-FR'), PLATFORM_LABELS[name as keyof typeof PLATFORM_LABELS] ?? name]} contentStyle={{ fontSize: 12 }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} formatter={(name) => PLATFORM_LABELS[name as keyof typeof PLATFORM_LABELS] ?? name} />
                {platforms.map((p) => (
                  <Line key={p} type="monotone" dataKey={p} stroke={PLATFORM_COLORS[p]} strokeWidth={2} dot={false} connectNulls />
                ))}
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
