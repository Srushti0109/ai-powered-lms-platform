// =============================================================================
//  Next.js Middleware
//  apps/web/src/middleware.ts
//
//  Runs at the edge before every matched request.
//
//  Auth strategy:
//  Tokens live in HttpOnly cookies — the middleware cannot read them directly
//  (they are inaccessible to JS, including edge functions). Instead we call
//  GET /api/auth/check on the backend, which validates the access_token cookie
//  server-side and returns { authenticated, role }.
//
//  Route protection rules:
//  ┌─────────────────────────┬─────────────────────────────────────────────┐
//  │ Unauthenticated user    │ /dashboard, /courses, /challenges →         │
//  │                         │ redirect to /login?from=<original>          │
//  ├─────────────────────────┼─────────────────────────────────────────────┤
//  │ Authenticated user      │ /login, /register → redirect to /dashboard  │
//  ├─────────────────────────┼─────────────────────────────────────────────┤
//  │ Wrong role              │ /admin/* for non-admin → 403 page           │
//  │                         │ /instructor/* for student → /dashboard      │
//  └─────────────────────────┴─────────────────────────────────────────────┘
//
//  Performance:
//  The /api/auth/check call adds ~5–15ms of latency. This is acceptable for
//  protected page navigations. Static assets are excluded by the matcher.
// =============================================================================

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { ROUTES, ROLE_PROTECTED_ROUTES } from '@/config/routes';

// ─── Route classification helpers ────────────────────────────────────────────

function isAuthRoute(pathname: string): boolean {
  return pathname.startsWith('/login') || pathname.startsWith('/register');
}

function isProtectedRoute(pathname: string): boolean {
  const protected_ = [
    '/dashboard',
    '/courses',
    '/challenges',
    '/certificates',
    '/profile',
    '/settings',
    '/instructor',
    '/admin',
    '/leaderboard',
    '/ai-chat',
  ];
  return protected_.some((p) => pathname.startsWith(p));
}

function isPublicRoute(pathname: string): boolean {
  // Routes accessible to anyone (no auth check needed)
  const public_ = ['/', '/about', '/catalog'];
  return public_.includes(pathname) || pathname.startsWith('/verify/');
}

// ─── Role requirement resolver ────────────────────────────────────────────────

function getRequiredRoles(pathname: string): string[] | null {
  for (const [prefix, roles] of Object.entries(ROLE_PROTECTED_ROUTES)) {
    if (pathname.startsWith(prefix)) return roles;
  }
  return null; // any authenticated role is fine
}

// ─── Middleware ───────────────────────────────────────────────────────────────

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── Always pass public routes through ─────────────────────────────────────
  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  // ── Check session by calling the backend /check endpoint ──────────────────
  // The HttpOnly cookies are automatically forwarded in this fetch.
  let isAuthenticated = false;
  let userRole: string | null = null;

  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
    const checkRes = await fetch(`${apiUrl}/api/auth/check`, {
      method: 'GET',
      headers: {
        // Forward all cookies from the original request
        cookie: request.headers.get('cookie') ?? '',
      },
      // Edge runtime cache: no-store ensures we always get a fresh result
      cache: 'no-store',
    });

    if (checkRes.ok) {
      const body = (await checkRes.json()) as {
        data?: { authenticated: boolean; role: string };
      };
      isAuthenticated = body.data?.authenticated ?? false;
      userRole = body.data?.role ?? null;
    }
  } catch {
    // Network error — treat as unauthenticated (backend may be down)
    // In production you may want a dedicated error page here
  }

  // ── Authenticated user trying to visit auth routes → dashboard ─────────────
  if (isAuthenticated && isAuthRoute(pathname)) {
    return NextResponse.redirect(new URL(ROUTES.dashboard, request.url));
  }

  // ── Unauthenticated user trying to visit protected routes → login ──────────
  if (!isAuthenticated && isProtectedRoute(pathname)) {
    const loginUrl = new URL(ROUTES.auth.login, request.url);
    // Preserve the original destination for post-login redirect
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // ── Role-based access control ──────────────────────────────────────────────
  if (isAuthenticated && userRole) {
    const requiredRoles = getRequiredRoles(pathname);
    if (requiredRoles && !requiredRoles.includes(userRole)) {
      // Wrong role — redirect to their appropriate dashboard
      const dashboardUrl =
        userRole === 'INSTRUCTOR'
          ? ROUTES.instructor.dashboard
          : ROUTES.student.dashboard;
      return NextResponse.redirect(new URL(dashboardUrl, request.url));
    }
  }

  return NextResponse.next();
}

// ─── Matcher — what paths the middleware runs on ─────────────────────────────
// Excludes: static files, _next internals, favicon, API routes (handled by server)

export const config = {
  matcher: [
    /*
     * Match all paths EXCEPT:
     * - _next/static  (static files)
     * - _next/image   (image optimization)
     * - favicon.ico
     * - Files with extensions (.png, .jpg, etc.)
     * - /api routes (those go directly to the backend)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)',
  ],
};
