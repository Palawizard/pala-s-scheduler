import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

function getS3Client() {
  return new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  })
}

const BUCKET = () => process.env.R2_BUCKET_NAME!

export async function uploadFile(
  key: string,
  body: Buffer,
  contentType: string
): Promise<string> {
  const s3 = getS3Client()
  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET(),
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  )
  return getPublicUrl(key)
}

export async function deleteFile(key: string): Promise<void> {
  const s3 = getS3Client()
  await s3.send(
    new DeleteObjectCommand({
      Bucket: BUCKET(),
      Key: key,
    })
  )
}

export async function getPresignedUploadUrl(
  key: string,
  contentType: string,
  expiresInSeconds = 3600
): Promise<string> {
  const s3 = getS3Client()
  return getSignedUrl(
    s3,
    new PutObjectCommand({
      Bucket: BUCKET(),
      Key: key,
      ContentType: contentType,
    }),
    { expiresIn: expiresInSeconds }
  )
}

export function getPublicUrl(key: string): string {
  return `${process.env.R2_PUBLIC_URL}/${key}`
}

export function extractKeyFromUrl(url: string): string {
  const base = process.env.R2_PUBLIC_URL ?? ''
  return url.replace(`${base}/`, '')
}

export function buildMediaKey(userId: string, filename: string): string {
  const timestamp = Date.now()
  const sanitized = filename.replace(/[^a-zA-Z0-9._-]/g, '_')
  return `media/${userId}/${timestamp}-${sanitized}`
}
