/**
 * DebtGuard Intelligence — Built-in Financial Advisor
 *
 * A self-contained financial expert system. No external APIs, no API keys,
 * no runtime dependencies. Works instantly for all users.
 *
 * Architecture:
 *  1. Intent detection via pattern matching (20+ intents)
 *  2. Financial math engine (interest, payoff timelines, comparisons)
 *  3. Personalized response generators using the user's actual data
 *  4. Fallback general finance knowledge base
 */

import type { DebtGuardContext } from '@/lib/types';

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────

type Intent =
  | 'greeting'
  | 'debt_overview'
  | 'payoff_strategy'
  | 'avalanche_method'
  | 'snowball_method'
  | 'interest_calculation'
  | 'budget_advice'
  | 'debt_consolidation'
  | 'credit_score'
  | 'emergency_fund'
  | 'savings_tips'
  | 'motivation'
  | 'payoff_timeline'
  | 'minimum_payment'
  | 'extra_payment'
  | 'refinancing'
  | 'bankruptcy'
  | 'debt_negotiation'
  | 'student_loan'
  | 'mortgage'
  | 'invest_vs_debt'
  | 'general_finance';

// ─────────────────────────────────────────────
// INTENT DETECTION
// ─────────────────────────────────────────────

export function detectIntent(message: string): Intent {
  const t = message.toLowerCase();

  if (/^(hi|hello|hey|howdy|good (morning|afternoon|evening)|what.?s up|sup)\b/.test(t)) return 'greeting';
  if (/\bavalanche|highest.?interest|high.?rate first\b/.test(t)) return 'avalanche_method';
  if (/\bsnowball|smallest.?debt|small.?balance first\b/.test(t)) return 'snowball_method';
  if (/\b(strategy|method|approach|how.?to.?pay|best way|payoff plan|which method)\b/.test(t)) return 'payoff_strategy';
  if (/\b(interest|apr|rate|how much.?pay(ing)?|cost.?of.?debt|interest cost)\b/.test(t)) return 'interest_calculation';
  if (/\b(timeline|when.?(will|can) i|how long|months|years|paid off|debt.?free date)\b/.test(t)) return 'payoff_timeline';
  if (/\b(total|overview|summary|how much do i owe|all my debt|debt situation)\b/.test(t)) return 'debt_overview';
  if (/\bminimum.?pay|min pay|only pay minimum\b/.test(t)) return 'minimum_payment';
  if (/\bextra|additional (money|payment)|put more|lump sum|windfall\b/.test(t)) return 'extra_payment';
  if (/\bbudget|spending|expenses|income|where.?money go|cut back|save more|afford\b/.test(t)) return 'budget_advice';
  if (/\bconsolidat|combine.?debt|merge|one loan|single payment|personal loan\b/.test(t)) return 'debt_consolidation';
  if (/\bcredit score|fico|credit report|credit rating|credit utilization\b/.test(t)) return 'credit_score';
  if (/\bemergency fund|rainy day|savings account|cushion|safety net\b/.test(t)) return 'emergency_fund';
  if (/\bsav(e|ing|ings) tip|cut cost|frugal|spend less|find money\b/.test(t)) return 'savings_tips';
  if (/\bmotivat|keep going|it.?s hard|struggling|overwhelm|stressed|anxious|hopeless|can.?t do\b/.test(t)) return 'motivation';
  if (/\brefin|lower.?rate|better.?rate|new loan for\b/.test(t)) return 'refinancing';
  if (/\bbankrupt|chapter 7|chapter 13|insolvency\b/.test(t)) return 'bankruptcy';
  if (/\bnegotiat|settle|settlement|collection.?agency|collector\b/.test(t)) return 'debt_negotiation';
  if (/\bstudent loan|student debt\b/.test(t)) return 'student_loan';
  if (/\bmortgage|home loan|house (debt|loan)\b/.test(t)) return 'mortgage';
  if (/\binvest|stock|401k|ira|roth|index fund\b/.test(t)) return 'invest_vs_debt';

  return 'general_finance';
}

// ─────────────────────────────────────────────
// FINANCIAL MATH
// ─────────────────────────────────────────────

function monthsToPayoff(balance: number, apr: number, monthlyPayment: number): number {
  if (balance <= 0) return 0;
  if (monthlyPayment <= 0) return Infinity;
  const r = apr / 100 / 12;
  if (r === 0) return Math.ceil(balance / monthlyPayment);
  if (monthlyPayment <= balance * r) return Infinity;
  return Math.ceil(-Math.log(1 - (balance * r) / monthlyPayment) / Math.log(1 + r));
}

function totalInterest(balance: number, apr: number, monthlyPayment: number): number {
  const m = monthsToPayoff(balance, apr, monthlyPayment);
  if (m === Infinity || m > 600) return Infinity;
  return Math.max(0, monthlyPayment * m - balance);
}

