'use client';

import { useMemo } from 'react';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { MonthlySnapshot } from '@/lib/types';
import { formatCurrency } from '@/lib/formatters';
import { cn } from '@/lib/utils';

interface TimelineScrubberProps {
  baseline: MonthlySnapshot[];
  scenario: MonthlySnapshot[];
  currentMonth: number;
  onMonthChange: (month: number) => void;
}

export function TimelineScrubber({
  baseline,
  scenario,
  currentMonth,
  onMonthChange,
}: TimelineScrubberProps) {
  const maxMonth = baseline.length - 1;

  const clampedMonth = Math.min(currentMonth, maxMonth);
  const baseSnap = baseline[clampedMonth];
  const scenSnap = scenario[clampedMonth];

  const rows = useMemo(() => {
    if (!baseSnap || !scenSnap) return [];
    return [
      {
        label: 'Debt Remaining',
        baseline: formatCurrency(baseSnap.debt),
        scenario: formatCurrency(scenSnap.debt),
        better: scenSnap.debt < baseSnap.debt,
        worse: scenSnap.debt > baseSnap.debt,
      },
      {
        label: 'Savings',
        baseline: formatCurrency(baseSnap.savings),
        scenario: formatCurrency(scenSnap.savings),
        better: scenSnap.savings > baseSnap.savings,
        worse: scenSnap.savings < baseSnap.savings,
      },
      {
        label: 'Cashflow',
        baseline: formatCurrency(baseSnap.cashflow),
        scenario: formatCurrency(scenSnap.cashflow),
        better: scenSnap.cashflow > baseSnap.cashflow,
        worse: scenSnap.cashflow < baseSnap.cashflow,
      },
      {
        label: 'Risk Score',
        baseline: baseSnap.riskScore.toFixed(0),
        scenario: scenSnap.riskScore.toFixed(0),
        better: scenSnap.riskScore < baseSnap.riskScore,
        worse: scenSnap.riskScore > baseSnap.riskScore,
      },
    ];
  }, [baseSnap, scenSnap]);

  if (!baseSnap || !scenSnap) return null;

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-semibold text-text-primary">Timeline Explorer</h4>
        <span className="text-xs font-medium text-accent bg-accent-subtle px-2.5 py-1 rounded-full">
          Month {baseSnap.month}
        </span>
      </div>

      <div className="px-1 mb-6">
        <Slider
          value={[clampedMonth]}
          onValueChange={(v) => onMonthChange(v[0])}
          min={0}
          max={maxMonth}
          step={1}
        />
        <div className="flex justify-between mt-1.5">
          <span className="text-[10px] text-text-muted">Month 0</span>
          <span className="text-[10px] text-text-muted">Month {baseline[maxMonth].month}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-text-muted font-medium mb-2">Baseline</p>
          <div className="space-y-2.5">
            {rows.map((row) => (
              <div key={`b-${row.label}`}>
                <p className="text-[10px] text-text-muted">{row.label}</p>
                <p className="text-sm font-semibold text-text-primary font-mono">{row.baseline}</p>
              </div>
            ))}
            <div>
              <p className="text-[10px] text-text-muted">Risk Level</p>
              <Badge variant={baseSnap.riskLevel as 'low' | 'medium' | 'high' | 'critical'} className="mt-0.5">
                {baseSnap.riskLevel.charAt(0).toUpperCase() + baseSnap.riskLevel.slice(1)}
              </Badge>
            </div>
          </div>
        </div>

        <div>
          <p className="text-[10px] uppercase tracking-wider text-text-muted font-medium mb-2">Scenario</p>
          <div className="space-y-2.5">
            {rows.map((row) => (
              <div key={`s-${row.label}`}>
                <p className="text-[10px] text-text-muted">{row.label}</p>
                <p className={cn(
                  'text-sm font-semibold font-mono transition-colors duration-200',
                  row.better ? 'text-success' : row.worse ? 'text-danger' : 'text-text-primary'
                )}>
                  {row.scenario}
                </p>
              </div>
            ))}
            <div>
              <p className="text-[10px] text-text-muted">Risk Level</p>
              <Badge variant={scenSnap.riskLevel as 'low' | 'medium' | 'high' | 'critical'} className="mt-0.5">
                {scenSnap.riskLevel.charAt(0).toUpperCase() + scenSnap.riskLevel.slice(1)}
              </Badge>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
