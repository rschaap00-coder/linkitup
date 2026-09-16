import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { authenticate } from './lib/accounts';
import { localOwner } from './lib/identity';
import { db } from './lib/storage';

export function authConfigured() {
  return Boolean(process.env.AUTH_SECRET && process.env.DATABASE_URL);
}
export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Credentials({
    credentials: { email: { type: 'email' }, password: { type: 'password' } },
    authorize: (credentials, request) => authenticate(credentials, request.headers),
  })],
  session: { strategy: 'jwt', maxAge: 60 * 60 * 24 * 7 },
  pages: { signIn: '/inloggen', error: '/inloggen' },
  callbacks: {
    jwt({ token, user }) {
      if (user) token.owner = localOwner(user.id);
      return token;
    },
    session({ session, token }) {
      if (session.user) session.user.id = localOwner(token.owner) || '';
      return session;
    },
  },
});
export async function currentUser() {
  if (!authConfigured()) return null;
  const session = await auth();
  const owner = localOwner(session?.user?.id);
  if (!owner) return null;
  const rows = await db()`SELECT email, name FROM users WHERE id = ${owner.slice(6)}`;
  if (!rows[0]) return null;
  return { userId: owner, email: rows[0].email as string, name: rows[0].name as string };
}