function fc(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);
}

function fm(months: number): string {
  if (months === Infinity || months > 600) return 'never (payment too low to cover interest)';
  if (months <= 0) return 'right now';
  const y = Math.floor(months / 12);
  const mo = months % 12;
  if (y === 0) return `${mo} month${mo !== 1 ? 's' : ''}`;
  if (mo === 0) return `${y} year${y !== 1 ? 's' : ''}`;
  return `${y} year${y !== 1 ? 's' : ''} and ${mo} month${mo !== 1 ? 's' : ''}`;
}

// ─────────────────────────────────────────────
// RESPONSE GENERATORS
// ─────────────────────────────────────────────

function greeting(ctx: DebtGuardContext): string {
  const name = ctx.userName ? `, ${ctx.userName}` : '';
  const hasData = !!ctx.profile;
  if (hasData && ctx.profile) {
    const debt = fc(ctx.profile.totalDebt);
    return `Hey${name}! I'm your DebtGuard AI Advisor — a specialist in personal finance and debt management. I can see you have ${debt} in total debt. I can help you build a payoff plan, calculate interest savings, compare strategies, and find ways to become debt-free faster. What would you like to work on today?`;
  }
  return `Hey${name}! I'm your DebtGuard AI Advisor — a specialist in personal finance and debt management. I can help you understand your debts, build a payoff plan, calculate interest costs, compare strategies like avalanche vs snowball, and find ways to become debt-free faster. What would you like to work on today?`;
}

function debtOverview(ctx: DebtGuardContext): string {
  if (!ctx.profile) {
    return `I don't see a financial profile set up yet. Head to the Dashboard and fill in your details — once that's done, I can give you a complete breakdown of your debt situation, interest costs, and a personalized payoff plan.`;
  }
  const p = ctx.profile;
  const monthlyInterest = p.totalDebt * p.interestRate / 100 / 12;
  const annualInterest = monthlyInterest * 12;
  const cashflow = p.income - p.expenses - p.minimumPayment;
  const months = monthsToPayoff(p.totalDebt, p.interestRate, p.minimumPayment);

  let r = `## Your Debt Snapshot\n\n`;
  r += `**Total Debt:** ${fc(p.totalDebt)}\n`;
  r += `**Interest Rate:** ${p.interestRate}% APR\n`;
  r += `**Monthly Minimum Payment:** ${fc(p.minimumPayment)}\n`;
  r += `**Monthly Interest Cost:** ~${fc(monthlyInterest)} (${fc(annualInterest)}/year)\n`;
  r += `**Estimated Payoff:** ${fm(months)} at current pace\n`;
  r += `**Monthly Cashflow:** ${cashflow >= 0 ? fc(cashflow) : `–${fc(Math.abs(cashflow))} (negative)`}\n\n`;

  if (cashflow < 0) {
    r += `[!] **Your cashflow is negative** — your income doesn't cover expenses plus debt payments. This is urgent. We need to find ways to cut expenses or increase income.\n\n`;
  } else if (cashflow < 200) {
    r += `Your cashflow is tight — only ${fc(cashflow)}/month left after expenses and minimums. Even small cuts to spending could free up significant extra debt payment.\n\n`;
  } else {
    r += `You have ${fc(cashflow)}/month in cashflow above minimums. Redirecting even half of that toward your highest-rate debt would significantly accelerate your payoff.\n\n`;
  }

  r += `The biggest lever you have: **extra payments reduce principal, which reduces future interest, creating a compounding effect in your favor.** Want to see a payoff plan?`;
  return r;
}

function avalanche(ctx: DebtGuardContext): string {
  let r = `## The Avalanche Method (Highest Rate First)\n\n`;
  r += `Target your **highest-interest debt first** — mathematically optimal, saves the most money.\n\n`;
  r += `**How it works:**\n`;
  r += `1. Pay minimums on all debts\n`;
  r += `2. Put every extra dollar toward the highest-APR debt\n`;
  r += `3. When it's gone, roll that full payment to the next highest rate\n\n`;

  if (ctx.profile) {
    const p = ctx.profile;
    const monthlyInterest = p.totalDebt * p.interestRate / 100 / 12;
    r += `**Your situation:** ${fc(p.totalDebt)} at ${p.interestRate}% APR — you're paying ${fc(monthlyInterest)}/month in interest alone.\n\n`;
    const months = monthsToPayoff(p.totalDebt, p.interestRate, p.minimumPayment);
    const extraMonths = monthsToPayoff(p.totalDebt, p.interestRate, p.minimumPayment + 200);
    const interestSaved = totalInterest(p.totalDebt, p.interestRate, p.minimumPayment) - totalInterest(p.totalDebt, p.interestRate, p.minimumPayment + 200);
    r += `With minimums only: paid off in **${fm(months)}**\n`;
    if (extraMonths !== Infinity) {
      r += `With $200 extra/month: **${fm(extraMonths)}** — saving ~${fc(Math.max(0, interestSaved))} in interest!\n\n`;
    }
  }

  r += `**Best for:** People motivated by saving the most money. High-rate debt above 20% APR especially benefits from avalanche — that interest compounds fast.\n\n`;
  r += `**Downside:** If your highest-rate debt also has a large balance, it can take a while before you see an account fully paid off. Some people lose motivation without quick wins.`;
  return r;
}

