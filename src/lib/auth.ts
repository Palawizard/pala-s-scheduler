import { PrismaAdapter } from '@auth/prisma-adapter'
import type { DefaultSession } from 'next-auth'
import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'
import Nodemailer from 'next-auth/providers/nodemailer'
import { authConfig } from './auth-config'
import { db } from './db'

declare module 'next-auth' {
  interface Session {
    user: { id: string } & DefaultSession['user']
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(db),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: [
            'openid',
            'email',
            'profile',
            'https://www.googleapis.com/auth/youtube.upload',
            'https://www.googleapis.com/auth/youtube.readonly',
          ].join(' '),
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    }),
    Nodemailer({
      server: process.env.EMAIL_SERVER,
      from: process.env.EMAIL_FROM ?? 'noreply@localhost',
      sendVerificationRequest: async ({ identifier, url }) => {
        if (process.env.NODE_ENV !== 'production') {
          console.log(`\n[auth] Magic link for ${identifier}:\n${url}\n`)
          return
        }
        const { createTransport } = await import('nodemailer')
        const transport = createTransport(process.env.EMAIL_SERVER)
        await transport.sendMail({
          to: identifier,
          from: process.env.EMAIL_FROM,
          subject: "Connexion a Pala's Scheduler",
          text: `Votre lien de connexion : ${url}\n\nCe lien expire dans 24 heures.`,
          html: `<p>Votre lien de connexion :</p><p><a href="${url}">${url}</a></p><p>Ce lien expire dans 24 heures.</p>`,
        })
      },
    }),
  ],
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'google' && account.access_token && user.id) {
        try {
          await db.connectedPlatform.upsert({
            where: { userId_platform: { userId: user.id, platform: 'YOUTUBE' } },
            update: {
              accessToken: account.access_token,
              refreshToken: account.refresh_token ?? null,
              tokenExpiry: account.expires_at ? new Date(account.expires_at * 1000) : null,
              isActive: true,
            },
            create: {
              userId: user.id,
              platform: 'YOUTUBE',
              accessToken: account.access_token,
              refreshToken: account.refresh_token ?? null,
              tokenExpiry: account.expires_at ? new Date(account.expires_at * 1000) : null,
              platformUserId: account.providerAccountId,
              platformUsername: user.name ?? null,
              platformAvatar: user.image ?? null,
            },
          })
        } catch (err) {
          console.error('[auth] failed to save youtube connected platform:', err)
        }
      }
      return true
    },
    session({ session, user }) {
      session.user.id = user.id
      return session
    },
  },
})
