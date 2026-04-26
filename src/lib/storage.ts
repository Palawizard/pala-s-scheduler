import { randomUUID } from 'node:crypto'
import path from 'node:path'

import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'
import { getAbsoluteAppUrl, withBasePath } from '@/lib/base-path'

const DEFAULT_PUBLIC_BASE_URL = '/api/media'

type R2Config = {
  accountId: string
  accessKeyId: string
  secretAccessKey: string
  bucket: string
}

let r2Client: S3Client | null = null

function getR2Config(): R2Config {
  const accountId = process.env.R2_ACCOUNT_ID
  const accessKeyId = process.env.R2_ACCESS_KEY_ID
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY
  const bucket = process.env.R2_BUCKET_NAME

  if (!accountId || !accessKeyId || !secretAccessKey || !bucket) {
    throw new Error('Missing Cloudflare R2 configuration')
  }

  return { accountId, accessKeyId, secretAccessKey, bucket }
}

function getR2Client(): S3Client {
  const config = getR2Config()

  r2Client ??= new S3Client({
    region: 'auto',
    endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  })

  return r2Client
}

function getPublicBaseUrl(): string {
  return (process.env.R2_PUBLIC_URL ?? DEFAULT_PUBLIC_BASE_URL).replace(/\/$/, '')
}

function isR2ApiEndpoint(url: URL): boolean {
  return url.hostname.endsWith('.r2.cloudflarestorage.com')
}

export function getAppMediaUrl(key: string): string {
  assertValidStorageKey(key)
  return `${withBasePath(DEFAULT_PUBLIC_BASE_URL)}/${key}`
}

function assertValidStorageKey(key: string): void {
  const normalized = path.posix.normalize(key)
  const hasTraversal = normalized === '..' || normalized.startsWith('../')

  if (!key || key.startsWith('/') || key.includes('\\') || hasTraversal || normalized !== key) {
    throw new Error('Invalid storage key')
  }
}

export async function uploadFile(key: string, body: Buffer, contentType: string): Promise<string> {
  assertValidStorageKey(key)
  const config = getR2Config()

  await getR2Client().send(
    new PutObjectCommand({
      Bucket: config.bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  )

  return getAppMediaUrl(key)
}

export async function deleteFile(key: string): Promise<void> {
  assertValidStorageKey(key)
  const config = getR2Config()

  await getR2Client().send(
    new DeleteObjectCommand({
      Bucket: config.bucket,
      Key: key,
    })
  )
}

export async function readFileFromStorage(key: string): Promise<Buffer> {
  assertValidStorageKey(key)
  const config = getR2Config()

  const response = await getR2Client().send(
    new GetObjectCommand({
      Bucket: config.bucket,
      Key: key,
    })
  )

  if (!response.Body) {
    throw new Error('Storage object has no body')
  }

  return Buffer.from(await response.Body.transformToByteArray())
}

export async function getFileSizeFromStorage(key: string): Promise<number> {
  assertValidStorageKey(key)
  const config = getR2Config()

  const response = await getR2Client().send(
    new HeadObjectCommand({
      Bucket: config.bucket,
      Key: key,
    })
  )

  return response.ContentLength ?? 0
}

export function getPublicUrl(key: string): string {
  assertValidStorageKey(key)
  return `${getPublicBaseUrl()}/${key}`
}

export function getAbsolutePublicUrl(key: string): string {
  const publicUrl = getPublicUrl(key)

  try {
    const url = new URL(publicUrl)
    if (url.hostname === 'localhost' || url.hostname === '127.0.0.1' || isR2ApiEndpoint(url)) {
      return getAbsoluteAppUrl(getAppMediaUrl(key)).toString()
    }
    return url.toString()
  } catch {
    return getAbsoluteAppUrl(publicUrl).toString()
  }
}

export function extractKeyFromUrl(url: string): string {
  const publicBaseUrl = getPublicBaseUrl()
  const appMediaBaseUrl = withBasePath(DEFAULT_PUBLIC_BASE_URL)

  if (url.startsWith(`${publicBaseUrl}/`)) {
    return decodeURIComponent(url.slice(publicBaseUrl.length + 1))
  }

  if (url.startsWith(`${appMediaBaseUrl}/`)) {
    return decodeURIComponent(url.slice(appMediaBaseUrl.length + 1))
  }

  const parsedUrl = new URL(url, getAbsoluteAppUrl('/').toString())
  const appMediaBasePath = new URL(appMediaBaseUrl, parsedUrl.origin).pathname.replace(/\/$/, '')
  const publicBase = new URL(publicBaseUrl, parsedUrl.origin)
  const basePath = publicBase.pathname.replace(/\/$/, '')

  if (parsedUrl.pathname.startsWith(`${appMediaBasePath}/`)) {
    return decodeURIComponent(parsedUrl.pathname.slice(appMediaBasePath.length + 1))
  }

  if (parsedUrl.origin !== publicBase.origin || !parsedUrl.pathname.startsWith(`${basePath}/`)) {
    return ''
  }

  return decodeURIComponent(parsedUrl.pathname.slice(basePath.length + 1))
}

export function buildMediaKey(userId: string, filename: string): string {
  const timestamp = Date.now()
  const sanitized = filename.replace(/[^a-zA-Z0-9._-]/g, '_')
  return `media/${userId}/${timestamp}-${randomUUID()}-${sanitized}`
}
