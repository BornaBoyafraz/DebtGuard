'use client';

import { useEffect, useState } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { getDecisionScoreColor, getVerdictColor } from '@/lib/formatters';
import { VerdictLevel } from '@/lib/types';

interface DecisionScoreDisplayProps {
  score: number;
  verdict: VerdictLevel;
  verdictText: string;
}

const verdictLabels: Record<VerdictLevel, string> = {
  significantly_better: 'Significantly Better',
  better: 'Better',
  neutral: 'Neutral',
  worse: 'Worse',
  significantly_worse: 'Significantly Worse',
};

export function DecisionScoreDisplay({ score, verdict, verdictText }: DecisionScoreDisplayProps) {
  const springValue = useSpring(0, { stiffness: 30, damping: 12 });
  const displayValue = useTransform(springValue, (v: number) => Math.round(v));
  const [displayed, setDisplayed] = useState(0);

  useEffect(() => {
    springValue.set(score);
    const unsub = displayValue.on('change', (v) => setDisplayed(v as number));
    return () => unsub();
  }, [score, springValue, displayValue]);

  const color = getDecisionScoreColor(score);
  const verdictColor = getVerdictColor(verdict);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center text-center py-6"
    >
      <p className="text-[10px] uppercase tracking-[0.15em] text-text-muted font-medium mb-3">
        Decision Score
      </p>
      <div className="relative">
        <span
          className="text-6xl font-bold tabular-nums"
          style={{ color }}
        >
          {displayed}
        </span>
        <span className="text-lg text-text-muted font-medium ml-1">/100</span>
      </div>
      <div
        className="inline-flex items-center gap-2 mt-3 px-3 py-1 rounded-full text-xs font-semibold"
        style={{ backgroundColor: `${verdictColor}15`, color: verdictColor }}
      >
        {verdictLabels[verdict]}
      </div>
      <p className="text-sm text-text-secondary mt-3 max-w-md leading-relaxed">
        {verdictText}
      </p>
    </motion.div>
  );
}
