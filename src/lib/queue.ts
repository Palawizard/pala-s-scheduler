import { Queue } from 'bullmq'
import IORedis from 'ioredis'

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
