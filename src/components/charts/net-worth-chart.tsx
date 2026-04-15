'use client';

import { useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import { MonthlySnapshot, ScenarioConfig } from '@/lib/types';
import { formatCurrency } from '@/lib/formatters';

interface NetWorthChartProps {
  baseline: MonthlySnapshot[];
  scenario: MonthlySnapshot[];
  additionalScenarios?: { config: ScenarioConfig; path: MonthlySnapshot[] }[];
  height?: number;
}

export function NetWorthChart({
  baseline,
  scenario,
  additionalScenarios,
  height = 300,
}: NetWorthChartProps) {
  const data = useMemo(() => {
    return baseline.map((b, i) => {
      const s = scenario[i];
      const entry: Record<string, number | string> = {
        monthLabel: `Mo ${b.month}`,
        Baseline: Math.round(b.netWorth),
        Scenario: Math.round(s.netWorth),
      };
      additionalScenarios?.forEach(({ config, path }) => {
        entry[config.label] = Math.round(path[i]?.netWorth ?? 0);
      });
      return entry;
    });
  }, [baseline, scenario, additionalScenarios]);

  const additionalColors = ['#ffdfb5', '#f59e0b', '#e54d2e'];

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis
            dataKey="monthLabel"
            tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: 'var(--border)' }}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) =>
              v >= 1000 ? `$${(v / 1000).toFixed(0)}k` :
              v <= -1000 ? `-$${(Math.abs(v) / 1000).toFixed(0)}k` :
              `$${v}`
            }
            width={60}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--surface-elevated)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              fontSize: '12px',
              padding: '8px 12px',
            }}
            labelStyle={{ color: 'var(--text-secondary)', fontSize: '11px', marginBottom: '4px' }}
            formatter={(value) => [formatCurrency(Number(value)), undefined]}
            labelFormatter={(label) => `Month ${String(label).replace('Mo ', '')}`}
          />
          <ReferenceLine y={0} stroke="var(--border)" strokeWidth={1.5} strokeDasharray="4 2" />
          <Line
            type="monotone"
            dataKey="Baseline"
            stroke="var(--text-muted)"
            strokeWidth={2}
            strokeDasharray="6 3"
            dot={false}
            animationDuration={1000}
          />
          <Line
            type="monotone"
            dataKey="Scenario"
            stroke="var(--accent)"
            strokeWidth={2.5}
            dot={false}
            animationDuration={1000}
            animationBegin={150}
          />
          {additionalScenarios?.map(({ config }, idx) => (
            <Line
              key={config.id}
              type="monotone"
              dataKey={config.label}
              stroke={config.color || additionalColors[idx % additionalColors.length]}
              strokeWidth={2}
              dot={false}
              animationDuration={1000}
              animationBegin={300 + idx * 100}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
