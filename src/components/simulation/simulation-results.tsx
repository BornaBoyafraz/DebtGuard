'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { SimulationResult, MonthlySnapshot } from '@/lib/types';
import { DecisionScoreDisplay } from './decision-score';
import { NarrativePanel } from './narrative-engine';
import { DeltaSummary } from './delta-summary';
import { MetricsSummary } from './metrics-summary';
import { ScenarioVerdict } from './scenario-verdict';
import { ForkChart } from '@/components/charts/fork-chart';
import { TimelineScrubber } from '@/components/charts/timeline-scrubber';
import { DebtChart } from '@/components/charts/debt-chart';
import { SavingsChart } from '@/components/charts/savings-chart';
import { RiskScoreChart } from '@/components/charts/risk-score-chart';
import { NetWorthChart } from '@/components/charts/net-worth-chart';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useSimulationStore } from '@/store/simulation-store';
import { useSimulations } from '@/hooks/use-simulations';
import { useAuthContext } from '@/contexts/auth-context';
import { useToast } from '@/components/ui/toast';
import { generatePdfReport } from '@/components/export/pdf-report';
import { formatCurrency } from '@/lib/formatters';
import { AlertTriangle, Info, TrendingDown, TrendingUp, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AiNarrative {
  narrative: string;
  watchOuts: string[];
  confidenceRating: number;
  confidenceNote: string;
}

interface SimulationResultsProps {
  result: SimulationResult | null;
  loading: boolean;
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center py-6">
        <Skeleton className="h-4 w-24 mb-3" />
        <Skeleton className="h-16 w-32" />
        <Skeleton className="h-6 w-40 mt-3" />
      </div>
      <Skeleton className="h-[200px] rounded-xl" />
      <Skeleton className="h-[360px] rounded-xl" />
      <div className="grid grid-cols-3 gap-4">
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
      </div>
      <Skeleton className="h-[200px] rounded-xl" />
      <Skeleton className="h-[120px] rounded-xl" />
    </div>
  );
}

function DeltaIcon({ value, invert = false }: { value: number; invert?: boolean }) {
  const isGood = invert ? value < 0 : value > 0;
  const isBad = invert ? value > 0 : value < 0;
  if (isGood) return <TrendingUp className="w-3.5 h-3.5 text-success" />;
  if (isBad) return <TrendingDown className="w-3.5 h-3.5 text-danger" />;
  return <Minus className="w-3.5 h-3.5 text-text-muted" />;
}

function ScenarioComparisonRow({
  label,
  color,
  path,
  baseline,
}: {
  label: string;
  color?: string;
  path: MonthlySnapshot[];
  baseline: MonthlySnapshot[];
}) {
  const last = path[path.length - 1];
  const lastBase = baseline[baseline.length - 1];
  const debtDelta = last.debt - lastBase.debt;
  const savingsDelta = last.savings - lastBase.savings;
  const riskDelta = last.riskScore - lastBase.riskScore;

  return (
    <div className="grid grid-cols-[auto_1fr_1fr_1fr_1fr] gap-3 items-center py-2.5 border-b border-border last:border-0">
      <div className="flex items-center gap-2 min-w-[120px]">
        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color || 'var(--accent)' }} />
        <span className="text-sm font-medium text-text-primary truncate">{label}</span>
      </div>
      <div className="text-right">
        <p className="text-sm font-semibold text-text-primary">{formatCurrency(last.debt)}</p>
        <div className={cn('flex items-center justify-end gap-1 text-xs', debtDelta < 0 ? 'text-success' : debtDelta > 0 ? 'text-danger' : 'text-text-muted')}>
          <DeltaIcon value={debtDelta} invert />
          {debtDelta !== 0 ? formatCurrency(Math.abs(debtDelta)) : '—'}
        </div>
      </div>
      <div className="text-right">
        <p className="text-sm font-semibold text-text-primary">{formatCurrency(last.savings)}</p>
        <div className={cn('flex items-center justify-end gap-1 text-xs', savingsDelta > 0 ? 'text-success' : savingsDelta < 0 ? 'text-danger' : 'text-text-muted')}>
          <DeltaIcon value={savingsDelta} />
          {savingsDelta !== 0 ? formatCurrency(Math.abs(savingsDelta)) : '—'}
        </div>
      </div>
      <div className="text-right">
        <p className="text-sm font-semibold text-text-primary">{formatCurrency(last.netWorth)}</p>
      </div>
      <div className="text-right">
        <p className={cn('text-sm font-semibold', riskDelta < 0 ? 'text-success' : riskDelta > 0 ? 'text-danger' : 'text-text-primary')}>
          {last.riskScore}
        </p>
        <div className={cn('flex items-center justify-end gap-1 text-xs', riskDelta < 0 ? 'text-success' : riskDelta > 0 ? 'text-danger' : 'text-text-muted')}>
          <DeltaIcon value={riskDelta} invert />
          {riskDelta !== 0 ? Math.abs(riskDelta).toFixed(0) : '—'}
        </div>
      </div>
    </div>
  );
}

