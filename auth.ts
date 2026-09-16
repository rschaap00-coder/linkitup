import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import { verifiedGoogleOwner } from './lib/identity';

export function googleConfigured() {
  return Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET && process.env.AUTH_SECRET);
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Google({ authorization: { params: { prompt: 'select_account' } } })],
  session: { strategy: 'jwt', maxAge: 60 * 60 * 24 * 7 },
  pages: { signIn: '/inloggen', error: '/inloggen' },
  callbacks: {
    signIn({ account, profile }) {
      return account?.provider === 'google' && verifiedGoogleOwner(profile) !== null;
    },
    jwt({ token, account, profile }) {
      if (account) {
        const owner = account.provider === 'google' ? verifiedGoogleOwner(profile) : null;
        if (!owner) throw new Error('Invalid Google identity');
        token.owner = owner;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user && typeof token.owner === 'string') session.user.id = token.owner;
      return session;
    },
  },
});

export async function currentUser() {
  if (!googleConfigured()) return null;
  const session = await auth();
  if (!session?.user?.id?.startsWith('google:')) return null;
  return { userId: session.user.id, email: session.user.email || '', name: session.user.name || '' };
}
