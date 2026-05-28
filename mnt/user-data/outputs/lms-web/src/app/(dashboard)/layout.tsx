import type { Metadata } from 'next';
import { DashboardShell } from '@/components/layout/dashboard/dashboard-shell';

export const metadata: Metadata = {
  title: {
    template: '%s | LMS Platform',
    default: 'Dashboard',
  },
};

interface DashboardLayoutProps {
  children: React.ReactNode;
}

/**
 * (dashboard) group layout
 *
 * Wraps every authenticated page in the sidebar + navbar shell.
 * Applied to: /dashboard, /courses, /challenges, /profile, /settings,
 *             /instructor/*, /admin/*, /certificates, /leaderboard, /ai-chat
 */
export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return <DashboardShell>{children}</DashboardShell>;
}
