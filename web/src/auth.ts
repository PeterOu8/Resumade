import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import Credentials from 'next-auth/providers/credentials';
import { signinSchema, signinResponseSchema } from './lib/auth/auth.schema';

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },

      async authorize(credentials) {
        const input = signinSchema.safeParse(credentials);
        if (!input.success) return null;

        const apiUrl = process.env.API_URL;
        if (!apiUrl) throw new Error('API_URL is missing');

        const response = await fetch(new URL('/api/auth/signin', apiUrl), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input.data),
          cache: 'no-store',
          signal: AbortSignal.timeout(10_000),
        });

        if (response.status === 401) return null;

        if (!response.ok) {
          throw new Error(`Login API returned HTTP ${response.status}`);
        }

        const { accessToken, user } = signinResponseSchema.parse(
          await response.json(),
        );

        return {
          id: user.userId,
          name: user.displayName,
          email: user.email,
          apiToken: accessToken,
        };
      },
    }),

    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,

      authorization: {
        params: {
          prompt: 'consent',
          access_type: 'offline',
          response_type: 'code',
        },
      },
    }),
  ],
  secret: process.env.AUTH_SECRET,
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60,
  },
  callbacks: {
    async jwt({ token, account, user }) {
      if (account?.provider === 'credentials') {
        if (!user?.id || !user.apiToken) {
          throw new Error(
            'Login API did not provide a user ID and access token',
          );
        }

        token.apiUserId = user.id;
        token.apiToken = user.apiToken;
        return token;
      }
      if (account?.provider === 'google') {
        const apiUrl = process.env.API_URL;
        if (!apiUrl) throw new Error('API_URL is missing');
        if (!account.id_token) throw new Error('Google ID token is missing');

        const response = await fetch(new URL('/api/auth/google', apiUrl), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken: account.id_token }),
          cache: 'no-store',
          signal: AbortSignal.timeout(10_000),
        });
        if (!response.ok) {
          throw new Error(
            `Google sign-in API returned HTTP ${response.status}`,
          );
        }

        const { accessToken, user } = signinResponseSchema.parse(
          await response.json(),
        );
        token.apiToken = accessToken;
        token.apiUserId = user.userId;
      }
      return token;
    },
    async session({ session, token }) {
      if (token.apiUserId !== undefined) {
        session.user.id = token.apiUserId;
      }
      session.error = token.error;
      return session;
    },
  },
});
