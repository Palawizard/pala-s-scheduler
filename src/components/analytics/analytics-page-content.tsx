'use client'

import { useState } from 'react'
import { BarChart3, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'

import { AccountSection } from '@/components/analytics/account-section'
import { PostsSection } from '@/components/analytics/posts-section'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { Skeleton } from '@/components/ui/skeleton'
import { Spinner } from '@/components/ui/spinner'
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
  const hasAnalyticsData = Boolean(
    data &&
    (data.account.totalFollowers > 0 ||
      data.account.totalImpressions > 0 ||
      data.posts.totalInteractions > 0 ||
      data.posts.totalPostsCount > 0)
  )

  async function handleSync() {
    try {
      const result = await sync.mutateAsync()
      toast.success(`Synchronisation terminée — ${result.synced} mis à jour`)
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
            {sync.isPending ? (
              <Spinner className="h-3.5 w-3.5" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5" />
            )}
            Synchroniser
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Skeleton className="h-28 rounded-lg" />
            <Skeleton className="h-28 rounded-lg" />
          </div>
          <Skeleton className="h-52 rounded-lg" />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Skeleton className="h-28 rounded-lg" />
            <Skeleton className="h-28 rounded-lg" />
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Skeleton className="h-52 rounded-lg" />
            <Skeleton className="h-52 rounded-lg" />
          </div>
        </div>
      ) : !data ? null : !hasAnalyticsData ? (
        <EmptyState
          action={
            <Button variant="outline" onClick={handleSync} disabled={sync.isPending}>
              {sync.isPending ? <Spinner /> : <RefreshCw className="h-4 w-4" />}
              Synchroniser
            </Button>
          }
          description="Synchronisez vos comptes connectés pour afficher les performances."
          icon={<BarChart3 className="h-8 w-8" />}
          title="Aucune donnée analytique"
        />
      ) : (
        <div className="space-y-10">
          <AccountSection
            byPlatform={data.account.byPlatform}
            followersOverTime={data.account.followersOverTime}
            impressionsOverTime={data.account.impressionsOverTime}
            totalFollowers={data.account.totalFollowers}
            totalImpressions={data.account.totalImpressions}
          />
          <PostsSection
            byPlatform={data.posts.byPlatform}
            interactionsByDay={data.posts.interactionsByDay}
            postsByDay={data.posts.postsByDay}
            totalInteractions={data.posts.totalInteractions}
            totalPostsCount={data.posts.totalPostsCount}
            items={data.posts.items}
          />
        </div>
      )}
    </div>
  )
}
