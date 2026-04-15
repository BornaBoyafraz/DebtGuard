import { MonthlySnapshot, VerdictLevel } from './types';

/**
 * Computes a decision score from 0-100 comparing a scenario path against
 * a baseline path.
 *
 * Score of 50 = neutral (no net change).
 * Score > 50 = the scenario improves your financial position.
 * Score < 50 = the scenario worsens your financial position.
 *
 * Weights: debt 35%, savings 30%, risk 25%, payoff speed 10%
 */
export function computeDecisionScore(
  baseline: MonthlySnapshot[],
  scenario: MonthlySnapshot[]
): number {
  const lastBaseline = baseline[baseline.length - 1];
  const lastScenario = scenario[scenario.length - 1];

  // --- Debt component (35%) ---
  // Compare final debt levels
  const baselineDebt = lastBaseline.debt;
  const scenarioDebt = lastScenario.debt;
  const debtDelta = baselineDebt - scenarioDebt; // positive = scenario has less debt = good

  // Normalize: how much of the original debt was improved?
  const maxDebtSwing = Math.max(baselineDebt, scenarioDebt, 1);
  const debtRatio = clamp(debtDelta / maxDebtSwing, -1, 1);
  const debtScore = 50 + debtRatio * 50;

  // --- Savings component (30%) ---
  const baselineSavings = lastBaseline.savings;
  const scenarioSavings = lastScenario.savings;
  const savingsDelta = scenarioSavings - baselineSavings; // positive = scenario has more savings = good

  const maxSavingsSwing = Math.max(Math.abs(baselineSavings), Math.abs(scenarioSavings), 1);
  const savingsRatio = clamp(savingsDelta / maxSavingsSwing, -1, 1);
  const savingsScore = 50 + savingsRatio * 50;

  // --- Risk component (25%) ---
  const avgBaselineRisk = baseline.reduce((sum, s) => sum + s.riskScore, 0) / baseline.length;
  const avgScenarioRisk = scenario.reduce((sum, s) => sum + s.riskScore, 0) / scenario.length;
  const riskDelta = avgBaselineRisk - avgScenarioRisk; // positive = scenario has lower risk = good

  // Risk scores are 0-100, so delta range is -100 to +100
  const riskRatio = clamp(riskDelta / 50, -1, 1);
  const riskScore = 50 + riskRatio * 50;

  // --- Payoff speed component (10%) ---
  const baselinePayoffIdx = baseline.findIndex(s => s.debt <= 0);
  const scenarioPayoffIdx = scenario.findIndex(s => s.debt <= 0);

  let payoffScore = 50; // neutral by default

  if (baselinePayoffIdx >= 0 && scenarioPayoffIdx >= 0) {
    // Both pay off: compare when
    const monthsSaved = baselinePayoffIdx - scenarioPayoffIdx; // positive = scenario pays off sooner
    const maxMonths = baseline.length;
    const payoffRatio = clamp(monthsSaved / (maxMonths * 0.5), -1, 1);
    payoffScore = 50 + payoffRatio * 50;
  } else if (baselinePayoffIdx < 0 && scenarioPayoffIdx >= 0) {
    // Scenario pays off but baseline doesn't: big win
    payoffScore = 95;
  } else if (baselinePayoffIdx >= 0 && scenarioPayoffIdx < 0) {
    // Baseline pays off but scenario doesn't: big loss
    payoffScore = 5;
  }
  // else neither pays off: stays neutral at 50

  // --- Weighted combination ---
  const weightedScore =
    debtScore * 0.35 +
    savingsScore * 0.30 +
    riskScore * 0.25 +
    payoffScore * 0.10;

  return Math.round(clamp(weightedScore, 0, 100));
}

/**
 * Maps a decision score (0-100) to a verdict level.
 */
export function getVerdict(score: number): VerdictLevel {
  if (score >= 72) return 'significantly_better';
  if (score >= 58) return 'better';
  if (score >= 42) return 'neutral';
  if (score >= 28) return 'worse';
  return 'significantly_worse';
}

/**
 * Returns a human-readable string for each verdict level.
 */
export function getVerdictText(verdict: VerdictLevel): string {
  switch (verdict) {
    case 'significantly_better':
      return 'This scenario significantly improves your financial position. The numbers strongly support this path.';
    case 'better':
      return 'This scenario produces meaningful improvements. The changes are worth pursuing and will compound over time.';
    case 'neutral':
      return 'This scenario produces marginal changes. Some metrics improve slightly while others remain similar. Consider whether the effort justifies the incremental benefit.';
    case 'worse':
      return 'This scenario weakens your financial position. Key metrics deteriorate, and alternatives should be considered.';
    case 'significantly_worse':
      return 'This scenario significantly damages your financial outlook. This path substantially increases your risk exposure. Strongly reconsider.';
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
