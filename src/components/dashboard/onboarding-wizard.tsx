'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, useSpring, useTransform } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { computeRiskScore } from '@/lib/risk-engine';
import { getRiskColor } from '@/lib/formatters';
import { useFinancialStore } from '@/store/financial-store';
import type { FinancialProfile, RiskAnalysis, RiskLevel } from '@/lib/types';

interface OnboardingWizardProps {
  onComplete: () => void;
}

const TOTAL_STEPS = 3;

const slideVariants = {
  enter: { x: 80, opacity: 0 },
  center: { x: 0, opacity: 1 },
  exit: { x: -80, opacity: 0 },
};

function StepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex gap-2 mb-6">
      {Array.from({ length: TOTAL_STEPS }, (_, i) => (
        <div
          key={i}
          className={cn(
            'h-1 flex-1 rounded-full transition-colors duration-300',
            i < currentStep ? 'bg-accent' : 'bg-surface-elevated'
          )}
        />
      ))}
    </div>
  );
}

function AnimatedRiskRing({
  score,
  level,
}: {
  score: number;
  level: RiskLevel;
}) {
  const color = getRiskColor(level);
  const radius = 72;
  const circumference = 2 * Math.PI * radius;

  const springValue = useSpring(0, { stiffness: 40, damping: 15 });
  const strokeDashoffset = useTransform(
    springValue,
    (v: number) => circumference - (v / 100) * circumference
  );

  const displayScore = useTransform(springValue, (v: number) => Math.round(v));
  const [displayedScore, setDisplayedScore] = useState(0);

  useEffect(() => {
    springValue.set(score);
    const unsubscribe = displayScore.on('change', (v) => {
      setDisplayedScore(v as number);
    });
    return () => unsubscribe();
  }, [score, springValue, displayScore]);

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-40 h-40">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
          <circle
            cx="80"
            cy="80"
            r={radius}
            fill="none"
            stroke="var(--surface-elevated)"
            strokeWidth="8"
          />
          <motion.circle
            cx="80"
            cy="80"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            style={{ strokeDashoffset }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="text-4xl font-bold"
            style={{ color }}
          >
            {displayedScore}
          </span>
          <span className="text-xs text-text-muted capitalize">
            {level} risk
          </span>
        </div>
      </div>
      <Badge
        variant={level === 'low' ? 'low' : level === 'medium' ? 'medium' : level === 'high' ? 'high' : 'critical'}
        className="mt-3 text-sm px-4 py-1"
      >
        {level.charAt(0).toUpperCase() + level.slice(1)} Risk
      </Badge>
    </div>
  );
}

