import { Queue } from 'bullmq'
import IORedis from 'ioredis'

export const ANALYTICS_SYNC_INTERVAL_MS = 6 * 60 * 60 * 1000

export const redisConnection = new IORedis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
})

export const postSchedulerQueue = new Queue('post-scheduler', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 500 },
  },
})

export type PostSchedulerJobData = {
  postId: string
  userId: string
}

function jobId(postId: string): string {
  return `post_${postId}`
}

export async function schedulePostJob(postId: string, userId: string, scheduledAt: Date): Promise<void> {
  const delay = Math.max(0, scheduledAt.getTime() - Date.now())
  const existing = await postSchedulerQueue.getJob(jobId(postId))
  if (existing) {
    await existing.remove()
  }
  await postSchedulerQueue.add('publish-post', { postId, userId }, {
    jobId: jobId(postId),
    delay,
  })
}

export async function cancelPostJob(postId: string): Promise<void> {
  const existing = await postSchedulerQueue.getJob(jobId(postId))
  if (existing) {
    await existing.remove()
  }
}

export const analyticsQueue = new Queue('analytics', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 2,
    backoff: { type: 'exponential', delay: 10_000 },
    removeOnComplete: { count: 10 },
    removeOnFail: { count: 50 },
  },
})

export type AnalyticsJobData = Record<string, never>

export async function registerAnalyticsSyncJob(): Promise<void> {
  await analyticsQueue.upsertJobScheduler(
    'analytics-sync',
    { every: ANALYTICS_SYNC_INTERVAL_MS },
    { name: 'sync-all', data: {} }
  )
}
