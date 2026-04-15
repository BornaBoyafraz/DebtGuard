import { type HTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
  {
    variants: {
      variant: {
        low: 'bg-success-subtle text-success',
        medium: 'bg-warning-subtle text-warning',
        high: 'bg-danger-subtle text-danger',
        critical: 'bg-danger-subtle text-danger',
        positive: 'bg-success-subtle text-success',
        negative: 'bg-danger-subtle text-danger',
        neutral: 'bg-surface-elevated text-text-secondary',
        accent: 'bg-accent-subtle text-accent',
      },
    },
    defaultVariants: {
      variant: 'neutral',
    },
  }
);

interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
export type { BadgeProps };
