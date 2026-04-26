import { Queue } from 'bullmq'
import IORedis from 'ioredis'

import { env } from '@/lib/env'

export const redisConnection = new IORedis(env.REDIS_URL, {
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

export async function schedulePostJob(
  postId: string,
  userId: string,
  scheduledAt: Date
): Promise<void> {
  const delay = Math.max(0, scheduledAt.getTime() - Date.now())
  const existing = await postSchedulerQueue.getJob(jobId(postId))
  if (existing) {
    await existing.remove()
  }
  await postSchedulerQueue.add(
    'publish-post',
    { postId, userId },
    {
      jobId: jobId(postId),
      delay,
    }
  )
}

export async function cancelPostJob(postId: string): Promise<void> {
  const existing = await postSchedulerQueue.getJob(jobId(postId))
  if (existing) {
    await existing.remove()
  }
}
