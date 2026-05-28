'use client';

import { useAuthStore } from '@/store/auth.store';
import type { Role } from '@lms/types';

interface RoleGuardProps {
  /** Roles allowed to see the children */
  roles: Role[];
  children: React.ReactNode;
  /** Rendered when the user doesn't have the required role */
  fallback?: React.ReactNode;
}

/**
 * RoleGuard — client-side component-level role protection.
 *
 * Used to conditionally show UI sections based on role WITHOUT a page redirect.
 * For full page-level protection, middleware handles the redirect.
 *
 * @example
 * // Show "Create course" button only to instructors/admins:
 * <RoleGuard roles={[Role.INSTRUCTOR, Role.ADMIN]}>
 *   <Button>Create course</Button>
 * </RoleGuard>
 *
 * // Show different content per role:
 * <RoleGuard roles={[Role.ADMIN]} fallback={<StudentDashboard />}>
 *   <AdminDashboard />
 * </RoleGuard>
 */
export function RoleGuard({ roles, children, fallback = null }: RoleGuardProps) {
  const userRole = useAuthStore((s) => s.user?.role);
  const isHydrated = useAuthStore((s) => s.isHydrated);

  // Don't render anything until store is hydrated (avoids role flicker)
  if (!isHydrated) return null;

  if (!userRole || !roles.includes(userRole as Role)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
