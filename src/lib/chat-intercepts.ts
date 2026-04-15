import type { DebtGuardContext, InterceptResult } from '@/lib/types';
import { formatCurrency } from '@/lib/formatters';

function noProfile(): InterceptResult {
  return {
    handled: true,
    response:
      "I don't have a financial profile for you yet. Head to the Dashboard and fill in your details — once that's done, I can give you exact answers to questions like this.",
  };
}

function computePayoffMonths(
  debt: number,
  annualRate: number,
  monthlyPayment: number
): number | null {
  if (debt <= 0 || monthlyPayment <= 0) return null;
  const r = annualRate / 100 / 12;
  if (r === 0) {
    return Math.ceil(debt / monthlyPayment);
  }
  const interest = debt * r;
  if (monthlyPayment <= interest) return null; // Payment doesn't cover interest
  return Math.ceil(-Math.log(1 - interest / monthlyPayment) / Math.log(1 + r));
}

function formatMonthsToYears(months: number): string {
  if (months <= 0) return 'right now';
  const years = Math.floor(months / 12);
  const rem = months % 12;
  if (years === 0) return `${months} month${months === 1 ? '' : 's'}`;
  if (rem === 0) return `${years} year${years === 1 ? '' : 's'}`;
  return `${years} year${years === 1 ? '' : 's'} and ${rem} month${rem === 1 ? '' : 's'}`;
}

