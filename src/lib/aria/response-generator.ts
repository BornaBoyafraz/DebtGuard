import type { DebtGuardContext } from '@/lib/types';
import type { Intent } from './intent-classifier';
import {
  computeDebtPayoffMonths,
  computeSavingsDepletionMonths,
  computePayoffWithExtra,
  computeInterestSaved,
  computeMinPaymentToNotGrow,
  compareToHealthyBenchmarks,
  fc,
  fm,
} from './aria-computations';

// ─── Handler map ──────────────────────────────────────────────────────────────

export function generateResponse(
  intent: Intent,
  context: DebtGuardContext,
  message: string
): string {
  switch (intent) {
    case 'explain_risk_score':       return handleExplainRiskScore(context);
    case 'explain_cashflow':         return handleExplainCashflow(context);
    case 'explain_dti':              return handleExplainDTI(context);
    case 'explain_payment_burden':   return handleExplainPaymentBurden(context);
    case 'explain_savings_runway':   return handleExplainSavingsRunway(context);
    case 'explain_interest_pressure':return handleExplainInterestPressure(context);
    case 'debt_payoff_timeline':     return handleDebtPayoffTimeline(context);
    case 'savings_depletion_timeline':return handleSavingsDepletion(context);
    case 'what_if_extra_payment':    return handleWhatIfExtraPayment(context, message);
    case 'what_if_reduce_expenses':  return handleWhatIfReduceExpenses(context, message);
    case 'what_if_income_change':    return handleWhatIfIncomeChange(context, message);
    case 'what_if_refinance':        return handleWhatIfRefinance(context, message);
    case 'what_if_new_loan':         return handleWhatIfNewLoan(context, message);
    case 'compare_scenarios':        return handleCompareScenarios(context);
    case 'interpret_simulation':     return handleInterpretSimulation(context);
    case 'interpret_decision_score': return handleInterpretDecisionScore(context);
    case 'what_to_simulate_next':    return handleWhatToSimulateNext(context);
    case 'most_urgent_issue':        return handleMostUrgentIssue(context);
    case 'am_i_in_trouble':          return handleAmIInTrouble(context);
    case 'how_to_improve_score':     return handleHowToImproveScore(context);
    case 'explain_replicate_system': return handleExplainReplicateSystem();
    case 'greeting':                 return handleGreeting(context);
    case 'financial_stress':         return handleFinancialStress(context);
    case 'no_profile_guidance':      return handleNoProfileGuidance(context);
    case 'general_finance_question': return handleGeneralFinance(context);
    case 'unknown':                  return handleUnknown();
  }
}

// ─── Handlers ─────────────────────────────────────────────────────────────────

function handleExplainRiskScore(ctx: DebtGuardContext): string {
  if (!ctx.riskAnalysis || !ctx.indicators) {
    return 'Run a risk analysis on the Dashboard first and I will explain exactly what your score means.';
  }

  const { score, level, drivers } = ctx.riskAnalysis;
  const { debtToIncomeRatio, paymentBurden, cashflow, savingsRunway } = ctx.indicators;

  const dtiPct = (debtToIncomeRatio * 100).toFixed(1);
  const pbPct = (paymentBurden * 100).toFixed(1);
  const runwayStr = savingsRunway === Infinity ? 'stable (positive cashflow)' : `${savingsRunway.toFixed(1)} months`;
  const topDriver = drivers[0]?.name ?? 'your key metrics';

  const levelDesc: Record<string, string> = {
    low: 'a healthy position — your financial structure is stable',
    medium: 'moderate exposure — there are real vulnerabilities but no immediate crisis',
    high: 'concerning — significant vulnerabilities that need attention',
    critical: 'fragile — your current trajectory carries meaningful risk of financial distress',
  };

  return `Your risk score is **${score}/100** — that puts you in the **${level.toUpperCase()}** range, which means ${levelDesc[level] ?? 'a position worth monitoring'}.

Here is what is driving that score:
- **Debt-to-Income Ratio:** ${dtiPct}% (healthy is below 20%)
- **Payment Burden:** ${pbPct}% of income (healthy is below 15%)
- **Monthly Cashflow:** ${fc(cashflow)}
- **Savings Runway:** ${runwayStr}

The primary driver of your score is **${topDriver}**. ${drivers[0]?.value ? `Current value: ${drivers[0].value}.` : ''}

A score above 75 means the system considers your situation critical. Below 25 is the healthy zone. The score is not a credit score — it measures how much financial stress your current structure is under, not your creditworthiness.`;
}

function handleExplainCashflow(ctx: DebtGuardContext): string {
  if (!ctx.profile || !ctx.indicators) {
    return 'Set up your financial profile on the Dashboard first, and I can break down your cashflow in detail.';
  }

  const { income, expenses, minimumPayment, savings } = ctx.profile;
  const { cashflow } = ctx.indicators;

  if (cashflow < 0) {
    const depletionMonths = computeSavingsDepletionMonths(savings, Math.abs(cashflow));
    const runway = depletionMonths !== null ? `approximately ${depletionMonths} months` : 'an unknown period';
    return `Your monthly cashflow is **${fc(cashflow)}**. This means you are spending ${fc(Math.abs(cashflow))} more than you earn each month after debt payments.

Breakdown: ${fc(income)} income − ${fc(expenses)} expenses − ${fc(minimumPayment)} minimum payment = **${fc(cashflow)}**

At this rate, your savings will last **${runway}** before reaching zero. This is the most urgent issue to address — a negative cashflow compounds over time and quickly erodes your safety buffer. Head to the Simulator and try an expense cut or income scenario to find your break-even point.`;
  }

  if (cashflow <= 200) {
    return `Your monthly cashflow is **${fc(cashflow)}** — barely positive. A single unexpected expense could push you negative.

Breakdown: ${fc(income)} income − ${fc(expenses)} expenses − ${fc(minimumPayment)} minimum payment = **${fc(cashflow)}**

The goal is to reach at least $500/month in positive cashflow as a buffer. Even a $300/month expense reduction would give you meaningful breathing room. Use the Simulator to see exactly what that creates.`;
  }

  return `Your monthly cashflow is **${fc(cashflow)}**. That is a reasonable buffer.

Breakdown: ${fc(income)} income − ${fc(expenses)} expenses − ${fc(minimumPayment)} minimum payment = **${fc(cashflow)}**

The key question is whether that surplus is building savings or sitting idle. Directing even half of it — ${fc(cashflow / 2)}/month — toward your debt would significantly accelerate your payoff timeline. Use the Simulator with an extra payment scenario to see the exact impact.`;
}

