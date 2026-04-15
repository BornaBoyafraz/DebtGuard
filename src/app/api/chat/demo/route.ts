// Public AI demo endpoint — no auth required, rate limited
// Uses Ollama (local) to answer general financial questions
// Does NOT accept personal financial data

import { AI_MODELS, buildDemoSystemPrompt } from '@/lib/ai-config';
import { checkRateLimit } from '@/lib/rate-limiter';

export const maxDuration = 30;

const OLLAMA_URL = 'http://localhost:11434/api/chat';
const MAX_MESSAGES = 5;
const MAX_MESSAGE_LENGTH = 500;

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export async function POST(req: Request) {
  // ── Rate limiting (public endpoint — most critical) ───────────────────────
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
           || req.headers.get('x-real-ip')
           || 'unknown';
  const rl = checkRateLimit(`demo:${ip}`, 20, 15 * 60 * 1000);
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

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'invalid_request' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const raw = body as Record<string, unknown>;
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
      content: String(m.content)
        .replace(/[^\w\s.,!?$%()/:@#\-+'"]/g, ' ')
        .trim()
        .slice(0, MAX_MESSAGE_LENGTH),
    }));

  if (messages.length === 0) {
    return new Response(JSON.stringify({ error: 'invalid_request' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const ollamaMessages = [
    { role: 'system', content: buildDemoSystemPrompt() },
    ...messages.map((m) => ({ role: m.role, content: m.content })),
  ];

  let ollamaRes: Response;
  try {
    ollamaRes = await fetch(OLLAMA_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: AI_MODELS.chat,
        messages: ollamaMessages,
        stream: true,
      }),
    });
  } catch {
    return new Response(
      JSON.stringify({
        error: 'ollama_not_running',
        message: 'Ollama is not running. Please install Ollama from ollama.com and run: ollama pull llama3.2',
      }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }

  if (!ollamaRes.ok) {
    return new Response(
      JSON.stringify({ error: 'ollama_error' }),
      { status: 502, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const ollamaReader = ollamaRes.body!.getReader();
  const encoder = new TextEncoder();
  const lineDecoder = new TextDecoder();

  const readable = new ReadableStream({
    async start(controller) {
      let buffer = '';
      try {
        let streamDone = false;
        while (!streamDone) {
          const { done, value } = await ollamaReader.read();
          if (done) break;

          buffer += lineDecoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';

          for (const line of lines) {
            if (!line.trim()) continue;
            try {
              const parsed = JSON.parse(line) as {
                message?: { content?: string };
                done?: boolean;
              };
              if (parsed.message?.content) {
                controller.enqueue(encoder.encode(parsed.message.content));
              }
              if (parsed.done) {
                streamDone = true;
                break;
              }
            } catch { /* skip malformed */ }
          }
        }
        controller.close();
      } catch {
        controller.error(new Error('stream_failed'));
      }
    },
  });

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache',
    },
  });
}
