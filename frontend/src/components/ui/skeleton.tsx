import { cn } from "@/lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Whether to show a pulsing animation
   * @default true
   */
  animate?: boolean;
}

function Skeleton({ className, animate = true, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        "rounded-md bg-muted",
        animate && "animate-pulse",
        className
      )}
      {...props}
    />
  );
}

// Preset skeleton variants for common use cases
function SkeletonText({ className, ...props }: SkeletonProps) {
  return <Skeleton className={cn("h-4 w-full", className)} {...props} />;
}

function SkeletonCircle({ className, ...props }: SkeletonProps) {
  return <Skeleton className={cn("h-10 w-10 rounded-full", className)} {...props} />;
}

function SkeletonCard({ className, ...props }: SkeletonProps) {
  return (
    <div className={cn("space-y-3", className)} {...props}>
      <Skeleton className="h-48 w-full rounded-lg" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  );
}

function SkeletonAvatar({ className, ...props }: SkeletonProps) {
  return <Skeleton className={cn("h-12 w-12 rounded-full", className)} {...props} />;
}

function SkeletonButton({ className, ...props }: SkeletonProps) {
  return <Skeleton className={cn("h-10 w-24 rounded-md", className)} {...props} />;
}

export { Skeleton, SkeletonText, SkeletonCircle, SkeletonCard, SkeletonAvatar, SkeletonButton };
