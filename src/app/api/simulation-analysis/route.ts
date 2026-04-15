import Anthropic from '@anthropic-ai/sdk';
import { getApiUser } from '@/lib/supabase/auth-helper';
import { AI_MODELS, AI_MAX_TOKENS, buildSimulationSystemPrompt, sanitizeNum, sanitizeStr } from '@/lib/ai-config';
import type { SimulationResult, MonthlySnapshot } from '@/lib/types';
import { checkRateLimit } from '@/lib/rate-limiter';

export const maxDuration = 30;

// M-7: Cap additional scenarios included in the AI prompt
const MAX_ADDITIONAL_SCENARIOS = 5;
const MAX_STRING_LEN = 80;

interface SimulationAnalysisResult {
  narrative: string;
  watchOuts: string[];
  confidenceRating: number;
  confidenceNote: string;
}


function buildTrendSummary(path: MonthlySnapshot[]): string {
  const first = path[0];
  const mid = path[Math.floor(path.length / 2)];
  const last = path[path.length - 1];
  return (
    `Month 1: debt=$${sanitizeNum(first.debt).toFixed(0)}, savings=$${sanitizeNum(first.savings).toFixed(0)}, risk=${sanitizeNum(first.riskScore)} | ` +
    `Mid: debt=$${sanitizeNum(mid.debt).toFixed(0)}, savings=$${sanitizeNum(mid.savings).toFixed(0)}, risk=${sanitizeNum(mid.riskScore)} | ` +
    `Final: debt=$${sanitizeNum(last.debt).toFixed(0)}, savings=$${sanitizeNum(last.savings).toFixed(0)}, risk=${sanitizeNum(last.riskScore)}`
  );
}

