'use client';

import { useEffect } from 'react';

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    // In production, send to your error monitoring (Sentry, etc.)
    console.error('[GlobalError]', error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <div className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-white dark:bg-gray-950 px-4 text-center">
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
              Something went wrong
            </h1>
            <p className="max-w-sm text-gray-500 dark:text-gray-400">
              An unexpected error occurred. Our team has been notified.
            </p>
            {process.env.NODE_ENV === 'development' && (
              <pre className="mt-4 max-w-lg overflow-auto rounded-lg bg-gray-100 dark:bg-gray-900 p-4 text-left text-xs text-red-600 dark:text-red-400">
                {error.message}
              </pre>
            )}
          </div>
          <button
            onClick={reset}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
