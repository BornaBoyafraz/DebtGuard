import { FinancialProfile, GoalTarget, GoalSolution } from './types';
import { simulatePath } from './simulation-engine';
import { formatCurrency, formatMonths } from './formatters';

/**
 * Uses binary search to find the financial adjustments needed to achieve a goal.
 *
 * Supported goal types:
 * - debt_free_by: finds the extra monthly payment needed to pay off all debt by a target month
 * - savings_target: finds the expense reduction or income increase needed to reach a savings target
 * - risk_score_target: finds the combination of changes needed to bring risk score below a target
 */
export function solveForGoal(
  profile: FinancialProfile,
  goal: GoalTarget
): GoalSolution {
  switch (goal.type) {
    case 'debt_free_by':
      return solveDebtFreeBy(profile, goal);
    case 'savings_target':
      return solveSavingsTarget(profile, goal);
    case 'risk_score_target':
      return solveRiskScoreTarget(profile, goal);
  }
}

function solveDebtFreeBy(
  profile: FinancialProfile,
  goal: GoalTarget
): GoalSolution {
  const targetMonth = goal.byMonth;

  // ── Feasibility pre-checks ────────────────────────────────────────────────

  // Check 1: If current cashflow is negative, every extra payment only deepens
  // the deficit — debt can never decrease without first achieving positive cashflow.
  const currentCashflow = profile.income - profile.expenses - profile.minimumPayment;
  if (currentCashflow <= 0) {
    return {
      achievable: false,
      explanation: `Debt freedom requires positive monthly cashflow first. Your current cashflow after expenses and minimum payment is ${formatCurrency(currentCashflow)}/mo. Any extra debt payment would further reduce savings without meaningfully improving the trajectory. Focus on achieving positive cashflow — either by cutting ${formatCurrency(Math.abs(currentCashflow) + 1)}/mo in expenses or increasing income — before targeting debt payoff.`,
    };
  }

  // Check 2: If the minimum payment can't cover monthly interest, debt grows regardless.
  // Interest-only threshold = totalDebt * (APR / 12)
  if (profile.totalDebt > 0 && profile.interestRate > 0) {
    const monthlyInterestOnly = profile.totalDebt * (profile.interestRate / 100 / 12);
    if (profile.minimumPayment < monthlyInterestOnly) {
      return {
        achievable: false,
        explanation: `Your current minimum payment of ${formatCurrency(profile.minimumPayment)}/mo is less than the monthly interest charge of ${formatCurrency(monthlyInterestOnly)}/mo. This means your debt balance is growing each month even while making payments. You need to pay at least ${formatCurrency(Math.ceil(monthlyInterestOnly))}/mo just to stop the debt from increasing — consider refinancing to a lower rate or increasing your minimum payment immediately.`,
      };
    }
  }

  // First check if it's already achievable with no extra payment
  const baselinePath = simulatePath(profile, {}, targetMonth, true);
  const baselinePayoff = baselinePath.findIndex(s => s.debt <= 0);

  if (baselinePayoff >= 0 && baselinePayoff + 1 <= targetMonth) {
    return {
      achievable: true,
      requiredExtraPayment: 0,
      explanation: `You're already on track to be debt-free by month ${baselinePayoff + 1}, which is within your target of ${formatMonths(targetMonth)}. No extra payments are needed.`,
    };
  }

  // Binary search for the required extra payment
  let low = 0;
  let high = profile.totalDebt; // Upper bound: paying entire debt at once
  let bestExtra: number | null = null;

  for (let i = 0; i < 50; i++) {
    const mid = (low + high) / 2;
    const path = simulatePath(profile, { extraPayment: mid }, targetMonth, false);
    const payoffIdx = path.findIndex(s => s.debt <= 0);

    if (payoffIdx >= 0 && payoffIdx + 1 <= targetMonth) {
      bestExtra = mid;
      high = mid;
    } else {
      low = mid;
    }

    if (high - low < 1) break;
  }

  if (bestExtra !== null) {
    const roundedExtra = Math.ceil(bestExtra);

    // Check if savings go negative during the process
    const verifyPath = simulatePath(profile, { extraPayment: roundedExtra }, targetMonth, false);
    const savingsGoBelowZero = verifyPath.some(s => s.savings < 0);

    let explanation = `To be debt-free within ${formatMonths(targetMonth)}, you need to pay an extra ${formatCurrency(roundedExtra)}/mo on top of your minimum payment of ${formatCurrency(profile.minimumPayment)}, for a total monthly payment of ${formatCurrency(profile.minimumPayment + roundedExtra)}.`;

    if (savingsGoBelowZero) {
      explanation += ` Caution: at this payment level, your savings may dip below zero. Consider a slightly lower extra payment or find ways to boost income.`;
    }

    return {
      achievable: true,
      requiredExtraPayment: roundedExtra,
      explanation,
    };
  }

  return {
    achievable: false,
    explanation: `It is not feasible to become debt-free within ${formatMonths(targetMonth)} given your current financial profile. Your income after expenses (${formatCurrency(profile.income - profile.expenses)}) is not sufficient to pay down ${formatCurrency(profile.totalDebt)} at ${profile.interestRate}% APR in that timeframe. Consider a longer horizon or reducing your interest rate through refinancing.`,
  };
}

