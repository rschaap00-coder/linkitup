import { currentUser, authConfigured } from '@/auth';
import AccountForm from '@/app/account-form';
import { redirect } from 'next/navigation';
import { Link2 } from 'lucide-react';
export const dynamic = 'force-dynamic';
export default async function Register() {
  if (await currentUser()) redirect('/');
  const ready = authConfigured();
  return <main className="login-page"><div className="card login-card">
    <a href="/" className="wordmark"><span className="brand-icon"><Link2/></span>linkplek.</a>
    <h1>Alle links. Jouw plek.</h1><p>Maak een account aan en stel je eigen linkpagina samen. Je bezoekers hoeven niet in te loggen.</p>
    {!ready && <div className="notice error" role="status">Registreren is nog niet ingesteld door de beheerder.</div>}
    <AccountForm registration ready={ready}/>
    <p className="hint">Al een account? <a href="/inloggen">Log in</a>.</p>
  </div></main>;
}
