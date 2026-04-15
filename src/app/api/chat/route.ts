import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getApiUser, isSupabaseServerConfigured } from '@/lib/supabase/auth-helper';
import { sanitizeNum } from '@/lib/ai-config';
import type { DebtGuardContext } from '@/lib/types';
import { tryIntercept } from '@/lib/chat-intercepts';
import { generateAdvisorResponse } from '@/lib/ai/financial-advisor';
import { randomUUID } from 'crypto';
import { checkRateLimit } from '@/lib/rate-limiter';

export const maxDuration = 60;

// Request limits
const MAX_MESSAGES = 40;
const MAX_MESSAGE_LENGTH = 4000;
const MAX_SESSION_ID_LENGTH = 64;

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export async function POST(req: Request) {
  // ── Rate limiting ─────────────────────────────────────────────────────────
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
           || req.headers.get('x-real-ip')
           || 'unknown';
  const rl = checkRateLimit(`chat:${ip}`, 20, 15 * 60 * 1000);
  if (!rl.allowed) {
    return new Response(JSON.stringify({ error: 'too_many_requests', retryAfter: rl.retryAfter }), {
      status: 429,
      headers: { 'Content-Type': 'application/json', 'Retry-After': String(rl.retryAfter) },
    });
  }

  // ── Body size guard ───────────────────────────────────────────────────────
  const contentLength = parseInt(req.headers.get('content-length') ?? '0', 10);
  if (contentLength > 50_000) {
    return new Response(JSON.stringify({ error: 'payload_too_large' }), { status: 413 });
  }

  // ── C-1: Authentication required ──────────────────────────────────────────
  const apiUser = await getApiUser();
  if (!apiUser) {
    return new Response(JSON.stringify({ error: 'unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // ── C-4: Fetch userName from the authenticated session ────────────────────
  const serverUserName = apiUser.name;

  // ── H-2: Parse and validate request body ──────────────────────────────────
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'invalid_request' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!body || typeof body !== 'object') {
    return new Response(JSON.stringify({ error: 'invalid_request' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const raw = body as Record<string, unknown>;

  // M-2: Validate messages array
  const rawMessages = Array.isArray(raw.messages) ? raw.messages : [];
  const messages: ChatMessage[] = rawMessages
    .slice(0, MAX_MESSAGES)
    .filter((m): m is ChatMessage =>
      m &&
      typeof m === 'object' &&
      (m.role === 'user' || m.role === 'assistant') &&
      typeof m.content === 'string'
    )
    .map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: String(m.content).slice(0, MAX_MESSAGE_LENGTH),
    }));

  if (messages.length === 0) {
    return new Response(JSON.stringify({ error: 'invalid_request' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Build DebtGuardContext — userName always from server session (C-4)
  const ctx = (raw.context ?? {}) as Record<string, unknown>;
  const safeContext: DebtGuardContext = {
    userName: serverUserName,
    profile: (ctx.profile as DebtGuardContext['profile']) ?? null,
    indicators: (ctx.indicators as DebtGuardContext['indicators']) ?? null,
    riskAnalysis: (ctx.riskAnalysis as DebtGuardContext['riskAnalysis']) ?? null,
    currentSimulation: (ctx.currentSimulation as DebtGuardContext['currentSimulation']) ?? null,
    savedSimulationsCount: Math.max(0, sanitizeNum(ctx.savedSimulationsCount)),
    hasCompletedOnboarding: !!(ctx.hasCompletedOnboarding ?? ctx.profile),
  };

  // M-3: sessionId validation
  const rawSessionId = String(raw.sessionId ?? '');
  const sessionId = /^[\w-]{1,64}$/.test(rawSessionId)
    ? rawSessionId.slice(0, MAX_SESSION_ID_LENGTH)
    : null;

  // ── Part 2: Intercept common queries locally ───────────────────────────────
  const latestUserMessage = messages.findLast((m) => m.role === 'user');
  if (latestUserMessage) {
    const intercept = tryIntercept(latestUserMessage.content, safeContext);
    if (intercept.handled && intercept.response) {
      if (sessionId && isSupabaseServerConfigured) {
        void (async () => {
          try {
            const supabase = await createServerSupabaseClient();
            const now = new Date().toISOString();
            await supabase.from('chat_messages').insert([
              { id: randomUUID(), user_id: apiUser.id, session_id: sessionId, role: 'user', content: latestUserMessage.content, created_at: now },
              { id: randomUUID(), user_id: apiUser.id, session_id: sessionId, role: 'assistant', content: intercept.response, created_at: new Date(Date.now() + 1).toISOString() },
            ]);
          } catch { /* non-critical */ }
        })();
      }
      return new Response(intercept.response, {
        headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-cache' },
      });
    }
  }

  // ── DebtGuard Intelligence — built-in financial advisor ───────────────────
  // No external API, no API keys, works instantly for all users.
  const userMsg = latestUserMessage?.content ?? '';
  const advisorResponse = generateAdvisorResponse(userMsg, safeContext);

  const encoder = new TextEncoder();

  const readable = new ReadableStream({
    async start(controller) {
      const fullResponse = advisorResponse;

      try {
        // Stream character by character for a natural AI typing feel
        for (let i = 0; i < fullResponse.length; i++) {
          controller.enqueue(encoder.encode(fullResponse[i]));
          // Small delay every few chars to simulate typing
          if (i % 4 === 0) {
            await new Promise((resolve) => setTimeout(resolve, 6));
          }
        }
        controller.close();
      } catch {
        controller.error(new Error('stream_failed'));
        return;
      }

      // Persist messages to Supabase in the background (non-critical)
      if (fullResponse && sessionId && isSupabaseServerConfigured) {
        const lastUserMsg = messages[messages.length - 1];
        if (lastUserMsg?.role === 'user') {
          try {
            const supabase = await createServerSupabaseClient();
            const now = new Date().toISOString();
            await supabase.from('chat_messages').insert([
              { id: randomUUID(), user_id: apiUser.id, session_id: sessionId, role: 'user', content: lastUserMsg.content, created_at: now },
              { id: randomUUID(), user_id: apiUser.id, session_id: sessionId, role: 'assistant', content: fullResponse, created_at: new Date(Date.now() + 1).toISOString() },
            ]);
          } catch { /* non-critical */ }
        }
      }
    },
  });

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
