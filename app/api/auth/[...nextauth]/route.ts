import NextAuth from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      // On first sign-in, Google's sub is the stable unique user ID
      if (account && profile) {
        token.id = token.sub
      }
      return token
    },
    async session({ session, token }) {
      // Attach the id to session.user so it's available everywhere
      if (session.user) {
        session.user.id = token.id as string
      }
      return session
    },
    async redirect() {
      return '/chat'
    },
  },
})

export { handler as GET, handler as POST }