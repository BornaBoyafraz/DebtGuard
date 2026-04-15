import {
  FinancialProfile,
  ScenarioConfig,
  SimulationResult,
  SimulationSummary,
  MonthlySnapshot,
} from './types';
import { computeRiskScore } from './risk-engine';
import { computeDecisionScore, getVerdict, getVerdictText } from './decision-score';
import { generateNarrative } from './narrative-engine';

interface PathAdjustments {
  extraPayment?: number;
  expenseChange?: number;
  incomeChange?: number;
  oneTimeShock?: number;
  newLoanAmount?: number;
  newLoanRate?: number;
  refinanceRate?: number | null;
}

export function simulatePath(
  profile: FinancialProfile,
  adjustments: PathAdjustments,
  months: number,
  isBaseline = false
): MonthlySnapshot[] {
  const snapshots: MonthlySnapshot[] = [];

  // Track existing debt and new loan debt separately for correct interest calculation
  let existingDebt = profile.totalDebt;
  let newLoanDebt = 0;
  let savings = profile.savings;
  let currentMinPayment = profile.minimumPayment;
  let totalPaidAccumulator = 0;

  // Rate for existing debt (may be overridden by refinance)
  const existingRate = (!isBaseline && adjustments.refinanceRate != null)
    ? adjustments.refinanceRate
    : profile.interestRate;

  // Rate for the new loan (separate from existing debt rate)
  const newLoanRate = (!isBaseline && adjustments.newLoanRate && adjustments.newLoanRate > 0)
    ? adjustments.newLoanRate
    : existingRate;

  const adjustedIncome = profile.income + (isBaseline ? 0 : (adjustments.incomeChange || 0));
  const adjustedExpenses = profile.expenses + (isBaseline ? 0 : (adjustments.expenseChange || 0));
  const extraPayment = isBaseline ? 0 : (adjustments.extraPayment || 0);

  for (let month = 1; month <= months; month++) {
    // Apply one-time shock in month 1
    if (month === 1 && !isBaseline && adjustments.oneTimeShock) {
      savings -= adjustments.oneTimeShock;
    }

    // Apply new loan in month 1 — tracked separately with its own rate
    if (month === 1 && !isBaseline && adjustments.newLoanAmount) {
      newLoanDebt = adjustments.newLoanAmount;
    }

    const totalDebt = existingDebt + newLoanDebt;

    // Compute monthly interest for each debt segment at its respective rate
    const existingInterest = existingDebt > 0 ? existingDebt * (existingRate / 100 / 12) : 0;
    const newLoanInterest = newLoanDebt > 0 ? newLoanDebt * (newLoanRate / 100 / 12) : 0;
    const monthlyInterest = existingInterest + newLoanInterest;

    // Compute total payment (min + extra, capped at total owed)
    const desiredPayment = currentMinPayment + extraPayment;
    const totalPayment = totalDebt > 0
      ? Math.min(totalDebt + monthlyInterest, desiredPayment)
      : 0;

    // Allocate payments proportionally by outstanding balance
    if (totalDebt > 0) {
      const existingFraction = existingDebt / totalDebt;
      const newLoanFraction = newLoanDebt / totalDebt;
      existingDebt = Math.max(0, existingDebt + existingInterest - totalPayment * existingFraction);
      newLoanDebt = Math.max(0, newLoanDebt + newLoanInterest - totalPayment * newLoanFraction);
    }

    const debt = existingDebt + newLoanDebt;

    // Compute cashflow and update savings
    const cashflow = adjustedIncome - adjustedExpenses - totalPayment;
    savings = savings + cashflow;

    // Track cumulative payments
    totalPaidAccumulator += totalPayment;

    // Recalculate minimum payment based on remaining total debt
    currentMinPayment = debt > 0 ? Math.max(profile.minimumPayment, debt * 0.02) : 0;

    // Compute risk score for current state
    const currentProfile: FinancialProfile = {
      income: adjustedIncome,
      expenses: adjustedExpenses,
      savings,
      totalDebt: debt,
      interestRate: existingRate,
      minimumPayment: currentMinPayment,
    };

    const riskAnalysis = computeRiskScore(currentProfile);

    snapshots.push({
      month,
      debt,
      savings,
      cashflow,
      riskScore: riskAnalysis.score,
      riskLevel: riskAnalysis.level,
      minimumPayment: currentMinPayment,
      interestPaid: monthlyInterest,
      netWorth: savings - debt,
      totalPaid: totalPaidAccumulator,
    });
  }

  return snapshots;
}

