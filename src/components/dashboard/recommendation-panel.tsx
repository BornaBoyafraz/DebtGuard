'use client';

import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Lightbulb, MessageSquare } from 'lucide-react';
import { RiskAnalysis } from '@/lib/types';

interface RecommendationPanelProps {
  analysis: RiskAnalysis;
}

export function RecommendationPanel({ analysis }: RecommendationPanelProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="grid md:grid-cols-2 gap-4"
    >
      <Card>
        <div className="flex items-center gap-2 mb-3">
          <MessageSquare className="w-4 h-4 text-accent" />
          <h3 className="text-sm font-semibold text-text-primary">Analysis</h3>
        </div>
        <p className="text-sm text-text-secondary leading-relaxed">{analysis.explanation}</p>
      </Card>

      <Card className="border-accent/20 bg-accent-subtle/30">
        <div className="flex items-center gap-2 mb-3">
          <Lightbulb className="w-4 h-4 text-accent" />
          <h3 className="text-sm font-semibold text-text-primary">Recommendation</h3>
        </div>
        <p className="text-sm text-text-secondary leading-relaxed">{analysis.recommendation}</p>
      </Card>
    </motion.div>
  );
}
