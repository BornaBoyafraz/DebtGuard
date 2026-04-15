'use client';

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { formatCurrency } from '@/lib/formatters';

interface ComparisonChartProps {
  data: { label: string; baseline: number; scenario: number }[];
}

export function ComparisonChart({ data }: ComparisonChartProps) {
  return (
    <div className="w-full h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis
            dataKey="label"
            tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: 'var(--border)' }}
          />
          <YAxis
            tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: 'var(--border)' }}
            tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--surface-elevated)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              fontSize: '12px',
            }}
            labelStyle={{ color: 'var(--text-secondary)' }}
            formatter={(value) => [formatCurrency(Number(value)), undefined]}
          />
          <Bar dataKey="baseline" fill="var(--text-muted)" radius={[4, 4, 0, 0]} name="Baseline" />
          <Bar dataKey="scenario" fill="var(--accent)" radius={[4, 4, 0, 0]} name="Scenario" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