function snowball(ctx: DebtGuardContext): string {
  let r = `## The Snowball Method (Smallest Balance First)\n\n`;
  r += `Target your **smallest balance first** — builds momentum with quick wins.\n\n`;
  r += `**How it works:**\n`;
  r += `1. Pay minimums on all debts\n`;
  r += `2. Put every extra dollar toward the smallest balance\n`;
  r += `3. When it's paid off, roll that payment to the next smallest\n\n`;

  r += `**The psychology:** Each time you eliminate a debt, you free up a payment — and that freed payment goes to the next debt. It's like a snowball rolling downhill, growing bigger with each debt cleared.\n\n`;
  r += `**Research shows** that people who use snowball are more likely to stick with their debt payoff plan — and a plan you stick with beats a "mathematically optimal" plan you abandon.\n\n`;
  r += `**Best for:** People who need early wins to stay motivated. Works especially well when you have several small debts you can knock out quickly.\n\n`;
  r += `**vs. Avalanche:** Snowball typically costs more in total interest, but the difference is often smaller than people expect. The best method is the one you'll actually follow through on.`;
  return r;
}

function payoffStrategy(ctx: DebtGuardContext): string {
  let r = `## Avalanche vs. Snowball — Which Should You Use?\n\n`;

  r += `### Avalanche — Saves the Most Money\n`;
  r += `Pay highest-interest debt first. Mathematically optimal — minimizes total interest paid.\n`;
  r += `Best for: Analytical thinkers. Especially important when you have debt above 20% APR.\n\n`;

  r += `### Snowball — Best for Motivation\n`;
  r += `Pay smallest balance first. Creates quick wins and builds momentum.\n`;
  r += `Best for: People who need visible progress to stay motivated.\n\n`;

  r += `### Which is right for you?\n`;
  if (ctx.profile) {
    const p = ctx.profile;
    const months = monthsToPayoff(p.totalDebt, p.interestRate, p.minimumPayment);
    const interest = totalInterest(p.totalDebt, p.interestRate, p.minimumPayment);
    r += `Your ${fc(p.totalDebt)} at ${p.interestRate}% APR will take **${fm(months)}** at minimums, costing **${fc(Math.min(interest, 999999))}** in interest.\n\n`;
    if (p.interestRate > 18) {
      r += `[*] With rates above 18%, **avalanche is strongly recommended** — that interest compounds aggressively. Every extra dollar toward your highest-rate debt gives you a guaranteed ${p.interestRate}% return.\n\n`;
    } else {
      r += `At ${p.interestRate}% APR, both strategies are reasonable. If you want to save money: avalanche. If you need motivation: snowball.\n\n`;
    }
  }

  r += `**The truth:** The "best" strategy is the one you'll stick with for years. If you won't stay consistent with avalanche, snowball wins — even if it costs a little more in interest.\n\n`;
  r += `Want me to calculate your exact payoff timeline and interest costs?`;
  return r;
}