export function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
  const [step, setStep] = useState(1);
  const { setProfile, setRiskAnalysis, setOnboardingComplete } =
    useFinancialStore();

  // Step 1 fields
  const [income, setIncome] = useState('');
  const [expenses, setExpenses] = useState('');
  const [step1Errors, setStep1Errors] = useState<Record<string, string>>({});

  // Step 2 fields
  const [savings, setSavings] = useState('');
  const [totalDebt, setTotalDebt] = useState('');
  const [interestRate, setInterestRate] = useState('');
  const [minimumPayment, setMinimumPayment] = useState('');
  const [step2Errors, setStep2Errors] = useState<Record<string, string>>({});

  // Step 3 computed
  const [analysis, setAnalysis] = useState<RiskAnalysis | null>(null);

  const buildProfile = useCallback((): FinancialProfile => ({
    income: parseFloat(income) || 0,
    expenses: parseFloat(expenses) || 0,
    savings: parseFloat(savings) || 0,
    totalDebt: parseFloat(totalDebt) || 0,
    interestRate: parseFloat(interestRate) || 0,
    minimumPayment: parseFloat(minimumPayment) || 0,
  }), [income, expenses, savings, totalDebt, interestRate, minimumPayment]);

  const validateStep1 = (): boolean => {
    const errors: Record<string, string> = {};
    const inc = parseFloat(income);
    const exp = parseFloat(expenses);
    if (!income || isNaN(inc) || inc <= 0) errors.income = 'Must be greater than 0';
    if (!expenses || isNaN(exp) || exp <= 0) errors.expenses = 'Must be greater than 0';
    setStep1Errors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateStep2 = (): boolean => {
    const errors: Record<string, string> = {};
    const sav = parseFloat(savings);
    const debt = parseFloat(totalDebt);
    const rate = parseFloat(interestRate);
    const minPay = parseFloat(minimumPayment);

    if (savings === '' || isNaN(sav) || sav < 0) errors.savings = 'Must be 0 or greater';
    if (totalDebt === '' || isNaN(debt) || debt < 0) errors.totalDebt = 'Must be 0 or greater';
    if (interestRate === '' || isNaN(rate) || rate < 0 || rate > 100) errors.interestRate = 'Must be between 0 and 100';
    if (!minimumPayment || isNaN(minPay) || minPay <= 0) errors.minimumPayment = 'Must be greater than 0';
    setStep2Errors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleStep1Continue = () => {
    if (validateStep1()) {
      setStep(2);
    }
  };

  const handleStep2Continue = () => {
    if (validateStep2()) {
      const profile = buildProfile();
      const result = computeRiskScore(profile);
      setAnalysis(result);
      setStep(3);
    }
  };

  const handleComplete = () => {
    const profile = buildProfile();
    setProfile(profile);
    if (analysis) {
      setRiskAnalysis(analysis);
    }
    setOnboardingComplete();
    onComplete();
  };

  const handleSkip = () => {
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-xl flex items-center justify-center p-4">
      <div className="max-w-lg w-full bg-surface border border-border rounded-2xl p-8 shadow-2xl relative">
        <button
          onClick={handleSkip}
          className="absolute top-4 right-4 text-text-muted hover:text-text-primary text-sm transition-colors cursor-pointer"
        >
          Skip
        </button>

        <StepIndicator currentStep={step} />

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step-1"
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: 'easeInOut' }}
            >
              <h2 className="text-xl font-bold text-text-primary mb-1">
                Your Income and Expenses
              </h2>
              <p className="text-sm text-text-secondary mb-6">
                This tells us your basic cashflow position.
              </p>

              <div className="space-y-4">
                <Input
                  label="Monthly Income"
                  type="number"
                  prefix="$"
                  placeholder="4500"
                  value={income}
                  onChange={(e) => setIncome(e.target.value)}
                  error={step1Errors.income}
                />
                <Input
                  label="Monthly Expenses"
                  type="number"
                  prefix="$"
                  placeholder="3200"
                  value={expenses}
                  onChange={(e) => setExpenses(e.target.value)}
                  error={step1Errors.expenses}
                />
              </div>

              <Button
                onClick={handleStep1Continue}
                size="lg"
                className="w-full mt-6"
              >
                Continue
              </Button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step-2"
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: 'easeInOut' }}
            >
              <h2 className="text-xl font-bold text-text-primary mb-1">
                Your Debt and Savings
              </h2>
              <p className="text-sm text-text-secondary mb-6">
                We use this to calculate your risk exposure.
              </p>

              <div className="space-y-4">
                <Input
                  label="Total Savings"
                  type="number"
                  prefix="$"
                  placeholder="8000"
                  value={savings}
                  onChange={(e) => setSavings(e.target.value)}
                  error={step2Errors.savings}
                />
                <Input
                  label="Total Debt"
                  type="number"
                  prefix="$"
                  placeholder="18000"
                  value={totalDebt}
                  onChange={(e) => setTotalDebt(e.target.value)}
                  error={step2Errors.totalDebt}
                />
                <Input
                  label="Interest Rate (APR)"
                  type="number"
                  suffix="%"
                  step="0.1"
                  placeholder="18.5"
                  value={interestRate}
                  onChange={(e) => setInterestRate(e.target.value)}
                  error={step2Errors.interestRate}
                />
                <Input
                  label="Minimum Monthly Payment"
                  type="number"
                  prefix="$"
                  placeholder="450"
                  value={minimumPayment}
                  onChange={(e) => setMinimumPayment(e.target.value)}
                  error={step2Errors.minimumPayment}
                />
              </div>

              <Button
                onClick={handleStep2Continue}
                size="lg"
                className="w-full mt-6"
              >
                Continue
              </Button>
            </motion.div>
          )}

          {step === 3 && analysis && (
            <motion.div
              key="step-3"
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: 'easeInOut' }}
            >
              <h2 className="text-xl font-bold text-text-primary mb-1">
                Your Risk Analysis
              </h2>
              <p className="text-sm text-text-secondary mb-6">
                Here is your personalized financial risk assessment.
              </p>

              <div className="flex justify-center mb-6">
                <AnimatedRiskRing
                  score={analysis.score}
                  level={analysis.level}
                />
              </div>

              <p className="text-sm text-text-secondary text-center leading-relaxed mb-6">
                {analysis.explanation}
              </p>

              <Button
                onClick={handleComplete}
                size="lg"
                className="w-full"
              >
                Enter My Workspace
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
