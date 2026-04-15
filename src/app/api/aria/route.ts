/**
 * /api/aria — Aria AI financial assistant endpoint
 *
 * Self-contained: no external AI API, no API keys, zero cost.
 * Runs entirely on the server using the Aria rule-based engine.
 */

import { processMessage } from '@/lib/aria/aria-engine';
import { getApiUser } from '@/lib/supabase/auth-helper';
import { checkRateLimit } from '@/lib/rate-limiter';
import { sanitizeChatMessage, ValidationError } from '@/lib/security/sanitize';
import type { DebtGuardContext } from '@/lib/types';
import { sanitizeNum } from '@/lib/ai-config';

export const runtime = 'nodejs';

const MAX_HISTORY = 20;
const MAX_MESSAGE_LENGTH = 500;

export async function POST(request: Request) {
  // ── Rate limiting ─────────────────────────────────────────────────────────
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown';
  const rl = checkRateLimit(`aria:${ip}`, 30, 60 * 1000); // 30 per minute per IP
  if (!rl.allowed) {
    return Response.json(
      { error: 'Too many requests. Please slow down.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(rl.retryAfter ?? 60),
          'X-RateLimit-Limit': '30',
          'X-RateLimit-Remaining': '0',
        },
      }
    );
  }

  // ── Body size guard ───────────────────────────────────────────────────────
  const contentLength = parseInt(request.headers.get('content-length') ?? '0', 10);
  if (contentLength > 20_000) {
    return Response.json({ error: 'payload_too_large' }, { status: 413 });
  }

  // ── Authentication ────────────────────────────────────────────────────────
  const apiUser = await getApiUser();
  if (!apiUser) {
    return Response.json({ error: 'unauthorized' }, { status: 401 });
  }

  // ── Parse + validate body ─────────────────────────────────────────────────
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'invalid_request' }, { status: 400 });
  }

  if (!body || typeof body !== 'object') {
    return Response.json({ error: 'invalid_request' }, { status: 400 });
  }

  const raw = body as Record<string, unknown>;

  // Sanitize the message
  let message: string;
  try {
    message = sanitizeChatMessage(raw.message);
    if (message.length > MAX_MESSAGE_LENGTH) {
      return Response.json({ error: 'Message too long' }, { status: 400 });
    }
  } catch (e) {
    if (e instanceof ValidationError) {
      return Response.json({ error: e.message }, { status: 400 });
    }
    return Response.json({ error: 'invalid_message' }, { status: 400 });
  }

  // Build safe context — userName always from authenticated session
  const rawCtx = (raw.context ?? {}) as Record<string, unknown>;
  const safeContext: DebtGuardContext = {
    userName: apiUser.name,
    profile: (rawCtx.profile as DebtGuardContext['profile']) ?? null,
    indicators: (rawCtx.indicators as DebtGuardContext['indicators']) ?? null,
    riskAnalysis: (rawCtx.riskAnalysis as DebtGuardContext['riskAnalysis']) ?? null,
    currentSimulation: (rawCtx.currentSimulation as DebtGuardContext['currentSimulation']) ?? null,
    savedSimulationsCount: Math.max(0, sanitizeNum(rawCtx.savedSimulationsCount)),
    hasCompletedOnboarding: !!(rawCtx.hasCompletedOnboarding ?? rawCtx.profile),
  };

  // Sanitize conversation history
  const rawHistory = Array.isArray(raw.conversationHistory) ? raw.conversationHistory : [];
  const conversationHistory = rawHistory
    .slice(0, MAX_HISTORY)
    .filter(
      (m): m is { role: 'user' | 'assistant'; content: string } =>
        m &&
        typeof m === 'object' &&
        (m.role === 'user' || m.role === 'assistant') &&
        typeof m.content === 'string'
    )
    .map((m) => ({
      role: m.role,
      content: String(m.content).slice(0, 2000),
    }));

  // ── Process with Aria engine ──────────────────────────────────────────────
  try {
    const response = processMessage({
      message,
      context: safeContext,
      conversationHistory,
    });

    return Response.json(response);
  } catch {
    return Response.json({ error: 'internal_error' }, { status: 500 });
  }
}
