import type { Job } from 'bullmq'
import { Worker } from 'bullmq'
import type IORedis from 'ioredis'

import { db } from '@/lib/db'
import { getPlatformClient, type PublishPayload } from '@/lib/platforms'
import { checkPlatformRequirements, extractReadableError } from '@/lib/platforms/checks'
import { loadPublishMedia } from '@/lib/platforms/media'
import type { PostSchedulerJobData } from '@/lib/queue'

async function processScheduledPost(job: Job<PostSchedulerJobData>): Promise<void> {
  const { postId } = job.data

  const post = await db.post.findUnique({
    where: { id: postId },
    include: {
      platforms: {
        include: { connectedPlatform: true },
      },
    },
  })

  if (!post) {
    console.log(`[worker] post ${postId} not found, skipping`)
    return
  }

  if (post.status === 'PUBLISHED' || post.status === 'CANCELLED') {
    console.log(`[worker] post ${postId} already ${post.status}, skipping`)
    return
  }

  console.log(`[worker] processing post ${postId}, attempt ${job.attemptsMade + 1}`)

  await db.post.update({ where: { id: post.id }, data: { status: 'PUBLISHING' } })

  let media: Awaited<ReturnType<typeof loadPublishMedia>>
  try {
    media = await loadPublishMedia(post.mediaUrls)
  } catch (err) {
    console.error(`[worker] media load failed for post ${postId}:`, err instanceof Error ? err.message : err)
    throw err
  }

  const payload: PublishPayload = {
    postId: post.id,
    userId: post.userId,
    title: post.title,
    caption: post.caption,
    hashtags: post.hashtags,
    mediaUrls: post.mediaUrls,
    thumbnailUrl: post.thumbnailUrl,
    contentType: null,
    visibility: null,
    media,
  }

  let successCount = 0

  for (const postPlatform of post.platforms) {
    if (postPlatform.status === 'PUBLISHED') {
      successCount += 1
      continue
    }

    await db.postPlatform.update({
      where: { id: postPlatform.id },
      data: { status: 'PUBLISHING', errorMessage: null },
    })

    const preflightError = checkPlatformRequirements(
      postPlatform.platform,
      postPlatform.contentType,
      postPlatform.connectedPlatform.tokenExpiry,
      media
    )

    if (preflightError) {
      console.warn(`[worker] preflight failed for ${postPlatform.platform} on post ${postId}: ${preflightError}`)
      await db.postPlatform.update({
        where: { id: postPlatform.id },
        data: { status: 'FAILED', errorMessage: preflightError },
      })
      continue
    }

    try {
      // Each publisher handles proactive token refresh internally before publishing
      const result = await getPlatformClient(postPlatform.platform).publish(
        { ...payload, contentType: postPlatform.contentType, visibility: postPlatform.visibility },
        postPlatform.connectedPlatform
      )

      await db.postPlatform.update({
        where: { id: postPlatform.id },
        data: {
          status: 'PUBLISHED',
          platformPostId: result.platformPostId,
          publishedAt: new Date(),
          errorMessage: null,
        },
      })
      successCount += 1
      console.log(`[worker] ${postPlatform.platform} published for post ${postId}`)
    } catch (err) {
      const raw = err instanceof Error ? err.message : 'Publication impossible'
      const readable = extractReadableError(postPlatform.platform, raw)
      console.error(`[worker] ${postPlatform.platform} failed for post ${postId}:`, raw)
      await db.postPlatform.update({
        where: { id: postPlatform.id },
        data: { status: 'FAILED', errorMessage: readable },
      })
    }
  }

  const nextStatus = successCount === post.platforms.length ? 'PUBLISHED' : 'FAILED'
  await db.post.update({
    where: { id: post.id },
    data: {
      status: nextStatus,
      publishedAt: successCount > 0 ? new Date() : undefined,
    },
  })

  console.log(`[worker] post ${postId} → ${nextStatus} (${successCount}/${post.platforms.length} platforms)`)
}

export function createPostSchedulerWorker(connection: IORedis): Worker<PostSchedulerJobData> {
  const worker = new Worker<PostSchedulerJobData>('post-scheduler', processScheduledPost, {
    connection,
  })

  worker.on('completed', (job) => {
    console.log(`[worker] job ${job.id} completed`)
  })

  worker.on('failed', async (job, err) => {
    if (!job) return
    const maxAttempts = job.opts.attempts ?? 1
    console.error(`[worker] job ${job.id} failed (attempt ${job.attemptsMade}/${maxAttempts}):`, err.message)

    // After exhausting all retries, mark the post as permanently failed
    if (job.attemptsMade >= maxAttempts) {
      await db.post
        .update({
          where: { id: job.data.postId },
          data: { status: 'FAILED' },
        })
        .catch((updateErr: unknown) => {
          console.error(`[worker] could not mark post ${job.data.postId} as FAILED:`, updateErr)
        })
    }
  })

  return worker
}
