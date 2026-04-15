import { solveForGoal } from '@/lib/goal-solver';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { FinancialProfile, GoalTarget, GoalSolution } from '@/lib/types';
import { checkRateLimit } from '@/lib/rate-limiter';

export const maxDuration = 30;

const PYTHON_SERVICE_URL = process.env.PYTHON_SERVICE_URL || 'http://localhost:8000';

const VALID_GOAL_TYPES = new Set(['debt_free_by', 'savings_target', 'risk_score_target']);

interface OptimizeResponse extends GoalSolution {
  engine: 'python' | 'typescript';
}

async function isPythonServiceAvailable(): Promise<boolean> {
  try {
    const res = await fetch(`${PYTHON_SERVICE_URL}/health`, {
      signal: AbortSignal.timeout(1500),
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function callPythonOptimizer(
  profile: FinancialProfile,
  goal: GoalTarget
): Promise<GoalSolution> {
  let endpoint: string;
  const params = new URLSearchParams({ by_month: String(goal.byMonth) });

  if (goal.type === 'debt_free_by') {
    endpoint = `/optimize/debt-payoff?${params}`;
  } else if (goal.type === 'savings_target') {
    params.set('target_savings', String(goal.value));
    endpoint = `/optimize/savings-target?${params}`;
  } else {
    params.set('target_score', String(goal.value));
    endpoint = `/optimize/risk-target?${params}`;
  }

  const res = await fetch(`${PYTHON_SERVICE_URL}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(profile),
    signal: AbortSignal.timeout(10000),
  });

  if (!res.ok) throw new Error(`python_service_error`);

  const data = await res.json() as Record<string, unknown>;

  if (goal.type === 'debt_free_by') {
    return {
      achievable: Boolean(data.achievable),
      requiredExtraPayment: Number(data.requiredExtraPayment ?? 0),
      explanation: data.savingsGoNegative
        ? `To be debt-free by month ${goal.byMonth}, pay an extra $${data.requiredExtraPayment}/mo. ` +
          `Caution: savings may dip below zero at this payment level.`
        : `To be debt-free by month ${goal.byMonth}, pay an extra $${data.requiredExtraPayment}/mo (scipy Brent's method, ${data.convergedIn ?? '?'} iterations).`,
    };
  } else if (goal.type === 'savings_target') {
    return {
      achievable: Boolean(data.achievable),
      requiredExpenseReduction: Number(data.requiredExpenseCut ?? 0),
      requiredIncomeIncrease: Number(data.requiredIncomeBoost ?? 0),
      explanation: `To reach $${goal.value.toLocaleString()} in savings by month ${goal.byMonth}: ` +
        `cut expenses by $${data.requiredExpenseCut}/mo or boost income by $${data.requiredIncomeBoost}/mo.`,
    };
  } else {
    return {
      achievable: Boolean(data.achievable),
      requiredExtraPayment: Number(data.requiredExtraPayment ?? 0),
      requiredExpenseReduction: Number(data.requiredExpenseCut ?? 0),
      requiredIncomeIncrease: Number(data.requiredIncomeBoost ?? 0),
      explanation: `To reach risk score ${goal.value} by month ${goal.byMonth}: ` +
        `extra payment $${data.requiredExtraPayment}/mo, cut $${data.requiredExpenseCut}/mo expenses, ` +
        `or boost income $${data.requiredIncomeBoost}/mo.`,
    };
  }
}

export async function POST(request: Request) {
  // ── Rate limiting ─────────────────────────────────────────────────────────
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
           || request.headers.get('x-real-ip')
           || 'unknown';
  const rl = checkRateLimit(`opt:${ip}`, 20, 15 * 60 * 1000);
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

  // ── C-1: Authentication required ──────────────────────────────────────────
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return new Response(JSON.stringify({ error: 'unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

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

  if (!raw.profile || typeof raw.profile !== 'object') {
    return new Response(JSON.stringify({ error: 'invalid_request' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (
    !raw.goal ||
    typeof raw.goal !== 'object' ||
    !VALID_GOAL_TYPES.has((raw.goal as Record<string, unknown>).type as string)
  ) {
    return new Response(JSON.stringify({ error: 'invalid_request' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const profile = raw.profile as FinancialProfile;
  const goal = raw.goal as GoalTarget;

  // Try the Python service first; fall back to TypeScript solver if unavailable
  const pythonAvailable = await isPythonServiceAvailable();

  if (pythonAvailable) {
    try {
      const solution = await callPythonOptimizer(profile, goal);
      const response: OptimizeResponse = { ...solution, engine: 'python' };
      return Response.json(response);
    } catch {
      // Fall through to TypeScript fallback
    }
  }

  // TypeScript fallback (always available)
  try {
    const solution = solveForGoal(profile, goal);
    const response: OptimizeResponse = { ...solution, engine: 'typescript' };
    return Response.json(response);
  } catch {
    return new Response(JSON.stringify({ error: 'optimization_failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