function computeSummary(
  baseline: MonthlySnapshot[],
  scenario: MonthlySnapshot[],
  config: ScenarioConfig,
  profile: FinancialProfile
): SimulationSummary {
  const lastBaseline = baseline[baseline.length - 1];
  const lastScenario = scenario[scenario.length - 1];

  const baselinePayoff = baseline.findIndex(s => s.debt <= 0);
  const scenarioPayoff = scenario.findIndex(s => s.debt <= 0);

  const baselineDepletion = baseline.findIndex(s => s.savings <= 0);
  const scenarioDepletion = scenario.findIndex(s => s.savings <= 0);

  const finalDebtDelta = lastScenario.debt - lastBaseline.debt;
  const finalSavingsDelta = lastScenario.savings - lastBaseline.savings;

  const avgBaselineRisk = baseline.reduce((s, v) => s + v.riskScore, 0) / baseline.length;
  const avgScenarioRisk = scenario.reduce((s, v) => s + v.riskScore, 0) / scenario.length;
  const avgRiskDelta = avgScenarioRisk - avgBaselineRisk;

  const baselinePayoffMonth = baselinePayoff >= 0 ? baselinePayoff + 1 : null;
  const scenarioPayoffMonth = scenarioPayoff >= 0 ? scenarioPayoff + 1 : null;

  let timeToPayoffDelta: number | null = null;
  if (baselinePayoffMonth !== null && scenarioPayoffMonth !== null) {
    timeToPayoffDelta = scenarioPayoffMonth - baselinePayoffMonth;
  } else if (baselinePayoffMonth === null && scenarioPayoffMonth !== null) {
    timeToPayoffDelta = -(config.horizonMonths);
  } else if (baselinePayoffMonth !== null && scenarioPayoffMonth === null) {
    timeToPayoffDelta = config.horizonMonths;
  }

  const decisionScore = computeDecisionScore(baseline, scenario);
  const verdict = getVerdict(decisionScore);
  const verdictText = getVerdictText(verdict);

  const narrative = generateNarrative(profile, config, baseline, scenario, {
    baselineDebtPayoffMonth: baselinePayoffMonth,
    scenarioDebtPayoffMonth: scenarioPayoffMonth,
    baselineSavingsDepletionMonth: baselineDepletion >= 0 ? baselineDepletion + 1 : null,
    scenarioSavingsDepletionMonth: scenarioDepletion >= 0 ? scenarioDepletion + 1 : null,
    finalDebtDelta,
    finalSavingsDelta,
    avgRiskDelta,
    timeToPayoffDelta,
    verdict,
    verdictText,
    decisionScore,
    narrative: '',
  });

  return {
    baselineDebtPayoffMonth: baselinePayoffMonth,
    scenarioDebtPayoffMonth: scenarioPayoffMonth,
    baselineSavingsDepletionMonth: baselineDepletion >= 0 ? baselineDepletion + 1 : null,
    scenarioSavingsDepletionMonth: scenarioDepletion >= 0 ? scenarioDepletion + 1 : null,
    finalDebtDelta,
    finalSavingsDelta,
    avgRiskDelta,
    timeToPayoffDelta,
    verdict,
    verdictText,
    decisionScore,
    narrative,
  };
}

export function runSimulation(
  profile: FinancialProfile,
  scenario: ScenarioConfig,
  additionalScenarios?: ScenarioConfig[]
): SimulationResult {
  const baseline = simulatePath(profile, {}, scenario.horizonMonths, true);
  const scenarioPath = simulatePath(profile, scenario, scenario.horizonMonths, false);
  const summary = computeSummary(baseline, scenarioPath, scenario, profile);

  const additional = additionalScenarios?.length
    ? additionalScenarios.map(sc => ({
        config: sc,
        path: simulatePath(profile, sc, sc.horizonMonths || scenario.horizonMonths, false),
      }))
    : undefined;

  return {
    id: crypto.randomUUID(),
    baseline,
    scenario: scenarioPath,
    additionalScenarios: additional,
    config: scenario,
    profile,
    summary,
    createdAt: new Date().toISOString(),
  };
}
