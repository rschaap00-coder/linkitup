import { currentUser, authConfigured } from '@/auth';
import AccountForm from '@/app/account-form';
import { redirect } from 'next/navigation';
import { Link2 } from 'lucide-react';
export const dynamic = 'force-dynamic';
export default async function Login({searchParams}:{searchParams:Promise<{error?:string;registered?:string}>}) {
  if (await currentUser()) redirect('/');
  const {error,registered} = await searchParams;
  const ready = authConfigured();
  return <main className="login-page"><div className="card login-card">
    <a href="/" className="wordmark"><span className="brand-icon"><Link2/></span>linkplek.</a>
    <h1>Welkom terug.</h1><p>Log in met je e-mailadres en wachtwoord om je links te beheren.</p>
    {registered && <div className="notice" role="status">Je aanvraag is verwerkt. Is dit een nieuw e-mailadres? Dan kun je nu inloggen met je gekozen wachtwoord. Had je al een account? Gebruik je bestaande wachtwoord.</div>}
    {error && <div className="notice error" role="alert">Inloggen is niet gelukt. Probeer het opnieuw.</div>}
    {!ready && <div className="notice error" role="status">Inloggen is nog niet ingesteld door de beheerder.</div>}
    <AccountForm ready={ready}/>
    <p className="hint">Nog geen account? <a href="/registreren">Maak een account aan</a>.</p>
  </div></main>;
}
