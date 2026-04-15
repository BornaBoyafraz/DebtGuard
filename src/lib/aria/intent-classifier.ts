export type Intent =
  | 'explain_risk_score'
  | 'explain_cashflow'
  | 'explain_dti'
  | 'explain_payment_burden'
  | 'explain_savings_runway'
  | 'explain_interest_pressure'
  | 'debt_payoff_timeline'
  | 'savings_depletion_timeline'
  | 'what_if_extra_payment'
  | 'what_if_reduce_expenses'
  | 'what_if_income_change'
  | 'what_if_refinance'
  | 'what_if_new_loan'
  | 'compare_scenarios'
  | 'interpret_simulation'
  | 'interpret_decision_score'
  | 'what_to_simulate_next'
  | 'most_urgent_issue'
  | 'am_i_in_trouble'
  | 'how_to_improve_score'
  | 'explain_replicate_system'
  | 'greeting'
  | 'financial_stress'
  | 'no_profile_guidance'
  | 'general_finance_question'
  | 'unknown';

const intentPatterns: Record<Intent, string[]> = {
  explain_risk_score: [
    'risk score', 'score mean', 'score of', 'why is my score', 'what is my score',
    'score high', 'score low', 'risk number', 'what does my score', 'explain my score',
    'score tell me', 'score measure',
  ],
  explain_cashflow: [
    'cashflow', 'cash flow', 'money left', 'leftover', 'monthly left',
    'after expenses', 'take home', 'net income', 'monthly surplus', 'monthly deficit',
  ],
  explain_dti: [
    'debt to income', 'dti', 'debt ratio', 'income ratio', 'how much debt',
    'debt relative', 'debt versus income',
  ],
  explain_payment_burden: [
    'payment burden', 'payment percentage', 'how much going to debt', 'debt payments',
    'percentage of income', 'payments take', 'payments eat',
  ],
  explain_savings_runway: [
    'savings runway', 'how long savings', 'run out of savings', 'savings last',
    'months of savings', 'savings cover', 'emergency runway',
  ],
  explain_interest_pressure: [
    'interest pressure', 'how much interest', 'interest costing', 'interest rate affect',
    'interest eating', 'cost of interest', 'interest burden',
  ],
  debt_payoff_timeline: [
    'pay off debt', 'debt free', 'when paid off', 'how long debt', 'payoff date',
    'debt gone', 'when will i be', 'pay off my loan', 'pay off my debt',
    'how many months', 'how many years to pay',
  ],
  savings_depletion_timeline: [
    'savings run out', 'when savings gone', 'deplete savings', 'savings depletion',
    'when will savings', 'savings zero', 'how long until savings',
  ],
  what_if_extra_payment: [
    'extra payment', 'pay more', 'additional payment', 'what if i paid',
    'pay extra', 'put more toward', 'add to payment', 'increase payment',
  ],
  what_if_reduce_expenses: [
    'reduce expenses', 'cut expenses', 'spend less', 'lower expenses',
    'cut spending', 'reduce spending', 'expense cut', 'trim expenses',
  ],
  what_if_income_change: [
    'income increase', 'earn more', 'raise', 'income drop', 'lose income',
    'income change', 'salary increase', 'get a raise', 'income goes up', 'income goes down',
  ],
  what_if_refinance: [
    'refinance', 'lower rate', 'better rate', 'new interest rate', 'refi',
    'lower my rate', 'new rate', 'reduce my rate',
  ],
  what_if_new_loan: [
    'new loan', 'take out loan', 'borrow money', 'new debt', 'personal loan',
    'take on debt', 'new credit', 'additional loan',
  ],
  compare_scenarios: [
    'compare', 'which is better', 'best scenario', 'better option', ' vs ',
    'versus', 'side by side', 'which approach', 'which option',
  ],
  interpret_simulation: [
    'simulation mean', 'simulation result', 'what does this mean', 'explain simulation',
    'last simulation', 'what did the simulation', 'simulation show', 'results mean',
  ],
  interpret_decision_score: [
    'decision score', 'what is the score', 'score mean', 'good score',
    'score out of', 'what does the score', 'score breakdown',
  ],
  what_to_simulate_next: [
    'what should i simulate', 'what to try', 'suggest scenario', 'next step',
    'what should i do next', 'what scenario', 'recommend a scenario', 'best to simulate',
  ],
  most_urgent_issue: [
    'most urgent', 'biggest problem', 'worst issue', 'priority', 'focus on',
    'most important', 'what to fix first', 'biggest risk', 'top issue',
  ],
  am_i_in_trouble: [
    'am i okay', 'in trouble', 'should i be worried', 'is this bad', 'how serious',
    'danger', 'am i at risk', 'is this normal', 'how bad is this',
  ],
  how_to_improve_score: [
    'improve score', 'lower my score', 'better score', 'reduce risk', 'how to fix',
    'bring down my score', 'improve my risk', 'get my score lower',
  ],
  explain_replicate_system: [
    'replicate', 'how does debtguard work', 'what is replicate', 'system work',
    'how is this built', 'how does this work', 'what is debtguard',
  ],
  greeting: [
    'hello', 'hi', 'hey', 'good morning', 'good evening', 'good afternoon',
    'start', 'begin', 'what can you do', 'who are you',
  ],
  financial_stress: [
    'overwhelmed', 'stressed', 'scared', 'worried', 'anxious', 'panic',
    "can't afford", 'struggling', 'help me', "don't know what to do",
    'desperate', 'freaking out', 'losing sleep',
  ],
  no_profile_guidance: [
    'how do i start', 'where do i begin', 'setup', 'get started', 'first step',
    'how to use', 'getting started', 'what do i do first',
  ],
  general_finance_question: [
    'interest rate', 'apr', 'credit score', 'emergency fund', 'budget',
    'savings account', 'what is debt', 'what is apr', 'financial advice',
  ],
  unknown: [],
};

export function classifyIntent(message: string): Intent {
  const lower = message.toLowerCase();
  let topIntent: Intent = 'unknown';
  let topScore = 0;

  for (const [intent, keywords] of Object.entries(intentPatterns) as [Intent, string[]][]) {
    if (intent === 'unknown') continue;
    let score = 0;
    for (const kw of keywords) {
      if (lower.includes(kw)) score++;
    }
    if (score > topScore) {
      topScore = score;
      topIntent = intent;
    }
  }

  return topScore > 0 ? topIntent : 'unknown';
}
