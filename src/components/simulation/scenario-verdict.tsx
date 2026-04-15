'use client';

import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SimulationSummary } from '@/lib/types';
import { CheckCircle2, AlertTriangle, XCircle, MinusCircle, Sparkles, Bookmark, Download } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ScenarioVerdictProps {
  summary: SimulationSummary;
  onSave?: () => void;
  onExport?: () => void;
  saved?: boolean;
}

const verdictConfig = {
  significantly_better: {
    label: 'Significantly Better',
    icon: Sparkles,
    color: 'text-success',
    bgColor: 'bg-success-subtle',
    borderColor: 'border-success/20',
  },
  better: {
    label: 'Better',
    icon: CheckCircle2,
    color: 'text-success',
    bgColor: 'bg-success-subtle',
    borderColor: 'border-success/20',
  },
  neutral: {
    label: 'Neutral',
    icon: MinusCircle,
    color: 'text-text-secondary',
    bgColor: 'bg-surface-elevated',
    borderColor: 'border-border',
  },
  worse: {
    label: 'Worse',
    icon: AlertTriangle,
    color: 'text-warning',
    bgColor: 'bg-warning-subtle',
    borderColor: 'border-warning/20',
  },
  significantly_worse: {
    label: 'Significantly Worse',
    icon: XCircle,
    color: 'text-danger',
    bgColor: 'bg-danger-subtle',
    borderColor: 'border-danger/20',
  },
};

export function ScenarioVerdict({ summary, onSave, onExport, saved }: ScenarioVerdictProps) {
  const config = verdictConfig[summary.verdict];
  const Icon = config.icon;

  return (
    <Card className={cn('border', config.borderColor)}>
      <div className="flex items-center gap-3 mb-3">
        <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', config.bgColor)}>
          <Icon className={cn('w-5 h-5', config.color)} />
        </div>
        <div>
          <p className="text-xs text-text-muted uppercase tracking-wider font-medium">Verdict</p>
          <p className={cn('text-lg font-bold', config.color)}>{config.label}</p>
        </div>
      </div>
      <p className="text-sm text-text-secondary leading-relaxed mb-5">{summary.verdictText}</p>

      {(onSave || onExport) && (
        <div className="flex items-center gap-3">
          {onSave && (
            <Button
              variant="outline"
              size="sm"
              onClick={onSave}
              disabled={saved}
              className="gap-2"
            >
              <Bookmark className="w-3.5 h-3.5" />
              {saved ? 'Saved' : 'Save to History'}
            </Button>
          )}
          {onExport && (
            <Button variant="ghost" size="sm" onClick={onExport} className="gap-2">
              <Download className="w-3.5 h-3.5" />
              Download Report
            </Button>
          )}
        </div>
      )}
    </Card>
  );
}
