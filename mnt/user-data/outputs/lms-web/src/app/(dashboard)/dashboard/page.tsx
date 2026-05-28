import type { Metadata } from 'next';
import { PageHeader } from '@/components/layout/dashboard/page-header';

export const metadata: Metadata = { title: 'Dashboard' };

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Welcome back — here's what's happening."
      />
      {/*
        Feature content mounts here in phase 2:
        <StudentDashboard />  or  <InstructorDashboard />  or  <AdminDashboard />
        based on the authenticated user's role.
      */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="h-32 rounded-lg border bg-card animate-pulse"
          />
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {[...Array(2)].map((_, i) => (
          <div
            key={i}
            className="h-64 rounded-lg border bg-card animate-pulse"
          />
        ))}
      </div>
    </div>
  );
}