function handleExplainDTI(ctx: DebtGuardContext): string {
  if (!ctx.profile || !ctx.indicators) {
    return 'Set up your financial profile on the Dashboard and I can explain your debt-to-income ratio.';
  }

  const { income, totalDebt } = ctx.profile;
  const { debtToIncomeRatio } = ctx.indicators;
  const dtiPct = (debtToIncomeRatio * 100).toFixed(1);
  const annualIncome = income * 12;

  const status =
    debtToIncomeRatio < 0.2 ? 'healthy' : debtToIncomeRatio < 0.4 ? 'elevated' : 'high';

  return `Your **debt-to-income ratio (DTI) is ${dtiPct}%** — ${status} by standard benchmarks.

How it is calculated: ${fc(totalDebt)} total debt ÷ ${fc(annualIncome)} annual income = **${dtiPct}%**

The benchmark is simple:
- Below 20%: healthy — debt is well within control
- 20–40%: elevated — manageable but worth reducing
- Above 40%: high — this is a meaningful financial constraint

DTI matters because lenders use it to assess borrowing risk, and it directly affects your ability to handle income disruptions. Bringing it below 20% is a meaningful milestone.`;
}

function handleExplainPaymentBurden(ctx: DebtGuardContext): string {
  if (!ctx.profile || !ctx.indicators) {
    return 'Fill in your financial profile on the Dashboard and I will explain your payment burden.';
  }

  const { income, minimumPayment } = ctx.profile;
  const { paymentBurden } = ctx.indicators;
  const pbPct = (paymentBurden * 100).toFixed(1);

  const status =
    paymentBurden < 0.15 ? 'healthy' : paymentBurden < 0.3 ? 'elevated' : 'high';

  return `Your **payment burden is ${pbPct}%** — ${status}.

How it is calculated: ${fc(minimumPayment)} monthly minimum ÷ ${fc(income)} monthly income = **${pbPct}%**

This is the share of your income locked into debt servicing. Below 15% means you have meaningful flexibility. Above 30% means debt payments are consuming a large portion of every dollar you earn.

${paymentBurden > 0.3
  ? `At ${pbPct}%, more than a quarter of your income goes to minimum payments before you can spend on anything else. Reducing this — through extra payments, refinancing, or debt elimination — is a priority.`
  : `Your payment burden is within a manageable range. The goal is to keep it below 15% as you pay down debt.`}`;
}

function handleExplainSavingsRunway(ctx: DebtGuardContext): string {
  if (!ctx.profile || !ctx.indicators) {
    return 'Set up your financial profile on the Dashboard and I will calculate your savings runway.';
  }

  const { savings } = ctx.profile;
  const { cashflow, savingsRunway } = ctx.indicators;

  if (cashflow >= 0) {
    return `Your savings runway is **stable** — because your cashflow is positive (${fc(cashflow)}/month), you are not depleting savings. In fact, you are building them.

Your current savings balance is ${fc(savings)}. To strengthen your runway, the benchmark is 6 months of total expenses as an emergency reserve.`;
  }

  const runway = savingsRunway === Infinity ? null : savingsRunway;
  if (runway === null) {
    return 'Unable to calculate runway with the current data. Make sure your profile is complete.';
  }

  const status = runway > 6 ? 'solid' : runway >= 3 ? 'adequate but thinning' : 'critically short';

  return `Your savings runway is **${runway.toFixed(1)} months** — ${status}.

How it is calculated: ${fc(savings)} savings ÷ ${fc(Math.abs(cashflow))} monthly deficit = **${runway.toFixed(1)} months**

${runway < 3
  ? `With less than 3 months of runway, a single unexpected expense or income disruption could be destabilizing. Stopping the negative cashflow is the first priority.`
  : runway < 6
  ? `3–6 months provides some cushion, but it is thinning. Each month of negative cashflow brings you closer to zero. The goal is to stop the bleed first.`
  : `More than 6 months is the healthy target. You have a reasonable buffer, though the negative cashflow will eventually erode it.`}`;
}

