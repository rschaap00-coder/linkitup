import { z } from 'zod';

export const credentialsSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(12).max(128),
});
export const registrationSchema = credentialsSchema.extend({
  name: z.string().trim().min(1).max(80),
  confirmation: z.string().max(128),
}).refine(value => value.password === value.confirmation, {
  message: 'De wachtwoorden komen niet overeen.', path: ['confirmation'],
});
export function localOwner(id: unknown): string | null {
  return typeof id === 'string' && /^local:[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(id) ? id : null;
}
