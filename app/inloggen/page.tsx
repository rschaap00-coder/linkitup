import { currentUser, googleConfigured } from '@/auth';
import { loginWithGoogle } from '@/app/auth-actions';
import { redirect } from 'next/navigation';
import { Link2 } from 'lucide-react';
export const dynamic = 'force-dynamic';
export default async function Login({searchParams}:{searchParams:Promise<{error?:string}>}) {
  if (await currentUser()) redirect('/');
  const {error} = await searchParams;
  const ready = googleConfigured();
  return <main className="login-page"><div className="card login-card"><a href="/" className="wordmark"><span className="brand-icon"><Link2/></span>linkplek.</a><h1>Jouw links beginnen hier.</h1><p>Log in met je Google-account om je eigen pagina te maken en je links te beheren.</p>{error&&<div className="notice error" role="alert">Inloggen is niet gelukt. Probeer het opnieuw met een geverifieerd Google-account.</div>}{!ready&&<div className="notice error" role="status">Google-inloggen is nog niet ingesteld door de beheerder.</div>}<form action={loginWithGoogle}><button className="button primary" disabled={!ready}>Doorgaan met Google</button></form><p className="hint">Nieuwe gebruiker? Je profiel ontstaat wanneer je je pagina voor het eerst opslaat. Je bezoekers hoeven niet in te loggen.</p></div></main>;
}
