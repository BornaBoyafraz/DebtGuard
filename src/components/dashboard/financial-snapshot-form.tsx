'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FinancialProfile } from '@/lib/types';
import { DEFAULT_PROFILE } from '@/lib/constants';
import { ShieldCheck } from 'lucide-react';

const profileSchema = z.object({
  income: z.coerce.number().min(0, 'Must be positive'),
  expenses: z.coerce.number().min(0, 'Must be positive'),
  savings: z.coerce.number().min(0, 'Must be positive'),
  totalDebt: z.coerce.number().min(0, 'Must be positive'),
  interestRate: z.coerce.number().min(0).max(100, 'Must be 0–100'),
  minimumPayment: z.coerce.number().min(0, 'Must be positive'),
});

type ProfileFormData = z.infer<typeof profileSchema>;

interface FinancialSnapshotFormProps {
  defaultValues?: FinancialProfile;
  onSubmit: (profile: FinancialProfile) => void;
  loading?: boolean;
}

export function FinancialSnapshotForm({ defaultValues, onSubmit, loading }: FinancialSnapshotFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(profileSchema) as any,
    defaultValues: defaultValues || DEFAULT_PROFILE,
  });

  return (
    <Card>
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-text-primary">Financial Snapshot</h3>
        <p className="text-sm text-text-secondary mt-1">Enter your current financial details to analyze risk.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="grid sm:grid-cols-2 gap-4">
          <Input
            label="Monthly Income"
            type="number"
            prefix="$"
            placeholder="4500"
            helperText="Your total monthly take-home pay"
            error={errors.income?.message}
            {...register('income')}
          />
          <Input
            label="Monthly Expenses"
            type="number"
            prefix="$"
            placeholder="3200"
            helperText="Rent, food, utilities, subscriptions, etc."
            error={errors.expenses?.message}
            {...register('expenses')}
          />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <Input
            label="Current Savings"
            type="number"
            prefix="$"
            placeholder="8000"
            helperText="Emergency fund + savings accounts"
            error={errors.savings?.message}
            {...register('savings')}
          />
          <Input
            label="Total Debt"
            type="number"
            prefix="$"
            placeholder="18000"
            helperText="All outstanding balances combined"
            error={errors.totalDebt?.message}
            {...register('totalDebt')}
          />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <Input
            label="Interest Rate"
            type="number"
            suffix="%"
            step="0.1"
            placeholder="18.5"
            helperText="Weighted average APR across debts"
            error={errors.interestRate?.message}
            {...register('interestRate')}
          />
          <Input
            label="Minimum Payment"
            type="number"
            prefix="$"
            placeholder="450"
            helperText="Total minimum monthly debt payments"
            error={errors.minimumPayment?.message}
            {...register('minimumPayment')}
          />
        </div>

        <Button type="submit" size="lg" className="w-full gap-2" loading={loading}>
          <ShieldCheck className="w-4 h-4" />
          Analyze Risk
        </Button>
      </form>
    </Card>
  );
}
