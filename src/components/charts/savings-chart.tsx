'use client';

import { useMemo } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';
import { MonthlySnapshot, ScenarioConfig } from '@/lib/types';
import { formatCurrency } from '@/lib/formatters';

interface SavingsChartProps {
  baseline: MonthlySnapshot[];
  scenario: MonthlySnapshot[];
  additionalScenarios?: { config: ScenarioConfig; path: MonthlySnapshot[] }[];
}

const ADDITIONAL_COLORS = ['#ffdfb5', '#f59e0b', '#e54d2e'];

export function SavingsChart({ baseline, scenario, additionalScenarios }: SavingsChartProps) {
  const data = useMemo(() => {
    return baseline.map((b, i) => {
      const entry: Record<string, number | string> = {
        month: `Mo ${b.month}`,
        Baseline: Math.round(b.savings),
        Scenario: Math.round(scenario[i].savings),
      };
      additionalScenarios?.forEach(({ config, path }) => {
        entry[config.label] = Math.round(path[i]?.savings ?? 0);
      });
      return entry;
    });
  }, [baseline, scenario, additionalScenarios]);

  return (
    <div className="w-full h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis
            dataKey="month"
            tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: 'var(--border)' }}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v}`}
            width={55}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--surface-elevated)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              fontSize: '12px',
              padding: '8px 12px',
            }}
            labelStyle={{ color: 'var(--text-secondary)', fontSize: '11px' }}
            formatter={(value) => [formatCurrency(Number(value)), undefined]}
          />
          <Legend wrapperStyle={{ fontSize: '12px', color: 'var(--text-secondary)' }} />
          <Line
            type="monotone"
            dataKey="Baseline"
            stroke="var(--text-muted)"
            strokeWidth={2}
            dot={false}
            strokeDasharray="6 3"
            animationDuration={1000}
          />
          <Line
            type="monotone"
            dataKey="Scenario"
            stroke="var(--accent)"
            strokeWidth={2.5}
            dot={false}
            animationDuration={1000}
            animationBegin={200}
          />
          {additionalScenarios?.map(({ config }, idx) => (
            <Line
              key={config.id}
              type="monotone"
              dataKey={config.label}
              stroke={config.color || ADDITIONAL_COLORS[idx % ADDITIONAL_COLORS.length]}
              strokeWidth={2}
              dot={false}
              animationDuration={1000}
              animationBegin={400 + idx * 100}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
