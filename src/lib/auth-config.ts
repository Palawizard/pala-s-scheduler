import type { NextAuthConfig } from 'next-auth'
import { withBasePath } from './base-path'

// Edge-compatible config (no Prisma adapter).
// Used by middleware to validate sessions without hitting the database.
export const authConfig: NextAuthConfig = {
  providers: [],
  pages: {
    signIn: withBasePath('/login'),
    error: withBasePath('/login'),
  },
  callbacks: {
    authorized() {
      return true
    },
  },
}
