import { type HTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const skeletonVariants = cva('skeleton-shimmer', {
  variants: {
    variant: {
      text: 'h-4 w-full rounded-md',
      title: 'h-6 w-48 rounded-md',
      card: 'h-32 w-full rounded-xl',
      circle: 'rounded-full',
      chart: 'h-64 w-full rounded-xl',
    },
  },
  defaultVariants: {
    variant: 'text',
  },
});

interface SkeletonProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof skeletonVariants> {}

function Skeleton({ className, variant, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(skeletonVariants({ variant }), className)}
      aria-hidden="true"
      {...props}
    />
  );
}

export { Skeleton, skeletonVariants };
export type { SkeletonProps };
