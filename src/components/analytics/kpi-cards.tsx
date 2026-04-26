'use client'

import { Eye, Heart, MessageCircle, Send } from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
import type { AnalyticsKpis } from '@/hooks/use-analytics'

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`
  return String(n)
}

type KpiCardProps = {
  label: string
  value: number
  icon: React.ElementType
}

function KpiCard({ label, value, icon: Icon }: KpiCardProps) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <div className="bg-muted flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
          <Icon className="text-muted-foreground h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-muted-foreground text-xs">{label}</p>
          <p className="text-2xl font-semibold tabular-nums">{formatNumber(value)}</p>
        </div>
      </CardContent>
    </Card>
  )
}

type Props = {
  kpis: AnalyticsKpis
}

export function KpiCards({ kpis }: Props) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <KpiCard label="Vues" value={kpis.totalViews} icon={Eye} />
      <KpiCard label="Likes" value={kpis.totalLikes} icon={Heart} />
      <KpiCard label="Commentaires" value={kpis.totalComments} icon={MessageCircle} />
      <KpiCard label="Publications" value={kpis.publishedPosts} icon={Send} />
    </div>
  )
}
