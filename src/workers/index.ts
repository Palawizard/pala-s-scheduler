import IORedis from 'ioredis'

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

const worker = createPostSchedulerWorker(connection)

process.on('SIGTERM', async () => {
  console.log('[worker] shutting down...')
  await worker.close()
  await connection.quit()
  process.exit(0)
})

process.on('SIGINT', async () => {
  console.log('[worker] shutting down...')
  await worker.close()
  await connection.quit()
  process.exit(0)
})

console.log('[worker] starting...')