function interestCalc(ctx: DebtGuardContext): string {
  if (!ctx.profile) {
    return `Interest is the real cost of debt — and it compounds relentlessly.\n\n**Example:** $10,000 at 20% APR = $167/month in interest. That's $2,000/year that goes nowhere. Until you add your financial profile, I can't give you your exact numbers, but the principle is universal: every extra dollar you pay reduces your principal, which reduces future interest charges.\n\nAdd your profile in the Dashboard and I'll calculate exactly what you're paying in interest each month.`;
  }

  const p = ctx.profile;
  const monthly = p.totalDebt * p.interestRate / 100 / 12;
  const annual = monthly * 12;
  const pctOfPayment = p.minimumPayment > 0 ? (monthly / p.minimumPayment * 100).toFixed(0) : '?';
  const principalPerMonth = Math.max(0, p.minimumPayment - monthly);

  let r = `## Your Interest Cost\n\n`;
  r += `**Monthly interest charge:** ${fc(monthly)}\n`;
  r += `**Annual interest cost:** ${fc(annual)}\n`;
  r += `**% of your payment that's interest:** ~${pctOfPayment}%\n`;
  r += `**Principal actually paid/month:** only ${fc(principalPerMonth)}\n\n`;

  if (parseFloat(pctOfPayment) > 60) {
    r += `[!] Over 60% of your minimum payment goes to interest — barely touching your principal. This is why debt feels like running on a treadmill.\n\n`;
  }

  r += `**The compounding trap:** At ${p.interestRate}% APR, every month you don't pay extra, you add ${fc(monthly)} in new charges. This is why extra payments have such a massive impact — they directly reduce the principal that generates future interest.\n\n`;

  const months100 = monthsToPayoff(p.totalDebt, p.interestRate, p.minimumPayment + 100);
  const saved100 = totalInterest(p.totalDebt, p.interestRate, p.minimumPayment) - totalInterest(p.totalDebt, p.interestRate, p.minimumPayment + 100);
  if (months100 !== Infinity) {
    r += `**Quick win:** Adding just $100/month extra would save you approximately ${fc(Math.max(0, saved100))} in total interest.`;
  }

  return r;
}

function payoffTimeline(ctx: DebtGuardContext): string {
  if (!ctx.profile) {
    return `To calculate your payoff timeline, I need your debt details. Add your profile in the Dashboard and I'll give you an exact breakdown.\n\n**General rule:** At 20% APR with minimum payments only, a $10,000 debt takes 15+ years and costs more than the original balance in interest. Adding $200/month extra cuts that to under 4 years and saves thousands.`;
  }

  const p = ctx.profile;
  const baseMonths = monthsToPayoff(p.totalDebt, p.interestRate, p.minimumPayment);
  const baseInterest = totalInterest(p.totalDebt, p.interestRate, p.minimumPayment);

  let r = `## Your Payoff Timeline\n\n`;
  r += `**${fc(p.totalDebt)} at ${p.interestRate}% APR**\n\n`;
  r += `| Extra/Month | Payoff Time | Total Interest | Savings |\n`;
  r += `|-------------|-------------|----------------|--------|\n`;

  const scenarios = [0, 50, 100, 200, 500];
  scenarios.forEach(extra => {
    const m = monthsToPayoff(p.totalDebt, p.interestRate, p.minimumPayment + extra);
    const int = totalInterest(p.totalDebt, p.interestRate, p.minimumPayment + extra);
    const saved = Math.max(0, baseInterest - int);
    const label = extra === 0 ? 'Minimum only' : `+${fc(extra)}/mo`;
    r += `| ${label} | ${fm(m)} | ${fc(Math.min(int, 999999))} | ${extra === 0 ? '—' : fc(saved)} |\n`;
  });

  r += `\n**Key insight:** Even $50-100 extra per month has an outsized impact because it directly shrinks the principal that generates future interest charges.\n\n`;

  const cashflow = p.income - p.expenses - p.minimumPayment;
  if (cashflow > 0) {
    r += `You have ${fc(cashflow)}/month in available cashflow. Even putting half of that (${fc(cashflow / 2)}) toward extra payments would dramatically accelerate your timeline.`;
  }

  return r;
}

function extraPayment(ctx: DebtGuardContext): string {
  if (!ctx.profile) {
    return `Extra payments are one of the most powerful debt elimination tools — and the math is surprisingly dramatic.\n\n**Example:** $10,000 at 20% APR\n- Minimum only ($250/mo): ~7.8 years, $13,000+ in interest\n- $100 extra ($350/mo): ~3.9 years, $6,300 in interest — saves $6,700 and 3.9 years!\n\nAdd your profile and I'll run these numbers with your actual debt.`;
  }

  const p = ctx.profile;
  const extras = [50, 100, 200, 500];
  let r = `## Impact of Extra Payments\n\nFocusing on your ${fc(p.totalDebt)} at ${p.interestRate}% APR:\n\n`;

  const baseM = monthsToPayoff(p.totalDebt, p.interestRate, p.minimumPayment);
  const baseInt = totalInterest(p.totalDebt, p.interestRate, p.minimumPayment);

  r += `**Current pace** (${fc(p.minimumPayment)}/mo minimum): ${fm(baseM)} | ${fc(Math.min(baseInt, 999999))} in interest\n\n`;

  extras.forEach(extra => {
    const m = monthsToPayoff(p.totalDebt, p.interestRate, p.minimumPayment + extra);
    const int = totalInterest(p.totalDebt, p.interestRate, p.minimumPayment + extra);
    const timeSaved = baseM === Infinity ? 0 : Math.max(0, baseM - m);
    const moneySaved = Math.max(0, baseInt - int);
    r += `**+${fc(extra)}/mo:** ${fm(m)} — saves ${fm(timeSaved)} and ${fc(moneySaved)}\n`;
  });

  const cashflow = p.income - p.expenses - p.minimumPayment;
  r += `\n`;
  if (cashflow > 100) {
    r += `You have ${fc(cashflow)}/month in cashflow. Even redirecting ${fc(Math.min(100, cashflow))}/month would make a significant impact. Where could you find an extra $50-100 in your budget?`;
  } else {
    r += `Your cashflow is tight right now, but even $50 extra/month makes a real difference. Want tips on finding extra money in your budget?`;
  }
  return r;
}

