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
} from 'recharts';
import { Card } from '@/components/ui/card';
import { SimulationResult } from '@/lib/types';
import { getDecisionScoreColor } from '@/lib/formatters';

interface HistoryTimelineProps {
  history: SimulationResult[];
}

export function HistoryTimeline({ history }: HistoryTimelineProps) {
  const data = useMemo(() => {
    return [...history].reverse().map((result, i) => ({
      index: i + 1,
      label: result.config.label.length > 15
        ? result.config.label.slice(0, 15) + '...'
        : result.config.label,
      score: result.summary.decisionScore,
      color: getDecisionScoreColor(result.summary.decisionScore),
    }));
  }, [history]);

  if (data.length < 2) return null;

  return (
    <Card bordered className="mb-6">
      <h3 className="text-sm font-semibold text-text-primary mb-1">Your Decision Score History</h3>
      <p className="text-xs text-text-muted mb-4">Track how your scenarios compare over time</p>
      <div className="w-full h-[180px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fill: 'var(--text-muted)', fontSize: 10 }}
              tickLine={false}
              axisLine={{ stroke: 'var(--border)' }}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fill: 'var(--text-muted)', fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              width={30}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--surface-elevated)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                fontSize: '12px',
              }}
              labelStyle={{ color: 'var(--text-secondary)' }}
              formatter={(value) => [`${value}/100`, 'Decision Score']}
            />
            <Line
              type="monotone"
              dataKey="score"
              stroke="var(--accent)"
              strokeWidth={2.5}
              dot={{ r: 4, fill: 'var(--accent)', strokeWidth: 0 }}
              activeDot={{ r: 6, fill: 'var(--accent)', strokeWidth: 2, stroke: 'var(--background)' }}
              animationDuration={1000}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
