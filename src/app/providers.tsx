'use client'

import { useState } from 'react'
import { SessionProvider } from 'next-auth/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { Toaster } from '@/components/ui/sonner'
import { withBasePath } from '@/lib/base-path'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())

  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider basePath={withBasePath('/api/auth')}>
        {children}
        <Toaster richColors position="top-right" />
      </SessionProvider>
    </QueryClientProvider>
  )
}
