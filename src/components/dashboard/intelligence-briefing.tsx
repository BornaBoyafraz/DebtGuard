'use client';

import { AlertTriangle, TrendingUp, Eye, Zap } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useFinancialStore } from '@/store/financial-store';
import { cn } from '@/lib/utils';
import type { InsightItem } from '@/lib/ai-config';

const INSIGHT_CONFIG = {
  warning: {
    icon: AlertTriangle,
    barClass: 'bg-warning',
    iconClass: 'text-warning',
  },
  opportunity: {
    icon: TrendingUp,
    barClass: 'bg-success',
    iconClass: 'text-success',
  },
  observation: {
    icon: Eye,
    barClass: 'bg-accent',
    iconClass: 'text-accent',
  },
} as const;

const URGENCY_CONFIG = {
  high: { label: 'High', className: 'bg-danger/10 text-danger' },
  medium: { label: 'Medium', className: 'bg-warning/10 text-warning' },
  low: { label: 'Low', className: 'bg-surface-elevated text-text-muted' },
} as const;

function InsightTile({ insight }: { insight: InsightItem }) {
  const config = INSIGHT_CONFIG[insight.type];
  const urgency = URGENCY_CONFIG[insight.urgency];
  const Icon = config.icon;

  return (
    <div className="flex gap-3 py-3 first:pt-0 last:pb-0 border-b border-border last:border-0">
      <div className={cn('w-0.5 rounded-full shrink-0 self-stretch', config.barClass)} />
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2 mb-1">
          <Icon className={cn('w-3.5 h-3.5 mt-0.5 shrink-0', config.iconClass)} />
          <p className="text-sm font-medium text-text-primary leading-snug flex-1">
            {insight.title}
          </p>
          <span
            className={cn(
              'text-[10px] font-medium px-1.5 py-0.5 rounded-full shrink-0',
              urgency.className
            )}
          >
            {urgency.label}
          </span>
        </div>
        <p className="text-xs text-text-secondary leading-relaxed pl-[22px]">
          {insight.body}
        </p>
      </div>
    </div>
  );
}

export function IntelligenceBriefing() {
  const { insights, isLoadingInsights } = useFinancialStore();

  // Only render once analysis has been triggered
  if (!isLoadingInsights && !insights) return null;

  return (
    <Card bordered>
      <div className="flex items-center gap-2 mb-4">
        <Zap className="w-4 h-4 text-accent" />
        <h3 className="text-base font-semibold text-text-primary">Intelligence Briefing</h3>
        {isLoadingInsights && (
          <span className="text-xs text-text-muted animate-pulse">Generating...</span>
        )}
      </div>

      {isLoadingInsights ? (
        <div className="space-y-3">
          <div className="flex gap-3">
            <Skeleton className="w-0.5 h-16 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-[85%]" />
            </div>
          </div>
          <div className="flex gap-3">
            <Skeleton className="w-0.5 h-14 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-[70%]" />
            </div>
          </div>
        </div>
      ) : insights && insights.length > 0 ? (
        <>
          <div className="space-y-0">
            {insights.map((insight, i) => (
              <InsightTile key={i} insight={insight} />
            ))}
          </div>
          <p className="text-[10px] text-text-muted/50 text-right mt-3">
            Powered by DebtGuard Intelligence
          </p>
        </>
      ) : null}
    </Card>
  );
}
