import type { DebtGuardContext } from '@/lib/types';

export function generateFollowUps(
  lastAssistantMessage: string,
  context: DebtGuardContext
): string[] {
  const lower = lastAssistantMessage.toLowerCase();
  const suggestions: string[] = [];

  if (suggestions.length < 2 && /debt/.test(lower) && /pay.?off|payoff|month/.test(lower)) {
    suggestions.push('What if I paid $200 more per month?');
  }

  if (suggestions.length < 2 && /risk score/.test(lower)) {
    suggestions.push("What's the fastest way to lower my score?");
  }

  if (suggestions.length < 2 && /cashflow|cash flow/.test(lower)) {
    suggestions.push('How long before this becomes a problem?');
  }

  if (suggestions.length < 2 && /savings runway|runway/.test(lower)) {
    suggestions.push('What would bring my runway above 6 months?');
  }

  if (suggestions.length < 2 && /scenario|simulation/.test(lower)) {
    suggestions.push('Can we compare this to a more aggressive approach?');
  }

  if (suggestions.length < 2 && /interest/.test(lower)) {
    suggestions.push('Would refinancing make a meaningful difference?');
  }

  if (suggestions.length < 2 && /expense|budget/.test(lower)) {
    suggestions.push('Which expense change would have the biggest impact?');
  }

  // Context-aware fallbacks if message didn't trigger specific chips
  if (suggestions.length === 0) {
    suggestions.push('Walk me through my financial situation');
    if (context.riskAnalysis) {
      suggestions.push(`What's driving my ${context.riskAnalysis.level} risk score?`);
    } else if (context.profile) {
      suggestions.push('How long until my debt is paid off?');
    }
  } else if (suggestions.length === 1) {
    if (context.currentSimulation) {
      suggestions.push(
        `Was "${context.currentSimulation.label}" the right decision?`
      );
    } else if (context.riskAnalysis && !/risk score/.test(lower)) {
      suggestions.push("What's the most urgent thing to fix?");
    } else {
      suggestions.push('Walk me through my financial situation');
    }
  }

  return suggestions.slice(0, 2);
}
