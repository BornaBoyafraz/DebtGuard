/**
 * /api/auth/login — Rate-limited login endpoint
 *
 * Acts as a rate-limiting proxy for Supabase auth.
 * Supabase handles the actual authentication; this route enforces limits.
 */

import { checkRateLimit, resetLimit } from '@/lib/rate-limiter';
import { sanitizeEmail, sanitizeString, ValidationError } from '@/lib/security/sanitize';
import { createServerSupabaseClient } from '@/lib/supabase/server';

const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 5;

export async function POST(request: Request) {
  // ── IP + rate limit key ───────────────────────────────────────────────────
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown';

  // Body size guard
  const contentLength = parseInt(request.headers.get('content-length') ?? '0', 10);
  if (contentLength > 2_000) {
    return Response.json({ error: 'payload_too_large' }, { status: 413 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'invalid_request' }, { status: 400 });
  }

  const raw = body as Record<string, unknown>;

  // Sanitize email
  let email: string;
  try {
    email = sanitizeEmail(raw.email);
  } catch (e) {
    if (e instanceof ValidationError) {
      return Response.json({ error: e.message }, { status: 400 });
    }
    return Response.json({ error: 'invalid_email' }, { status: 400 });
  }

  let password: string;
  try {
    password = sanitizeString(raw.password, 128);
  } catch {
    return Response.json({ error: 'invalid_password' }, { status: 400 });
  }

  const identifier = `login:${ip}:${email}`;
  const rl = checkRateLimit(identifier, MAX_ATTEMPTS, WINDOW_MS);

  if (!rl.allowed) {
    return Response.json(
      {
        error: 'Too many login attempts. Please try again later.',
        retryAfter: rl.retryAfter,
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(rl.retryAfter ?? 900),
          'X-RateLimit-Limit': String(MAX_ATTEMPTS),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(Date.now() + WINDOW_MS),
        },
      }
    );
  }

  // Attempt Supabase auth
  try {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      // On failure, the attempt is already counted by checkRateLimit
      // Return generic error — do not reveal if email exists
      return Response.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Successful login — reset the rate limit counter
    resetLimit(identifier);
    return Response.json({ success: true });
  } catch {
    return Response.json({ error: 'Authentication service unavailable' }, { status: 503 });
  }
}
