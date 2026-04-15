'use client';

import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RiskDriver } from '@/lib/types';
import { AlertTriangle } from 'lucide-react';

interface RiskDriversPanelProps {
  drivers: RiskDriver[];
}

export function RiskDriversPanel({ drivers }: RiskDriversPanelProps) {
  if (drivers.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-4 h-4 text-warning" />
          <h3 className="text-base font-semibold text-text-primary">Risk Drivers</h3>
        </div>
        <div className="space-y-4">
          {drivers.slice(0, 3).map((driver, i) => (
            <div key={i} className="flex items-start gap-3">
              <Badge
                variant={
                  driver.impact === 'high' ? 'negative' :
                  driver.impact === 'medium' ? 'medium' : 'neutral'
                }
                className="mt-0.5 shrink-0"
              >
                {driver.impact}
              </Badge>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-text-primary">{driver.name}</p>
                  <span className="text-xs text-text-muted font-mono shrink-0">{driver.value}</span>
                </div>
                <p className="text-xs text-text-secondary mt-0.5 leading-relaxed">{driver.description}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </motion.div>
  );
}
