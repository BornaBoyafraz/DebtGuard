'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { getRiskColor } from '@/lib/formatters';
import type { RiskLevel } from '@/lib/types';

interface RiskPulseProps {
  level: RiskLevel;
  className?: string;
}

export function RiskPulse({ level, className }: RiskPulseProps) {
  const color = getRiskColor(level);
  const shouldPulse = level === 'high' || level === 'critical';

  return (
    <span className={cn('relative inline-flex h-3 w-3', className)}>
      {shouldPulse && (
        <motion.span
          className="absolute inset-0 rounded-full"
          style={{ backgroundColor: color, opacity: 0.4 }}
          animate={{
            scale: [1, 1.8, 1],
            opacity: [0.4, 0, 0.4],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      )}
      <span
        className="relative inline-flex h-3 w-3 rounded-full"
        style={{ backgroundColor: color }}
      />
    </span>
  );
}
