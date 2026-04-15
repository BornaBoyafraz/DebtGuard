'use client';

import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { SimulationSummary } from '@/lib/types';
import { formatCurrency, formatDelta } from '@/lib/formatters';
import { cn } from '@/lib/utils';

interface DeltaSummaryProps {
  summary: SimulationSummary;
}

export function DeltaSummary({ summary }: DeltaSummaryProps) {
  const cards = [
    {
      label: 'Debt Delta',
      value: summary.finalDebtDelta,
      formatted: formatDelta(summary.finalDebtDelta, 'currency'),
      isGood: summary.finalDebtDelta < 0,
      isBad: summary.finalDebtDelta > 0,
      subLabel: summary.finalDebtDelta < 0 ? 'Less debt in scenario' : summary.finalDebtDelta > 0 ? 'More debt in scenario' : 'No change',
    },
    {
      label: 'Savings Delta',
      value: summary.finalSavingsDelta,
      formatted: formatDelta(summary.finalSavingsDelta, 'currency'),
      isGood: summary.finalSavingsDelta > 0,
      isBad: summary.finalSavingsDelta < 0,
      subLabel: summary.finalSavingsDelta > 0 ? 'More savings in scenario' : summary.finalSavingsDelta < 0 ? 'Less savings in scenario' : 'No change',
    },
    {
      label: 'Risk Delta',
      value: summary.avgRiskDelta,
      formatted: formatDelta(summary.avgRiskDelta, 'score') + ' pts',
      isGood: summary.avgRiskDelta < 0,
      isBad: summary.avgRiskDelta > 0,
      subLabel: summary.avgRiskDelta < 0 ? 'Lower risk in scenario' : summary.avgRiskDelta > 0 ? 'Higher risk in scenario' : 'No change',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="grid grid-cols-1 sm:grid-cols-3 gap-4"
    >
      {cards.map((card, i) => {
        const Icon = card.isGood ? TrendingUp : card.isBad ? TrendingDown : Minus;
        return (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 + i * 0.05 }}
          >
            <Card bordered>
              <p className="text-[10px] uppercase tracking-wider text-text-muted font-medium mb-2">
                {card.label}
              </p>
              <div className="flex items-center gap-2.5">
                <div className={cn(
                  'w-8 h-8 rounded-lg flex items-center justify-center',
                  card.isGood && 'bg-success-subtle',
                  card.isBad && 'bg-danger-subtle',
                  !card.isGood && !card.isBad && 'bg-surface-elevated'
                )}>
                  <Icon className={cn(
                    'w-4 h-4',
                    card.isGood && 'text-success',
                    card.isBad && 'text-danger',
                    !card.isGood && !card.isBad && 'text-text-muted'
                  )} />
                </div>
                <p className={cn(
                  'text-xl font-bold tabular-nums',
                  card.isGood && 'text-success',
                  card.isBad && 'text-danger',
                  !card.isGood && !card.isBad && 'text-text-secondary'
                )}>
                  {card.formatted}
                </p>
              </div>
              <p className="text-[10px] text-text-muted mt-2">{card.subLabel}</p>
            </Card>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
