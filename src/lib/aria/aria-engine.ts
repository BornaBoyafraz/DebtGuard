/**
 * Aria Engine — DebtGuard's self-contained AI financial assistant.
 *
 * Architecture:
 *  1. Stress detection (overrides normal intent flow)
 *  2. Intent classification via keyword matching
 *  3. Response generation using real financial computations
 *  4. Intelligent follow-up suggestions
 *
 * No external APIs. No API keys. Zero cost. Works offline.
 */

import { classifyIntent } from './intent-classifier';
import type { Intent } from './intent-classifier';
import { generateResponse } from './response-generator';
import { generateFollowUps } from './followup-generator';
import { detectStressSignals } from '@/lib/stress-detection';
import type { DebtGuardContext } from '@/lib/types';

export interface AriaMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: Date;
}

export interface AriaInput {
  message: string;
  context: DebtGuardContext;
  conversationHistory: AriaMessage[];
}

export interface AriaResponse {
  content: string;
  confidence: 'high' | 'medium' | 'low';
  suggestedFollowUps: string[];
  intent: string;
  usedComputation: boolean;
}

// Intents that require a profile to give a useful answer
const PROFILE_REQUIRED_INTENTS = new Set<Intent>([
  'explain_risk_score',
  'explain_cashflow',
  'explain_dti',
  'explain_payment_burden',
  'explain_savings_runway',
  'explain_interest_pressure',
  'debt_payoff_timeline',
  'savings_depletion_timeline',
  'what_if_extra_payment',
  'what_if_reduce_expenses',
  'what_if_income_change',
  'what_if_refinance',
  'what_if_new_loan',
  'most_urgent_issue',
  'am_i_in_trouble',
  'how_to_improve_score',
]);

// Intents that involve computation
const COMPUTATIONAL_INTENTS = new Set<Intent>([
  'explain_risk_score',
  'explain_cashflow',
  'explain_dti',
  'explain_payment_burden',
  'explain_savings_runway',
  'explain_interest_pressure',
  'debt_payoff_timeline',
  'savings_depletion_timeline',
  'what_if_extra_payment',
  'what_if_reduce_expenses',
  'what_if_income_change',
  'what_if_refinance',
  'what_if_new_loan',
  'most_urgent_issue',
  'how_to_improve_score',
]);

// Confidence level by intent
function getConfidence(intent: Intent): 'high' | 'medium' | 'low' {
  if (COMPUTATIONAL_INTENTS.has(intent)) return 'high';
  if (intent === 'unknown' || intent === 'general_finance_question') return 'low';
  return 'medium';
}

// Redirect response when a profile is required but missing
function noProfileResponse(userName: string): AriaResponse {
  const name = userName && userName !== 'there' ? ` ${userName}` : '';
  return {
    content: `To answer that question accurately, I need your financial profile. Head to the **Dashboard** and fill in your details — income, expenses, savings, debt, and minimum payment. It takes about 2 minutes and unlocks everything: your risk score, payoff timeline, cashflow analysis, and all scenario simulations.`,
    confidence: 'high',
    suggestedFollowUps: [
      'How do I set up my profile?',
      'What does DebtGuard calculate from my data?',
    ],
    intent: 'no_profile_guidance',
    usedComputation: false,
  };
}

export function processMessage(input: AriaInput): AriaResponse {
  const { message, context, conversationHistory } = input;

  // 1. Detect emotional/financial stress (overrides intent classification)
  const stress = detectStressSignals(message);
  const intent: Intent = stress.detected ? 'financial_stress' : classifyIntent(message);

  // 2. If the intent needs a profile and we don't have one, redirect
  if (!context.profile && PROFILE_REQUIRED_INTENTS.has(intent)) {
    return noProfileResponse(context.userName);
  }

  // 3. Generate the response
  const content = generateResponse(intent, context, message);

  // 4. Generate follow-ups
  const suggestedFollowUps = generateFollowUps(intent, context, conversationHistory);

  return {
    content,
    confidence: getConfidence(intent),
    suggestedFollowUps,
    intent,
    usedComputation: COMPUTATIONAL_INTENTS.has(intent),
  };
}
