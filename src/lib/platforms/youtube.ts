type YoutubeChannel = {
  id: string
  title: string
  avatar: string | null
}

type JsonRecord = Record<string, unknown>

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function getString(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null
}

function getThumbnailUrl(snippet: JsonRecord): string | null {
  const thumbnails = snippet.thumbnails
  if (!isRecord(thumbnails)) return null

  for (const key of ['high', 'medium', 'default']) {
    const thumbnail = thumbnails[key]
    if (!isRecord(thumbnail)) continue

    const url = getString(thumbnail.url)
    if (url) return url
  }

  return null
}

export async function getYoutubeChannel(accessToken: string): Promise<YoutubeChannel | null> {
  const params = new URLSearchParams({
    part: 'snippet',
    mine: 'true',
  })

  const res = await fetch(`https://www.googleapis.com/youtube/v3/channels?${params}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) throw new Error(`YouTube channel fetch failed: ${await res.text()}`)

  const body = (await res.json()) as unknown
  if (!isRecord(body) || !Array.isArray(body.items)) return null

  const firstChannel = body.items.find(isRecord)
  if (!firstChannel) return null

  const id = getString(firstChannel.id)
  const snippet = firstChannel.snippet
  if (!id || !isRecord(snippet)) return null

  const title = getString(snippet.title)
  if (!title) return null

  return {
    id,
    title,
    avatar: getThumbnailUrl(snippet),
  }
}