function minimumPayment(ctx: DebtGuardContext): string {
  let r = `## The Minimum Payment Trap\n\nMinimum payments are designed to maximize the interest you pay — they keep you in debt as long as possible.\n\n`;

  if (ctx.profile) {
    const p = ctx.profile;
    const months = monthsToPayoff(p.totalDebt, p.interestRate, p.minimumPayment);
    const interest = totalInterest(p.totalDebt, p.interestRate, p.minimumPayment);
    const monthlyInterest = p.totalDebt * p.interestRate / 100 / 12;
    const principalPaid = Math.max(0, p.minimumPayment - monthlyInterest);

    r += `**Your numbers:**\n`;
    r += `• ${fc(p.totalDebt)} at ${p.interestRate}% APR — ${fc(monthlyInterest)}/month in interest\n`;
    r += `• Your ${fc(p.minimumPayment)} minimum: only ${fc(principalPaid)} goes to principal!\n`;
    r += `• At this pace: paid off in ${fm(months)}, costing ${fc(Math.min(interest, 999999))} in interest\n\n`;

    const doubleMonths = monthsToPayoff(p.totalDebt, p.interestRate, p.minimumPayment * 2);
    const doubleInt = totalInterest(p.totalDebt, p.interestRate, p.minimumPayment * 2);
    r += `**If you doubled your payment (${fc(p.minimumPayment * 2)}/mo):** ${fm(doubleMonths)} — saves ${fc(Math.max(0, interest - doubleInt))} in interest!\n\n`;
  }

  r += `**The rule of thumb:** If your minimum is 2% of your balance, you could be paying for 20+ years. To get free faster, pay at minimum **2x the minimum payment** whenever possible.`;
  return r;
}

function budgetAdvice(ctx: DebtGuardContext): string {
  let r = `## Finding Money to Accelerate Debt Payoff\n\n`;

  if (ctx.profile) {
    const p = ctx.profile;
    const cashflow = p.income - p.expenses - p.minimumPayment;
    r += `**Your cashflow:** ${fc(p.income)} income – ${fc(p.expenses)} expenses – ${fc(p.minimumPayment)} payments = **${fc(cashflow)}/month**\n\n`;

    if (cashflow < 0) {
      r += `[!] **Cashflow is negative** — this needs immediate attention. You're spending more than you earn.\n\n**Urgent steps:**\n1. List every expense and find 3 you can cut this week\n2. Consider a temporary side income (gig work, freelancing)\n3. Contact creditors about hardship payment plans\n4. Review subscriptions — cancel everything non-essential\n\n`;
    } else if (cashflow < 300) {
      r += `Your cashflow is tight. Here's how to find extra money:\n\n`;
    } else {
      r += `You have ${fc(cashflow)}/month above minimums — a solid foundation. Here's how to make it work harder:\n\n`;
    }
  }

  r += `**The high-impact moves:**\n`;
  r += `• **Subscription audit** — cancel anything you haven't used in 30 days (~$50-100/month savings)\n`;
  r += `• **Meal prep 3x/week** — saves $150-300/month vs. eating out\n`;
  r += `• **Negotiate bills** — call phone/insurance providers for loyalty discounts\n`;
  r += `• **24-hour rule** — wait 24 hours before any non-essential purchase over $50\n\n`;

  r += `**Bigger moves:**\n`;
  r += `• Sell unused items (electronics, clothes, furniture) — quick cash for a debt lump sum\n`;
  r += `• Side income: even 5 hours/week at $20/hour = $400/month extra toward debt\n`;
  r += `• Buy generic for staples — identical quality, 30-40% cheaper\n\n`;

  r += `**Treat your extra payment like a bill.** Set it on autopay. If it's automatic, you can't spend it.`;
  return r;
}

function creditScore(): string {
  return `## Credit Scores & Debt\n\n**What drives your score:**\n• **Payment history (35%)** — most critical. One missed payment can drop 50-100 points.\n• **Credit utilization (30%)** — keep balances below 30% of limits (ideally below 10%)\n• **Length of history (15%)** — older accounts help your score\n• **Credit mix (10%)** — different types of credit\n• **New inquiries (10%)** — limit hard pulls\n\n**How paying debt affects your score:**\nReducing credit card balances directly improves utilization — often the fastest way to boost your score. Paying down $2,000 on a $5,000 limit card (40%→24% utilization) can add 20-40 points.\n\n**Common mistake:** Closing a paid-off credit card. This reduces available credit and can *hurt* your score. Keep old cards open with a zero balance.\n\n**Goal:** Under 30% utilization on all cards. Under 10% for best score impact.`;
}

