import {
  FinancialProfile,
  RiskAnalysis,
  RiskLevel,
  RiskDriver,
  FinancialIndicators,
} from './types';
import { formatCurrency, formatPercent } from './formatters';

export function computeIndicators(profile: FinancialProfile): FinancialIndicators {
  const { income, expenses, savings, totalDebt, interestRate, minimumPayment } = profile;

  const cashflow = income - expenses - minimumPayment;
  const debtToIncomeRatio = income > 0 ? totalDebt / (income * 12) : 999;
  const paymentBurden = income > 0 ? minimumPayment / income : 999;
  const savingsRunway = cashflow < 0 ? savings / Math.abs(cashflow) : Infinity;
  const interestPressure = income > 0 ? (totalDebt * interestRate / 100) / 12 / income : 999;

  return {
    cashflow,
    debtToIncomeRatio,
    paymentBurden,
    savingsRunway,
    interestPressure,
  };
}

export function computeRiskScore(profile: FinancialProfile): RiskAnalysis {
  const indicators = computeIndicators(profile);
  const { cashflow, debtToIncomeRatio, paymentBurden, savingsRunway, interestPressure } = indicators;

  let score = 0;
  const drivers: RiskDriver[] = [];

  // Cashflow scoring
  if (cashflow < 0) {
    score += 30;
    drivers.push({
      name: 'Negative Cash Flow',
      impact: 'high',
      description: `You're spending ${formatCurrency(Math.abs(cashflow))} more per month than you earn after debt payments. This depletes savings every month.`,
      value: formatCurrency(cashflow),
    });
  } else if (cashflow < 200) {
    score += 15;
    drivers.push({
      name: 'Tight Cash Flow',
      impact: 'medium',
      description: `Only ${formatCurrency(cashflow)} remains after expenses and debt payments. Any unexpected expense could push you negative.`,
      value: formatCurrency(cashflow),
    });
  }

  // Debt-to-income scoring
  if (debtToIncomeRatio > 0.4) {
    score += 25;
    drivers.push({
      name: 'High Debt-to-Income Ratio',
      impact: 'high',
      description: `Your total debt is ${formatPercent(debtToIncomeRatio * 100)} of your annual income. This level of debt significantly limits financial flexibility.`,
      value: formatPercent(debtToIncomeRatio * 100),
    });
  } else if (debtToIncomeRatio > 0.2) {
    score += 12;
    drivers.push({
      name: 'Elevated Debt-to-Income Ratio',
      impact: 'medium',
      description: `Your debt represents ${formatPercent(debtToIncomeRatio * 100)} of your annual income. Manageable but worth monitoring.`,
      value: formatPercent(debtToIncomeRatio * 100),
    });
  }

  // Payment burden scoring
  if (paymentBurden > 0.3) {
    score += 20;
    drivers.push({
      name: 'Heavy Payment Burden',
      impact: 'high',
      description: `Debt payments consume ${formatPercent(paymentBurden * 100)} of your monthly income. This leaves little room for other needs.`,
      value: formatPercent(paymentBurden * 100),
    });
  } else if (paymentBurden > 0.15) {
    score += 10;
    drivers.push({
      name: 'Moderate Payment Burden',
      impact: 'medium',
      description: `${formatPercent(paymentBurden * 100)} of your income goes to debt payments. This is a meaningful monthly obligation.`,
      value: formatPercent(paymentBurden * 100),
    });
  }

  // Savings runway scoring
  if (savingsRunway < 3) {
    score += 15;
    drivers.push({
      name: 'Low Savings Runway',
      impact: 'high',
      description: savingsRunway <= 0
        ? 'Your savings provide no buffer against your current spending pattern.'
        : `At your current rate, savings will last only ${savingsRunway.toFixed(1)} months. You need a larger emergency buffer.`,
      value: savingsRunway <= 0 ? '0 months' : `${savingsRunway.toFixed(1)} months`,
    });
  } else if (savingsRunway < 6) {
    score += 8;
    drivers.push({
      name: 'Limited Savings Buffer',
      impact: 'medium',
      description: `Your savings provide a ${savingsRunway.toFixed(1)}-month runway. Financial experts recommend at least 6 months.`,
      value: `${savingsRunway.toFixed(1)} months`,
    });
  }

  // Interest pressure scoring
  if (interestPressure > 0.1) {
    score += 10;
    drivers.push({
      name: 'High Interest Pressure',
      impact: 'medium',
      description: `Monthly interest charges consume ${formatPercent(interestPressure * 100)} of your income. A significant portion of payments goes to interest, not principal.`,
      value: formatPercent(interestPressure * 100),
    });
  }

  score = Math.min(100, Math.max(0, score));

  const level = getLevel(score);
  drivers.sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 };
    return order[a.impact] - order[b.impact];
  });

  const explanation = generateExplanation(score, level, indicators, drivers);
  const recommendation = generateRecommendation(level, indicators, drivers);

  return { score, level, drivers, explanation, recommendation, indicators };
}

function getLevel(score: number): RiskLevel {
  if (score <= 25) return 'low';
  if (score <= 50) return 'medium';
  if (score <= 75) return 'high';
  return 'critical';
}

function generateExplanation(
  score: number,
  level: RiskLevel,
  _indicators: FinancialIndicators,
  drivers: RiskDriver[]
): string {
  const topDrivers = drivers.slice(0, 3).map(d => d.name.toLowerCase());

  switch (level) {
    case 'low':
      return `Your financial risk score is ${score}/100, indicating a low-risk position. Your cash flow is healthy, debt levels are manageable, and you have adequate savings. Continue maintaining these habits.`;
    case 'medium':
      return `Your financial risk score is ${score}/100, placing you in the medium-risk zone. Key concerns include ${topDrivers.join(' and ')}. While not immediately dangerous, these factors deserve attention to prevent escalation.`;
    case 'high':
      return `Your financial risk score is ${score}/100, indicating high risk. ${drivers[0]?.description || ''} This combination of factors creates significant financial vulnerability. Taking action now can prevent further deterioration.`;
    case 'critical':
      return `Your financial risk score is ${score}/100, placing you in critical territory. Multiple serious risk factors are active: ${topDrivers.join(', ')}. Immediate action is strongly recommended to stabilize your financial position.`;
  }
}

function generateRecommendation(
  level: RiskLevel,
  indicators: FinancialIndicators,
  _drivers: RiskDriver[]
): string {
  if (level === 'low') {
    return 'Maintain your current trajectory. Consider increasing savings contributions or making extra debt payments to build an even stronger position.';
  }

  const recs: string[] = [];

  if (indicators.cashflow < 0) {
    recs.push('Reduce monthly expenses or increase income to achieve positive cash flow');
  }
  if (indicators.debtToIncomeRatio > 0.3) {
    recs.push('Focus on aggressive debt reduction — consider the debt avalanche method targeting highest-interest debt first');
  }
  if (indicators.paymentBurden > 0.2) {
    recs.push('Explore refinancing options to lower your monthly payment burden');
  }
  if (indicators.savingsRunway < 6) {
    recs.push('Build an emergency fund covering at least 6 months of essential expenses');
  }
  if (indicators.interestPressure > 0.1) {
    recs.push('Investigate balance transfer or consolidation options to reduce interest costs');
  }

  if (recs.length === 0) {
    recs.push('Review your budget for opportunities to optimize spending and accelerate debt payoff');
  }

  return recs.slice(0, 3).join('. ') + '.';
}
