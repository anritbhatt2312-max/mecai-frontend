import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account && profile) {
        token.googleId = profile.sub
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.googleId as string) ?? token.sub ?? ''
      }
      return session
    },
    async redirect() {
      return '/chat'
    },
  },
})
