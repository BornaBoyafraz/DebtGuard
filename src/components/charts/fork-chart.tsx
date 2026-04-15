'use client';

import { useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import { MonthlySnapshot } from '@/lib/types';
import { formatCurrency } from '@/lib/formatters';

interface ForkChartProps {
  baseline: MonthlySnapshot[];
  scenario: MonthlySnapshot[];
  height?: number;
}

export function ForkChart({ baseline, scenario, height = 360 }: ForkChartProps) {
  const data = useMemo(() => {
    return baseline.map((b, i) => {
      const s = scenario[i];
      const baseDebt = Math.round(b.debt);
      const scenDebt = Math.round(s.debt);
      const scenarioBetter = scenDebt <= baseDebt;

      return {
        month: b.month,
        monthLabel: `Mo ${b.month}`,
        Baseline: baseDebt,
        Scenario: scenDebt,
        betterFill: scenarioBetter ? [scenDebt, baseDebt] : [baseDebt, baseDebt],
        worseFill: !scenarioBetter ? [baseDebt, scenDebt] : [scenDebt, scenDebt],
      };
    });
  }, [baseline, scenario]);

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
          <defs>
            <linearGradient id="betterGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity={0.25} />
              <stop offset="100%" stopColor="#10b981" stopOpacity={0.05} />
            </linearGradient>
            <linearGradient id="worseGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#e54d2e" stopOpacity={0.25} />
              <stop offset="100%" stopColor="#e54d2e" stopOpacity={0.05} />
            </linearGradient>
          </defs>
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
            labelStyle={{ color: 'var(--text-secondary)', fontSize: '11px', marginBottom: '4px' }}
            formatter={(value) => [formatCurrency(Number(value)), undefined]}
            labelFormatter={(label) => `Month ${String(label).replace('Mo ', '')}`}
          />
          <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
          <Area
            type="monotone"
            dataKey="Baseline"
            stroke="none"
            fill="url(#worseGradient)"
            fillOpacity={1}
            animationDuration={1200}
            legendType="none"
            tooltipType="none"
          />
          <Area
            type="monotone"
            dataKey="Scenario"
            stroke="none"
            fill="url(#betterGradient)"
            fillOpacity={1}
            animationDuration={1200}
            legendType="none"
            tooltipType="none"
          />
          <Line
            type="monotone"
            dataKey="Baseline"
            stroke="var(--text-muted)"
            strokeWidth={2}
            strokeDasharray="6 3"
            dot={false}
            animationDuration={1200}
          />
          <Line
            type="monotone"
            dataKey="Scenario"
            stroke="var(--accent)"
            strokeWidth={2.5}
            dot={false}
            animationDuration={1200}
            animationBegin={200}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
