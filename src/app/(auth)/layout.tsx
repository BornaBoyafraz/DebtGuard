'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const mountedRef = useRef(false);

  useEffect(() => {
    // Use ref to avoid cascading render — only flip state once
    if (!mountedRef.current) {
      mountedRef.current = true;
      // Schedule state update outside the synchronous effect body
      Promise.resolve().then(() => setMounted(true));
    }
  }, []);

  useEffect(() => {
    if (mounted && isAuthenticated) {
      router.replace('/app/dashboard');
    }
  }, [mounted, isAuthenticated, router]);

  if (!mounted) return null;

  if (isAuthenticated) return null;

  return <>{children}</>;
}
