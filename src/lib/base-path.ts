function normalizeBasePath(path: string | undefined): string {
  if (!path) return ''

  const trimmed = path.trim()
  if (!trimmed || trimmed === '/') return ''

  return `/${trimmed.replace(/^\/+|\/+$/g, '')}`
}

export const appBasePath = normalizeBasePath(process.env.NEXT_PUBLIC_BASE_PATH)

export function withBasePath(path: string): string {
  if (/^https?:\/\//.test(path)) return path

  const normalizedPath = path ? `/${path.replace(/^\/+/, '')}` : '/'
  if (!appBasePath) return normalizedPath
  if (normalizedPath === appBasePath || normalizedPath.startsWith(`${appBasePath}/`)) {
    return normalizedPath
  }
  if (normalizedPath === '/') return `${appBasePath}/`

  return `${appBasePath}${normalizedPath}`
}

export function stripBasePath(pathname: string): string {
  if (!appBasePath) return pathname || '/'
  if (pathname === appBasePath) return '/'
  if (pathname.startsWith(`${appBasePath}/`)) return pathname.slice(appBasePath.length)

  return pathname || '/'
}

export function getAbsoluteAppUrl(
  path: string,
  baseUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000'
): URL {
  if (/^https?:\/\//.test(path)) return new URL(path)

  const base = new URL(baseUrl)
  const basePath = normalizeBasePath(base.pathname)
  const normalizedPath = path ? `/${path.replace(/^\/+/, '')}` : '/'
  const absolutePath =
    basePath && normalizedPath !== basePath && !normalizedPath.startsWith(`${basePath}/`)
      ? withBasePath(normalizedPath)
      : normalizedPath

  return new URL(absolutePath, base.origin)
}