function handleExplainInterestPressure(ctx: DebtGuardContext): string {
  if (!ctx.profile || !ctx.indicators) {
    return 'Fill in your financial profile and I will explain the cost of your interest.';
  }

  const { totalDebt, interestRate, income } = ctx.profile;
  const { interestPressure } = ctx.indicators;
  const monthlyInterest = totalDebt * (interestRate / 100 / 12);
  const ipPct = (interestPressure * 100).toFixed(1);

  return `Your **interest pressure is ${ipPct}%** of monthly income.

You are paying approximately **${fc(monthlyInterest)}/month in interest** on ${fc(totalDebt)} of debt at ${interestRate}% APR. That is ${fc(monthlyInterest * 12)}/year going purely to interest — not reducing your balance.

Benchmark:
- Below 5%: low pressure
- 5–10%: moderate — refinancing or extra payments would meaningfully help
- Above 10%: high — interest is a significant drag on your finances

${interestPressure > 0.1
  ? `At ${ipPct}%, over a tenth of your income is going to interest charges alone. The Simulator's refinance scenario would show you exactly how much a rate reduction would save.`
  : `Your interest burden is not the primary issue right now, but it is still worth watching as it compounds over time.`}`;
}

function handleDebtPayoffTimeline(ctx: DebtGuardContext): string {
  if (!ctx.profile) {
    return 'Set up your financial profile on the Dashboard and I will calculate your exact debt payoff timeline.';
  }

  const { totalDebt, interestRate, minimumPayment } = ctx.profile;

  if (totalDebt <= 0) {
    return 'Your profile shows no debt. That is an excellent position to be in.';
  }

  const monthlyInterest = computeMinPaymentToNotGrow(totalDebt, interestRate);

  if (minimumPayment <= monthlyInterest && interestRate > 0) {
    return `At your current minimum payment of **${fc(minimumPayment)}/month**, you are not making progress on your debt.

Your monthly interest alone is **${fc(monthlyInterest)}**, which exceeds your payment. Your balance is growing, not shrinking. You need to pay at least **${fc(Math.ceil(monthlyInterest) + 1)}/month** just to stop the balance from increasing.

Use the Simulator with an extra payment scenario to find the minimum that actually makes a dent.`;
  }

  const months = computeDebtPayoffMonths(totalDebt, minimumPayment, interestRate);

  if (months === null) {
    return `At your current payment of ${fc(minimumPayment)}, the balance would never be fully paid off given the interest rate. You need to increase your payment above ${fc(monthlyInterest + 1)}/month.`;
  }

  const totalPaid = minimumPayment * months;
  const totalInterest = Math.max(0, totalPaid - totalDebt);

  // Extra payment scenarios
  const extra200Months = computeDebtPayoffMonths(totalDebt, minimumPayment + 200, interestRate) ?? months;
  const interestSaved200 = computeInterestSaved(totalDebt, minimumPayment, 200, interestRate);

  return `At your current minimum payment of **${fc(minimumPayment)}/month** on **${fc(totalDebt)} debt** at **${interestRate}% APR**, you will pay off your debt in approximately **${fm(months)}**.

You will pay a total of **${fc(totalInterest)} in interest** over that period.

If you added an extra **$200/month**, that drops to approximately **${fm(extra200Months)}** — saving you **${fc(interestSaved200)} in interest**.

Use the Simulator to run the exact scenario with your preferred extra payment amount.`;
}

function handleSavingsDepletion(ctx: DebtGuardContext): string {
  if (!ctx.profile || !ctx.indicators) {
    return 'Fill in your profile on the Dashboard and I will calculate when your savings would run out.';
  }

  const { savings } = ctx.profile;
  const { cashflow } = ctx.indicators;

  if (cashflow >= 0) {
    return `Your cashflow is positive (${fc(cashflow)}/month), so your savings are not depleting — they are growing. The savings depletion question is not relevant in your current situation.`;
  }

  const depletionMonths = computeSavingsDepletionMonths(savings, Math.abs(cashflow));

  if (depletionMonths === null || depletionMonths <= 0) {
    return `Your savings are already at or near zero, and your cashflow is negative (${fc(cashflow)}/month). This is an urgent situation — every month you delay costs you.`;
  }

  return `At your current deficit of **${fc(Math.abs(cashflow))}/month**, your savings of **${fc(savings)}** will last approximately **${depletionMonths} months** (${fm(depletionMonths)}).

After that point, you would have no financial buffer and would need to cover expenses through new debt or credit.

Use the Simulator to find what change — expense cut, income increase, or extra income — would stop the depletion before it reaches zero.`;
}

function handleWhatIfExtraPayment(ctx: DebtGuardContext, message: string): string {
  if (!ctx.profile) {
    return 'Set up your financial profile on the Dashboard first so I can run these calculations with your actual numbers.';
  }

  const { totalDebt, minimumPayment, interestRate } = ctx.profile;

  if (totalDebt <= 0) {
    return 'Your profile shows no debt, so extra payment scenarios are not applicable.';
  }

  // Try to extract a dollar amount from the message
  const match = message.match(/\$?\s*(\d[\d,]*)/);
  const extracted = match ? parseFloat(match[1].replace(/,/g, '')) : null;

  if (extracted !== null && extracted > 0 && extracted < 10000) {
    const newMonths = computePayoffWithExtra(totalDebt, minimumPayment, extracted, interestRate);
    const baseMonths = computeDebtPayoffMonths(totalDebt, minimumPayment, interestRate) ?? 0;
    const saved = computeInterestSaved(totalDebt, minimumPayment, extracted, interestRate);
    const monthsSaved = baseMonths - newMonths;

    return `If you added **${fc(extracted)}/month** to your current payment:

- **Payoff time:** ${fm(newMonths)} (${fm(baseMonths)} without the extra payment)
- **Time saved:** ${fm(monthsSaved)}
- **Interest saved:** ${fc(saved)}

That is a total payment of **${fc((minimumPayment + extracted) * newMonths)}** versus **${fc(minimumPayment * baseMonths)}** at the minimum.

