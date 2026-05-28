import { cn } from '@/lib/utils/cn';

interface PageHeaderProps {
  title: string;
  description?: string;
  /** Optional slot for buttons/actions rendered top-right */
  actions?: React.ReactNode;
  className?: string;
}

/**
 * Standard page header used at the top of every dashboard page.
 * Provides consistent spacing, typography, and an action slot.
 *
 * @example
 * <PageHeader
 *   title="My Courses"
 *   description="Continue where you left off"
 *   actions={<Button>Browse catalog</Button>}
 * />
 */
export function PageHeader({
  title,
  description,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between',
        className
      )}
    >
      <div className="space-y-0.5">
        <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
          {title}
        </h1>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>

      {actions && (
        <div className="flex shrink-0 items-center gap-2 sm:ml-4">
          {actions}
        </div>
      )}
    </div>
  );
}
