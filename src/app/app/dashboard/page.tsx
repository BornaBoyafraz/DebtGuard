'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FinancialSnapshotForm } from '@/components/dashboard/financial-snapshot-form';
import { RiskScoreCard } from '@/components/dashboard/risk-score-card';
import { MetricsGrid } from '@/components/dashboard/metrics-grid';
import { RiskDriversPanel } from '@/components/dashboard/risk-drivers-panel';
import { RecommendationPanel } from '@/components/dashboard/recommendation-panel';
import { IntelligenceBriefing } from '@/components/dashboard/intelligence-briefing';
import { OnboardingWizard } from '@/components/dashboard/onboarding-wizard';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useFinancialStore } from '@/store/financial-store';
import { useFinancialState } from '@/hooks/use-financial-state';
import { useFinancialProfile } from '@/hooks/use-financial-profile';
import { useAuthContext } from '@/contexts/auth-context';
import type { FinancialProfile } from '@/lib/types';
import { ClipboardList, Sparkles } from 'lucide-react';
import { ErrorBoundary } from '@/components/ui/error-boundary';

const staggerItem = (i: number) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { delay: i * 0.08, duration: 0.4 },
});

export default function DashboardPage() {
  const { profile: authProfile } = useAuthContext();
  const { profile, riskAnalysis, analyzeRisk } = useFinancialState();
  const {
    hasCompletedOnboarding,
    aiAnalysis, isAnalyzing, setAiAnalysis, setIsAnalyzing,
    setInsights, setIsLoadingInsights,
  } = useFinancialStore();
  const { isLoading: profileLoading, save: saveProfile } = useFinancialProfile();
  const [showWizard, setShowWizard] = useState(false);

  // Show wizard for first-time users once profile loads
  useEffect(() => {
    if (!profileLoading && !profile && !hasCompletedOnboarding) {
      setShowWizard(true);
    }
  }, [profileLoading, profile, hasCompletedOnboarding]);

  const handleAnalyze = async (data: FinancialProfile) => {
    // 1. Instant local computation
    const analysis = analyzeRisk(data);

    // 2. Save profile to Supabase
    void saveProfile(data);

    // 3. AI explanation + Intelligence Briefing in parallel
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return;
    setIsAnalyzing(true);
    setAiAnalysis(null);
    setIsLoadingInsights(true);
    setInsights(null);

    const riskPayload = {
      score: analysis.score,
      level: analysis.level,
      indicators: analysis.indicators,
      drivers: analysis.drivers,
    };

    try {
      const [analyzeRes, insightsRes] = await Promise.allSettled([
        fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            profile: data,
            ...riskPayload,
            userName: authProfile?.name ?? 'there',
          }),
        }),
        fetch('/api/ai/insights', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ profile: data, riskAnalysis: riskPayload }),
        }),
      ]);

      if (analyzeRes.status === 'fulfilled' && analyzeRes.value.ok) {
        const aiResult = await analyzeRes.value.json() as {
          explanation: string;
          recommendation: string;
          summary: string;
        };
        setAiAnalysis(aiResult);
      }

      if (insightsRes.status === 'fulfilled' && insightsRes.value.ok) {
        const insightsResult = await insightsRes.value.json() as { insights: import('@/lib/ai-config').InsightItem[] };
        setInsights(insightsResult.insights);
      }
    } catch {
      // AI unavailable — fall back gracefully
    } finally {
      setIsAnalyzing(false);
      setIsLoadingInsights(false);
    }
  };

  if (profileLoading) {
    return (
      <div className="max-w-5xl mx-auto w-full space-y-6">
        <Skeleton className="h-[180px] w-full rounded-xl" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!profile && !showWizard) {
    return (
      <div className="max-w-5xl mx-auto w-full">
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card bordered className="max-w-md text-center p-8">
            <div className="w-14 h-14 rounded-2xl bg-surface-elevated flex items-center justify-center mx-auto mb-4">
              <ClipboardList className="w-7 h-7 text-text-muted" />
            </div>
            <h3 className="text-lg font-semibold text-text-primary mb-2">
              Complete your financial profile
            </h3>
            <p className="text-sm text-text-secondary mb-6">
              Enter your income, expenses, savings, and debt to get started with your personalized risk analysis.
            </p>
            <Button onClick={() => setShowWizard(true)} size="lg">
              Get Started
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto w-full">
      {showWizard && <OnboardingWizard onComplete={() => setShowWizard(false)} />}

      <FinancialSnapshotForm
        defaultValues={profile || undefined}
        onSubmit={handleAnalyze}
      />

      {riskAnalysis && (
        <div className="mt-8 space-y-6">
          <motion.div {...staggerItem(0)} className="flex justify-center">
            <ErrorBoundary label="Risk score failed to render">
              <RiskScoreCard analysis={riskAnalysis} />
            </ErrorBoundary>
          </motion.div>

          <motion.div {...staggerItem(1)}>
            <ErrorBoundary label="Metrics failed to render">
              <MetricsGrid indicators={riskAnalysis.indicators} />
            </ErrorBoundary>
          </motion.div>

          <motion.div {...staggerItem(2)}>
            <ErrorBoundary label="Risk drivers failed to render">
              <RiskDriversPanel drivers={riskAnalysis.drivers} />
            </ErrorBoundary>
          </motion.div>

          {/* AI Explanation Panel */}
          <motion.div {...staggerItem(3)}>
            <Card bordered>
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-accent" />
                <h3 className="text-base font-semibold text-text-primary">AI Risk Explanation</h3>
                {isAnalyzing && (
                  <span className="text-xs text-text-muted animate-pulse">Analyzing...</span>
                )}
              </div>
              {isAnalyzing ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-[90%]" />
                  <Skeleton className="h-4 w-[80%]" />
                  <Skeleton className="h-4 w-[85%] mt-3" />
                  <Skeleton className="h-4 w-[70%]" />
                </div>
              ) : aiAnalysis ? (
                <div className="space-y-3">
                  {aiAnalysis.summary && (
                    <div className="rounded-lg bg-accent/5 border border-accent/10 px-3 py-2">
                      <p className="text-sm font-medium text-accent">{aiAnalysis.summary}</p>
                    </div>
                  )}
                  <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-line">
                    {aiAnalysis.explanation}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-text-secondary leading-relaxed">
                  {riskAnalysis.explanation}
                </p>
              )}
            </Card>
          </motion.div>

          <motion.div {...staggerItem(4)}>
            <RecommendationPanel
              analysis={{
                ...riskAnalysis,
                recommendation: aiAnalysis?.recommendation ?? riskAnalysis.recommendation,
              }}
            />
          </motion.div>

          <motion.div {...staggerItem(5)}>
            <IntelligenceBriefing />
          </motion.div>
        </div>
      )}
    </div>
  );
}
