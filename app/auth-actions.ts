'use server';
import { AuthError } from 'next-auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { signIn, signOut, authConfigured } from '@/auth';
import { credentialsSchema, registrationSchema } from '@/lib/identity';
import { clientAddress, limitAttempts, registerAccount, TooManyAttempts } from '@/lib/accounts';

export async function login(_previous: { error: string }, form: FormData) {
  if (!authConfigured()) return { error: 'Inloggen is nog niet ingesteld door de beheerder.' };
  const parsed = credentialsSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: 'Vul een geldig e-mailadres en je wachtwoord (12–128 tekens) in.' };
  try {
    await signIn('credentials', { ...parsed.data, redirectTo: '/' });
  } catch (error) {
    if (error instanceof AuthError) return { error: error.type === 'CredentialsSignin'
      ? 'Inloggen is niet gelukt. Controleer je gegevens. Na meerdere pogingen: wacht 15 minuten.'
      : 'Inloggen is tijdelijk niet mogelijk. Probeer het later opnieuw.' };
    throw error; // Includes Next.js redirects after a successful login.
  }
  return { error: '' };
}
export async function register(_previous: { error: string }, form: FormData) {
  if (!authConfigured()) return { error: 'Registreren is nog niet ingesteld door de beheerder.' };
  const parsed = registrationSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: 'Controleer je naam en e-mailadres. Gebruik 12–128 tekens voor je wachtwoord en vul tweemaal hetzelfde wachtwoord in.' };
  try {
    await limitAttempts('register-ip', clientAddress(await headers()), 10);
    const { name, email, password } = parsed.data;
    await registerAccount(name, email, password);
  } catch (error) {
    return { error: error instanceof TooManyAttempts
      ? 'Te veel pogingen. Probeer het over 15 minuten opnieuw.'
      : 'Registreren is tijdelijk niet mogelijk. Probeer het later opnieuw.' };
  }
  // Same response for an existing address; never overwrite its password.
  redirect('/inloggen?registered=1');
}
export async function logout() {
  await signOut({ redirectTo: '/inloggen' });
}
