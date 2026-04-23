import IORedis from 'ioredis'

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

process.on('SIGTERM', async () => {
  console.log('[worker] shutting down...')
  await connection.quit()
  process.exit(0)
})

console.log('[worker] starting...')
