'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FinancialProfile, GoalTarget, GoalSolution } from '@/lib/types';
import { Target, CheckCircle2, XCircle, Zap, ArrowRight } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';
import { useSimulationStore } from '@/store/simulation-store';

interface GoalModeProps {
  profile: FinancialProfile;
}

interface ExtendedSolution extends GoalSolution {
  engine?: 'python' | 'typescript';
}

export function GoalMode({ profile }: GoalModeProps) {
  const [goalType, setGoalType] = useState<GoalTarget['type']>('debt_free_by');
  const [targetValue, setTargetValue] = useState('');
  const [targetMonth, setTargetMonth] = useState('');
  const [solution, setSolution] = useState<ExtendedSolution | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { setScenarioConfig, setMode } = useSimulationStore();

  const handleSolve = async () => {
    setIsLoading(true);
    setSolution(null);

    const goal: GoalTarget = {
      type: goalType,
      value: goalType === 'debt_free_by' ? 0 : parseFloat(targetValue) || 0,
      byMonth: parseInt(targetMonth) || 24,
    };

    try {
      const res = await fetch('/api/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile, goal }),
      });

      if (!res.ok) throw new Error('Optimization request failed');

      const result = (await res.json()) as ExtendedSolution;
      setSolution(result);
    } catch {
      setSolution({
        achievable: false,
        explanation: 'Unable to compute optimization. Check your profile is complete.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-lg font-semibold text-text-primary mb-1">What would it take?</h3>
        <p className="text-xs text-text-secondary">
          Set a financial goal and DebtGuard will calculate exactly what needs to change.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-text-secondary mb-2">Goal Type</label>
        <Select value={goalType} onValueChange={(v) => { setGoalType(v as GoalTarget['type']); setSolution(null); }}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="debt_free_by">Pay off all debt by month X</SelectItem>
            <SelectItem value="savings_target">Reach $X in savings</SelectItem>
            <SelectItem value="risk_score_target">Get risk score below X</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {goalType === 'debt_free_by' && (
        <Input
          label="Target Month"
          type="number"
          placeholder="e.g., 18"
          value={targetMonth}
          onChange={(e) => setTargetMonth(e.target.value)}
          helperText="Which month do you want to be debt-free by?"
        />
      )}

      {goalType === 'savings_target' && (
        <>
          <Input
            label="Target Savings"
            type="number"
            prefix="$"
            placeholder="e.g., 20000"
            value={targetValue}
            onChange={(e) => setTargetValue(e.target.value)}
          />
          <Input
            label="By Month"
            type="number"
            placeholder="e.g., 24"
            value={targetMonth}
            onChange={(e) => setTargetMonth(e.target.value)}
          />
        </>
      )}

      {goalType === 'risk_score_target' && (
        <>
          <Input
            label="Target Risk Score"
            type="number"
            placeholder="e.g., 30"
            value={targetValue}
            onChange={(e) => setTargetValue(e.target.value)}
            helperText="Score between 0 and 100"
          />
          <Input
            label="By Month"
            type="number"
            placeholder="e.g., 12"
            value={targetMonth}
            onChange={(e) => setTargetMonth(e.target.value)}
          />
        </>
      )}

      <Button
        onClick={() => void handleSolve()}
        size="lg"
        className="w-full gap-2"
        loading={isLoading}
        disabled={
          (goalType === 'debt_free_by' && !targetMonth) ||
          (goalType !== 'debt_free_by' && (!targetValue || !targetMonth))
        }
      >
        <Target className="w-4 h-4" />
        Solve for Goal
      </Button>

      {solution && (
        <Card bordered className={solution.achievable ? 'border-success/20' : 'border-danger/20'}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              {solution.achievable ? (
                <CheckCircle2 className="w-5 h-5 text-success" />
              ) : (
                <XCircle className="w-5 h-5 text-danger" />
              )}
              <Badge variant={solution.achievable ? 'positive' : 'negative'}>
                {solution.achievable ? 'Achievable' : 'Not Achievable'}
              </Badge>
            </div>
            {solution.engine === 'python' && (
              <div className="flex items-center gap-1 text-xs text-accent">
                <Zap className="w-3 h-3" />
                <span>scipy</span>
              </div>
            )}
          </div>
          <p className="text-sm text-text-secondary leading-relaxed">
            {solution.explanation}
          </p>
          {solution.achievable && (
            <div className="mt-4 pt-4 border-t border-border space-y-2">
              {solution.requiredExtraPayment !== undefined && solution.requiredExtraPayment > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-text-muted">Extra Monthly Payment</span>
                  <span className="font-semibold text-text-primary">{formatCurrency(solution.requiredExtraPayment)}/mo</span>
                </div>
              )}
              {solution.requiredExpenseReduction !== undefined && solution.requiredExpenseReduction > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-text-muted">Expense Reduction</span>
                  <span className="font-semibold text-text-primary">{formatCurrency(solution.requiredExpenseReduction)}/mo</span>
                </div>
              )}
              {solution.requiredIncomeIncrease !== undefined && solution.requiredIncomeIncrease > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-text-muted">Income Increase</span>
                  <span className="font-semibold text-text-primary">{formatCurrency(solution.requiredIncomeIncrease)}/mo</span>
                </div>
              )}
              {(
                (solution.requiredExtraPayment ?? 0) > 0 ||
                (solution.requiredExpenseReduction ?? 0) > 0 ||
                (solution.requiredIncomeIncrease ?? 0) > 0
              ) && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-2 gap-1.5"
                  onClick={() => {
                    setScenarioConfig({
                      extraPayment: solution.requiredExtraPayment ?? 0,
                      expenseChange: solution.requiredExpenseReduction ? -(solution.requiredExpenseReduction) : 0,
                      incomeChange: solution.requiredIncomeIncrease ?? 0,
                    });
                    setMode('standard');
                  }}
                >
                  Apply to Scenario Builder
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              )}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