function emergencyFund(): string {
  return `## Emergency Fund vs. Debt Payoff\n\n**The framework:**\n1. First: Build a $1,000 starter emergency fund\n2. Then: Attack high-interest debt aggressively\n3. After debt-free: Build 3-6 months of expenses\n\n**Why the $1,000 first?** Without any buffer, any unexpected expense (car repair, medical bill) goes back on a credit card — undoing your progress and demoralizing you.\n\n**Where to keep it:** High-yield savings account (HYSA) — currently earning 4-5% APY at many online banks (Marcus, Ally, SoFi). Your emergency fund earns while it waits.\n\n**The math:** If your debt is at 20% APR, paying it down gives you a guaranteed 20% "return." No savings account beats that — so once you have your $1,000 starter fund, all extra money goes to debt until you're free.`;
}

function savingsTips(): string {
  return `## Proven Ways to Find Extra Money for Debt\n\n**This week (low effort):**\n• List all subscriptions — cancel anything unused\n• Call phone, insurance, and internet providers asking for a better rate\n• Check if employer has any unused benefits (wellness stipends, etc.)\n\n**This month (medium effort):**\n• Meal prep 3-4 days/week: saves $200-400/month for most people\n• Sell 5-10 unused items on Facebook Marketplace or eBay\n• Switch to generic brands for grocery staples\n• Review and reduce utility usage\n\n**Ongoing:**\n• Use the 24-hour rule: wait a day before purchases over $50\n• Pack lunch 4 days/week instead of buying\n• Use cash-back apps (Rakuten, Honey) for purchases you'd make anyway\n\n**Bigger moves:**\n• Side income: freelancing, gig work, tutoring — even $300/month extra changes your trajectory dramatically\n• Rent out a room or parking space\n• Ask for a raise if you haven't in 12+ months\n\n**Track everything for one month.** Most people discover 2-3 categories where they spend significantly more than they realized.`;
}

function motivation(ctx: DebtGuardContext): string {
  const debt = ctx.profile ? fc(ctx.profile.totalDebt) : 'your debt';
  const responses = [
    `Feeling the weight of ${debt} is completely normal — and honestly, it means you're paying attention.\n\nHere's the truth: the people who get out of debt aren't extraordinary. They just made one decision and stuck with it: **extra payments come before discretionary spending.** They treated it like rent. Non-negotiable.\n\nYou're here, you're tracking it, you're asking questions. That's already 90% of what separates people who get free from those who don't. The math is on your side — you just have to stay in the game.\n\nWant to calculate your debt-free date? Sometimes seeing the finish line is exactly what you need to stay motivated.`,
    `Debt feels relentless — especially when you're making payments and it barely moves. That's not a sign you're failing. That's the math of high interest rates. It's working against you by design.\n\nBut the same math that traps people can work in your favor once you start making extra payments. Each dollar above the minimum directly attacks the principal. Future interest charges get smaller. The timeline shrinks faster than you'd expect.\n\n**One small win:** Find one expense to cut this week and make one extra payment — even $25. Not because $25 changes everything, but because momentum is built in small consistent actions.\n\nYou've already started by using DebtGuard. That puts you ahead of most people who avoid looking at their numbers.`,
  ];
  return responses[Math.floor(Math.random() * responses.length)];
}

function consolidation(): string {
  return `## Debt Consolidation: Is It Right for You?\n\nConsolidation means combining multiple debts into one — ideally at a lower rate.\n\n**Option 1: Balance Transfer Card**\n• Best for credit card debt under $20,000\n• Many offer 0% APR for 12-21 months (look for no annual fee)\n• Transfer fee: typically 3-5% of amount transferred\n• Key: you must pay it off before the promo period ends\n• Requires good credit (usually 680+)\n\n**Option 2: Personal Loan**\n• Fixed rate (7-25% depending on credit score)\n• Fixed monthly payment and payoff date\n• Good if your current debt is at 25%+ APR\n• Shop multiple lenders (Sofi, LightStream, Marcus, local credit unions)\n\n**Option 3: Home Equity (if applicable)**\n• Lowest rates but your home is collateral — only consider with stable income\n\n**Consolidation only helps if:**\n1. You get a meaningfully lower interest rate\n2. You don't run the original cards back up after consolidating\n3. You're committed to paying down the new debt aggressively\n\n**Warning sign:** If you've consolidated before and ended up with more debt, the problem may be spending patterns, not the debt structure itself.`;
}

