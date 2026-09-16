// Only consume a profile after Auth.js has validated Google's OIDC response.
// Never identify accounts by email: Google's immutable subject is the owner key.
export function verifiedGoogleOwner(profile: unknown): string | null {
  if (!profile || typeof profile !== 'object') return null;
  const p = profile as { sub?: unknown; email_verified?: unknown };
  return typeof p.sub === 'string' && /^[a-zA-Z0-9_-]{1,255}$/.test(p.sub) && p.email_verified === true
    ? `google:${p.sub}` : null;
}
