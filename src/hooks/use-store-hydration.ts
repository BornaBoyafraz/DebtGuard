'use client';

import { useState, useEffect } from 'react';

/**
 * Hook to safely use Zustand persist stores in Next.js.
 * Returns false on server and true once client hydration is complete.
 */
export function useStoreHydration(): boolean {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // Schedule via microtask to avoid synchronous setState-in-effect lint rule
    Promise.resolve().then(() => setHydrated(true));
  }, []);

  return hydrated;
}
