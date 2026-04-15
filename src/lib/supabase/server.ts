import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

const isConfigured = SUPABASE_URL.startsWith('http') && SUPABASE_KEY.length > 0;

export async function createServerSupabaseClient() {
  const cookieStore = await cookies();

  // Use placeholder values when not configured to prevent startup crash.
  // All queries will fail gracefully with auth errors rather than throwing.
  const url = isConfigured ? SUPABASE_URL : 'https://placeholder.supabase.co';
  const key = isConfigured ? SUPABASE_KEY : 'placeholder-anon-key';

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Ignore errors in Server Components
        }
      },
    },
  });
}
