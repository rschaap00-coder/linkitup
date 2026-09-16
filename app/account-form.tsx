'use client';
import { useActionState } from 'react';
import { login, register } from './auth-actions';

export default function AccountForm({ registration = false, ready }: { registration?: boolean; ready: boolean }) {
  const [state, action, pending] = useActionState(registration ? register : login, { error: '' });
  return <form action={action} className="account-form" aria-busy={pending}>
    <fieldset disabled={!ready || pending}>
      {registration && <label htmlFor="name">Je naam<input id="name" name="name" autoComplete="name" required maxLength={80}/></label>}
      <label htmlFor="email">E-mailadres<input id="email" name="email" type="email" autoComplete="email" autoCapitalize="none" required maxLength={254}/></label>
      <label htmlFor="password">Wachtwoord<input id="password" name="password" type="password" autoComplete={registration ? 'new-password' : 'current-password'} required minLength={12} maxLength={128} aria-describedby="password-hint"/></label>
      <p id="password-hint" className="field-hint">Gebruik 12 tot 128 tekens. Een lange wachtzin is makkelijk te onthouden.</p>
      {registration && <label htmlFor="confirmation">Herhaal wachtwoord<input id="confirmation" name="confirmation" type="password" autoComplete="new-password" required minLength={12} maxLength={128}/></label>}
      <button type="submit" className="button primary">{pending ? (registration ? 'Account aanmaken…' : 'Inloggen…') : (registration ? 'Account aanmaken' : 'Inloggen')}</button>
    </fieldset>
    <div aria-live="polite">{state.error && <p className="notice error" role="alert">{state.error}</p>}</div>
  </form>;
}