To lock this in, go to the Simulator and set Extra Payment to ${fc(extracted)}/month.`;
  }

  // No specific amount found — show comparison table
  const rows = [100, 200, 300, 500].map((extra) => {
    const newM = computePayoffWithExtra(totalDebt, minimumPayment, extra, interestRate);
    const baseM = computeDebtPayoffMonths(totalDebt, minimumPayment, interestRate) ?? 0;
    const saved = computeInterestSaved(totalDebt, minimumPayment, extra, interestRate);
    return `- **+${fc(extra)}/month:** pay off in ${fm(newM)} (saves ${fm(baseM - newM)} and ${fc(saved)} in interest)`;
  });

  return `Here is what different extra payment amounts would do on your **${fc(totalDebt)} balance** at **${interestRate}% APR**:

${rows.join('\n')}

Even $100/month makes a meaningful difference at higher interest rates. Tell me a specific amount to analyze, or head to the Simulator to run the full projection.`;
}

function handleWhatIfReduceExpenses(ctx: DebtGuardContext, message: string): string {
  if (!ctx.profile || !ctx.indicators) {
    return 'Set up your financial profile first and I can model the impact of expense reductions.';
  }

  const { income, expenses, minimumPayment, savings, totalDebt, interestRate } = ctx.profile;
  const { cashflow } = ctx.indicators;

  const match = message.match(/\$?\s*(\d[\d,]*)/);
  const cut = match ? parseFloat(match[1].replace(/,/g, '')) : 300;

  const newExpenses = expenses - cut;
  const newCashflow = income - newExpenses - minimumPayment;
  const cfChange = newCashflow - cashflow;

  let depletionNote = '';
  if (cashflow < 0 && newCashflow >= 0) {
    depletionNote = ' This change would **stop your savings depletion entirely** — a critical inflection point.';
  } else if (cashflow < 0 && newCashflow < 0) {
    const oldDepletion = computeSavingsDepletionMonths(savings, Math.abs(cashflow));
    const newDepletion = computeSavingsDepletionMonths(savings, Math.abs(newCashflow));
    if (oldDepletion !== null && newDepletion !== null) {
      depletionNote = ` Your savings runway would extend from ${oldDepletion} to ${newDepletion} months.`;
    }
  }

  return `If you reduced expenses by **${fc(cut)}/month**:

- **New monthly cashflow:** ${fc(newCashflow)} (currently ${fc(cashflow)}, a change of +${fc(cfChange)})
- **New monthly expenses:** ${fc(newExpenses)}${depletionNote}

${newCashflow > 0 && totalDebt > 0
  ? `With a positive cashflow of ${fc(newCashflow)}, you could direct that surplus toward debt — paying off ${fc(totalDebt)} ${fm(computeDebtPayoffMonths(totalDebt, minimumPayment + Math.max(0, newCashflow), interestRate) ?? 0)} total.`
  : ''}

Use the Simulator's expense change input to run the full month-by-month projection.`;
}

function handleWhatIfIncomeChange(ctx: DebtGuardContext, message: string): string {
  if (!ctx.profile || !ctx.indicators) {
    return 'Set up your financial profile first and I can model income change scenarios.';
  }

  const { income, expenses, minimumPayment } = ctx.profile;
  const { cashflow } = ctx.indicators;

  const match = message.match(/\$?\s*(\d[\d,]*)/);
  const change = match ? parseFloat(match[1].replace(/,/g, '')) : 500;

  const isIncrease = !/drop|loss|lose|lower|cut|reduc/.test(message.toLowerCase());
  const delta = isIncrease ? change : -change;
  const newIncome = income + delta;
  const newCashflow = newIncome - expenses - minimumPayment;

  return `If your income ${isIncrease ? 'increased' : 'decreased'} by **${fc(Math.abs(delta))}/month**:

- **New monthly income:** ${fc(newIncome)}
- **New monthly cashflow:** ${fc(newCashflow)} (currently ${fc(cashflow)})
- **Change:** ${delta > 0 ? '+' : ''}${fc(delta)}/month

${!isIncrease && newCashflow < 0 && cashflow >= 0
  ? `⚠️ This income drop would push your cashflow **negative**. Your savings would start depleting immediately.`
  : isIncrease && newCashflow > 0 && cashflow < 0
  ? `This income increase would bring your cashflow to positive territory — a significant improvement.`
  : ''}

Use the Simulator's income change input to project the full impact over 12, 24, or 36 months.`;
}

function handleWhatIfRefinance(ctx: DebtGuardContext, message: string): string {
  if (!ctx.profile) {
    return 'Set up your financial profile first and I can model a refinance scenario.';
  }

  const { totalDebt, interestRate, minimumPayment } = ctx.profile;

  if (totalDebt <= 0) {
    return 'Your profile shows no debt, so refinancing is not applicable.';
  }

  const match = message.match(/(\d+(?:\.\d+)?)\s*%/);
  const newRate = match ? parseFloat(match[1]) : interestRate * 0.7; // Default: 30% rate reduction

  const oldMonths = computeDebtPayoffMonths(totalDebt, minimumPayment, interestRate) ?? 0;
  const newMonths = computeDebtPayoffMonths(totalDebt, minimumPayment, newRate) ?? 0;

  const oldInterest = Math.max(0, minimumPayment * oldMonths - totalDebt);
  const newInterestTotal = Math.max(0, minimumPayment * newMonths - totalDebt);
  const interestSaved = oldInterest - newInterestTotal;

  const oldMonthlyInterest = totalDebt * (interestRate / 100 / 12);
  const newMonthlyInterest = totalDebt * (newRate / 100 / 12);
  const monthlySaving = oldMonthlyInterest - newMonthlyInterest;

  return `If you refinanced from **${interestRate}% APR** to **${newRate.toFixed(1)}% APR**:

- **Monthly interest:** ${fc(newMonthlyInterest)} (down from ${fc(oldMonthlyInterest)}) — saving **${fc(monthlySaving)}/month**
- **Payoff time:** ${fm(newMonths)} (currently ${fm(oldMonths)})
- **Total interest savings:** ${fc(interestSaved)}

${monthlySaving > 0
  ? `The monthly interest saving of ${fc(monthlySaving)} would either reduce your payment burden or accelerate payoff if you keep the same payment amount.`
  : 'At that rate, the benefit would be minimal — the current rate may already be near the lower bound.'}

Use the Simulator's refinance input to run the exact projection. Also factor in any closing costs when evaluating whether refinancing makes sense.`;
}

