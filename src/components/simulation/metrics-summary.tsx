'use client';

import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { SimulationResult } from '@/lib/types';
import { formatCurrency } from '@/lib/formatters';
import { DeltaIndicator } from './delta-indicator';

interface MetricsSummaryProps {
  result: SimulationResult;
}

export function MetricsSummary({ result }: MetricsSummaryProps) {
  const { baseline, scenario, summary } = result;
  const lastBaseline = baseline[baseline.length - 1];
  const lastScenario = scenario[scenario.length - 1];
  const horizonLabel = `Month ${result.config.horizonMonths}`;

  const avgBaselineRisk = baseline.reduce((s, v) => s + v.riskScore, 0) / baseline.length;
  const avgScenarioRisk = scenario.reduce((s, v) => s + v.riskScore, 0) / scenario.length;

  const rows = [
    {
      label: `Final Debt (${horizonLabel})`,
      baseline: formatCurrency(lastBaseline.debt),
      scenario: formatCurrency(lastScenario.debt),
      delta: summary.finalDebtDelta,
      format: (v: number) => formatCurrency(v),
      invertColors: true,
    },
    {
      label: `Final Savings (${horizonLabel})`,
      baseline: formatCurrency(lastBaseline.savings),
      scenario: formatCurrency(lastScenario.savings),
      delta: summary.finalSavingsDelta,
      format: (v: number) => formatCurrency(v),
      invertColors: false,
    },
    {
      label: 'Average Risk Score',
      baseline: avgBaselineRisk.toFixed(1),
      scenario: avgScenarioRisk.toFixed(1),
      delta: summary.avgRiskDelta,
      format: (v: number) => (v > 0 ? '+' : '') + v.toFixed(1) + ' pts',
      invertColors: true,
    },
    {
      label: 'Debt Payoff Month',
      baseline: summary.baselineDebtPayoffMonth ? `Month ${summary.baselineDebtPayoffMonth}` : 'Not in period',
      scenario: summary.scenarioDebtPayoffMonth ? `Month ${summary.scenarioDebtPayoffMonth}` : 'Not in period',
      delta: null,
      format: () => '',
      invertColors: false,
    },
    {
      label: 'Savings Depletion',
      baseline: summary.baselineSavingsDepletionMonth ? `Month ${summary.baselineSavingsDepletionMonth}` : 'Stable',
      scenario: summary.scenarioSavingsDepletionMonth ? `Month ${summary.scenarioSavingsDepletionMonth}` : 'Stable',
      delta: null,
      format: () => '',
      invertColors: false,
    },
    {
      label: 'Final Monthly Cashflow',
      baseline: formatCurrency(lastBaseline.cashflow),
      scenario: formatCurrency(lastScenario.cashflow),
      delta: lastScenario.cashflow - lastBaseline.cashflow,
      format: (v: number) => formatCurrency(v),
      invertColors: false,
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <Card>
        <h3 className="text-base font-semibold text-text-primary mb-4">Summary Comparison</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 pr-4 text-text-muted font-medium">Metric</th>
                <th className="text-right py-2 px-4 text-text-muted font-medium">Baseline</th>
                <th className="text-right py-2 px-4 text-text-muted font-medium">Scenario</th>
                <th className="text-right py-2 pl-4 text-text-muted font-medium">Delta</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.label} className="border-b border-border/50 last:border-0">
                  <td className="py-3 pr-4 text-text-secondary">{row.label}</td>
                  <td className="py-3 px-4 text-right text-text-primary font-mono text-xs">{row.baseline}</td>
                  <td className="py-3 px-4 text-right text-text-primary font-mono text-xs">{row.scenario}</td>
                  <td className="py-3 pl-4 text-right">
                    {row.delta !== null ? (
                      <DeltaIndicator
                        value={row.delta}
                        label=""
                        format={row.format}
                        invertColors={row.invertColors}
                      />
                    ) : (
                      <span className="text-xs text-text-muted">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </motion.div>
  );
}
