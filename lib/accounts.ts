import { createHmac, randomUUID } from 'node:crypto';
import { db } from './storage';
import { credentialsSchema } from './identity';
import { hashPassword, verifyPassword } from './password';

export class TooManyAttempts extends Error {}
export async function limitAttempts(scope: string, identity: string, maximum: number) {
  if (!process.env.AUTH_SECRET) throw new Error('AUTH_SECRET is required');
  const key = createHmac('sha256', process.env.AUTH_SECRET).update(`${scope}:${identity}`).digest('hex');
  // Atomic across all serverless instances, including concurrent requests.
  const rows = await db()`INSERT INTO auth_limits (key, attempts, expires_at)
    VALUES (${key}, 1, NOW() + INTERVAL '15 minutes')
    ON CONFLICT (key) DO UPDATE SET
      attempts = CASE WHEN auth_limits.expires_at <= NOW() THEN 1 ELSE auth_limits.attempts + 1 END,
      expires_at = CASE WHEN auth_limits.expires_at <= NOW() THEN NOW() + INTERVAL '15 minutes' ELSE auth_limits.expires_at END
    RETURNING attempts`;
  if (Number(rows[0].attempts) > maximum) throw new TooManyAttempts();
}
export function clientAddress(headers: Headers) {
  // Vercel overwrites this header. Never trust arbitrary X-Forwarded-For.
  return process.env.VERCEL === '1' ? (headers.get('x-vercel-forwarded-for')?.split(',')[0].trim() || 'unknown') : 'local';
}
export async function authenticate(input: unknown, headers: Headers) {
  const parsed = credentialsSchema.safeParse(input);
  if (!parsed.success) return null;
  const { email, password } = parsed.data;
  try {
    await limitAttempts('login-ip', clientAddress(headers), 60);
    await limitAttempts('login-email', email, 10);
  } catch (error) {
    if (error instanceof TooManyAttempts) return null;
    throw error;
  }
  const rows = await db()`SELECT id, email, name, password_hash FROM users WHERE email = ${email}`;
  const user = rows[0];
  if (!await verifyPassword(password, user?.password_hash as string | undefined) || !user) return null;
  return { id: `local:${user.id}`, email: user.email as string, name: user.name as string };
}
export async function registerAccount(name: string, email: string, password: string) {
  const passwordHash = await hashPassword(password);
  const rows = await db()`INSERT INTO users (id, email, name, password_hash)
    VALUES (${randomUUID()}, ${email}, ${name}, ${passwordHash})
    ON CONFLICT (email) DO NOTHING RETURNING id`;
  return rows.length === 1;
}
