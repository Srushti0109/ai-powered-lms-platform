'use client';

import Link from 'next/link';
import { ROUTES } from '@/config/routes';

interface LoginPageContentProps {
  redirectTo?: string;
}

/**
 * Login page content — heading + form placeholder + register link.
 * The actual <LoginForm /> with react-hook-form + Zod is built in phase 2.
 * This establishes the layout contract that the form slots into.
 */
export function LoginPageContent({ redirectTo }: LoginPageContentProps) {
  return (
    <div className="space-y-6">
      {/* Heading */}
      <div className="space-y-1.5">
        <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
        <p className="text-sm text-muted-foreground">
          Sign in to continue to your dashboard
          {redirectTo && (
            <span className="ml-1 text-xs text-muted-foreground/60">
              (you'll be returned to your previous page)
            </span>
          )}
        </p>
      </div>

      {/*
        Form slot — LoginForm is injected here in phase 2.
        Placeholder maintains the layout height so there's no CLS.
      */}
      <div
        className="space-y-4"
        aria-label="Login form — coming in phase 2"
      >
        {/* Email field skeleton */}
        <div className="space-y-1.5">
          <div className="h-4 w-12 rounded bg-muted" />
          <div className="h-10 w-full rounded-md border bg-background" />
        </div>
        {/* Password field skeleton */}
        <div className="space-y-1.5">
          <div className="h-4 w-20 rounded bg-muted" />
          <div className="h-10 w-full rounded-md border bg-background" />
        </div>
        {/* Submit button skeleton */}
        <div className="h-10 w-full rounded-md bg-primary/20" />
      </div>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            or
          </span>
        </div>
      </div>

      {/* Register link */}
      <p className="text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{' '}
        <Link
          href={ROUTES.auth.register}
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          Create one
        </Link>
      </p>
    </div>
  );
}
