import { cn } from '@/lib/utils/cn';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeMap = {
  sm: 'h-4 w-4 border-2',
  md: 'h-6 w-6 border-2',
  lg: 'h-8 w-8 border-[3px]',
} as const;

/**
 * LoadingSpinner — lightweight CSS spinner.
 * Use for inline loading states within components.
 */
export function LoadingSpinner({ size = 'md', className }: SpinnerProps) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={cn(
        'animate-spin rounded-full border-muted-foreground/20 border-t-primary',
        sizeMap[size],
        className
      )}
    />
  );
}

interface PageLoaderProps {
  message?: string;
}

/**
 * PageLoader — full-page centred loading state.
 * Used as the Suspense fallback for heavy page-level components.
 */
export function PageLoader({ message }: PageLoaderProps) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
      <LoadingSpinner size="lg" />
      {message && (
        <p className="text-sm text-muted-foreground">{message}</p>
      )}
    </div>
  );
}
