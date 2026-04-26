'use client'

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import { PLATFORM_LABELS } from '@/lib/constants'
import type { AccountPlatformStats, PlatformDay } from '@/hooks/use-analytics'
import type { Platform } from '@/types'

const PLATFORM_STYLES: Record<Platform, { color: string; card: string; text: string }> = {
  YOUTUBE: { color: '#ff6f4f', card: 'bg-[#ff7155]', text: 'text-[#3d1409]' },
  INSTAGRAM: { color: '#f5a3df', card: 'bg-[#f5a3df]', text: 'text-[#481236]' },
  TIKTOK: { color: '#9ba8b0', card: 'bg-[#9ba8b0]', text: 'text-[#162027]' },
  TWITTER: { color: '#60a5fa', card: 'bg-[#93c5fd]', text: 'text-[#0f2f55]' },
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(n >= 10_000 ? 1 : 2)}k`
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
                  backgroundColor: PLATFORM_STYLES[platform as Platform]?.color ?? '#888',
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

type PlatformMetricCardProps = {
  platform: Platform
  value: number
}

function PlatformMetricCard({ platform, value }: PlatformMetricCardProps) {
  const style = PLATFORM_STYLES[platform]
  return (
    <div
      className={`min-w-36 rounded-lg px-6 py-3 text-center shadow-sm ${style.card} ${style.text}`}
    >
      <p className="text-3xl font-medium tabular-nums">{formatNumber(value)}</p>
      <p className="text-sm">{PLATFORM_LABELS[platform]}</p>
    </div>
  )
}

type Props = {
  byPlatform: AccountPlatformStats[]
  followersOverTime: PlatformDay[]
  impressionsOverTime: PlatformDay[]
  totalFollowers: number
  totalImpressions: number
}

type MetricPanelProps = {
  label: string
  total: number
  data: PlatformDay[]
  byPlatform: { platform: Platform; value: number }[]
}

function MetricPanel({ label, total, data, byPlatform }: MetricPanelProps) {
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

export function AccountSection({
  byPlatform,
  followersOverTime,
  impressionsOverTime,
  totalFollowers,
  totalImpressions,
}: Props) {
  return (
    <section className="bg-background space-y-8 rounded-lg border p-5 shadow-sm">
      <h2 className="text-lg font-semibold">Compte</h2>

      <MetricPanel
        label="Abonnés"
        total={totalFollowers}
        data={followersOverTime}
        byPlatform={byPlatform.map((p) => ({ platform: p.platform, value: p.followers }))}
      />
      <MetricPanel
        label="Impressions"
        total={totalImpressions}
        data={impressionsOverTime}
        byPlatform={byPlatform.map((p) => ({ platform: p.platform, value: p.impressions }))}
      />
    </section>
  )
}
