import {
  FinancialProfile,
  ScenarioConfig,
  MonthlySnapshot,
  SimulationSummary,
} from './types';
import { formatCurrency, formatMonths } from './formatters';

/**
 * Generates a 3-paragraph narrative analysis of a simulation.
 *
 * Paragraph 1: Immediate effect (month 1-3)
 * Paragraph 2: Compounding effect over the full horizon
 * Paragraph 3: Risks and opportunities to watch
 */
export function generateNarrative(
  profile: FinancialProfile,
  config: ScenarioConfig,
  baseline: MonthlySnapshot[],
  scenario: MonthlySnapshot[],
  summary: SimulationSummary
): string {
  const paragraph1 = generateImmediateEffect(profile, config, baseline, scenario);
  const paragraph2 = generateCompoundingEffect(config, baseline, scenario, summary);
  const paragraph3 = generateRisksAndOpportunities(profile, config, baseline, scenario, summary);

  return [paragraph1, paragraph2, paragraph3].join('\n\n');
}

function generateImmediateEffect(
  profile: FinancialProfile,
  config: ScenarioConfig,
  baseline: MonthlySnapshot[],
  scenario: MonthlySnapshot[]
): string {
  const parts: string[] = [];
  const month3Baseline = baseline[Math.min(2, baseline.length - 1)];
  const month3Scenario = scenario[Math.min(2, scenario.length - 1)];
  const month1Scenario = scenario[0];

  // Describe what changes
  const changes: string[] = [];
  if (config.extraPayment > 0) {
    changes.push(`an extra ${formatCurrency(config.extraPayment)}/mo toward debt`);
  }
  if (config.incomeChange > 0) {
    changes.push(`a ${formatCurrency(config.incomeChange)}/mo income increase`);
  }
  if (config.incomeChange < 0) {
    changes.push(`a ${formatCurrency(Math.abs(config.incomeChange))}/mo income decrease`);
  }
  if (config.expenseChange < 0) {
    changes.push(`cutting ${formatCurrency(Math.abs(config.expenseChange))}/mo in expenses`);
  }
  if (config.expenseChange > 0) {
    changes.push(`adding ${formatCurrency(config.expenseChange)}/mo in expenses`);
  }
  if (config.oneTimeShock > 0) {
    changes.push(`absorbing a ${formatCurrency(config.oneTimeShock)} one-time expense`);
  }
  if (config.newLoanAmount > 0) {
    changes.push(`taking on ${formatCurrency(config.newLoanAmount)} in new debt`);
  }
  if (config.refinanceRate !== null) {
    changes.push(`refinancing from ${profile.interestRate}% to ${config.refinanceRate}% APR`);
  }

  if (changes.length === 0) {
    return 'This scenario maintains your current financial trajectory without changes.';
  }

  const changeStr = changes.length === 1
    ? changes[0]
    : changes.slice(0, -1).join(', ') + ' and ' + changes[changes.length - 1];

  parts.push(`With ${changeStr}, the immediate impact shifts your monthly picture.`);

  // Cashflow comparison
  const cashflowDiff = month1Scenario.cashflow - baseline[0].cashflow;
  if (Math.abs(cashflowDiff) > 10) {
    if (cashflowDiff > 0) {
      parts.push(`Your monthly free cash flow improves by ${formatCurrency(cashflowDiff)} right away.`);
    } else {
      parts.push(`Your monthly free cash flow tightens by ${formatCurrency(Math.abs(cashflowDiff))}, which is the cost of accelerating your debt payoff.`);
    }
  }

  // Early debt comparison
  const earlyDebtDiff = month3Baseline.debt - month3Scenario.debt;
  if (Math.abs(earlyDebtDiff) > 50) {
    if (earlyDebtDiff > 0) {
      parts.push(`Within the first 3 months, you'll have ${formatCurrency(earlyDebtDiff)} less debt than the baseline.`);
    } else {
      parts.push(`Within the first 3 months, debt will be ${formatCurrency(Math.abs(earlyDebtDiff))} higher than the baseline.`);
    }
  }

  return parts.join(' ');
}