export async function POST(request: Request) {
  // ── Rate limiting ─────────────────────────────────────────────────────────
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
           || request.headers.get('x-real-ip')
           || 'unknown';
  const rl = checkRateLimit(`simlysis:${ip}`, 20, 15 * 60 * 1000);
  if (!rl.allowed) {
    return new Response(JSON.stringify({ error: 'too_many_requests', retryAfter: rl.retryAfter }), {
      status: 429,
      headers: { 'Content-Type': 'application/json', 'Retry-After': String(rl.retryAfter) },
    });
  }

  // ── Body size guard (200KB — simulation arrays can be large) ─────────────
  const contentLength = parseInt(request.headers.get('content-length') ?? '0', 10);
  if (contentLength > 200_000) {
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

  // ── C-4: Fetch userName from authenticated session, never from client body ──
  const serverUserName = apiUser.name;

  // ── H-2: Parse and validate body ──────────────────────────────────────────
  let body: unknown;
  try {
    body = await request.json();
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
  const result = raw.result as SimulationResult | undefined;

  // H-2: Validate that simulation result has the required arrays and fields
  if (
    !result ||
    !Array.isArray(result.baseline) || result.baseline.length === 0 ||
    !Array.isArray(result.scenario) || result.scenario.length === 0 ||
    !result.config ||
    !result.profile ||
    !result.summary
  ) {
    return new Response(JSON.stringify({ error: 'invalid_request' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { config, profile, summary, baseline, scenario } = result;

  // M-7: Cap number of additional scenarios to prevent prompt bloat
  const additionalScenarios = Array.isArray(result.additionalScenarios)
    ? result.additionalScenarios.slice(0, MAX_ADDITIONAL_SCENARIOS)
    : [];

  const lastBaseline = baseline[baseline.length - 1];
  const lastScenario = scenario[scenario.length - 1];

  const negCashflowMonths = scenario.filter(s => sanitizeNum(s.cashflow) < 0).length;
  const maxRisk = Math.max(...scenario.map(s => sanitizeNum(s.riskScore)));
  const minRisk = Math.min(...scenario.map(s => sanitizeNum(s.riskScore)));
  const totalInterestScenario = scenario.reduce((sum, s) => sum + sanitizeNum(s.interestPaid), 0);
  const totalInterestBaseline = baseline.reduce((sum, s) => sum + sanitizeNum(s.interestPaid), 0);
  const interestSaved = totalInterestBaseline - totalInterestScenario;

  // C-4: Sanitize all strings before they enter the AI prompt
  const safeName = sanitizeStr(serverUserName, 50);
  const safeLabel = sanitizeStr(config.label, 80);
  const safeVerdict = sanitizeStr(summary.verdict, 40);
  const safeHorizon = Math.max(1, Math.min(120, sanitizeNum(config.horizonMonths)));

  const additionalSummary = additionalScenarios.length
    ? '\nComparison Scenarios:\n' + additionalScenarios.map(({ config: sc, path }) => {
        const last = path[path.length - 1];
        return `  - "${sanitizeStr(sc.label, 60)}": final debt=$${sanitizeNum(last.debt).toFixed(0)}, savings=$${sanitizeNum(last.savings).toFixed(0)}, risk=${sanitizeNum(last.riskScore)}`;
      }).join('\n')
    : '';

  const userMessage = `Analyze this financial simulation for ${safeName}:

SCENARIO: "${safeLabel}" over ${safeHorizon} months
DECISION SCORE: ${Math.max(0, Math.min(100, sanitizeNum(summary.decisionScore)))}/100 (${safeVerdict})

CURRENT PROFILE:
  Income: $${sanitizeNum(profile.income).toLocaleString()}/mo
  Expenses: $${sanitizeNum(profile.expenses).toLocaleString()}/mo
  Monthly cashflow (today): $${(sanitizeNum(profile.income) - sanitizeNum(profile.expenses) - sanitizeNum(profile.minimumPayment)).toFixed(0)}
  Starting debt: $${sanitizeNum(profile.totalDebt).toLocaleString()} @ ${sanitizeNum(profile.interestRate)}% APR
  Starting savings: $${sanitizeNum(profile.savings).toLocaleString()}
  Minimum payment: $${sanitizeNum(profile.minimumPayment).toLocaleString()}/mo

SCENARIO CHANGES APPLIED:
  Extra payment: $${sanitizeNum(config.extraPayment)}/mo
  Expense change: $${sanitizeNum(config.expenseChange)}/mo (${sanitizeNum(config.expenseChange) < 0 ? 'cut' : sanitizeNum(config.expenseChange) > 0 ? 'increase' : 'none'})
  Income change: $${sanitizeNum(config.incomeChange)}/mo
  One-time shock: $${sanitizeNum(config.oneTimeShock)}
  New loan: $${sanitizeNum(config.newLoanAmount)}${sanitizeNum(config.newLoanAmount) > 0 ? ` @ ${sanitizeNum(config.newLoanRate)}% APR` : ''}
  Refinance rate: ${config.refinanceRate !== null ? sanitizeNum(config.refinanceRate) + '%' : 'no change'}

SIMULATION TRAJECTORY:
  Baseline: ${buildTrendSummary(baseline)}
  Scenario: ${buildTrendSummary(scenario)}

KEY OUTCOMES (${safeHorizon} months):
  Debt delta: ${sanitizeNum(summary.finalDebtDelta) < 0 ? '-' : '+'}$${Math.abs(sanitizeNum(summary.finalDebtDelta)).toFixed(0)}
  Savings delta: ${sanitizeNum(summary.finalSavingsDelta) < 0 ? '-' : '+'}$${Math.abs(sanitizeNum(summary.finalSavingsDelta)).toFixed(0)}
  Interest saved vs baseline: $${interestSaved.toFixed(0)}
  Avg risk delta: ${sanitizeNum(summary.avgRiskDelta).toFixed(1)} points
  Risk range (scenario): ${minRisk}–${maxRisk}
  Months with negative cashflow: ${negCashflowMonths} of ${safeHorizon}
  Baseline debt payoff: ${summary.baselineDebtPayoffMonth !== null ? 'month ' + sanitizeNum(summary.baselineDebtPayoffMonth) : 'not within horizon'}
  Scenario debt payoff: ${summary.scenarioDebtPayoffMonth !== null ? 'month ' + sanitizeNum(summary.scenarioDebtPayoffMonth) : 'not within horizon'}
  Baseline savings depletion: ${summary.baselineSavingsDepletionMonth !== null ? 'month ' + sanitizeNum(summary.baselineSavingsDepletionMonth) : 'none'}
  Scenario savings depletion: ${summary.scenarioSavingsDepletionMonth !== null ? 'month ' + sanitizeNum(summary.scenarioSavingsDepletionMonth) : 'none'}
  Final scenario debt: $${sanitizeNum(lastScenario.debt).toFixed(0)}
  Final scenario savings: $${sanitizeNum(lastScenario.savings).toFixed(0)}
  Final scenario net worth: $${sanitizeNum(lastScenario.netWorth).toFixed(0)} (vs baseline $${sanitizeNum(lastBaseline.netWorth).toFixed(0)})
${additionalSummary}

Provide the JSON analysis.`;

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  try {
    const response = await anthropic.messages.create({
      model: AI_MODELS.analysis,
      max_tokens: AI_MAX_TOKENS.simulationAnalysis,
      system: buildSimulationSystemPrompt(),
      messages: [{ role: 'user', content: userMessage }],
    });

    const rawText =
      response.content[0]?.type === 'text' ? response.content[0].text : '{}';

    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('no_json_in_response');

    const parsed = JSON.parse(jsonMatch[0]) as Record<string, unknown>;

    // Validate and coerce all fields — never trust raw AI output types
    const analysisResult: SimulationAnalysisResult = {
      narrative: typeof parsed.narrative === 'string' && parsed.narrative.length > 0
        ? parsed.narrative
        : 'Analysis could not be generated for this simulation.',
      watchOuts: Array.isArray(parsed.watchOuts)
        ? (parsed.watchOuts as unknown[]).filter((w): w is string => typeof w === 'string').slice(0, 5)
        : [],
      confidenceRating: Math.min(100, Math.max(0, Number(parsed.confidenceRating) || 75)),
      confidenceNote: typeof parsed.confidenceNote === 'string' && parsed.confidenceNote.length > 0
        ? parsed.confidenceNote
        : 'Analysis based on provided inputs.',
    };

    return Response.json(analysisResult);
  } catch {
    // H-3: Never leak internal error details to the client
    return new Response(JSON.stringify({ error: 'analysis_failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
