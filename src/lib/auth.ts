import { PrismaAdapter } from '@auth/prisma-adapter'
import type { DefaultSession } from 'next-auth'
import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'
import Nodemailer from 'next-auth/providers/nodemailer'
import { authConfig } from './auth-config'
import { db } from './db'

const emailServer = process.env.EMAIL_SERVER || 'smtp://localhost:1025'

async function saveYoutubeConnectedPlatform({
  userId,
  accessToken,
  refreshToken,
  expiresAt,
  providerAccountId,
  username,
  avatar,
}: {
  userId: string
  accessToken: string
  refreshToken?: string | null
  expiresAt?: number | null
  providerAccountId: string
  username?: string | null
  avatar?: string | null
}): Promise<void> {
  await db.connectedPlatform.upsert({
    where: { userId_platform: { userId, platform: 'YOUTUBE' } },
    update: {
      accessToken,
      refreshToken: refreshToken ?? null,
      tokenExpiry: expiresAt ? new Date(expiresAt * 1000) : null,
      platformUserId: providerAccountId,
      platformUsername: username ?? null,
      platformAvatar: avatar ?? null,
      isActive: true,
    },
    create: {
      userId,
      platform: 'YOUTUBE',
      accessToken,
      refreshToken: refreshToken ?? null,
      tokenExpiry: expiresAt ? new Date(expiresAt * 1000) : null,
      platformUserId: providerAccountId,
      platformUsername: username ?? null,
      platformAvatar: avatar ?? null,
    },
  })
}

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
      server: emailServer,
      from: process.env.EMAIL_FROM ?? 'noreply@localhost',
      sendVerificationRequest: async ({ identifier, url }) => {
        if (process.env.NODE_ENV !== 'production') {
          console.log(`\n[auth] Magic link for ${identifier}:\n${url}\n`)
          return
        }
        if (!process.env.EMAIL_SERVER) {
          throw new Error('EMAIL_SERVER is required to send magic links in production')
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
          const dbUser = await db.user.findUnique({ where: { id: user.id }, select: { id: true } })
          if (!dbUser) return true

          await saveYoutubeConnectedPlatform({
            userId: dbUser.id,
            accessToken: account.access_token,
            refreshToken: account.refresh_token,
            expiresAt: account.expires_at,
            providerAccountId: account.providerAccountId,
            username: user.name,
            avatar: user.image,
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
  events: {
    async linkAccount({ user, account }) {
      if (account.provider !== 'google' || !account.access_token || !user.id) return

      try {
        await saveYoutubeConnectedPlatform({
          userId: user.id,
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          expiresAt: account.expires_at,
          providerAccountId: account.providerAccountId,
          username: user.name,
          avatar: user.image,
        })
      } catch (err) {
        console.error('[auth] failed to link youtube connected platform:', err)
      }
    },
  },
})