function refinancing(): string {
  return `## When Refinancing Makes Sense\n\nRefinancing = replacing a high-rate loan with a new one at a lower rate.\n\n**Best candidates:**\n• Private student loans above 7%: refinancing to 4-6% can save thousands\n• Auto loans: if your credit improved since you financed\n• Personal loans: if rates have dropped or your score improved\n\n**The break-even math:**\n(Monthly savings) × (months remaining) > (refinancing fees)\nIf yes, it's worth it.\n\n**When NOT to refinance:**\n• Federal student loans → private: you lose income-based repayment, forgiveness programs. Only do this if your income is very stable and you don't need federal protections.\n• When you're less than 12 months from payoff: fees won't recoup\n• When the new term extends so much that you pay more total, even at a lower rate\n\n**How to get the best rate:**\n• Check credit unions (often 1-2% lower than banks)\n• Get quotes from at least 3 lenders\n• Use pre-qualification (soft pull, no credit impact) to compare\n• Higher credit score = significantly better rates`;
}

function debtNegotiation(): string {
  return `## Negotiating with Creditors\n\n**Yes, you can negotiate — more often than you'd think.**\n\n**Rate negotiation (active accounts):**\nCall the number on your card and say: *"I've been a loyal customer and I'm looking at a balance transfer offer with a lower rate. Can you match it?"*\nThis works more often than people expect, especially if you've had the account for 2+ years and haven't missed payments.\n\n**Hardship programs (if you're struggling):**\nMost major creditors have formal hardship programs — temporarily lower interest rates or reduced minimums. Call and say: *"I'm experiencing financial hardship and would like to discuss a hardship plan."*\nGet everything in writing before making any payment.\n\n**Debt settlement (delinquent accounts):**\n• Accounts in collections can often be settled for 40-60 cents on the dollar\n• Always negotiate in writing — never give electronic bank access\n• Understand: settled debt under $600 may be taxable as income (IRS Form 1099-C)\n• It will negatively impact your credit score for 7 years\n\n**Free help:** National Foundation for Credit Counseling (NFCC) — nonprofit counselors who can negotiate on your behalf at little or no cost.`;
}

function studentLoan(): string {
  return `## Student Loan Strategy\n\n**Federal loans — know your options:**\n• **Income-Driven Repayment (IDR):** Caps payments at 5-10% of discretionary income. Good if payments are straining your budget.\n• **Public Service Loan Forgiveness (PSLF):** Work for government or nonprofit for 10 years → remaining balance forgiven. Worth pursuing if you qualify.\n• **Don't refinance federal to private** unless income is very stable — you lose IDR and PSLF eligibility permanently.\n\n**Private loans:**\n• Refinancing makes sense if your credit improved or rates dropped since you borrowed\n• Shop: SoFi, Earnest, Laurel Road, local credit unions\n• Get pre-qualified (no credit impact) before formally applying\n\n**The invest vs. pay off question:**\n• Below 5%: likely better to invest (historical stock market returns ~7-10%)\n• 5-8%: it's a toss-up — consider both\n• Above 8%: pay it down aggressively\n\n**One non-obvious move:** If you're on IDR, make sure you're enrolled in auto-pay (often 0.25% rate reduction) and that your payment count is tracked toward forgiveness.`;
}

function mortgage(): string {
  return `## Mortgage & Debt Priority\n\nMortgage debt is generally "good debt" — it builds equity and homes typically appreciate over time.\n\n**Priority framework:**\n1. Get full employer 401k match (it's free money — 100% return)\n2. Pay off high-interest debt (above 7-8% APR) aggressively\n3. Build 3-6 month emergency fund\n4. Max Roth IRA ($7,000/year limit)\n5. Extra mortgage payments — only after all of the above\n\n**Why mortgage last:** Your mortgage rate is likely the lowest rate debt you carry. Historically, the stock market returns 7-10% annually. If your mortgage is at 4-6%, investing your extra money may outperform paying down the mortgage.\n\n**Exception:** If you're within a few years of retirement, paying off your mortgage provides significant peace of mind and eliminates a fixed expense. The math matters less at that point.`;
}

