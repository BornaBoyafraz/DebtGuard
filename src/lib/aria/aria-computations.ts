import type { FinancialIndicators } from '@/lib/types';

export interface BenchmarkComparison {
  metric: string;
  userValue: number;
  healthyThreshold: number;
  status: 'healthy' | 'warning' | 'critical';
  interpretation: string;
}

// ─── Core Amortization ────────────────────────────────────────────────────────

export function computeDebtPayoffMonths(
  debt: number,
  payment: number,
  annualRate: number
): number | null {
  if (debt <= 0) return 0;
  if (payment <= 0) return null;
  const r = annualRate / 100 / 12;
  if (r === 0) return Math.ceil(debt / payment);
  const monthlyInterest = debt * r;
  if (payment <= monthlyInterest) return null; // payment doesn't cover interest
  return Math.ceil(-Math.log(1 - monthlyInterest / payment) / Math.log(1 + r));
}

export function computeSavingsDepletionMonths(
  savings: number,
  monthlyDeficit: number
): number | null {
  if (monthlyDeficit <= 0) return null; // no deficit
  if (savings <= 0) return 0;
  return Math.floor(savings / monthlyDeficit);
}

export function computePayoffWithExtra(
  debt: number,
  basePayment: number,
  extra: number,
  annualRate: number
): number {
  const months = computeDebtPayoffMonths(debt, basePayment + extra, annualRate);
  return months ?? 0;
}

export function computeInterestSaved(
  debt: number,
  basePayment: number,
  extra: number,
  annualRate: number
): number {
  const baseTotalInterest = computeTotalInterest(debt, basePayment, annualRate);
  const newTotalInterest = computeTotalInterest(debt, basePayment + extra, annualRate);
  if (baseTotalInterest === null || newTotalInterest === null) return 0;
  return Math.max(0, baseTotalInterest - newTotalInterest);
}

function computeTotalInterest(
  debt: number,
  payment: number,
  annualRate: number
): number | null {
  const months = computeDebtPayoffMonths(debt, payment, annualRate);
  if (months === null || months > 600) return null;
  return Math.max(0, payment * months - debt);
}

export function computeMonthsToGoal(
  currentSavings: number,
  monthlySurplus: number,
  targetSavings: number
): number {
  if (monthlySurplus <= 0) return Infinity;
  const gap = targetSavings - currentSavings;
  if (gap <= 0) return 0;
  return Math.ceil(gap / monthlySurplus);
}

export function computeMinPaymentToNotGrow(
  debt: number,
  annualRate: number
): number {
  return debt * (annualRate / 100 / 12);
}

// ─── Benchmarks ───────────────────────────────────────────────────────────────

export function compareToHealthyBenchmarks(
  indicators: FinancialIndicators
): BenchmarkComparison[] {
  const results: BenchmarkComparison[] = [];

  // DTI: healthy < 20%, warning 20–40%, critical > 40%
  const dtiPct = indicators.debtToIncomeRatio * 100;
  results.push({
    metric: 'Debt-to-Income Ratio',
    userValue: dtiPct,
    healthyThreshold: 20,
    status: dtiPct < 20 ? 'healthy' : dtiPct < 40 ? 'warning' : 'critical',
    interpretation:
      dtiPct < 20
        ? 'Your total debt is low relative to your annual income — a healthy position.'
        : dtiPct < 40
        ? 'Your debt load is moderate. There is room to absorb it, but reducing it is advisable.'
        : 'Your debt is high relative to income. This limits your financial flexibility significantly.',
  });

  // Payment burden: healthy < 15%, warning 15–30%, critical > 30%
  const pbPct = indicators.paymentBurden * 100;
  results.push({
    metric: 'Payment Burden',
    userValue: pbPct,
    healthyThreshold: 15,
    status: pbPct < 15 ? 'healthy' : pbPct < 30 ? 'warning' : 'critical',
    interpretation:
      pbPct < 15
        ? 'Your minimum payments consume a small share of your income — manageable.'
        : pbPct < 30
        ? 'Your payments take a notable portion of income. Extra payments would help.'
        : 'Over 30% of your income is going to debt payments. This is a primary stress driver.',
  });

  // Savings runway: healthy > 6 months, warning 3–6, critical < 3
  const runway = indicators.savingsRunway === Infinity ? 999 : indicators.savingsRunway;
  results.push({
    metric: 'Savings Runway',
    userValue: runway,
    healthyThreshold: 6,
    status: runway > 6 ? 'healthy' : runway >= 3 ? 'warning' : 'critical',
    interpretation:
      runway > 6
        ? 'You have more than 6 months of runway — a solid safety buffer.'
        : runway >= 3
        ? 'Your savings would cover 3–6 months. Adequate but thinning.'
        : 'Less than 3 months of runway. A financial shock could be destabilizing.',
  });

  // Interest pressure: healthy < 5%, warning 5–10%, critical > 10%
  const ipPct = indicators.interestPressure * 100;
  results.push({
    metric: 'Interest Pressure',
    userValue: ipPct,
    healthyThreshold: 5,
    status: ipPct < 5 ? 'healthy' : ipPct < 10 ? 'warning' : 'critical',
    interpretation:
      ipPct < 5
        ? 'Interest is a small fraction of your income — not a meaningful drag.'
        : ipPct < 10
        ? 'Interest is consuming a noticeable portion of income. Refinancing or extra payments help.'
        : 'More than 10% of your income is going to interest alone. This is a significant inefficiency.',
  });

  // Cashflow: healthy > 500, warning 0–500, critical < 0
  const cf = indicators.cashflow;
  results.push({
    metric: 'Monthly Cashflow',
    userValue: cf,
    healthyThreshold: 500,
    status: cf > 500 ? 'healthy' : cf >= 0 ? 'warning' : 'critical',
    interpretation:
      cf > 500
        ? 'You have strong monthly surplus. Direct it toward debt or savings.'
        : cf >= 0
        ? 'Barely positive cashflow. One unexpected expense could push you negative.'
        : `You are spending $${Math.abs(cf).toFixed(0)} more than you earn each month. This must be addressed.`,
  });

  return results;
}

// ─── Formatting Helpers ───────────────────────────────────────────────────────

export function fc(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function fm(months: number): string {
  if (!isFinite(months) || months > 600) return 'never at this payment rate';
  if (months < 1) return 'less than a month';
  const y = Math.floor(months / 12);
  const m = months % 12;
  if (y === 0) return `${m} month${m !== 1 ? 's' : ''}`;
  if (m === 0) return `${y} year${y !== 1 ? 's' : ''}`;
  return `${y} year${y !== 1 ? 's' : ''} and ${m} month${m !== 1 ? 's' : ''}`;
}
