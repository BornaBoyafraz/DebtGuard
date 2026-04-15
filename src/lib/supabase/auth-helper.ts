/**
 * Server-side auth helper for API routes.
 *
 * When Supabase is not configured (local/demo mode), returns a local placeholder
 * user so all API routes work without credentials. When configured, validates
 * the real Supabase session.
 */

import { createServerSupabaseClient } from './server';

export const isSupabaseServerConfigured =
  (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').startsWith('http') &&
  (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '').length > 10;

export interface ApiUser {
  id: string;
  name: string;
  email: string;
}

export async function getApiUser(): Promise<ApiUser | null> {
  if (!isSupabaseServerConfigured) {
    // Local demo mode — allow all requests through without credentials
    return { id: 'local_demo', name: 'there', email: '' };
  }
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  return {
    id: user.id,
    name: (user.user_metadata?.name as string | undefined) || user.email?.split('@')[0] || 'there',
    email: user.email ?? '',
  };
}
