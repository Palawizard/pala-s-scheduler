import type { NextAuthConfig } from 'next-auth'
import { stripBasePath, withBasePath } from './base-path'

// Edge-compatible config (no Prisma adapter).
// Used by middleware to validate sessions without hitting the database.
export const authConfig: NextAuthConfig = {
  providers: [],
  pages: {
    signIn: withBasePath('/login'),
    error: withBasePath('/login'),
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const pathname = stripBasePath(nextUrl.pathname)
      const isLoginPage = pathname === '/login'

      if (!isLoggedIn && !isLoginPage) {
        return Response.redirect(new URL(withBasePath('/login'), nextUrl.origin))
      }
      return true
    },
  },
}
