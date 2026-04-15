'use client';

import { create } from 'zustand';
import type { ScenarioConfig, SimulationResult, GoalTarget } from '@/lib/types';
import { DEFAULT_SCENARIO } from '@/lib/constants';

interface SimulationStore {
  currentSimulation: SimulationResult | null;
  history: SimulationResult[];
  scenarioConfig: ScenarioConfig;
  stackedScenarios: ScenarioConfig[];
  isRunning: boolean;
  scrubMonth: number;
  activeMode: 'standard' | 'goal';
  goalTarget: GoalTarget | null;
  setScenarioConfig: (config: Partial<ScenarioConfig>) => void;
  resetScenarioConfig: () => void;
  setCurrentSimulation: (result: SimulationResult | null) => void;
  addStackedScenario: (config: ScenarioConfig) => void;
  updateStackedScenario: (id: string, patch: Partial<ScenarioConfig>) => void;
  removeStackedScenario: (id: string) => void;
  setScrubMonth: (month: number) => void;
  setMode: (mode: 'standard' | 'goal') => void;
  setGoalTarget: (target: GoalTarget | null) => void;
  saveToHistory: (result: SimulationResult) => void;
  deleteFromHistory: (id: string) => void;
  clearHistory: () => void;
  setIsRunning: (running: boolean) => void;
  reset: () => void;
}

export const useSimulationStore = create<SimulationStore>((set) => ({
  currentSimulation: null,
  history: [],
  scenarioConfig: DEFAULT_SCENARIO,
  stackedScenarios: [],
  isRunning: false,
  scrubMonth: 0,
  activeMode: 'standard',
  goalTarget: null,

  setScenarioConfig: (config) =>
    set((state) => {
      const updated = { ...state.scenarioConfig, ...config };
      // Sync horizon across all stacked scenarios when primary horizon changes
      const stackedUpdate = config.horizonMonths
        ? state.stackedScenarios.map((s) => ({ ...s, horizonMonths: config.horizonMonths! }))
        : state.stackedScenarios;
      return { scenarioConfig: updated, stackedScenarios: stackedUpdate };
    }),

  resetScenarioConfig: () => set({ scenarioConfig: DEFAULT_SCENARIO }),

  setCurrentSimulation: (result) => set({ currentSimulation: result }),

  addStackedScenario: (config) =>
    set((state) => ({
      stackedScenarios: [...state.stackedScenarios, config],
    })),

  updateStackedScenario: (id, patch) =>
    set((state) => ({
      stackedScenarios: state.stackedScenarios.map((s) =>
        s.id === id ? { ...s, ...patch } : s
      ),
    })),

  removeStackedScenario: (id) =>
    set((state) => ({
      stackedScenarios: state.stackedScenarios.filter((s) => s.id !== id),
    })),

  setScrubMonth: (month) => set({ scrubMonth: month }),

  setMode: (mode) => set({ activeMode: mode }),

  setGoalTarget: (target) => set({ goalTarget: target }),

  saveToHistory: (result) =>
    set((state) => ({
      history: [result, ...state.history.filter((h) => h.id !== result.id)],
    })),

  deleteFromHistory: (id) =>
    set((state) => ({
      history: state.history.filter((s) => s.id !== id),
    })),

  clearHistory: () => set({ history: [], currentSimulation: null }),

  setIsRunning: (running) => set({ isRunning: running }),

  reset: () =>
    set({
      currentSimulation: null,
      history: [],
      scenarioConfig: DEFAULT_SCENARIO,
      stackedScenarios: [],
      isRunning: false,
      scrubMonth: 0,
      activeMode: 'standard',
      goalTarget: null,
    }),
}));
