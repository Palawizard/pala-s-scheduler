import { withBasePath } from '@/lib/base-path'

export async function uploadMedia(file: File): Promise<string> {
  const formData = new FormData()
  formData.append('file', file)

  const response = await fetch(withBasePath('/api/upload'), {
    method: 'POST',
    body: formData,
  })
  const body = (await response.json().catch(() => null)) as {
    data?: { url: string }
    error?: unknown
  } | null

  if (!response.ok) {
    throw new Error(typeof body?.error === 'string' ? body.error : 'Upload impossible')
  }

  if (!body?.data?.url) {
    throw new Error('Upload impossible')
  }

  return body.data.url
}

export async function deleteUploadedMedia(url: string): Promise<void> {
  const response = await fetch(withBasePath('/api/upload'), {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  })

  if (!response.ok) {
    throw new Error('Suppression impossible')
  }
}
