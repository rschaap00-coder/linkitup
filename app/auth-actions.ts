'use server';
import { signIn, signOut, googleConfigured } from '@/auth';
export async function loginWithGoogle() {
  if (!googleConfigured()) return;
  await signIn('google', { redirectTo: '/' });
}
export async function logout() {
  await signOut({ redirectTo: '/inloggen' });
}
