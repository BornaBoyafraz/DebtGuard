'use client';

import { useCallback } from 'react';
import { useFinancialStore } from '@/store/financial-store';
import { computeRiskScore } from '@/lib/risk-engine';
import type { FinancialProfile, RiskAnalysis, FinancialIndicators } from '@/lib/types';

export function useFinancialState() {
  const { profile, riskAnalysis, setProfile, setRiskAnalysis } =
    useFinancialStore();

  const analyzeRisk = useCallback(
    (financialProfile: FinancialProfile) => {
      setProfile(financialProfile);
      const analysis = computeRiskScore(financialProfile);
      setRiskAnalysis(analysis);
      return analysis;
    },
    [setProfile, setRiskAnalysis]
  );

  return {
    profile,
    riskAnalysis,
    hasProfile: !!profile,
    indicators: riskAnalysis?.indicators ?? null,
    analyzeRisk,
  };
}