function handleWhatIfNewLoan(ctx: DebtGuardContext, message: string): string {
  if (!ctx.profile || !ctx.indicators) {
    return 'Set up your financial profile first so I can model the impact of a new loan.';
  }

  const { totalDebt, income, minimumPayment } = ctx.profile;
  const { cashflow } = ctx.indicators;

  const amountMatch = message.match(/\$?\s*(\d[\d,]*)/);
  const loanAmount = amountMatch ? parseFloat(amountMatch[1].replace(/,/g, '')) : 5000;
  const rateMatch = message.match(/(\d+(?:\.\d+)?)\s*%/);
  const loanRate = rateMatch ? parseFloat(rateMatch[1]) : 12;

  const newMinPayment = loanAmount * 0.02; // Estimate: 2% of balance
  const newCashflow = cashflow - newMinPayment;
  const newTotalDebt = totalDebt + loanAmount;
  const newDTI = (newTotalDebt / (income * 12)) * 100;

  return `If you took on a new loan of **${fc(loanAmount)}** at approximately **${loanRate}%**:

- **New total debt:** ${fc(newTotalDebt)} (up from ${fc(totalDebt)})
- **Estimated new minimum payment:** +${fc(newMinPayment)}/month
- **New monthly cashflow:** ${fc(newCashflow)} (down from ${fc(cashflow)})
- **New debt-to-income ratio:** ${newDTI.toFixed(1)}%

${newCashflow < 0 && cashflow >= 0
  ? `⚠️ This loan would push your monthly cashflow **negative**, meaning you would start depleting savings immediately.`
  : newCashflow < 0
  ? `⚠️ Your cashflow is already negative. Adding this loan would accelerate the depletion of your savings.`
  : `Your cashflow would remain positive, though reduced. Use the Simulator to see the full 24-month projection.`}

Use the Simulator's new loan inputs to model the exact impact before committing.`;
}

function handleCompareScenarios(ctx: DebtGuardContext): string {
  if (!ctx.currentSimulation) {
    return `To compare scenarios, you need to run at least one simulation first. Go to the Simulator, configure a scenario, and run it. Then run a second scenario — the Simulator supports up to 3 stacked scenarios simultaneously.

Once you have run multiple scenarios, I can help you interpret the comparison.`;
  }

  const { label, decisionScore, verdict, finalDebtDelta, finalSavingsDelta } = ctx.currentSimulation;

  return `Your current simulation — **"${label}"** — scored **${decisionScore}/100** with a verdict of **${verdict.replace(/_/g, ' ')}**.

Key outcomes:
- Debt change: ${finalDebtDelta > 0 ? '+' : ''}${fc(finalDebtDelta)} vs baseline
- Savings change: ${finalSavingsDelta > 0 ? '+' : ''}${fc(finalSavingsDelta)} vs baseline

To compare this against another approach, go to the Simulator and add a stacked scenario using the "+" button. You can run up to 3 scenarios side by side. I can then help you interpret which one produces the better outcome and why.`;
}

function handleInterpretSimulation(ctx: DebtGuardContext): string {
  if (!ctx.currentSimulation) {
    return 'Run a simulation in the Simulator first and I will explain what the results mean for your financial situation.';
  }

  const { label, decisionScore, verdict, finalDebtDelta, finalSavingsDelta, narrative } = ctx.currentSimulation;
  const isPositive = verdict === 'better' || verdict === 'significantly_better';

  return `Your simulation **"${label}"** produced these results:

**Decision Score: ${decisionScore}/100** — ${decisionScore >= 65 ? 'a meaningful improvement' : decisionScore >= 50 ? 'a modest improvement' : decisionScore >= 35 ? 'roughly neutral' : 'a deterioration from baseline'}

- Debt: ${finalDebtDelta > 0 ? 'increased' : 'decreased'} by ${fc(Math.abs(finalDebtDelta))} vs the baseline path
- Savings: ${finalSavingsDelta > 0 ? 'improved' : 'declined'} by ${fc(Math.abs(finalSavingsDelta))} vs the baseline path
- Verdict: **${verdict.replace(/_/g, ' ')}**

${narrative ? `Summary: ${narrative.slice(0, 300)}...` : ''}

${isPositive ? 'This scenario shows a genuine improvement over doing nothing. The question is whether you can realistically sustain the change.' : 'This scenario does not improve your baseline trajectory. Consider adjusting the parameters or trying a different approach.'}`;
}