function generateCompoundingEffect(
  config: ScenarioConfig,
  baseline: MonthlySnapshot[],
  scenario: MonthlySnapshot[],
  summary: SimulationSummary
): string {
  const parts: string[] = [];
  const horizon = config.horizonMonths;
  const lastBaseline = baseline[baseline.length - 1];
  const lastScenario = scenario[scenario.length - 1];

  parts.push(`Over the full ${formatMonths(horizon)} horizon, compounding effects reshape the picture.`);

  // Final debt comparison
  if (Math.abs(summary.finalDebtDelta) > 100) {
    if (summary.finalDebtDelta < 0) {
      parts.push(`Your debt ends up ${formatCurrency(Math.abs(summary.finalDebtDelta))} lower than baseline, finishing at ${formatCurrency(lastScenario.debt)}.`);
    } else {
      parts.push(`Your debt ends up ${formatCurrency(summary.finalDebtDelta)} higher than baseline, finishing at ${formatCurrency(lastScenario.debt)}.`);
    }
  }

  // Payoff comparison
  if (summary.scenarioDebtPayoffMonth !== null && summary.baselineDebtPayoffMonth !== null) {
    const monthsSaved = summary.baselineDebtPayoffMonth - summary.scenarioDebtPayoffMonth;
    if (monthsSaved > 0) {
      parts.push(`You reach debt-free status ${monthsSaved} months earlier, at month ${summary.scenarioDebtPayoffMonth} instead of month ${summary.baselineDebtPayoffMonth}.`);
    } else if (monthsSaved < 0) {
      parts.push(`Debt payoff is delayed by ${Math.abs(monthsSaved)} months, reaching zero at month ${summary.scenarioDebtPayoffMonth} versus month ${summary.baselineDebtPayoffMonth}.`);
    }
  } else if (summary.scenarioDebtPayoffMonth !== null && summary.baselineDebtPayoffMonth === null) {
    parts.push(`Notably, you become debt-free at month ${summary.scenarioDebtPayoffMonth}, while the baseline never fully pays off within this timeframe.`);
  } else if (summary.scenarioDebtPayoffMonth === null && summary.baselineDebtPayoffMonth !== null) {
    parts.push(`Unlike the baseline which pays off by month ${summary.baselineDebtPayoffMonth}, this scenario does not fully eliminate debt within ${formatMonths(horizon)}.`);
  }

  // Savings comparison
  if (Math.abs(summary.finalSavingsDelta) > 100) {
    if (summary.finalSavingsDelta > 0) {
      parts.push(`Your savings end up ${formatCurrency(summary.finalSavingsDelta)} higher, reaching ${formatCurrency(lastScenario.savings)}.`);
    } else {
      parts.push(`Savings end ${formatCurrency(Math.abs(summary.finalSavingsDelta))} lower at ${formatCurrency(lastScenario.savings)}.`);
    }
  }

  // Interest saved
  const totalBaselineInterest = baseline.reduce((sum, s) => sum + s.interestPaid, 0);
  const totalScenarioInterest = scenario.reduce((sum, s) => sum + s.interestPaid, 0);
  const interestSaved = totalBaselineInterest - totalScenarioInterest;
  if (Math.abs(interestSaved) > 50) {
    if (interestSaved > 0) {
      parts.push(`You save ${formatCurrency(interestSaved)} in total interest charges.`);
    } else {
      parts.push(`You pay ${formatCurrency(Math.abs(interestSaved))} more in total interest.`);
    }
  }

  return parts.join(' ');
}