function investVsDebt(): string {
  return `## Investing vs. Paying Off Debt\n\n**The framework:**\n\n| Debt Rate | What to Do |\n|-----------|------------|\n| Below 4% | Minimum payments, invest the rest |\n| 4–7% | Split: invest + pay extra |\n| 7–10% | Lean toward paying debt |\n| Above 10% | Pay debt aggressively first |\n| Above 15% | Pay debt exclusively — no investment beats guaranteed 15%+ |\n\n**Always do these first (before investing):**\n1. Get full employer 401k match — it's an instant 50-100% return, unbeatable\n2. Build $1,000 emergency fund\n3. Pay off any debt above 8-10% APR\n\n**The math:** The stock market historically returns ~7-10% annually (S&P 500 average). High-rate credit card debt at 20% APR gives you a guaranteed 20% "return" by paying it off. No investment reliably beats that.\n\n**After high-rate debt is gone:** Roth IRA (tax-free growth) → HSA if eligible → 401k above match → taxable accounts`;
}

function generalFinance(message: string): string {
  const t = message.toLowerCase();

  if (t.includes('net worth')) {
    return `## Building Net Worth\n\nNet Worth = Assets – Liabilities\n\nWhile paying off debt, your net worth grows from two directions: assets increase (savings, investments) and liabilities decrease (debt payoff).\n\n**Track it monthly** — even if it's negative right now, watching it trend upward is powerful motivation. Apps like Mint, YNAB, or a simple spreadsheet work great.\n\n**Reality check:** Many people have negative net worth in their 20s and 30s due to student loans. Getting it to zero — and then positive — is the real game.`;
  }

  if (t.includes('income') || t.includes('salary') || t.includes('raise')) {
    return `## Maximizing Income for Debt Payoff\n\nThe fastest path out of debt is often income growth, not just expense cutting.\n\n**Apply any income increases directly to debt:**\n• Got a raise? Increase your debt payment by the after-tax difference\n• Tax refund? Put 100% toward your highest-rate debt\n• Bonus? Treat it like it doesn't exist — it goes to debt\n\n**Side income accelerators:**\n• Freelancing in your field: $50-100/hour is common\n• Tutoring, coaching, consulting\n• Renting out a room or parking space\n• Gig economy (if other options aren't available)\n\nEven $300-500/month of extra income can cut your payoff time by years.`;
  }

  return `Great question about personal finance. Here's the core framework that applies to almost any financial situation:\n\n**The priority order:**\n1. $1,000 emergency fund (starter)\n2. Full employer 401k match (free money)\n3. Pay off high-interest debt (above 7-8% APR)\n4. Build 3-6 month emergency fund\n5. Invest (Roth IRA, index funds)\n6. Extra debt payments on lower-rate debt\n\n**The fundamental principle:** Get your money working as hard as you are. High-rate debt is your biggest enemy — it compounds against you. Eliminating it is a guaranteed return equal to the interest rate.\n\nFeel free to ask me about any specific aspect — payoff strategies, interest calculations, budgeting, or your specific situation!`;
}

// ─────────────────────────────────────────────
// MAIN EXPORT
// ─────────────────────────────────────────────

export function generateAdvisorResponse(
  userMessage: string,
  ctx: DebtGuardContext
): string {
  const intent = detectIntent(userMessage);

  switch (intent) {
    case 'greeting': return greeting(ctx);
    case 'debt_overview': return debtOverview(ctx);
    case 'avalanche_method': return avalanche(ctx);
    case 'snowball_method': return snowball(ctx);
    case 'payoff_strategy': return payoffStrategy(ctx);
    case 'interest_calculation': return interestCalc(ctx);
    case 'payoff_timeline': return payoffTimeline(ctx);
    case 'minimum_payment': return minimumPayment(ctx);
    case 'extra_payment': return extraPayment(ctx);
    case 'budget_advice': return budgetAdvice(ctx);
    case 'debt_consolidation': return consolidation();
    case 'credit_score': return creditScore();
    case 'emergency_fund': return emergencyFund();
    case 'savings_tips': return savingsTips();
    case 'motivation': return motivation(ctx);
    case 'refinancing': return refinancing();
    case 'bankruptcy': return `## Bankruptcy: A Last Resort\n\nBankruptcy is complex and I'm not a licensed advisor — please consult a bankruptcy attorney (many offer free consultations).\n\n**Chapter 7:** Most unsecured debts discharged in 3-6 months. Credit impact: 10 years. Best for people with mostly credit card debt and low income.\n\n**Chapter 13:** Keep assets, repay debts on 3-5 year plan. Requires regular income. Credit impact: 7 years.\n\n**Before bankruptcy, exhaust these options:**\n1. Negotiate directly with creditors for settlement or hardship plans\n2. Nonprofit credit counseling (NFCC — free/low cost)\n3. Debt consolidation\n\nBankruptcy eliminates debt but has lasting consequences. It's a real option for people in genuine crisis, not just people who want to avoid repayment.`;
    case 'debt_negotiation': return debtNegotiation();
    case 'student_loan': return studentLoan();
    case 'mortgage': return mortgage();
    case 'invest_vs_debt': return investVsDebt();
    default: return generalFinance(userMessage);
  }
}
