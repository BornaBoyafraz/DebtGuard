import { FinancialProfile, ScenarioConfig } from './types';

export const DEFAULT_PROFILE: FinancialProfile = {
  income: 4500,
  expenses: 3200,
  savings: 8000,
  totalDebt: 18000,
  interestRate: 18.5,
  minimumPayment: 450,
};

export const DEFAULT_SCENARIO: ScenarioConfig = {
  id: '',
  label: '',
  description: '',
  extraPayment: 0,
  expenseChange: 0,
  incomeChange: 0,
  oneTimeShock: 0,
  newLoanAmount: 0,
  newLoanRate: 0,
  refinanceRate: null,
  horizonMonths: 24,
};

export const PRESET_SCENARIOS: { label: string; description: string; config: Partial<ScenarioConfig> }[] = [
  {
    label: 'Aggressive Payoff',
    description: 'Double your monthly debt payments to pay off faster',
    config: {
      extraPayment: 450,
      label: 'Aggressive Payoff',
      description: 'Double your monthly debt payments to pay off faster',
      color: '#10b981',
    },
  },
  {
    label: 'Income Boost',
    description: 'Side hustle or raise adding $800/mo to income',
    config: {
      incomeChange: 800,
      label: 'Income Boost',
      description: 'Side hustle or raise adding $800/mo to income',
      color: '#ffe0c2',
    },
  },
  {
    label: 'Expense Cut',
    description: 'Trim $400/mo from discretionary spending',
    config: {
      expenseChange: -400,
      label: 'Expense Cut',
      description: 'Trim $400/mo from discretionary spending',
      color: '#ffdfb5',
    },
  },
  {
    label: 'Emergency Shock',
    description: 'Unexpected $3,000 expense hits your savings',
    config: {
      oneTimeShock: 3000,
      label: 'Emergency Shock',
      description: 'Unexpected $3,000 expense hits your savings',
      color: '#e54d2e',
    },
  },
  {
    label: 'Refinance Play',
    description: 'Consolidate debt at 8% APR through refinancing',
    config: {
      refinanceRate: 8,
      label: 'Refinance Play',
      description: 'Consolidate debt at 8% APR through refinancing',
      color: '#f59e0b',
    },
  },
];

export const NAV_ITEMS = [
  { label: 'Dashboard', href: '/app/dashboard', icon: 'LayoutDashboard' },
  { label: 'Simulate', href: '/app/simulate', icon: 'FlaskConical' },
  { label: 'History', href: '/app/history', icon: 'History' },
  { label: 'Settings', href: '/app/settings', icon: 'Settings' },
] as const;

export const COMMAND_PALETTE_ITEMS = [
  { id: 'nav-dashboard', label: 'Go to Dashboard', group: 'Navigation', action: 'navigate', href: '/app/dashboard', icon: 'LayoutDashboard' },
  { id: 'nav-simulate', label: 'Go to Simulate', group: 'Navigation', action: 'navigate', href: '/app/simulate', icon: 'FlaskConical' },
  { id: 'nav-history', label: 'Go to History', group: 'Navigation', action: 'navigate', href: '/app/history', icon: 'History' },
  { id: 'nav-settings', label: 'Go to Settings', group: 'Navigation', action: 'navigate', href: '/app/settings', icon: 'Settings' },
  { id: 'action-new-sim', label: 'New Simulation', group: 'Actions', action: 'new-simulation', icon: 'Plus' },
  { id: 'action-reset', label: 'Reset Profile to Defaults', group: 'Actions', action: 'reset-profile', icon: 'RotateCcw' },
  { id: 'preset-aggressive', label: 'Apply: Aggressive Payoff', group: 'Presets', action: 'apply-preset', presetIndex: 0, icon: 'Zap' },
  { id: 'preset-income', label: 'Apply: Income Boost', group: 'Presets', action: 'apply-preset', presetIndex: 1, icon: 'TrendingUp' },
  { id: 'preset-expense', label: 'Apply: Expense Cut', group: 'Presets', action: 'apply-preset', presetIndex: 2, icon: 'Scissors' },
  { id: 'preset-shock', label: 'Apply: Emergency Shock', group: 'Presets', action: 'apply-preset', presetIndex: 3, icon: 'AlertTriangle' },
  { id: 'preset-refinance', label: 'Apply: Refinance Play', group: 'Presets', action: 'apply-preset', presetIndex: 4, icon: 'RefreshCw' },
  { id: 'theme-dark', label: 'Switch to Dark Mode', group: 'Theme', action: 'set-theme', theme: 'dark', icon: 'Moon' },
  { id: 'theme-light', label: 'Switch to Light Mode', group: 'Theme', action: 'set-theme', theme: 'light', icon: 'Sun' },
  { id: 'theme-system', label: 'Use System Theme', group: 'Theme', action: 'set-theme', theme: 'system', icon: 'Monitor' },
] as const;

/** @deprecated Use PRESET_SCENARIOS instead */
export const SCENARIO_PRESETS = PRESET_SCENARIOS;
