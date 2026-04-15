export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type VerdictLevel = 'significantly_better' | 'better' | 'neutral' | 'worse' | 'significantly_worse';
export type HorizonMonths = 12 | 24 | 36;
export type ThemeMode = 'dark' | 'light' | 'system';

export interface FinancialProfile {
  income: number;
  expenses: number;
  savings: number;
  totalDebt: number;
  interestRate: number;
  minimumPayment: number;
}

export interface ScenarioConfig {
  id: string;
  label: string;
  description?: string;
  extraPayment: number;
  expenseChange: number;
  incomeChange: number;
  oneTimeShock: number;
  newLoanAmount: number;
  newLoanRate: number;
  refinanceRate: number | null;
  horizonMonths: HorizonMonths;
  color?: string;
}

export interface MonthlySnapshot {
  month: number;
  debt: number;
  savings: number;
  cashflow: number;
  riskScore: number;
  riskLevel: RiskLevel;
  minimumPayment: number;
  interestPaid: number;
  netWorth: number;
  totalPaid: number;
}

export interface RiskDriver {
  name: string;
  impact: 'high' | 'medium' | 'low';
  description: string;
  value: string;
}

export interface FinancialIndicators {
  cashflow: number;
  debtToIncomeRatio: number;
  paymentBurden: number;
  savingsRunway: number;
  interestPressure: number;
}

export interface RiskAnalysis {
  score: number;
  level: RiskLevel;
  drivers: RiskDriver[];
  explanation: string;
  recommendation: string;
  indicators: FinancialIndicators;
}

export interface SimulationSummary {
  baselineDebtPayoffMonth: number | null;
  scenarioDebtPayoffMonth: number | null;
  baselineSavingsDepletionMonth: number | null;
  scenarioSavingsDepletionMonth: number | null;
  finalDebtDelta: number;
  finalSavingsDelta: number;
  avgRiskDelta: number;
  timeToPayoffDelta: number | null;
  verdict: VerdictLevel;
  verdictText: string;
  decisionScore: number;
  narrative: string;
}

export interface SimulationResult {
  id: string;
  baseline: MonthlySnapshot[];
  scenario: MonthlySnapshot[];
  additionalScenarios?: { config: ScenarioConfig; path: MonthlySnapshot[] }[];
  config: ScenarioConfig;
  profile: FinancialProfile;
  summary: SimulationSummary;
  createdAt: string;
}

export interface GoalTarget {
  type: 'debt_free_by' | 'savings_target' | 'risk_score_target';
  value: number;
  byMonth: number;
}

export interface GoalSolution {
  achievable: boolean;
  requiredExtraPayment?: number;
  requiredExpenseReduction?: number;
  requiredIncomeIncrease?: number;
  explanation: string;
}

// Aria AI assistant types

export interface DebtGuardContext {
  userName: string;
  profile: FinancialProfile | null;
  indicators: FinancialIndicators | null;
  riskAnalysis: {
    score: number;
    level: RiskLevel;
    drivers: { name: string; impact: string; value: string }[];
  } | null;
  currentSimulation: {
    label: string;
    decisionScore: number;
    verdict: VerdictLevel;
    finalDebtDelta: number;
    finalSavingsDelta: number;
    horizonMonths: number;
    narrative: string;
  } | null;
  savedSimulationsCount: number;
  hasCompletedOnboarding: boolean;
}

export interface AriaChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface StressSignal {
  detected: boolean;
  level: 'mild' | 'moderate' | 'high';
  type: 'financial' | 'emotional' | 'overwhelm';
}

export interface InterceptResult {
  handled: boolean;
  response?: string;
}
