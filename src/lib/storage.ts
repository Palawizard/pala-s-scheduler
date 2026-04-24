import { randomUUID } from 'node:crypto'
import { mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'

const DEFAULT_STORAGE_ROOT = path.join(process.cwd(), 'storage')
const DEFAULT_PUBLIC_BASE_URL = '/api/media'

function getStorageRoot(): string {
  return path.resolve(process.env.LOCAL_STORAGE_ROOT ?? DEFAULT_STORAGE_ROOT)
}

function getPublicBaseUrl(): string {
  return (process.env.LOCAL_STORAGE_PUBLIC_URL ?? DEFAULT_PUBLIC_BASE_URL).replace(/\/$/, '')
}

function resolveStoragePath(key: string): string {
  const storageRoot = getStorageRoot()
  const filePath = path.resolve(storageRoot, key)

  if (!filePath.startsWith(`${storageRoot}${path.sep}`)) {
    throw new Error('Invalid storage key')
  }

  return filePath
}

export async function uploadFile(
  key: string,
  body: Buffer,
  _contentType: string
): Promise<string> {
  const filePath = resolveStoragePath(key)
  await mkdir(path.dirname(filePath), { recursive: true })
  await writeFile(filePath, body)

  return getPublicUrl(key)
}

export async function deleteFile(key: string): Promise<void> {
  await rm(resolveStoragePath(key), { force: true })
}

export async function readFileFromStorage(key: string): Promise<Buffer> {
  return readFile(resolveStoragePath(key))
}

export async function getFileSizeFromStorage(key: string): Promise<number> {
  const fileStat = await stat(resolveStoragePath(key))
  return fileStat.size
}

export function getPublicUrl(key: string): string {
  return `${getPublicBaseUrl()}/${key}`
}

export function getAbsolutePublicUrl(key: string): string {
  const publicUrl = getPublicUrl(key)
  const appOrigin = new URL(process.env.NEXTAUTH_URL ?? 'http://localhost:3000')

  try {
    const url = new URL(publicUrl)
    // If the stored URL is localhost but the app is exposed via tunnel, use the tunnel origin
    if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
      return new URL(url.pathname + url.search, appOrigin).toString()
    }
    return url.toString()
  } catch {
    return new URL(publicUrl, appOrigin).toString()
  }
}

export function extractKeyFromUrl(url: string): string {
  const publicBaseUrl = getPublicBaseUrl()

  if (url.startsWith(`${publicBaseUrl}/`)) {
    return url.slice(publicBaseUrl.length + 1)
  }

  const parsedUrl = new URL(url, process.env.NEXTAUTH_URL ?? 'http://localhost:3000')
  const basePath = new URL(publicBaseUrl, parsedUrl.origin).pathname.replace(/\/$/, '')

  if (!parsedUrl.pathname.startsWith(`${basePath}/`)) {
    return ''
  }

  return decodeURIComponent(parsedUrl.pathname.slice(basePath.length + 1))
}

export function buildMediaKey(userId: string, filename: string): string {
  const timestamp = Date.now()
  const sanitized = filename.replace(/[^a-zA-Z0-9._-]/g, '_')
  return `media/${userId}/${timestamp}-${randomUUID()}-${sanitized}`
}