export function tryIntercept(
  message: string,
  context: DebtGuardContext
): InterceptResult {
  const lower = message.toLowerCase().trim();

  // --- Debt payoff timeline (only catch time-related questions, not general strategy) ---
  if (
    /debt.?free|when.*(will i|can i).*(pay|be free)|how long.*(until|to pay|before)|payoff.*(date|timeline|when)|when.*paid off/.test(lower)
  ) {
    if (!context.profile) return noProfile();
    const { totalDebt, interestRate, minimumPayment, income, expenses } = context.profile;
    if (totalDebt <= 0) {
      return { handled: true, response: "You have no debt recorded in your profile — you're already debt-free." };
    }
    const months = computePayoffMonths(totalDebt, interestRate, minimumPayment);
    const monthsExtra = computePayoffMonths(totalDebt, interestRate, minimumPayment + 200);
    const debtStr = formatCurrency(totalDebt);
    const paymentStr = formatCurrency(minimumPayment);
    const extraStr = formatCurrency(minimumPayment + 200);

    if (months === null) {
      return {
        handled: true,
        response: `Your current minimum payment of ${paymentStr}/month doesn't cover the interest accruing on ${debtStr} at ${interestRate}% APR. At this rate, your debt will grow — not shrink. You need to increase your monthly payment above ${formatCurrency(Math.ceil(totalDebt * interestRate / 100 / 12) + 1)}/month just to make progress.`,
      };
    }

    const cashflow = income - expenses - minimumPayment;
    let extraLine = '';
    if (monthsExtra !== null && monthsExtra < months) {
      const saved = months - monthsExtra;
      extraLine = ` If you added an extra $200/month (paying ${extraStr} total), that drops to approximately ${formatMonthsToYears(monthsExtra)} — saving you ${saved} month${saved === 1 ? '' : 's'}.`;
    }

    const cashflowNote =
      cashflow < 0
        ? ` Note: your current cashflow is ${formatCurrency(cashflow)}/month (negative), which means you may not be able to sustain even the minimum payment without drawing down savings.`
        : '';

    return {
      handled: true,
      response: `Based on your current minimum payment of ${paymentStr}/month on ${debtStr} of debt at ${interestRate}% APR, you would pay off your debt in approximately ${formatMonthsToYears(months)}.${extraLine}${cashflowNote}`,
    };
  }

  // --- Cashflow ---
  if (/cashflow|cash flow|money.*(left|remaining|left over)|how much do i have/.test(lower)) {
    if (!context.profile) return noProfile();
    const { income, expenses, minimumPayment } = context.profile;
    const cashflow = income - expenses - minimumPayment;
    const cashflowStr = formatCurrency(Math.abs(cashflow));
    const sign = cashflow >= 0 ? 'positive' : 'negative';

    let context2 = '';
    if (cashflow < 0) {
      context2 = ` This means you're spending more than you earn each month — your savings will decrease by ${cashflowStr}/month until something changes.`;
    } else if (cashflow < income * 0.1) {
      context2 = ` That's less than 10% of your income, which leaves very little buffer for unexpected expenses.`;
    } else {
      context2 = ` That's ${((cashflow / income) * 100).toFixed(1)}% of your income remaining after all expenses and debt payments.`;
    }

    return {
      handled: true,
      response: `Your monthly cashflow is ${cashflow >= 0 ? '+' : '-'}${cashflowStr} (${sign}). This is calculated as: income (${formatCurrency(income)}) − expenses (${formatCurrency(expenses)}) − minimum payment (${formatCurrency(minimumPayment)}).${context2}`,
    };
  }

  // --- DTI ---
  if (/dti|debt.to.income|debt-to-income/.test(lower)) {
    if (!context.profile) return noProfile();
    const { totalDebt, income } = context.profile;
    const dti = income > 0 ? (totalDebt / (income * 12)) * 100 : 0;
    let assessment = '';
    if (dti < 36) assessment = 'This is in healthy territory (below 36%).';
    else if (dti < 50) assessment = 'This is elevated — lenders typically prefer below 36%.';
    else assessment = 'This is high. Above 50% is considered concerning by most lenders and financial planners.';

    return {
      handled: true,
      response: `Your debt-to-income ratio is ${dti.toFixed(1)}%. This is calculated as total debt (${formatCurrency(totalDebt)}) divided by annual income (${formatCurrency(income * 12)}). ${assessment}`,
    };
  }

  // --- Payment burden ---
  if (/payment burden|payment.*(percent|percentage|ratio)|how much.*(payment|paying)/.test(lower)) {
    if (!context.profile) return noProfile();
    const { minimumPayment, income } = context.profile;
    const burden = income > 0 ? (minimumPayment / income) * 100 : 0;
    let assessment = '';
    if (burden < 15) assessment = 'This is healthy — below the 15% guideline.';
    else if (burden < 30) assessment = "This is moderate. It's manageable but worth monitoring.";
    else assessment = 'This is high. Above 30% of income going to debt payments is considered financially stressful.';

    return {
      handled: true,
      response: `Your payment burden is ${burden.toFixed(1)}% — that's ${formatCurrency(minimumPayment)}/month in minimum debt payments on a ${formatCurrency(income)}/month income. ${assessment}`,
    };
  }

  // --- Savings runway ---
  if (/savings runway|months of savings|how (long|many months).*savings|savings.*last/.test(lower)) {
    if (!context.profile) return noProfile();
    const { savings, income, expenses, minimumPayment } = context.profile;
    const cashflow = income - expenses - minimumPayment;

    if (cashflow >= 0) {
      return {
        handled: true,
        response: `Your savings runway is stable — your cashflow is positive (${formatCurrency(cashflow)}/month surplus), so your savings of ${formatCurrency(savings)} are not being depleted. You're building wealth, not burning through reserves.`,
      };
    }

    const runway = savings / Math.abs(cashflow);
    const runwayStr = runway < 1 ? 'less than 1 month' : `${runway.toFixed(1)} months`;
    const urgency =
      runway < 3
        ? ' This is critical — you have very limited buffer before savings are exhausted.'
        : runway < 6
        ? ' This is below the recommended 6-month emergency fund.'
        : ' This gives you some buffer, but your cashflow is still negative.';

    return {
      handled: true,
      response: `At your current burn rate of ${formatCurrency(Math.abs(cashflow))}/month, your ${formatCurrency(savings)} in savings will last approximately ${runwayStr}.${urgency}`,
    };
  }

  return { handled: false };
}
