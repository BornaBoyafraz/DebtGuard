'use client';

import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { FileText } from 'lucide-react';

interface NarrativePanelProps {
  narrative: string;
}

export function NarrativePanel({ narrative }: NarrativePanelProps) {
  const paragraphs = narrative.split('\n\n').filter(Boolean);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      <Card>
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-8 h-8 rounded-lg bg-surface-elevated flex items-center justify-center">
            <FileText className="w-4 h-4 text-text-secondary" />
          </div>
          <h3 className="text-base font-semibold text-text-primary">Analysis</h3>
        </div>
        <div className="space-y-4">
          {paragraphs.map((para, i) => (
            <p key={i} className="text-sm text-text-secondary leading-relaxed">
              {para}
            </p>
          ))}
        </div>
      </Card>
    </motion.div>
  );
}
