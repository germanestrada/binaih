import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { getUserByEmail, validatePassword } from '@/lib/users'
import type { Role } from '@/types/auth'

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: process.env.AUTH_SECRET,
  session: { strategy: 'jwt', maxAge: 60 * 60 * 8 },
  pages: { signIn: '/login', error: '/login' },

  providers: [
    Credentials({
      name: 'Credenciales',
      credentials: {
        email:    { label: 'Email',      type: 'email'    },
        password: { label: 'Contraseña', type: 'password' },
      },
      async authorize(credentials) {
        const email    = credentials?.email    as string | undefined
        const password = credentials?.password as string | undefined
        if (!email || !password) return null

        const user = await getUserByEmail(email)
        if (!user) return null

        const valid = await validatePassword(password, user.passwordHash)
        if (!valid) return null

        return {
          id:          user.id,
          name:        user.name,
          email:       user.email,
          role:        user.roleName as Role,
          zone:        user.zone,
          companyId:   user.tenantId,
          companyName: user.tenantName,
        }
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token['role']        = user.role
        token['zone']        = user.zone ?? null
        token['companyId']   = user.companyId
        token['companyName'] = user.companyName
      }
      return token
    },
    async session({ session, token }) {
      return {
        ...session,
        user: {
          ...session.user,
          id:          token.sub ?? '',
          role:        (token['role']        as Role)   ?? 'viewer',
          zone:        (token['zone']        as string) ?? null,
          companyId:   (token['companyId']   as string) ?? '',
          companyName: (token['companyName'] as string) ?? '',
        },
      }
    },
  },
})
