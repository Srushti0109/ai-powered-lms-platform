import type { Metadata } from 'next';
import { AuthShell } from '@/components/layout/auth/auth-shell';

export const metadata: Metadata = {
  title: {
    template: '%s | LMS Platform',
    default: 'Sign in',
  },
};

interface AuthLayoutProps {
  children: React.ReactNode;
}

/**
 * (auth) group layout
 *
 * Wraps /login and /register in the full-page centered shell.
 * Does not include the dashboard navbar/sidebar.
 */
export default function AuthLayout({ children }: AuthLayoutProps) {
  return <AuthShell>{children}</AuthShell>;
}
