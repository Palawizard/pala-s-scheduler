import type { NextConfig } from 'next'

const basePath = process.env.NEXT_PUBLIC_BASE_PATH?.trim()

const nextConfig: NextConfig = {
  basePath:
    basePath && basePath !== '/'
      ? `/${basePath.replace(/^\/+|\/+$/g, '')}`
      : undefined,
  typescript: {
    ignoreBuildErrors: true,
  },
}

export default nextConfig
