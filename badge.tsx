import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils/cn';

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:     'bg-primary/10 text-primary',
        secondary:   'bg-secondary text-secondary-foreground',
        destructive: 'bg-destructive/10 text-destructive',
        outline:     'border border-input text-foreground',
        success:     'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
        warning:     'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
        // Difficulty
        easy:        'bg-[hsl(var(--difficulty-easy)/0.15)] text-[hsl(var(--difficulty-easy))]',
        medium:      'bg-[hsl(var(--difficulty-medium)/0.15)] text-[hsl(var(--difficulty-medium))]',
        hard:        'bg-[hsl(var(--difficulty-hard)/0.15)] text-[hsl(var(--difficulty-hard))]',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}
