'use client';

import { type ReactNode } from 'react';
import { AuthProvider } from '@/contexts/auth-context';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ToastContainer } from '@/components/ui/toast';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <TooltipProvider>
        <ToastContainer>{children}</ToastContainer>
      </TooltipProvider>
    </AuthProvider>
  );
}
