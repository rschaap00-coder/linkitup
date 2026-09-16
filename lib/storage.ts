import { neon } from '@neondatabase/serverless';
import type { Profile } from './profile';
export function db() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not configured');
  return neon(process.env.DATABASE_URL);
}
export async function getProfile(owner:string) {
  const rows = await db()`SELECT slug, data FROM profiles WHERE owner = ${owner}`;
  return rows[0] as {slug:string;data:Profile}|undefined;
}
export async function publicProfile(slug:string) {
  const rows = await db()`SELECT data FROM profiles WHERE slug = ${slug}`;
  return (rows[0] as {data:Profile}|undefined)?.data;
}
export async function saveProfile(owner:string, data:Profile) {
  const rows = await db()`INSERT INTO profiles (owner, slug, data)
    VALUES (${owner}, ${crypto.randomUUID()}, ${JSON.stringify(data)}::jsonb)
    ON CONFLICT (owner) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()
    RETURNING slug`;
  return rows[0].slug as string;
}
export async function ownsAvatar(key:string,owner:string) {
  const rows = await db()`SELECT id FROM avatars WHERE id = ${key} AND owner = ${owner}`;
  return rows.length === 1;
}
