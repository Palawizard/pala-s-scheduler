import type { NextAuthConfig } from 'next-auth'

// Edge-compatible config (no Prisma adapter).
// Used by middleware to validate sessions without hitting the database.
export const authConfig: NextAuthConfig = {
  providers: [],
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const isLoginPage = nextUrl.pathname === '/login'

      if (isLoggedIn && isLoginPage) {
        return Response.redirect(new URL('/calendar', nextUrl))
      }
      if (!isLoggedIn && !isLoginPage) {
        return Response.redirect(new URL('/login', nextUrl))
      }
      return true
    },
  },
}