function handleInterpretDecisionScore(ctx: DebtGuardContext): string {
  if (!ctx.currentSimulation) {
    return 'Run a simulation first and I will explain your Decision Score in detail.';
  }

  const { decisionScore, verdict, finalDebtDelta, finalSavingsDelta } = ctx.currentSimulation;

  let interpretation = '';
  if (decisionScore >= 75) interpretation = 'strongly positive — this scenario significantly improves your financial trajectory';
  else if (decisionScore >= 60) interpretation = 'positive — a meaningful improvement over your baseline path';
  else if (decisionScore >= 45) interpretation = 'modestly positive — slight improvement but not transformative';
  else if (decisionScore >= 35) interpretation = 'roughly neutral — minimal impact either way';
  else interpretation = 'negative — this scenario makes your situation worse than the baseline';

  const debtWeight = Math.round((Math.abs(finalDebtDelta) / (Math.abs(finalDebtDelta) + Math.abs(finalSavingsDelta) + 1)) * 35);
  const savingsWeight = Math.round((Math.abs(finalSavingsDelta) / (Math.abs(finalDebtDelta) + Math.abs(finalSavingsDelta) + 1)) * 30);

  return `Your **Decision Score of ${decisionScore}/100** means: ${interpretation}.

The score is a composite metric:
- **35% weight** — debt improvement (your scenario ${finalDebtDelta < 0 ? 'reduced' : 'increased'} debt by ${fc(Math.abs(finalDebtDelta))})
- **30% weight** — savings improvement (savings ${finalSavingsDelta > 0 ? 'improved' : 'declined'} by ${fc(Math.abs(finalSavingsDelta))})
- **25% weight** — risk score reduction
- **10% weight** — payoff acceleration

**50 is neutral.** Above 50 means improvement; below 50 means the scenario makes things worse. A score of ${decisionScore} puts you ${decisionScore > 50 ? `${decisionScore - 50} points above neutral` : `${50 - decisionScore} points below neutral`}.

${verdict === 'significantly_better' ? 'This is a strong result — consider implementing this change.' : verdict === 'better' ? 'This is a positive result. Refine the parameters in the Simulator to see if you can push the score higher.' : verdict === 'neutral' ? 'The impact is marginal. Try a more aggressive scenario to find a meaningful lever.' : 'Consider a different approach — this scenario is counterproductive.'}`;
}

function handleWhatToSimulateNext(ctx: DebtGuardContext): string {
  if (!ctx.riskAnalysis || !ctx.indicators || !ctx.profile) {
    return 'Set up your financial profile and run a risk analysis first. Then I can recommend exactly which scenario to run.';
  }

  const { drivers } = ctx.riskAnalysis;
  const { cashflow, paymentBurden, savingsRunway } = ctx.indicators;
  const { totalDebt, minimumPayment, interestRate } = ctx.profile;

  const topDriver = drivers[0]?.name ?? '';

  if (cashflow < 0) {
    return `Given your negative cashflow of **${fc(cashflow)}/month**, the highest-value simulation to run right now is an **expense reduction scenario**.

In the Simulator, set **Expense Change to -$300/month** and run it for **24 months**. The result will show you exactly when your cashflow turns positive, how much longer your savings last, and what your risk score looks like at month 12 and 24.

This is the most informative simulation you can run right now because stopping the cashflow bleed is the prerequisite for everything else.`;
  }

  if (paymentBurden > 0.3) {
    const extra = Math.round(minimumPayment * 0.5);
    return `Given your high payment burden (${(paymentBurden * 100).toFixed(1)}% of income), the highest-value simulation is an **extra payment scenario**.

In the Simulator, set **Extra Payment to ${fc(extra)}/month** and run it for **36 months**. You will see how much faster your debt clears and how dramatically that reduces your payment burden over time.

As debt drops, your minimum payment typically drops too — which frees up even more cash. The snowball effect is worth seeing visually.`;
  }

  if (savingsRunway < 6) {
    return `Your savings runway is ${savingsRunway.toFixed(1)} months — below the 6-month healthy target. The most valuable simulation is an **expense cut + extra saving** scenario.

In the Simulator, set **Expense Change to -$200/month** and run it for **24 months**. Watch how your savings runway grows month by month and when it crosses the 6-month threshold.`;
  }

  if (interestRate > 10) {
    return `Your interest rate of ${interestRate}% is meaningfully high. The highest-value simulation is a **refinance scenario**.

In the Simulator, set **Refinance Rate to ${(interestRate * 0.7).toFixed(1)}%** (a 30% rate reduction) and run it for **36 months**. The total interest savings will show you exactly what a rate reduction is worth in dollar terms.`;
  }

  return `Based on your current profile, run an **extra payment scenario** to see how aggressively you can accelerate debt payoff.

In the Simulator, try **Extra Payment of ${fc(Math.round(minimumPayment * 0.5))}/month** for **36 months**. This will show the full payoff timeline, total interest savings, and risk score trajectory side by side with your baseline.`;
}

