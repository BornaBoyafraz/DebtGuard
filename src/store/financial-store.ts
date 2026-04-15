'use client';

import { create } from 'zustand';
import type { FinancialProfile, RiskAnalysis } from '@/lib/types';
import type { InsightItem } from '@/lib/ai-config';

interface AIAnalysis {
  explanation: string;
  recommendation: string;
  summary: string;
}

interface FinancialStore {
  profile: FinancialProfile | null;
  riskAnalysis: RiskAnalysis | null;
  aiAnalysis: AIAnalysis | null;
  isAnalyzing: boolean;
  insights: InsightItem[] | null;
  isLoadingInsights: boolean;
  hasCompletedOnboarding: boolean;
  setProfile: (profile: FinancialProfile) => void;
  setRiskAnalysis: (analysis: RiskAnalysis) => void;
  setAiAnalysis: (analysis: AIAnalysis | null) => void;
  setIsAnalyzing: (v: boolean) => void;
  setInsights: (insights: InsightItem[] | null) => void;
  setIsLoadingInsights: (v: boolean) => void;
  setOnboardingComplete: () => void;
  reset: () => void;
}

export const useFinancialStore = create<FinancialStore>((set) => ({
  profile: null,
  riskAnalysis: null,
  aiAnalysis: null,
  isAnalyzing: false,
  insights: null,
  isLoadingInsights: false,
  hasCompletedOnboarding: false,
  setProfile: (profile) => set({ profile }),
  setRiskAnalysis: (analysis) => set({ riskAnalysis: analysis }),
  setAiAnalysis: (analysis) => set({ aiAnalysis: analysis }),
  setIsAnalyzing: (v) => set({ isAnalyzing: v }),
  setInsights: (insights) => set({ insights }),
  setIsLoadingInsights: (v) => set({ isLoadingInsights: v }),
  setOnboardingComplete: () => set({ hasCompletedOnboarding: true }),
  reset: () =>
    set({
      profile: null,
      riskAnalysis: null,
      aiAnalysis: null,
      isAnalyzing: false,
      insights: null,
      isLoadingInsights: false,
      hasCompletedOnboarding: false,
    }),
}));