export function SimulationResults({ result, loading }: SimulationResultsProps) {
  const { scrubMonth, setScrubMonth } = useSimulationStore();
  const { save } = useSimulations();
  const { profile: authProfile } = useAuthContext();
  const { toast } = useToast();
  const [saved, setSaved] = useState(false);
  const [aiNarrative, setAiNarrative] = useState<AiNarrative | null>(null);
  const [narrativeLoading, setNarrativeLoading] = useState(false);

  useEffect(() => {
    if (!result || !process.env.NEXT_PUBLIC_SUPABASE_URL) return;
    // Defer state updates via microtask to satisfy react-hooks/set-state-in-effect
    Promise.resolve().then(() => {
      setAiNarrative(null);
      setNarrativeLoading(true);
    });
    void fetch('/api/simulation-analysis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ result, userName: authProfile?.name ?? 'there' }),
    })
      .then((res) => res.ok ? res.json() : null)
      .then((data: AiNarrative | null) => { if (data) setAiNarrative(data); })
      .finally(() => setNarrativeLoading(false));
  }, [result?.id]);  // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) return <LoadingSkeleton />;
  if (!result) return null;

  const hasAdditional = (result.additionalScenarios?.length ?? 0) > 0;

  const handleSave = async () => {
    const { error } = await save(result);
    if (error) {
      toast('Failed to save simulation. Try again.', 'error');
    } else {
      setSaved(true);
      toast('Simulation saved to history', 'success');
    }
  };

  const handleExport = () => {
    try {
      generatePdfReport(result);
      toast('Report downloaded', 'success');
    } catch {
      toast('Failed to generate report', 'error');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      {/* Decision Score */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0 }}
      >
        <Card bordered>
          <DecisionScoreDisplay
            score={result.summary.decisionScore}
            verdict={result.summary.verdict}
            verdictText={result.summary.verdictText}
          />
        </Card>
      </motion.div>

      {/* Narrative */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
      >
        {narrativeLoading ? (
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <Skeleton className="w-8 h-8 rounded-lg" />
              <Skeleton className="h-4 w-24" />
              <span className="text-xs text-text-muted animate-pulse ml-1">Analyzing...</span>
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-[90%]" />
              <Skeleton className="h-4 w-[80%]" />
              <Skeleton className="h-4 w-[85%] mt-3" />
              <Skeleton className="h-4 w-[70%]" />
            </div>
          </Card>
        ) : aiNarrative ? (
          <div className="space-y-3">
            <NarrativePanel narrative={aiNarrative.narrative} />
            {aiNarrative.watchOuts.length > 0 && (
              <Card>
                <div className="flex items-center gap-1.5 mb-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-warning" />
                  <p className="text-xs font-semibold text-warning uppercase tracking-wide">Watch Out For</p>
                </div>
                <ul className="space-y-1">
                  {aiNarrative.watchOuts.map((w, i) => (
                    <li key={i} className="text-xs text-text-secondary flex gap-2">
                      <span className="text-warning mt-0.5">•</span>
                      <span>{w}</span>
                    </li>
                  ))}
                </ul>
                <div className="flex items-center gap-1.5 text-xs text-text-muted mt-3 pt-3 border-t border-border">
                  <Info className="w-3 h-3 shrink-0" />
                  <span>Confidence: {aiNarrative.confidenceRating}/100 — {aiNarrative.confidenceNote}</span>
                </div>
              </Card>
            )}
          </div>
        ) : (
          <NarrativePanel narrative={result.summary.narrative} />
        )}
      </motion.div>

      {/* Fork Chart - Hero Visualization */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.16 }}
      >
        <Card bordered>
          <h3 className="text-base font-semibold text-text-primary mb-1">Debt Trajectory Fork</h3>
          <p className="text-xs text-text-muted mb-4">Baseline vs scenario — the area shows the divergence</p>
          <ForkChart baseline={result.baseline} scenario={result.scenario} />
        </Card>
      </motion.div>

      {/* Timeline Scrubber */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.24 }}
      >
        <TimelineScrubber
          baseline={result.baseline}
          scenario={result.scenario}
          currentMonth={scrubMonth}
          onMonthChange={setScrubMonth}
        />
      </motion.div>

      {/* Delta Summary Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.32 }}
      >
        <DeltaSummary summary={result.summary} />
      </motion.div>

      {/* Multi-Scenario Comparison Table */}
      {hasAdditional && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.38 }}
        >
          <Card bordered>
            <h3 className="text-base font-semibold text-text-primary mb-1">Scenario Comparison</h3>
            <p className="text-xs text-text-muted mb-4">
              Final-month outcomes across all scenarios vs baseline
            </p>
            <div className="grid grid-cols-[auto_1fr_1fr_1fr_1fr] gap-3 mb-1 px-0">
              <span className="text-xs font-medium text-text-muted min-w-[120px]">Scenario</span>
              <span className="text-xs font-medium text-text-muted text-right">Final Debt</span>
              <span className="text-xs font-medium text-text-muted text-right">Final Savings</span>
              <span className="text-xs font-medium text-text-muted text-right">Net Worth</span>
              <span className="text-xs font-medium text-text-muted text-right">Risk Score</span>
            </div>
            <ScenarioComparisonRow
              label={result.config.label}
              color="var(--accent)"
              path={result.scenario}
              baseline={result.baseline}
            />
            {result.additionalScenarios?.map(({ config, path }) => (
              <ScenarioComparisonRow
                key={config.id}
                label={config.label}
                color={config.color}
                path={path}
                baseline={result.baseline}
              />
            ))}
          </Card>
        </motion.div>
      )}

      {/* Detailed Charts */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: hasAdditional ? 0.46 : 0.4 }}
      >
        <Card bordered>
          <Tabs defaultValue="debt">
            <TabsList className="w-full">
              <TabsTrigger value="debt" className="flex-1">Debt</TabsTrigger>
              <TabsTrigger value="savings" className="flex-1">Savings</TabsTrigger>
              <TabsTrigger value="risk" className="flex-1">Risk</TabsTrigger>
              <TabsTrigger value="networth" className="flex-1">Net Worth</TabsTrigger>
            </TabsList>
            <TabsContent value="debt">
              <h3 className="text-sm font-semibold text-text-primary mb-3">Debt Over Time</h3>
              <DebtChart
                baseline={result.baseline}
                scenario={result.scenario}
                additionalScenarios={result.additionalScenarios}
              />
            </TabsContent>
            <TabsContent value="savings">
              <h3 className="text-sm font-semibold text-text-primary mb-3">Savings Over Time</h3>
              <SavingsChart
                baseline={result.baseline}
                scenario={result.scenario}
                additionalScenarios={result.additionalScenarios}
              />
            </TabsContent>
            <TabsContent value="risk">
              <h3 className="text-sm font-semibold text-text-primary mb-3">Risk Score Over Time</h3>
              <RiskScoreChart
                baseline={result.baseline}
                scenario={result.scenario}
                additionalScenarios={result.additionalScenarios}
              />
            </TabsContent>
            <TabsContent value="networth">
              <h3 className="text-sm font-semibold text-text-primary mb-1">Net Worth Over Time</h3>
              <p className="text-xs text-text-muted mb-3">Savings minus total debt — positive means assets exceed liabilities</p>
              <NetWorthChart
                baseline={result.baseline}
                scenario={result.scenario}
                additionalScenarios={result.additionalScenarios}
              />
            </TabsContent>
          </Tabs>
        </Card>
      </motion.div>

      {/* Comparison Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: hasAdditional ? 0.54 : 0.48 }}
      >
        <MetricsSummary result={result} />
      </motion.div>

      {/* Verdict + Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: hasAdditional ? 0.62 : 0.56 }}
      >
        <ScenarioVerdict
          summary={result.summary}
          onSave={() => void handleSave()}
          onExport={handleExport}
          saved={saved}
        />
      </motion.div>
    </motion.div>
  );
}
