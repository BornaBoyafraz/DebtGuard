'use client';

import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { FinancialIndicators } from '@/lib/types';
import { formatCurrency, formatPercent } from '@/lib/formatters';
import { DollarSign, Percent, CreditCard, PiggyBank } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MetricsGridProps {
  indicators: FinancialIndicators;
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const item = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0 },
};

export function MetricsGrid({ indicators }: MetricsGridProps) {
  const metrics = [
    {
      label: 'Monthly Cashflow',
      value: formatCurrency(indicators.cashflow),
      icon: DollarSign,
      color: indicators.cashflow >= 0 ? 'text-success' : 'text-danger',
      bgColor: indicators.cashflow >= 0 ? 'bg-success-subtle' : 'bg-danger-subtle',
    },
    {
      label: 'Debt-to-Income',
      value: formatPercent(indicators.debtToIncomeRatio * 100),
      icon: Percent,
      color: indicators.debtToIncomeRatio > 0.4 ? 'text-danger' : indicators.debtToIncomeRatio > 0.2 ? 'text-warning' : 'text-success',
      bgColor: indicators.debtToIncomeRatio > 0.4 ? 'bg-danger-subtle' : indicators.debtToIncomeRatio > 0.2 ? 'bg-warning-subtle' : 'bg-success-subtle',
    },
    {
      label: 'Payment Burden',
      value: formatPercent(indicators.paymentBurden * 100),
      icon: CreditCard,
      color: indicators.paymentBurden > 0.3 ? 'text-danger' : indicators.paymentBurden > 0.15 ? 'text-warning' : 'text-success',
      bgColor: indicators.paymentBurden > 0.3 ? 'bg-danger-subtle' : indicators.paymentBurden > 0.15 ? 'bg-warning-subtle' : 'bg-success-subtle',
    },
    {
      label: 'Savings Runway',
      value: indicators.savingsRunway === Infinity ? '∞ months' : `${indicators.savingsRunway.toFixed(1)} months`,
      icon: PiggyBank,
      color: indicators.savingsRunway < 3 ? 'text-danger' : indicators.savingsRunway < 6 ? 'text-warning' : 'text-success',
      bgColor: indicators.savingsRunway < 3 ? 'bg-danger-subtle' : indicators.savingsRunway < 6 ? 'bg-warning-subtle' : 'bg-success-subtle',
    },
  ];

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-2 lg:grid-cols-4 gap-4"
    >
      {metrics.map((metric) => {
        const Icon = metric.icon;
        return (
          <motion.div key={metric.label} variants={item}>
            <Card className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', metric.bgColor)}>
                  <Icon className={cn('w-4 h-4', metric.color)} />
                </div>
              </div>
              <p className="text-xs text-text-muted mb-1">{metric.label}</p>
              <p className={cn('text-xl font-bold', metric.color)}>{metric.value}</p>
            </Card>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
