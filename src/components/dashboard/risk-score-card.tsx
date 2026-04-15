'use client';

import { motion } from 'framer-motion';
import { RiskAnalysis } from '@/lib/types';
import { getRiskColor } from '@/lib/formatters';
import { cn } from '@/lib/utils';

interface RiskScoreCardProps {
  analysis: RiskAnalysis;
}

export function RiskScoreCard({ analysis }: RiskScoreCardProps) {
  const { score, level } = analysis;
  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (score / 100) * circumference;
  const color = getRiskColor(level);

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-36 h-36">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          <circle
            cx="60"
            cy="60"
            r="54"
            fill="none"
            stroke="var(--surface-elevated)"
            strokeWidth="8"
          />
          <motion.circle
            cx="60"
            cy="60"
            r="54"
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            className="text-3xl font-bold"
            style={{ color }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {score}
          </motion.span>
          <span className="text-xs text-text-muted">/ 100</span>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className={cn(
          'mt-3 px-4 py-1.5 rounded-full text-sm font-semibold uppercase tracking-wide',
        )}
        style={{ backgroundColor: `${color}20`, color }}
      >
        {level} Risk
      </motion.div>
    </div>
  );
}
