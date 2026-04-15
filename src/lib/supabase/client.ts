import { createBrowserClient } from '@supabase/ssr';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

export const isSupabaseConfigured =
  SUPABASE_URL.startsWith('http') && SUPABASE_KEY.length > 0;

export function createClient() {
  if (!isSupabaseConfigured) {
    // Return a no-op stub when Supabase is not configured (local dev without credentials).
    // All auth calls will gracefully return null/error instead of crashing.
    return createBrowserClient(
      'https://placeholder.supabase.co',
      'placeholder-anon-key'
    );
  }
  return createBrowserClient(SUPABASE_URL, SUPABASE_KEY);
}
