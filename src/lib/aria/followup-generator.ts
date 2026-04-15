import type { Intent } from './intent-classifier';
import type { DebtGuardContext } from '@/lib/types';

interface HistoryMessage {
  role: 'user' | 'assistant';
  content: string;
}

// Map each intent to logical follow-up questions
const followUpMap: Partial<Record<Intent, string[]>> = {
  explain_risk_score: [
    'What is the fastest way to lower my score?',
    'Which risk driver should I tackle first?',
  ],
  explain_cashflow: [
    'How long until my savings run out at this rate?',
    'What would bring my cashflow positive?',
  ],
  explain_dti: [
    'How long to pay off this debt?',
    'What DTI ratio should I be aiming for?',
  ],
  explain_payment_burden: [
    'Would refinancing lower my payment burden?',
    'What if I added $200 extra per month?',
  ],
  explain_savings_runway: [
    'What would bring my runway above 6 months?',
    'What is the most urgent thing to fix?',
  ],
  explain_interest_pressure: [
    'Would refinancing make a meaningful difference?',
    'How much interest will I pay over the life of this debt?',
  ],
  debt_payoff_timeline: [
    'What if I paid an extra $200 per month?',
    'Which payoff strategy is better — avalanche or snowball?',
  ],
  savings_depletion_timeline: [
    'What would stop my savings from running out?',
    'What is the most urgent issue to fix?',
  ],
  what_if_extra_payment: [
    'Where should I run this scenario in the Simulator?',
    'What is the total interest I would save?',
  ],
  what_if_reduce_expenses: [
    'How much would I need to cut to go cashflow positive?',
    'What should I simulate next?',
  ],
  what_if_income_change: [
    'How would a raise affect my risk score?',
    'What would happen to my debt payoff timeline?',
  ],
  what_if_refinance: [
    'How do I run this scenario in the Simulator?',
    'What rate would I need to see a meaningful difference?',
  ],
  what_if_new_loan: [
    'How would this affect my risk score?',
    'Is my current debt-to-income ratio too high already?',
  ],
  compare_scenarios: [
    'Which scenario should I run first?',
    'What is the Decision Score measuring?',
  ],
  interpret_simulation: [
    'What does my Decision Score mean?',
    'What should I try next?',
  ],
  interpret_decision_score: [
    'How do I get a higher Decision Score?',
    'What is the best scenario to run next?',
  ],
  what_to_simulate_next: [
    'How do I set up this scenario?',
    'What does the Decision Score mean?',
  ],
  most_urgent_issue: [
    'How do I fix this in the Simulator?',
    'How long until this becomes critical?',
  ],
  am_i_in_trouble: [
    'What is the single most important thing I can do right now?',
    'How do I run a scenario to improve this?',
  ],
  how_to_improve_score: [
    'Can you walk me through running that scenario?',
    'How quickly could my score improve?',
  ],
  explain_replicate_system: [
    'How does my risk score work?',
    'What should I simulate first?',
  ],
  greeting: [
    'What is the most important thing to focus on right now?',
    'Walk me through my financial situation.',
  ],
  financial_stress: [
    'What is the single most important thing I can do right now?',
    'Can you walk me through my situation step by step?',
  ],
  no_profile_guidance: [
    'What happens after I set up my profile?',
    'How does the risk score work?',
  ],
  general_finance_question: [
    'How does this apply to my specific situation?',
    'What should I focus on first?',
  ],
  unknown: [
    'Walk me through my financial situation.',
    'What is the most urgent issue?',
  ],
};

// Context-aware overrides — if the user has specific data, surface smarter follow-ups
function getContextualFollowUps(
  intent: Intent,
  context: DebtGuardContext,
  history: HistoryMessage[]
): string[] {
  const base = followUpMap[intent] ?? [
    'Walk me through my financial situation.',
    'What is the most urgent thing to fix?',
  ];

  // Filter out anything that echoes what was just answered
  const historyLower = history
    .slice(-4) // Only look at recent history
    .map((m) => m.content.toLowerCase())
    .join(' ');

  const filtered = base.filter((q) => {
    const ql = q.toLowerCase();
    // Skip if we've asked something very similar recently
    if (historyLower.includes(ql.slice(0, 20))) return false;
    return true;
  });

  // If we filtered everything out, fall back to context-based defaults
  if (filtered.length === 0) {
    if (context.riskAnalysis) {
      return [`Why is my risk score ${context.riskAnalysis.score}?`, 'What is the most urgent issue?'];
    }
    return ['Walk me through my financial situation.', 'Where do I start?'];
  }

  return filtered.slice(0, 2);
}

export function generateFollowUps(
  intent: Intent,
  context: DebtGuardContext,
  conversationHistory: HistoryMessage[]
): string[] {
  return getContextualFollowUps(intent, context, conversationHistory);
}
