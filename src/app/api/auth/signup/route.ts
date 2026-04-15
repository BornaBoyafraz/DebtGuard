/**
 * /api/auth/signup — Rate-limited signup endpoint
 *
 * 3 signups per hour per IP.
 */

import { checkRateLimit } from '@/lib/rate-limiter';
import { sanitizeEmail, sanitizeString, ValidationError } from '@/lib/security/sanitize';
import { createServerSupabaseClient } from '@/lib/supabase/server';

const WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_ATTEMPTS = 3;

export async function POST(request: Request) {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown';

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

  let name: string;
  try {
    name = sanitizeString(raw.name ?? '', 100);
  } catch {
    name = 'User';
  }

  const identifier = `signup:${ip}`;
  const rl = checkRateLimit(identifier, MAX_ATTEMPTS, WINDOW_MS);

  if (!rl.allowed) {
    return Response.json(
      {
        error: 'Too many signup attempts. Please try again later.',
        retryAfter: rl.retryAfter,
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(rl.retryAfter ?? 3600),
          'X-RateLimit-Limit': String(MAX_ATTEMPTS),
          'X-RateLimit-Remaining': '0',
        },
      }
    );
  }

  try {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });

    if (error) {
      return Response.json({ error: 'Signup failed. Please try again.' }, { status: 400 });
    }

    return Response.json({ success: true });
  } catch {
    return Response.json({ error: 'Service unavailable' }, { status: 503 });
  }
}
