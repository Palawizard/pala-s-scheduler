import { Worker } from 'bullmq'
import type IORedis from 'ioredis'

import { syncAllUsersAnalytics } from '@/lib/analytics/sync'
import type { AnalyticsJobData } from '@/lib/queue'

export function createAnalyticsWorker(connection: IORedis): Worker<AnalyticsJobData> {
  const worker = new Worker<AnalyticsJobData>(
    'analytics',
    async (job) => {
      console.log(`[analytics-worker] running sync job ${job.id}`)
      await syncAllUsersAnalytics()
      console.log(`[analytics-worker] sync job ${job.id} complete`)
    },
    { connection }
  )

  worker.on('failed', (_job, err) => {
    console.error('[analytics-worker] sync job failed:', err.message)
  })

  return worker
}
