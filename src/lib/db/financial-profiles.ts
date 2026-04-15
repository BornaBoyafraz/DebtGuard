import { createClient } from '@/lib/supabase/client';
import type { FinancialProfile } from '@/lib/types';

interface DbFinancialProfile {
  id: string;
  user_id: string;
  income: number;
  expenses: number;
  savings: number;
  total_debt: number;
  interest_rate: number;
  minimum_payment: number;
  created_at: string;
  updated_at: string;
}

function toFinancialProfile(row: DbFinancialProfile): FinancialProfile {
  return {
    income: row.income,
    expenses: row.expenses,
    savings: row.savings,
    totalDebt: row.total_debt,
    interestRate: row.interest_rate,
    minimumPayment: row.minimum_payment,
  };
}

export async function getFinancialProfile(
  userId: string
): Promise<FinancialProfile | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('financial_profiles')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;
  return toFinancialProfile(data as DbFinancialProfile);
}

export async function upsertFinancialProfile(
  userId: string,
  profile: FinancialProfile
): Promise<{ error: string | null }> {
  const supabase = createClient();

  // Check if one exists
  const { data: existing } = await supabase
    .from('financial_profiles')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();

  const payload = {
    user_id: userId,
    income: profile.income,
    expenses: profile.expenses,
    savings: profile.savings,
    total_debt: profile.totalDebt,
    interest_rate: profile.interestRate,
    minimum_payment: profile.minimumPayment,
    updated_at: new Date().toISOString(),
  };

  let error: { message: string } | null = null;

  if (existing) {
    const result = await supabase
      .from('financial_profiles')
      .update(payload)
      .eq('id', (existing as { id: string }).id);
    error = result.error;
  } else {
    const result = await supabase.from('financial_profiles').insert(payload);
    error = result.error;
  }

  return { error: error?.message ?? null };
}
