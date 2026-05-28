'use client';

import { useAuthStore } from '@/store/auth.store';

interface HydrationGuardProps {
  children: React.ReactNode;
  /** Rendered while waiting for store hydration */
  fallback?: React.ReactNode;
}

/**
 * HydrationGuard
 *
 * Blocks rendering until the Zustand auth store has loaded from sessionStorage.
 * Without this, server-rendered HTML shows the "not authenticated" state for
 * one frame before the store hydrates, causing a visible flicker.
 *
 * Usage: wrap any component that reads auth state from the store.
 *
 * @example
 * // In a layout:
 * <HydrationGuard fallback={<DashboardSkeleton />}>
 *   <DashboardContent />
 * </HydrationGuard>
 */
export function HydrationGuard({ children, fallback = null }: HydrationGuardProps) {
  const isHydrated = useAuthStore((s) => s.isHydrated);
  if (!isHydrated) return <>{fallback}</>;
  return <>{children}</>;
}
