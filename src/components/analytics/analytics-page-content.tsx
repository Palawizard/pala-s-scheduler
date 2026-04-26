'use client'

import { useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { toast } from 'sonner'

import { EngagementChart } from '@/components/analytics/engagement-chart'
import { KpiCards } from '@/components/analytics/kpi-cards'
import { PlatformStatsSection } from '@/components/analytics/platform-stats'
import { PostsPerformanceTable } from '@/components/analytics/posts-table'
import { Button } from '@/components/ui/button'
import { useAnalytics, useSyncAnalytics } from '@/hooks/use-analytics'
import { cn } from '@/lib/utils'

const PERIODS = [
  { label: '7j', value: 7 },
  { label: '30j', value: 30 },
  { label: '90j', value: 90 },
]

export function AnalyticsPageContent() {
  const [period, setPeriod] = useState(30)
  const { data, isLoading } = useAnalytics(period)
  const sync = useSyncAnalytics()

  async function handleSync() {
    try {
      const result = await sync.mutateAsync()
      toast.success(`${result.synced} publication${result.synced !== 1 ? 's' : ''} synchronisée${result.synced !== 1 ? 's' : ''}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Synchronisation impossible')
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Analytiques</h1>
        <div className="flex items-center gap-3">
          <div className="flex rounded-md border">
            {PERIODS.map(({ label, value }) => (
              <button
                key={value}
                onClick={() => setPeriod(value)}
                className={cn(
                  'px-3 py-1.5 text-sm transition-colors first:rounded-l-md last:rounded-r-md',
                  period === value
                    ? 'bg-primary text-primary-foreground font-medium'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {label}
              </button>
            ))}
          </div>
          <Button variant="outline" size="sm" onClick={handleSync} disabled={sync.isPending}>
            <RefreshCw className={cn('h-3.5 w-3.5', sync.isPending && 'animate-spin')} />
            Synchroniser
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-muted h-24 animate-pulse rounded-lg" />
            ))}
          </div>
          <div className="bg-muted h-64 animate-pulse rounded-lg" />
        </div>
      ) : !data ? null : (
        <div className="space-y-6">
          <KpiCards kpis={data.kpis} />
          <EngagementChart data={data.engagementByDay} />
          <PlatformStatsSection platforms={data.byPlatform} />
          <PostsPerformanceTable posts={data.topPosts} />
        </div>
      )}
    </div>
  )
}
