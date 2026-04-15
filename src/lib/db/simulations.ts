import { createClient } from '@/lib/supabase/client';
import type { SimulationResult } from '@/lib/types';

interface DbSimulation {
  id: string;
  user_id: string;
  label: string;
  description: string | null;
  scenario_config: SimulationResult['config'];
  financial_profile: SimulationResult['profile'];
  baseline_path: SimulationResult['baseline'];
  scenario_path: SimulationResult['scenario'];
  summary: SimulationResult['summary'];
  decision_score: number;
  verdict: string;
  narrative: string | null;
  created_at: string;
}

function toSimulationResult(row: DbSimulation): SimulationResult {
  return {
    id: row.id,
    config: row.scenario_config,
    profile: row.financial_profile,
    baseline: row.baseline_path,
    scenario: row.scenario_path,
    summary: row.summary,
    createdAt: row.created_at,
  };
}

export async function getSimulations(userId: string): Promise<SimulationResult[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('simulations')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error || !data) return [];
  return (data as DbSimulation[]).map(toSimulationResult);
}

export async function saveSimulation(
  userId: string,
  result: SimulationResult
): Promise<{ error: string | null }> {
  const supabase = createClient();
  const { error } = await supabase.from('simulations').insert({
    id: result.id,
    user_id: userId,
    label: result.config.label,
    description: result.config.description ?? null,
    scenario_config: result.config,
    financial_profile: result.profile,
    baseline_path: result.baseline,
    scenario_path: result.scenario,
    summary: result.summary,
    decision_score: result.summary.decisionScore,
    verdict: result.summary.verdict,
    narrative: result.summary.narrative ?? null,
    created_at: result.createdAt,
  });
  return { error: error?.message ?? null };
}

export async function deleteSimulation(
  userId: string,
  id: string
): Promise<{ error: string | null }> {
  const supabase = createClient();
  const { error } = await supabase
    .from('simulations')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);
  return { error: error?.message ?? null };
}

export async function deleteAllSimulations(
  userId: string
): Promise<{ error: string | null }> {
  const supabase = createClient();
  const { error } = await supabase
    .from('simulations')
    .delete()
    .eq('user_id', userId);
  return { error: error?.message ?? null };
}

export async function getSimulationById(
  userId: string,
  id: string
): Promise<SimulationResult | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('simulations')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .single();

  if (error || !data) return null;
  return toSimulationResult(data as DbSimulation);
}
