'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SimulationResult } from '@/lib/types';
import { formatCurrency } from '@/lib/formatters';
import { Calendar, Clock, Trash2, Eye } from 'lucide-react';
import { format } from 'date-fns';

interface ScenarioCardProps {
  result: SimulationResult;
  onView: (result: SimulationResult) => void;
  onDelete: (id: string) => void;
}

const verdictBadgeVariant = {
  significantly_better: 'positive' as const,
  better: 'positive' as const,
  neutral: 'neutral' as const,
  worse: 'medium' as const,
  significantly_worse: 'negative' as const,
};

const verdictLabel = {
  significantly_better: 'Significantly Better',
  better: 'Better',
  neutral: 'Neutral',
  worse: 'Worse',
  significantly_worse: 'Significantly Worse',
};

export function ScenarioCard({ result, onView, onDelete }: ScenarioCardProps) {
  const date = new Date(result.createdAt);

  return (
    <Card hover className="group">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-text-primary truncate">{result.config.label}</h3>
          <div className="flex items-center gap-3 mt-1.5">
            <span className="flex items-center gap-1 text-xs text-text-muted">
              <Calendar className="w-3 h-3" />
              {format(date, 'MMM d, yyyy')}
            </span>
            <span className="flex items-center gap-1 text-xs text-text-muted">
              <Clock className="w-3 h-3" />
              {result.config.horizonMonths} months
            </span>
          </div>
        </div>
        <Badge variant={verdictBadgeVariant[result.summary.verdict]}>
          {verdictLabel[result.summary.verdict]}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-4">
        <div className="rounded-lg bg-surface-elevated p-3">
          <p className="text-[10px] text-text-muted uppercase tracking-wider">Debt Delta</p>
          <p className={`text-sm font-bold mt-0.5 ${result.summary.finalDebtDelta <= 0 ? 'text-success' : 'text-danger'}`}>
            {result.summary.finalDebtDelta <= 0 ? '' : '+'}{formatCurrency(result.summary.finalDebtDelta)}
          </p>
        </div>
        <div className="rounded-lg bg-surface-elevated p-3">
          <p className="text-[10px] text-text-muted uppercase tracking-wider">Savings Delta</p>
          <p className={`text-sm font-bold mt-0.5 ${result.summary.finalSavingsDelta >= 0 ? 'text-success' : 'text-danger'}`}>
            {result.summary.finalSavingsDelta >= 0 ? '+' : ''}{formatCurrency(result.summary.finalSavingsDelta)}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 mt-4 pt-4 border-t border-border">
        <Button variant="ghost" size="sm" onClick={() => onDelete(result.id)} className="text-text-muted hover:text-danger">
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
        <Button variant="outline" size="sm" onClick={() => onView(result)} className="gap-1.5">
          <Eye className="w-3.5 h-3.5" />
          View Details
        </Button>
      </div>
    </Card>
  );
}
