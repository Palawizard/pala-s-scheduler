import { PrismaAdapter } from '@auth/prisma-adapter'
import type { DefaultSession } from 'next-auth'
import NextAuth from 'next-auth'
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
    session({ session, user }) {
      session.user.id = user.id
      return session
    },
  },
})