function solveSavingsTarget(
  profile: FinancialProfile,
  goal: GoalTarget
): GoalSolution {
  const targetSavings = goal.value;
  const targetMonth = goal.byMonth;

  // Check baseline
  const baselinePath = simulatePath(profile, {}, targetMonth, true);
  const baselineFinal = baselinePath[baselinePath.length - 1];

  if (baselineFinal.savings >= targetSavings) {
    return {
      achievable: true,
      requiredExpenseReduction: 0,
      requiredIncomeIncrease: 0,
      explanation: `You're already on track to reach ${formatCurrency(targetSavings)} in savings by ${formatMonths(targetMonth)}. Your baseline projection shows ${formatCurrency(baselineFinal.savings)} in savings at that point.`,
    };
  }

  const gap = targetSavings - baselineFinal.savings;
  const monthlyGapNeeded = gap / targetMonth;

  // Try expense reduction first (binary search)
  const expenseReduction = solveForMonthlyChange(profile, targetMonth, targetSavings, 'expense');

  // Try income increase
  const incomeIncrease = solveForMonthlyChange(profile, targetMonth, targetSavings, 'income');

  if (expenseReduction !== null || incomeIncrease !== null) {
    const parts: string[] = [];
    parts.push(`To reach ${formatCurrency(targetSavings)} in savings within ${formatMonths(targetMonth)}, you need approximately ${formatCurrency(Math.ceil(monthlyGapNeeded))}/mo in additional free cash flow.`);

    if (expenseReduction !== null) {
      const rounded = Math.ceil(expenseReduction);
      parts.push(`This could be achieved by cutting expenses by ${formatCurrency(rounded)}/mo.`);
    }

    if (incomeIncrease !== null) {
      const rounded = Math.ceil(incomeIncrease);
      parts.push(`Alternatively, increasing your income by ${formatCurrency(rounded)}/mo would also reach this goal.`);
    }

    parts.push(`A combination of both smaller changes is also viable.`);

    return {
      achievable: true,
      requiredExpenseReduction: expenseReduction !== null ? Math.ceil(expenseReduction) : undefined,
      requiredIncomeIncrease: incomeIncrease !== null ? Math.ceil(incomeIncrease) : undefined,
      explanation: parts.join(' '),
    };
  }

  return {
    achievable: false,
    explanation: `Reaching ${formatCurrency(targetSavings)} in savings within ${formatMonths(targetMonth)} is not feasible with reasonable adjustments to your current profile. The gap of ${formatCurrency(gap)} would require changes exceeding your current income. Consider extending the timeline or combining multiple strategies.`,
  };
}

function solveForMonthlyChange(
  profile: FinancialProfile,
  months: number,
  targetSavings: number,
  type: 'expense' | 'income'
): number | null {
  let low = 0;
  let high = profile.income * 0.8; // Can't reduce expenses or need income more than 80% of current income
  let best: number | null = null;

  for (let i = 0; i < 50; i++) {
    const mid = (low + high) / 2;
    const adjustments = type === 'expense'
      ? { expenseChange: -mid }
      : { incomeChange: mid };

    const path = simulatePath(profile, adjustments, months, false);
    const finalSavings = path[path.length - 1].savings;

    if (finalSavings >= targetSavings) {
      best = mid;
      high = mid;
    } else {
      low = mid;
    }

    if (high - low < 1) break;
  }

  return best;
}

