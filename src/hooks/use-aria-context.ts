'use client';

import { useMemo } from 'react';
import { useFinancialStore } from '@/store/financial-store';
import { useSimulationStore } from '@/store/simulation-store';
import { useAuthStore } from '@/store/auth-store';
import type { DebtGuardContext } from '@/lib/types';

export function useAriaContext(): DebtGuardContext {
  const { profile, riskAnalysis, hasCompletedOnboarding } = useFinancialStore();
  const { currentSimulation, history } = useSimulationStore();
  const { user } = useAuthStore();

  return useMemo((): DebtGuardContext => {
    const indicators = riskAnalysis?.indicators ?? null;

    const mappedRisk = riskAnalysis
      ? {
          score: riskAnalysis.score,
          level: riskAnalysis.level,
          drivers: riskAnalysis.drivers.map((d) => ({
            name: d.name,
            impact: d.impact,
            value: d.value,
          })),
        }
      : null;

    const mappedSimulation = currentSimulation
      ? {
          label: currentSimulation.config.label,
          decisionScore: currentSimulation.summary.decisionScore,
          verdict: currentSimulation.summary.verdict,
          finalDebtDelta: currentSimulation.summary.finalDebtDelta,
          finalSavingsDelta: currentSimulation.summary.finalSavingsDelta,
          horizonMonths: currentSimulation.config.horizonMonths,
          narrative: currentSimulation.summary.narrative ?? '',
        }
      : null;

    return {
      userName: user?.name ?? 'there',
      profile,
      indicators,
      riskAnalysis: mappedRisk,
      currentSimulation: mappedSimulation,
      savedSimulationsCount: history.length,
      hasCompletedOnboarding,
    };
  }, [profile, riskAnalysis, hasCompletedOnboarding, currentSimulation, history, user]);
}
