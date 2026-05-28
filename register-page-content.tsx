'use client';

import Link from 'next/link';
import { ROUTES } from '@/config/routes';

/**
 * Register page content — heading + form placeholder + login link.
 * The actual <RegisterForm /> with role selection is built in phase 2.
 */
export function RegisterPageContent() {
  return (
    <div className="space-y-6">
      {/* Heading */}
      <div className="space-y-1.5">
        <h1 className="text-2xl font-semibold tracking-tight">
          Create an account
        </h1>
        <p className="text-sm text-muted-foreground">
          Join as a student or instructor
        </p>
      </div>

      {/*
        Form slot — RegisterForm is injected here in phase 2.
        Includes: firstName, lastName, email, password, role selector.
      */}
      <div className="space-y-4" aria-label="Register form — coming in phase 2">
        {/* Name row */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <div className="h-4 w-20 rounded bg-muted" />
            <div className="h-10 w-full rounded-md border bg-background" />
          </div>
          <div className="space-y-1.5">
            <div className="h-4 w-20 rounded bg-muted" />
            <div className="h-10 w-full rounded-md border bg-background" />
          </div>
        </div>
        {/* Email */}
        <div className="space-y-1.5">
          <div className="h-4 w-12 rounded bg-muted" />
          <div className="h-10 w-full rounded-md border bg-background" />
        </div>
        {/* Password */}
        <div className="space-y-1.5">
          <div className="h-4 w-20 rounded bg-muted" />
          <div className="h-10 w-full rounded-md border bg-background" />
        </div>
        {/* Role selector */}
        <div className="grid grid-cols-2 gap-3">
          <div className="h-16 rounded-md border bg-background" />
          <div className="h-16 rounded-md border bg-background" />
        </div>
        {/* Submit */}
        <div className="h-10 w-full rounded-md bg-primary/20" />
      </div>

      {/* Login link */}
      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link
          href={ROUTES.auth.login}
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