function handleMostUrgentIssue(ctx: DebtGuardContext): string {
  if (!ctx.riskAnalysis || !ctx.indicators || !ctx.profile) {
    return 'Set up your financial profile and run a risk analysis on the Dashboard. Then I can tell you exactly what to prioritize.';
  }

  const { cashflow, savingsRunway, paymentBurden } = ctx.indicators;
  const { drivers } = ctx.riskAnalysis;

  // Priority order: negative cashflow > critical runway < 3 > high payment burden > DTI
  if (cashflow < 0) {
    const depMonths = computeSavingsDepletionMonths(ctx.profile.savings, Math.abs(cashflow));
    return `The most urgent issue is your **negative cashflow of ${fc(cashflow)}/month**.

Every month you run a deficit, your savings shrinks by ${fc(Math.abs(cashflow))}. At this rate, you have approximately **${depMonths ?? 'unknown'} months** before your savings reach zero.

**First concrete step:** Go to the Simulator and run an expense cut of $300/month for 24 months. This will show you the exact point where cashflow turns positive and when your savings stop depleting. That is the breakeven point you need to target.`;
  }

  if (savingsRunway !== Infinity && savingsRunway < 3) {
    return `The most urgent issue is your **savings runway of ${savingsRunway.toFixed(1)} months** — critically low.

You have less than 3 months of buffer. A job disruption, car repair, or medical expense could wipe it out entirely.

**First concrete step:** Identify $200–$400/month in expenses you can suspend temporarily (subscriptions, dining, discretionary). Run that in the Simulator to see how quickly your runway extends beyond 3 months. Getting to 3 months of buffer is the immediate goal.`;
  }

  if (paymentBurden > 0.3) {
    return `The most urgent issue is your **payment burden of ${(paymentBurden * 100).toFixed(1)}%** — over 30% of your income is going to debt minimum payments.

This severely limits your financial flexibility and makes any income disruption dangerous.

**First concrete step:** Go to the Simulator and run a refinance scenario at ${(ctx.profile.interestRate * 0.75).toFixed(1)}% (a 25% rate reduction). See how much that reduces your minimum payment and restores your cashflow flexibility.`;
  }

  const topDriver = drivers[0];
  return `Your highest-priority issue is **${topDriver?.name ?? 'your risk score drivers'}**. ${topDriver?.value ? `Current value: ${topDriver.value}.` : ''}

**First concrete step:** Go to the Simulator and run the scenario that directly addresses this — ${topDriver?.name?.toLowerCase().includes('debt') ? 'an extra payment scenario' : topDriver?.name?.toLowerCase().includes('savings') ? 'an expense cut scenario' : 'a scenario that targets your top driver'}.`;
}

function handleAmIInTrouble(ctx: DebtGuardContext): string {
  if (!ctx.riskAnalysis) {
    return 'Run a risk analysis on the Dashboard first and I will give you an honest answer about your financial position.';
  }

  const { score, level, drivers } = ctx.riskAnalysis;
  const topDriver = drivers[0]?.name ?? 'your key metrics';

  if (level === 'critical') {
    return `Yes — your current financial position is fragile. Your risk score of **${score}/100** puts you in the critical range.

**${topDriver}** is the primary reason. This does not mean a crisis is inevitable, but it does mean the current trajectory needs to change. Left unaddressed for 6–12 months, the compounding effect of your risk drivers will make recovery significantly harder.

The most important thing right now is not to ignore it. Use the Simulator to find one meaningful change — even a $200/month expense cut or extra payment — and see what it does to your 24-month trajectory.`;
  }

  if (level === 'high') {
    return `Your situation is concerning but not yet critical. Risk score **${score}/100** means there are real vulnerabilities — specifically **${topDriver}**.

Left unaddressed for 12+ months, this could become a serious problem. The good news is that you have time to course-correct, but that window is not unlimited.

The highest-leverage action: go to the Simulator and run the scenario that targets your top driver. Even a 10-point risk score reduction would meaningfully improve your resilience.`;
  }

  if (level === 'medium') {
    return `You are not in immediate trouble, but you have meaningful exposure. Risk score **${score}/100**, driven mainly by **${topDriver}**, means certain financial shocks could destabilize your position.

Think of medium risk as "fine for now, but vulnerable." A job disruption or unexpected expense at this level is manageable — but just barely for some drivers.

Use the Simulator to stress-test one scenario: what happens if your income drops 20%? That answer will tell you more about your real risk than the score alone.`;
  }

  return `No, you are not in trouble. Risk score **${score}/100** is in the healthy range.

Your main job right now is to stay here and use the Simulator to stress-test your resilience. Try a scenario where income drops or a large unexpected expense hits — confirm that your position remains stable under those conditions.`;
}

function handleHowToImproveScore(ctx: DebtGuardContext): string {
  if (!ctx.riskAnalysis || !ctx.indicators || !ctx.profile) {
    return 'Set up your profile and run a risk analysis first. Then I can give you specific actions with estimated point reductions.';
  }

  const { score, drivers } = ctx.riskAnalysis;
  const { paymentBurden, cashflow } = ctx.indicators;
  const { minimumPayment, income } = ctx.profile;

  const topTwo = drivers.slice(0, 2);
  const actions: string[] = [];

  if (cashflow < 0) {
    actions.push(`**Stop negative cashflow first.** Cutting ${fc(Math.abs(cashflow))} in monthly expenses would bring cashflow to zero — the prerequisite for everything else. Estimated score reduction: 10–20 points.`);
  }

  if (paymentBurden > 0.15) {
    const targetBurden = income * 0.15;
    const excess = minimumPayment - targetBurden;
    actions.push(`**Reduce payment burden.** Paying down ${fc(excess * 12)} in debt over the next year would bring your payment burden from ${(paymentBurden * 100).toFixed(1)}% to near the 15% threshold. Estimated score reduction: 8–15 points.`);
  }

  if (topTwo.length > 0 && actions.length < 2) {
    actions.push(`**Address ${topTwo[topTwo.length - 1]?.name}:** ${topTwo[topTwo.length - 1]?.value ? `Current value: ${topTwo[topTwo.length - 1]?.value}.` : 'This is a meaningful risk driver.'} Estimated score reduction: 5–12 points.`);
  }

  return `Your score is currently **${score}/100**. Here is what would move it most:

${actions.join('\n\n')}

The fastest path to a lower risk score is to go to the Simulator and try the scenario I just described. The results will show your projected risk score month by month — you will see the improvement visually.`;
}

