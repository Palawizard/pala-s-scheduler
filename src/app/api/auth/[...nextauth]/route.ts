import { NextRequest } from 'next/server'
import { appBasePath, withBasePath } from '@/lib/base-path'
import { handlers } from '@/lib/auth'

function withAuthRequestBasePath(request: NextRequest): NextRequest {
  const url = request.nextUrl.clone()
  const publicAuthPrefix = appBasePath ? `${appBasePath}/` : ''

  if (publicAuthPrefix && !url.pathname.startsWith(publicAuthPrefix)) {
    url.pathname = withBasePath(url.pathname)
  }

  return new NextRequest(url, request)
}

export async function GET(request: NextRequest) {
  return handlers.GET(withAuthRequestBasePath(request))
}

export async function POST(request: NextRequest) {
  return handlers.POST(withAuthRequestBasePath(request))
}
