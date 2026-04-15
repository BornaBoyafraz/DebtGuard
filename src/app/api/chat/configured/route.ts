import { createServerSupabaseClient } from '@/lib/supabase/server';
import { checkRateLimit } from '@/lib/rate-limiter';

export async function GET(request: Request) {
  // ── Rate limiting ─────────────────────────────────────────────────────────
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
           || request.headers.get('x-real-ip')
           || 'unknown';
  const rl = checkRateLimit(`cfg:${ip}`, 20, 15 * 60 * 1000);
  if (!rl.allowed) {
    return new Response(JSON.stringify({ error: 'too_many_requests', retryAfter: rl.retryAfter }), {
      status: 429,
      headers: { 'Content-Type': 'application/json', 'Retry-After': String(rl.retryAfter) },
    });
  }

  // H-5: Only reveal AI config status to authenticated users.
  // Unauthenticated callers receive configured: false so the chat panel stays hidden.
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ configured: false });
  }
  // Ollama is local — no API key required. Always configured for authenticated users.
  return Response.json({ configured: true });
}
