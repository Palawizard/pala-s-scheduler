import IORedis from 'ioredis'

import { registerAnalyticsSyncJob } from '@/lib/queue'
import { createAnalyticsWorker } from '@/workers/analytics.worker'
import { createPostSchedulerWorker } from '@/workers/post-scheduler.worker'

const connection = new IORedis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
})

connection.on('connect', () => {
  console.log('[worker] connected to redis')
})

connection.on('error', (err: Error) => {
  console.error('[worker] redis connection error:', err.message)
  process.exit(1)
})

const postWorker = createPostSchedulerWorker(connection)
const analyticsWorker = createAnalyticsWorker(connection)

registerAnalyticsSyncJob().catch((err: unknown) => {
  console.error('[worker] failed to register analytics sync job:', err)
})

process.on('SIGTERM', async () => {
  console.log('[worker] shutting down...')
  await postWorker.close()
  await analyticsWorker.close()
  await connection.quit()
  process.exit(0)
})

process.on('SIGINT', async () => {
  console.log('[worker] shutting down...')
  await postWorker.close()
  await analyticsWorker.close()
  await connection.quit()
  process.exit(0)
})

console.log('[worker] starting...')