function generateRisksAndOpportunities(
  profile: FinancialProfile,
  config: ScenarioConfig,
  baseline: MonthlySnapshot[],
  scenario: MonthlySnapshot[],
  summary: SimulationSummary
): string {
  const parts: string[] = [];

  const avgBaselineRisk = baseline.reduce((sum, s) => sum + s.riskScore, 0) / baseline.length;

  // Risk trajectory — use both absolute and relative thresholds to catch small but meaningful changes
  const riskDeltaSignificant =
    Math.abs(summary.avgRiskDelta) > 3 ||
    (avgBaselineRisk > 0 && Math.abs(summary.avgRiskDelta / avgBaselineRisk) > 0.05);
  if (riskDeltaSignificant) {
    if (summary.avgRiskDelta < 0) {
      parts.push(`Your average risk score improves by ${Math.abs(summary.avgRiskDelta).toFixed(1)} points across the simulation period, indicating a more resilient financial position.`);
    } else {
      parts.push(`Your average risk score increases by ${summary.avgRiskDelta.toFixed(1)} points, signaling increased financial vulnerability that warrants monitoring.`);
    }
  }

  // Cashflow reversal warning — flag if scenario flips positive cashflow to negative
  const baselineCashflow0 = baseline[0]?.cashflow ?? 0;
  const scenarioCashflow0 = scenario[0]?.cashflow ?? 0;
  if (baselineCashflow0 > 0 && scenarioCashflow0 < 0) {
    parts.push(`This scenario flips your monthly cashflow from positive (${formatCurrency(baselineCashflow0)}) to negative (${formatCurrency(scenarioCashflow0)}). Every month you are in deficit chips directly into savings — make sure that tradeoff is intentional.`);
  }

  // Savings depletion warning
  if (summary.scenarioSavingsDepletionMonth !== null) {
    parts.push(`Warning: savings reach zero at month ${summary.scenarioSavingsDepletionMonth}. This eliminates your emergency buffer and creates significant vulnerability to unexpected expenses.`);
  }

  // Tight cashflow warning
  const tightMonths = scenario.filter(s => s.cashflow < 0).length;
  if (tightMonths > 0 && scenarioCashflow0 >= 0) {
    // Only show this if cashflow wasn't already flagged by the reversal warning above
    parts.push(`You experience negative cash flow in ${tightMonths} of ${config.horizonMonths} months. Consider building in more margin to handle variability in income or expenses.`);
  }

  // New loan cost warning
  if (config.newLoanAmount > 0 && config.newLoanRate > 0) {
    const estimatedTotalInterest = config.newLoanAmount * (config.newLoanRate / 100) * (config.horizonMonths / 12);
    parts.push(`The new ${formatCurrency(config.newLoanAmount)} loan at ${config.newLoanRate}% APR will cost roughly ${formatCurrency(estimatedTotalInterest)} in interest over this horizon alone — this is the hidden cost of the loan beyond the principal.`);
  }

  // One-time shock recovery trajectory
  if (config.oneTimeShock > 0) {
    const cashflowAfterShock = scenarioCashflow0;
    if (cashflowAfterShock > 0) {
      const recoveryMonths = Math.ceil(config.oneTimeShock / cashflowAfterShock);
      parts.push(`The ${formatCurrency(config.oneTimeShock)} shock takes roughly ${recoveryMonths} month${recoveryMonths !== 1 ? 's' : ''} to recover from at your post-shock cashflow rate of ${formatCurrency(cashflowAfterShock)}/mo.`);
    } else {
      parts.push(`The ${formatCurrency(config.oneTimeShock)} shock is not recoverable under this scenario — your cashflow is negative, meaning savings will continue declining after the shock.`);
    }
  }

  // Income change dependency warning
  if (config.incomeChange !== 0) {
    if (config.incomeChange > 0) {
      parts.push(`These projections assume the ${formatCurrency(config.incomeChange)}/mo income increase is sustained for the full ${config.horizonMonths} months. A reversal or reduction of that income would materially change the outcome.`);
    } else {
      parts.push(`The ${formatCurrency(Math.abs(config.incomeChange))}/mo income reduction is assumed permanent across all ${config.horizonMonths} months. If this is temporary, run a shorter horizon to model the true impact window.`);
    }
  }

  // Opportunity callouts
  if (config.refinanceRate !== null && config.refinanceRate < profile.interestRate) {
    const rateSavings = profile.interestRate - config.refinanceRate;
    parts.push(`The ${rateSavings.toFixed(1)} percentage point rate reduction compounds significantly over time. Ensure you account for any refinancing fees or closing costs.`);
  }

  if (config.extraPayment > 0 && summary.scenarioDebtPayoffMonth !== null) {
    parts.push(`The accelerated payoff frees up ${formatCurrency(profile.minimumPayment + config.extraPayment)}/mo after month ${summary.scenarioDebtPayoffMonth}, which can be redirected toward savings or investment.`);
  }

  // Net worth trajectory
  const lastBaseline = baseline[baseline.length - 1];
  const lastScenario = scenario[scenario.length - 1];
  const netWorthDelta = lastScenario.netWorth - lastBaseline.netWorth;
  if (Math.abs(netWorthDelta) > 100) {
    if (netWorthDelta > 0) {
      parts.push(`Overall, your net worth ends ${formatCurrency(netWorthDelta)} higher, moving from ${formatCurrency(lastBaseline.netWorth)} to ${formatCurrency(lastScenario.netWorth)}.`);
    } else {
      parts.push(`Your net worth finishes ${formatCurrency(Math.abs(netWorthDelta))} lower. Weigh whether the short-term cost aligns with your longer-term financial goals.`);
    }
  }

  if (parts.length === 0) {
    parts.push('This scenario tracks closely with the baseline across all risk metrics. The changes are minor enough that external factors like income variability or unexpected expenses will likely matter more than the scenario adjustments themselves.');
  }

  return parts.join(' ');
}
