'use client';

import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { GoalMode } from './goal-mode';
import { useSimulationStore } from '@/store/simulation-store';
import { useFinancialStore } from '@/store/financial-store';
import { PRESET_SCENARIOS } from '@/lib/constants';
import { ScenarioConfig } from '@/lib/types';
import { FlaskConical, RotateCcw, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ScenarioBuilderProps {
  onRun: () => void;
  loading: boolean;
  disabled: boolean;
}

export function ScenarioBuilder({ onRun, loading, disabled }: ScenarioBuilderProps) {
  const {
    scenarioConfig,
    setScenarioConfig,
    resetScenarioConfig,
    stackedScenarios,
    addStackedScenario,
    updateStackedScenario,
    removeStackedScenario,
    activeMode,
    setMode,
    currentSimulation,
  } = useSimulationStore();
  const { profile } = useFinancialStore();

  const update = (patch: Partial<ScenarioConfig>) => setScenarioConfig(patch);

  const scenarioColors = ['#ffdfb5', '#f59e0b', '#e54d2e'];

  const handleAddStacked = () => {
    if (stackedScenarios.length >= 2) return;
    addStackedScenario({
      id: `stacked-${Date.now()}`,
      label: `Scenario ${stackedScenarios.length + 2}`,
      extraPayment: 0,
      expenseChange: 0,
      incomeChange: 0,
      oneTimeShock: 0,
      newLoanAmount: 0,
      newLoanRate: 0,
      refinanceRate: null,
      horizonMonths: scenarioConfig.horizonMonths,
      color: scenarioColors[stackedScenarios.length],
    });
  };

  return (
    <Card className="lg:sticky lg:top-20">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-lg font-semibold text-text-primary">Build a Scenario</h3>
          <p className="text-xs text-text-secondary mt-0.5">Configure and test a financial decision</p>
        </div>
        <button
          onClick={resetScenarioConfig}
          className="text-text-muted hover:text-text-secondary transition-colors cursor-pointer"
          title="Reset"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      <Tabs
        value={activeMode}
        onValueChange={(v) => setMode(v as 'standard' | 'goal')}
      >
        <TabsList className="w-full mb-5">
          <TabsTrigger value="standard" className="flex-1">Standard</TabsTrigger>
          <TabsTrigger value="goal" className="flex-1">Goal Mode</TabsTrigger>
        </TabsList>

        <TabsContent value="standard">
          <div className="space-y-4">
            {/* Scenario Gallery */}
            <div>
              <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
                Presets
              </label>
              <div className="flex flex-wrap gap-2">
                {PRESET_SCENARIOS.map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() => update({
                      ...preset.config,
                      label: preset.label,
                    })}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-150 cursor-pointer',
                      scenarioConfig.label === preset.label
                        ? 'border-accent bg-accent-subtle text-accent'
                        : 'border-border bg-surface-elevated text-text-secondary hover:border-accent/50 hover:text-accent'
                    )}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            <Separator />

            <Input
              label="Scenario Name"
              placeholder="e.g., Aggressive Debt Payoff"
              value={scenarioConfig.label}
              onChange={(e) => update({ label: e.target.value })}
            />

            {/* Extra Payment with Slider */}
            <div>
              <Input
                label="Extra Debt Payment"
                type="number"
                prefix="$"
                suffix="/mo"
                value={scenarioConfig.extraPayment || ''}
                onChange={(e) => update({ extraPayment: Number(e.target.value) || 0 })}
                helperText="Additional monthly payment on top of minimum"
              />
              <div className="mt-2 px-1">
                <Slider
                  value={[scenarioConfig.extraPayment]}
                  onValueChange={(v) => update({ extraPayment: v[0] })}
                  min={0}
                  max={2000}
                  step={50}
                />
              </div>
            </div>

            <Input
              label="Expense Change"
              type="number"
              prefix="$"
              suffix="/mo"
              value={scenarioConfig.expenseChange || ''}
              onChange={(e) => update({ expenseChange: Number(e.target.value) || 0 })}
              helperText="Negative = cut expenses, Positive = increase"
            />

            <Input
              label="Income Change"
              type="number"
              prefix="$"
              suffix="/mo"
              value={scenarioConfig.incomeChange || ''}
              onChange={(e) => update({ incomeChange: Number(e.target.value) || 0 })}
              helperText="Raise, side hustle, or job loss"
            />

            <Input
              label="One-Time Expense Shock"
              type="number"
              prefix="$"
              value={scenarioConfig.oneTimeShock || ''}
              onChange={(e) => update({ oneTimeShock: Number(e.target.value) || 0 })}
              helperText="Emergency expense applied at month 1"
            />

            <Separator />

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="New Loan Amount"
                type="number"
                prefix="$"
                value={scenarioConfig.newLoanAmount || ''}
                onChange={(e) => update({ newLoanAmount: Number(e.target.value) || 0 })}
              />
              <Input
                label="New Loan Rate"
                type="number"
                suffix="%"
                step="0.1"
                value={scenarioConfig.newLoanRate || ''}
                onChange={(e) => update({ newLoanRate: Number(e.target.value) || 0 })}
              />
            </div>

            <Input
              label="Refinance to Rate"
              type="number"
              suffix="%"
              step="0.1"
              value={scenarioConfig.refinanceRate ?? ''}
              onChange={(e) => {
                const val = e.target.value;
                update({ refinanceRate: val ? Number(val) : null });
              }}
              helperText="Override existing interest rate (leave empty to keep current)"
            />

            <Separator />

            {/* Horizon */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">Horizon</label>
              <div className="inline-flex items-center gap-1 rounded-lg bg-surface-elevated p-1 w-full">
                {([12, 24, 36] as const).map((months) => (
                  <button
                    key={months}
                    onClick={() => {
                      update({ horizonMonths: months });
                      if (currentSimulation) onRun();
                    }}
                    className={cn(
                      'flex-1 py-1.5 rounded-md text-sm font-medium transition-all cursor-pointer',
                      scenarioConfig.horizonMonths === months
                        ? 'bg-accent text-accent-foreground shadow-sm'
                        : 'text-text-muted hover:text-text-secondary'
                    )}
                  >
                    {months} mo
                  </button>
                ))}
              </div>
            </div>

            {/* Stacked Scenarios */}
            {stackedScenarios.length > 0 && (
              <div className="space-y-3">
                <Separator />
                <p className="text-xs font-medium text-text-muted uppercase tracking-wider">
                  Comparison Scenarios
                </p>
                {stackedScenarios.map((sc, i) => (
                  <div key={sc.id} className="bg-surface-elevated rounded-lg p-3 border border-border relative">
                    <button
                      onClick={() => removeStackedScenario(sc.id)}
                      className="absolute top-2 right-2 text-text-muted hover:text-text-primary cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                    <div className="flex items-center gap-2 mb-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: sc.color || scenarioColors[i] }}
                      />
                      <Input
                        label="Name"
                        value={sc.label}
                        onChange={(e) => updateStackedScenario(sc.id, { label: e.target.value })}
                        className="flex-1"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        label="Extra Payment"
                        type="number"
                        prefix="$"
                        value={sc.extraPayment || ''}
                        onChange={(e) => updateStackedScenario(sc.id, { extraPayment: Number(e.target.value) || 0 })}
                      />
                      <Input
                        label="Expense Chg"
                        type="number"
                        prefix="$"
                        value={sc.expenseChange || ''}
                        onChange={(e) => updateStackedScenario(sc.id, { expenseChange: Number(e.target.value) || 0 })}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <Input
                        label="Income Chg"
                        type="number"
                        prefix="$"
                        value={sc.incomeChange || ''}
                        onChange={(e) => updateStackedScenario(sc.id, { incomeChange: Number(e.target.value) || 0 })}
                      />
                      <Input
                        label="Refi Rate"
                        type="number"
                        suffix="%"
                        step="0.1"
                        value={sc.refinanceRate ?? ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          updateStackedScenario(sc.id, { refinanceRate: val ? Number(val) : null });
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {stackedScenarios.length < 2 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddStacked}
                className="w-full"
              >
                Add Comparison Scenario
              </Button>
            )}

            <Button
              onClick={onRun}
              size="lg"
              className="w-full gap-2 mt-2"
              loading={loading}
              disabled={disabled || !scenarioConfig.label.trim()}
            >
              <FlaskConical className="w-4 h-4" />
              Run Simulation
            </Button>

            {disabled && (
              <p className="text-xs text-warning text-center">
                Set up your financial profile on the Dashboard first.
              </p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="goal">
          {profile ? (
            <GoalMode profile={profile} />
          ) : (
            <p className="text-sm text-text-secondary text-center py-8">
              Set up your financial profile on the Dashboard first.
            </p>
          )}
        </TabsContent>
      </Tabs>
    </Card>
  );
}
