import type { NextAuthConfig } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { User } from './app/lib/definitions';

export const authConfig: NextAuthConfig = {
  pages: {
    signIn: '/login',
  },

  trustHost: true,
  secret: process.env.AUTH_SECRET!,
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnDashboard = nextUrl.pathname.startsWith('/dashboard');
      if (isOnDashboard) {
        if (isLoggedIn) return true;
        return false;
      } else if (isLoggedIn) {
        const cbURL = new URL(nextUrl.href).searchParams.get('callbackUrl');
        return Response.redirect(cbURL || new URL('/dashboard', nextUrl));
      }
      return true;
    },
  },
  providers: [
    Credentials({
      async authorize(credentials) {
        try {
          const res = await fetch(`${process.env.NEXTAUTH_URL}/api/user`, {
            headers: {
              Accept: 'application/json',
              'Content-Type': 'application/json',
            },
            method: 'POST',
            body: JSON.stringify(credentials),
          });
          const data = (await res.json()) as { data: User };
          const user = data.data;
          return user || null;
        } catch (e) {
          return null;
        }
      },
    }),
  ],
};
