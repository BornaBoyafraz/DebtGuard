import Anthropic from '@anthropic-ai/sdk';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getApiUser, isSupabaseServerConfigured } from '@/lib/supabase/auth-helper';
import { createHash } from 'crypto';
import { AI_MODELS, AI_MAX_TOKENS, buildAnalysisSystemPrompt, sanitizeNum } from '@/lib/ai-config';
import type { FinancialProfile, FinancialIndicators, RiskLevel, RiskDriver } from '@/lib/types';
import { checkRateLimit } from '@/lib/rate-limiter';

export const maxDuration = 30;

// Maximum number of characters allowed in a string field entering a prompt
const MAX_STRING_LEN = 120;

interface AnalyzeRequest {
  profile: FinancialProfile;
  indicators: FinancialIndicators;
  score: number;
  level: RiskLevel;
  drivers: RiskDriver[];
}

interface AnalyzeResult {
  explanation: string;
  recommendation: string;
  summary: string;
}


function validateRequest(body: unknown): body is AnalyzeRequest {
  if (!body || typeof body !== 'object') return false;
  const b = body as Record<string, unknown>;
  if (!b.profile || typeof b.profile !== 'object') return false;
  if (!b.indicators || typeof b.indicators !== 'object') return false;
  if (!Array.isArray(b.drivers)) return false;
  return true;
}

function buildUserMessage(req: AnalyzeRequest): string {
  const { profile, indicators, score, level, drivers } = req;
  const cashflow = sanitizeNum(profile.income) - sanitizeNum(profile.expenses) - sanitizeNum(profile.minimumPayment);
  const runway =
    indicators.savingsRunway === Infinity
      ? 'Stable (positive cashflow)'
      : `${sanitizeNum(indicators.savingsRunway).toFixed(1)} months`;

  // Driver names are sanitized: strip to alphanumerics, spaces, and basic punctuation
  const safeDrivers = drivers
    .slice(0, 5)
    .map((d) => `${String(d.name).replace(/[^\w\s,().%-]/g, '').slice(0, MAX_STRING_LEN)} (${d.impact} impact)`)
    .join(', ');

  return `Analyze this financial profile:
- Monthly Income: $${sanitizeNum(profile.income).toLocaleString()}
- Monthly Expenses: $${sanitizeNum(profile.expenses).toLocaleString()}
- Monthly Cashflow: $${cashflow.toLocaleString()}
- Total Savings: $${sanitizeNum(profile.savings).toLocaleString()}
- Total Debt: $${sanitizeNum(profile.totalDebt).toLocaleString()}
- Interest Rate: ${sanitizeNum(profile.interestRate)}%
- Minimum Payment: $${sanitizeNum(profile.minimumPayment).toLocaleString()}

Computed indicators:
- Debt-to-Income Ratio: ${(sanitizeNum(indicators.debtToIncomeRatio) * 100).toFixed(1)}%
- Payment Burden: ${(sanitizeNum(indicators.paymentBurden) * 100).toFixed(1)}% of income
- Savings Runway: ${runway}
- Interest Pressure: ${(sanitizeNum(indicators.interestPressure) * 100).toFixed(1)}% of income going to interest

Risk Score: ${Math.max(0, Math.min(100, sanitizeNum(score)))}/100
Risk Level: ${['low', 'medium', 'high', 'critical'].includes(String(level)) ? String(level).toUpperCase() : 'UNKNOWN'}
Primary Risk Drivers: ${safeDrivers}

Provide the JSON response as specified.`;
}

function hashPrompt(req: AnalyzeRequest): string {
  const key = JSON.stringify({
    income: sanitizeNum(req.profile.income),
    expenses: sanitizeNum(req.profile.expenses),
    savings: sanitizeNum(req.profile.savings),
    totalDebt: sanitizeNum(req.profile.totalDebt),
    interestRate: sanitizeNum(req.profile.interestRate),
    minimumPayment: sanitizeNum(req.profile.minimumPayment),
    score: sanitizeNum(req.score),
    level: req.level,
  });
  return createHash('sha256').update(key).digest('hex').slice(0, 32);
}

export async function POST(request: Request) {
  // ── Rate limiting ─────────────────────────────────────────────────────────
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
           || request.headers.get('x-real-ip')
           || 'unknown';
  const rl = checkRateLimit(`analyze:${ip}`, 20, 15 * 60 * 1000);
  if (!rl.allowed) {
    return new Response(JSON.stringify({ error: 'too_many_requests', retryAfter: rl.retryAfter }), {
      status: 429,
      headers: { 'Content-Type': 'application/json', 'Retry-After': String(rl.retryAfter) },
    });
  }

  // ── Body size guard ───────────────────────────────────────────────────────
  const contentLength = parseInt(request.headers.get('content-length') ?? '0', 10);
  if (contentLength > 50_000) {
    return new Response(JSON.stringify({ error: 'payload_too_large' }), { status: 413 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return new Response(
      JSON.stringify({ error: 'service_unavailable' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // ── C-1: Authentication required ──────────────────────────────────────────
  const apiUser = await getApiUser();
  if (!apiUser) {
    return new Response(JSON.stringify({ error: 'unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // ── H-2: Input validation ──────────────────────────────────────────────────
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'invalid_request' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!validateRequest(body)) {
    return new Response(JSON.stringify({ error: 'invalid_request' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const promptHash = hashPrompt(body);

  // Check cache (skip in local mode)
  if (isSupabaseServerConfigured) {
    try {
      const supabase = await createServerSupabaseClient();
      const { data: cached } = await supabase
        .from('ai_analyses')
        .select('result')
        .eq('user_id', apiUser.id)
        .eq('prompt_hash', promptHash)
        .eq('analysis_type', 'risk')
        .maybeSingle();

      if (cached) {
        return Response.json(JSON.parse((cached as { result: string }).result) as AnalyzeResult);
      }
    } catch {
      // Cache miss — proceed with API call
    }
  }

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  try {
    const response = await anthropic.messages.create({
      model: AI_MODELS.analysis,
      max_tokens: AI_MAX_TOKENS.analysis,
      system: buildAnalysisSystemPrompt(),
      messages: [{ role: 'user', content: buildUserMessage(body) }],
    });

    const rawText =
      response.content[0]?.type === 'text' ? response.content[0].text : '{}';

    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('no_json_in_response');

    const result = JSON.parse(jsonMatch[0]) as AnalyzeResult;

    // Save to cache (skip in local mode)
    if (isSupabaseServerConfigured) {
      try {
        const supabase = await createServerSupabaseClient();
        await supabase.from('ai_analyses').insert({
          user_id: apiUser.id,
          analysis_type: 'risk',
          prompt_hash: promptHash,
          result: JSON.stringify(result),
        });
      } catch {
        // Non-critical
      }
    }

    return Response.json(result);
  } catch {
    // ── H-3: Never leak internal error details ─────────────────────────────
    return new Response(JSON.stringify({ error: 'analysis_failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