function handleExplainReplicateSystem(): string {
  return `DebtGuard is built in three stages:

**Replicate 1 — Detection (active now):** Takes your financial snapshot and computes a risk score by analyzing your cashflow, debt-to-income ratio, payment burden, savings runway, and interest pressure. Every number is derived from your actual data. The score reflects how much financial stress your current structure is under.

**Replicate 2 — Simulation (active now):** Projects your financial future month by month and compares two paths side by side — your baseline (doing nothing) versus a scenario you define. The Decision Score (0–100) measures how much better or worse the scenario is versus the baseline. 50 is neutral; above 50 is improvement.

**Replicate 3 — Optimization (future):** Instead of you asking "what if X?", the system will search the space of possible decisions, simulate outcomes, and recommend the optimal strategy automatically. This is the next major development phase.`;
}

function handleGreeting(ctx: DebtGuardContext): string {
  const name = ctx.userName;

  if (!ctx.profile) {
    return `Hi ${name}. I am The Chef — I help you understand your financial situation and think through decisions before you make them. To get started, I need your financial profile. Head to the Dashboard and fill in your details — it takes about 2 minutes. Once you do that, I can give you a real analysis of where you stand.`;
  }

  if (!ctx.riskAnalysis) {
    return `Hi ${name}. Your profile is set up. Run a risk analysis on the Dashboard and I will be able to give you a complete picture of your financial position and what to watch.`;
  }

  const { score, level, drivers } = ctx.riskAnalysis;
  const topDriver = drivers[0]?.name ?? 'your key metrics';

  if (level === 'low') {
    return `Hi ${name}. Your finances are in healthy territory — risk score ${score}/100. The most valuable thing you can do from here is stress-test your position. Try a scenario in the Simulator: what happens if income drops 15%? Do you want to start there?`;
  }

  if (level === 'medium') {
    return `Hi ${name}. Your risk score is ${score}/100 — Medium. The primary driver is ${topDriver}. I can walk you through what that means and what would move the needle most. Where do you want to start?`;
  }

  return `Hi ${name}. Your risk score is ${score}/100 — that is ${level}. Your primary issue is ${topDriver}. I want to be direct: this is worth understanding before it compounds. Want me to break down what is driving it?`;
}

function handleFinancialStress(ctx: DebtGuardContext): string {
  const { cashflow } = ctx.indicators ?? {};

  const action =
    cashflow !== undefined && cashflow < 0
      ? `The single most useful thing right now is to go to the Simulator and run the "Expense Cut $300/month" preset. It will show you exactly how much breathing room that creates and how long until your cashflow turns positive.`
      : ctx.riskAnalysis
      ? `The single most useful thing right now is to look at your top risk driver — **${ctx.riskAnalysis.drivers[0]?.name ?? 'your key metric'}** — and run one focused scenario in the Simulator to address it. One specific change, not everything at once.`
      : `The single most useful thing right now is to complete your financial profile on the Dashboard. Once I have your numbers, I can tell you exactly what is most urgent and what to do first.`;

  return `That sounds genuinely stressful, and it makes sense that you feel that way.

${action}

We can go as fast or as slow as you need. What feels most pressing right now?`;
}

function handleNoProfileGuidance(ctx: DebtGuardContext): string {
  if (ctx.profile && ctx.riskAnalysis) {
    return `You are already set up. Your profile is complete and your risk analysis is done — risk score ${ctx.riskAnalysis.score}/100 (${ctx.riskAnalysis.level}). Head to the Simulator to start exploring what-if scenarios, or ask me anything about your current financial position.`;
  }

  if (ctx.profile) {
    return `Your financial profile is set up. The next step is to run a risk analysis — go to the Dashboard and click "Analyze Risk." That will give me everything I need to give you a complete picture of your financial position.`;
  }

  return `Here is how to get started:

1. **Go to the Dashboard** and fill in your 6 financial inputs: monthly income, expenses, savings, total debt, interest rate, and minimum payment. It takes about 2 minutes.
2. **Run a risk analysis** — click the Analyze button. This generates your risk score and identifies your top risk drivers.
3. **Come back here** — once your data is in, I can give you a personalized breakdown of exactly where you stand and what to focus on first.

The whole setup takes less than 5 minutes.`;
}

function handleGeneralFinance(ctx: DebtGuardContext): string {
  return `I am built specifically to help with your financial situation in DebtGuard — risk analysis, simulation interpretation, payoff timelines, and decision support using your actual numbers.

For general financial education, I can cover the basics:
- **APR vs interest rate:** APR includes fees; interest rate is just the cost of borrowing
- **Emergency fund:** The standard target is 3–6 months of expenses in liquid savings
- **Debt avalanche vs snowball:** Avalanche pays highest-rate debt first (mathematically optimal); snowball pays smallest balance first (behaviorally motivating)
- **Credit score:** Primarily driven by payment history (35%), utilization (30%), length of history (15%)

But the most valuable thing I can do is analyze your specific situation. If you have set up your profile, ask me something like "What is my biggest risk right now?" or "How long until I am debt free?"`;
}

function handleUnknown(): string {
  return `I am not sure I understood that completely. I am built specifically to help with financial analysis, risk understanding, simulation interpretation, and decision support.

Try asking me something like:
- "Why is my risk score high?"
- "How long until I am debt free?"
- "What should I simulate next?"
- "Am I in trouble?"
- "What if I paid $200 more per month?"`;
}
