import Anthropic from '@anthropic-ai/sdk';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getApiUser, isSupabaseServerConfigured } from '@/lib/supabase/auth-helper';
import { createHash } from 'crypto';
import {
  AI_MODELS,
  AI_MAX_TOKENS,
  buildInsightsSystemPrompt,
  sanitizeNum,
  sanitizeStr,
  type InsightsRequest,
  type InsightItem,
} from '@/lib/ai-config';
import { checkRateLimit } from '@/lib/rate-limiter';

export const maxDuration = 30;

interface InsightsResponse {
  insights: InsightItem[];
  generatedAt: string;
}

function validateRequest(body: unknown): body is InsightsRequest {
  if (!body || typeof body !== 'object') return false;
  const b = body as Record<string, unknown>;
  if (!b.profile || typeof b.profile !== 'object') return false;
  if (!b.riskAnalysis || typeof b.riskAnalysis !== 'object') return false;
  const risk = b.riskAnalysis as Record<string, unknown>;
  if (typeof risk.score !== 'number' && typeof risk.score !== 'string') return false;
  if (!risk.indicators || typeof risk.indicators !== 'object') return false;
  return true;
}

function buildCacheKey(req: InsightsRequest): string {
  const key = JSON.stringify({
    income: sanitizeNum(req.profile.income),
    expenses: sanitizeNum(req.profile.expenses),
    savings: sanitizeNum(req.profile.savings),
    totalDebt: sanitizeNum(req.profile.totalDebt),
    interestRate: sanitizeNum(req.profile.interestRate),
    minimumPayment: sanitizeNum(req.profile.minimumPayment),
    score: sanitizeNum(req.riskAnalysis.score),
    recentSimulationLabel: req.recentSimulation?.label ?? null,
  });
  return 'insights_' + createHash('sha256').update(key).digest('hex').slice(0, 28);
}

function buildUserMessage(req: InsightsRequest): string {
  const { profile, riskAnalysis, recentSimulation } = req;
  const ind = riskAnalysis.indicators;
  const cashflow =
    sanitizeNum(profile.income) -
    sanitizeNum(profile.expenses) -
    sanitizeNum(profile.minimumPayment);
  const runway =
    ind.savingsRunway === Infinity
      ? 'Stable (positive cashflow)'
      : `${sanitizeNum(ind.savingsRunway).toFixed(1)} months`;
  const interestToPaymentRatio =
    sanitizeNum(profile.minimumPayment) > 0
      ? (sanitizeNum(ind.interestPressure) * sanitizeNum(profile.income)) /
        sanitizeNum(profile.minimumPayment)
      : 0;

  const safeDrivers = riskAnalysis.drivers
    .slice(0, 5)
    .map((d) => `${sanitizeStr(d.name, 60)} (${d.impact} impact)`)
    .join(', ');

  let msg = `Generate intelligence briefing for this financial profile:

Income: $${sanitizeNum(profile.income).toLocaleString()}/mo
Expenses: $${sanitizeNum(profile.expenses).toLocaleString()}/mo
Cashflow: $${cashflow.toLocaleString()}/mo
Savings: $${sanitizeNum(profile.savings).toLocaleString()}
Total Debt: $${sanitizeNum(profile.totalDebt).toLocaleString()}
APR: ${sanitizeNum(profile.interestRate)}%
Min Payment: $${sanitizeNum(profile.minimumPayment).toLocaleString()}/mo

Indicators:
- Risk Score: ${Math.max(0, Math.min(100, sanitizeNum(riskAnalysis.score)))}/100 (${sanitizeStr(riskAnalysis.level, 20).toUpperCase()})
- Debt-to-Income Ratio (annual): ${(sanitizeNum(ind.debtToIncomeRatio) * 100).toFixed(1)}%
- Payment Burden: ${(sanitizeNum(ind.paymentBurden) * 100).toFixed(1)}% of income
- Savings Runway: ${runway}
- Interest Pressure: ${(sanitizeNum(ind.interestPressure) * 100).toFixed(1)}% of income
- Interest-to-Payment Ratio: ${(interestToPaymentRatio * 100).toFixed(1)}%
- Risk Drivers: ${safeDrivers}`;

  if (recentSimulation) {
    msg += `\n\nRecent Simulation: "${sanitizeStr(recentSimulation.label, 80)}" — Decision Score: ${sanitizeNum(recentSimulation.decisionScore)}/100 (${sanitizeStr(recentSimulation.verdict, 40)})`;
  }

  msg += '\n\nProvide the JSON array of insights.';
  return msg;
}

export async function POST(request: Request) {
  // ── Rate limiting ─────────────────────────────────────────────────────────
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
           || request.headers.get('x-real-ip')
           || 'unknown';
  const rl = checkRateLimit(`insights:${ip}`, 20, 15 * 60 * 1000);
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

  // ── H-2: Parse and validate ────────────────────────────────────────────────
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

  const cacheKey = buildCacheKey(body);

  // Check cache — insights are keyed by profile + risk score + recent simulation label (skip in local mode)
  if (isSupabaseServerConfigured) {
    try {
      const supabase = await createServerSupabaseClient();
      const { data: cached } = await supabase
        .from('ai_analyses')
        .select('result')
        .eq('user_id', apiUser.id)
        .eq('prompt_hash', cacheKey)
        .eq('analysis_type', 'insights')
        .maybeSingle();

      if (cached) {
        const parsed = JSON.parse((cached as { result: string }).result) as InsightsResponse;
        return Response.json(parsed);
      }
    } catch {
      // Cache miss — proceed with API call
    }
  }

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  try {
    const response = await anthropic.messages.create({
      model: AI_MODELS.analysis,
      max_tokens: AI_MAX_TOKENS.insights,
      system: buildInsightsSystemPrompt(),
      messages: [{ role: 'user', content: buildUserMessage(body) }],
    });

    const rawText =
      response.content[0]?.type === 'text' ? response.content[0].text : '[]';

    // Extract JSON array from response
    const jsonMatch = rawText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error('no_json_in_response');

    const insights = JSON.parse(jsonMatch[0]) as InsightItem[];

    // Validate structure — ensure it's an array with required fields
    if (!Array.isArray(insights) || insights.length === 0) {
      throw new Error('invalid_insights_structure');
    }

    const result: InsightsResponse = {
      insights: insights.slice(0, 3),
      generatedAt: new Date().toISOString(),
    };

    // Cache the result (skip in local mode)
    if (isSupabaseServerConfigured) {
      try {
        const supabase = await createServerSupabaseClient();
        await supabase.from('ai_analyses').insert({
          user_id: apiUser.id,
          analysis_type: 'insights',
          prompt_hash: cacheKey,
          result: JSON.stringify(result),
        });
      } catch {
        // Non-critical
      }
    }

    return Response.json(result);
  } catch {
    // ── H-3: Never leak internal error details ─────────────────────────────
    return new Response(JSON.stringify({ error: 'insights_failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
