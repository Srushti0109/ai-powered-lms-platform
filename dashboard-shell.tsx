'use client';

import { useUIStore } from '@/store/ui.store';
import { Sidebar } from '@/components/layout/sidebar/sidebar';
import { MobileSidebar } from '@/components/layout/sidebar/mobile-sidebar';
import { Navbar } from '@/components/layout/navbar/navbar';
import { cn } from '@/lib/utils/cn';

interface DashboardShellProps {
  children: React.ReactNode;
}

/**
 * DashboardShell
 *
 * The outer layout for all authenticated pages. Renders:
 * - Desktop: fixed left sidebar + sticky top navbar + scrollable main
 * - Mobile:  no sidebar (uses MobileSidebar drawer triggered from navbar)
 *
 * CSS grid approach (defined in globals.css):
 *   grid-template-areas: 'sidebar navbar' / 'sidebar main'
 *   grid-template-columns: var(--sidebar-width) 1fr
 *
 * The sidebar-collapsed variant changes the column width only —
 * content areas reflow automatically.
 */
export function DashboardShell({ children }: DashboardShellProps) {
  const collapsed = useUIStore((s) => s.sidebarCollapsed);

  return (
    <div
      className={cn(
        // Grid layout (desktop) — collapses to flex-col on mobile
        'hidden md:grid min-h-dvh',
        collapsed ? 'dashboard-layout dashboard-layout-collapsed' : 'dashboard-layout'
      )}
    >
      {/* ── Sidebar (desktop only — grid area: sidebar) ────────────────────── */}
      <div
        className="hidden md:flex"
        style={{ gridArea: 'sidebar' }}
      >
        <Sidebar />
      </div>

      {/* ── Navbar (grid area: navbar) ─────────────────────────────────────── */}
      <div style={{ gridArea: 'navbar' }}>
        <Navbar />
      </div>

      {/* ── Main content area (grid area: main) ───────────────────────────── */}
      <main
        className="overflow-y-auto"
        style={{ gridArea: 'main' }}
        id="main-content"
      >
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
}

/**
 * DashboardShellMobile
 *
 * Rendered on mobile viewports (<md).
 * Uses a flex-col layout with a sticky navbar and the MobileSidebar drawer.
 */
export function DashboardShellMobileWrapper({ children }: DashboardShellProps) {
  return (
    <div className="flex min-h-dvh flex-col md:hidden">
      <Navbar />
      <MobileSidebar />
      <main className="flex-1 overflow-y-auto" id="main-content">
        <div className="mx-auto max-w-7xl px-4 py-6">
          {children}
        </div>
      </main>
    </div>
  );
}
