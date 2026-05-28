import Link from 'next/link';
import { env } from '@/config/env';

interface AuthShellProps {
  children: React.ReactNode;
}

/**
 * Full-page layout for authentication pages.
 *
 * Desktop: left brand panel (40%) + right form panel (60%)
 * Mobile:  stacked — brand strip + form
 */
export function AuthShell({ children }: AuthShellProps) {
  return (
    <div className="min-h-dvh bg-background lg:grid lg:grid-cols-5">
      {/* ── Brand panel (desktop left, hidden on mobile) ───────────────────── */}
      <div className="relative hidden lg:col-span-2 lg:flex lg:flex-col bg-[hsl(var(--sidebar-bg))] border-r">
        {/* Top logo */}
        <div className="p-8">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
              L
            </div>
            <span className="text-lg font-semibold tracking-tight">
              {env.appName}
            </span>
          </Link>
        </div>

        {/* Centre copy */}
        <div className="flex flex-1 flex-col justify-center px-10 pb-16">
          <blockquote className="space-y-4">
            <p className="text-xl font-medium leading-relaxed text-foreground">
              "The best way to predict the future is to create it."
            </p>
            <div className="space-y-0.5">
              <p className="text-sm font-medium text-foreground">Peter Drucker</p>
              <p className="text-xs text-muted-foreground">Management consultant</p>
            </div>
          </blockquote>

          {/* Feature pills */}
          <div className="mt-10 space-y-2">
            {[
              'AI-powered doubt assistant',
              'Live coding judge with 4 languages',
              'Auto-graded quizzes & certificates',
            ].map((feature) => (
              <div key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                {feature}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom legal */}
        <p className="p-8 text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} {env.appName}. All rights reserved.
        </p>
      </div>

      {/* ── Form panel ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col items-center justify-center lg:col-span-3 px-4 py-12 sm:px-8">
        {/* Mobile logo */}
        <div className="mb-8 flex items-center gap-2 lg:hidden">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
            L
          </div>
          <span className="text-lg font-semibold">{env.appName}</span>
        </div>

        {/* Auth card */}
        <div className="w-full max-w-[400px]">
          {children}
        </div>
      </div>
    </div>
  );
}