function solveRiskScoreTarget(
  profile: FinancialProfile,
  goal: GoalTarget
): GoalSolution {
  const targetScore = goal.value;
  const targetMonth = goal.byMonth;

  // Check baseline
  const baselinePath = simulatePath(profile, {}, targetMonth, true);
  const baselineFinalRisk = baselinePath[baselinePath.length - 1].riskScore;

  if (baselineFinalRisk <= targetScore) {
    return {
      achievable: true,
      requiredExtraPayment: 0,
      requiredExpenseReduction: 0,
      requiredIncomeIncrease: 0,
      explanation: `Your risk score already reaches ${baselineFinalRisk} by ${formatMonths(targetMonth)}, which is at or below your target of ${targetScore}. No additional changes are needed.`,
    };
  }

  // Try combinations: extra payment, expense reduction, income increase
  // First try extra payment alone
  const extraPayment = solveForRiskViaExtra(profile, targetMonth, targetScore);

  // Try expense reduction alone
  const expenseReduction = solveForRiskViaExpense(profile, targetMonth, targetScore);

  // Try income increase alone
  const incomeIncrease = solveForRiskViaIncome(profile, targetMonth, targetScore);

  if (extraPayment !== null || expenseReduction !== null || incomeIncrease !== null) {
    const parts: string[] = [];
    parts.push(`To bring your risk score to ${targetScore} or below within ${formatMonths(targetMonth)}:`);

    if (extraPayment !== null) {
      parts.push(`Pay an extra ${formatCurrency(Math.ceil(extraPayment))}/mo toward debt.`);
    }
    if (expenseReduction !== null) {
      parts.push(`Reduce expenses by ${formatCurrency(Math.ceil(expenseReduction))}/mo.`);
    }
    if (incomeIncrease !== null) {
      parts.push(`Increase income by ${formatCurrency(Math.ceil(incomeIncrease))}/mo.`);
    }

    parts.push(`Any one of these approaches, or a combination of smaller adjustments, can reach the target.`);

    return {
      achievable: true,
      requiredExtraPayment: extraPayment !== null ? Math.ceil(extraPayment) : undefined,
      requiredExpenseReduction: expenseReduction !== null ? Math.ceil(expenseReduction) : undefined,
      requiredIncomeIncrease: incomeIncrease !== null ? Math.ceil(incomeIncrease) : undefined,
      explanation: parts.join(' '),
    };
  }

  return {
    achievable: false,
    explanation: `Reaching a risk score of ${targetScore} within ${formatMonths(targetMonth)} is not feasible with single-dimension changes. Your current risk score is driven by multiple factors including debt-to-income ratio, payment burden, and savings adequacy. Consider a combination of strategies: increasing income, reducing expenses, and making extra debt payments simultaneously. Refinancing to a lower rate could also significantly help.`,
  };
}

function solveForRiskViaExtra(
  profile: FinancialProfile,
  months: number,
  targetScore: number
): number | null {
  let low = 0;
  let high = profile.income - profile.expenses; // Max we could realistically pay extra
  if (high <= 0) return null;
  let best: number | null = null;

  for (let i = 0; i < 50; i++) {
    const mid = (low + high) / 2;
    const path = simulatePath(profile, { extraPayment: mid }, months, false);
    const finalRisk = path[path.length - 1].riskScore;

    if (finalRisk <= targetScore) {
      best = mid;
      high = mid;
    } else {
      low = mid;
    }

    if (high - low < 1) break;
  }

  return best;
}

function solveForRiskViaExpense(
  profile: FinancialProfile,
  months: number,
  targetScore: number
): number | null {
  let low = 0;
  let high = profile.expenses * 0.5; // Can't cut more than 50% of expenses
  let best: number | null = null;

  for (let i = 0; i < 50; i++) {
    const mid = (low + high) / 2;
    const path = simulatePath(profile, { expenseChange: -mid }, months, false);
    const finalRisk = path[path.length - 1].riskScore;

    if (finalRisk <= targetScore) {
      best = mid;
      high = mid;
    } else {
      low = mid;
    }

    if (high - low < 1) break;
  }

  return best;
}

function solveForRiskViaIncome(
  profile: FinancialProfile,
  months: number,
  targetScore: number
): number | null {
  let low = 0;
  let high = profile.income; // Up to doubling income
  let best: number | null = null;

  for (let i = 0; i < 50; i++) {
    const mid = (low + high) / 2;
    const path = simulatePath(profile, { incomeChange: mid }, months, false);
    const finalRisk = path[path.length - 1].riskScore;

    if (finalRisk <= targetScore) {
      best = mid;
      high = mid;
    } else {
      low = mid;
    }

    if (high - low < 1) break;
  }

  return best;
}
