import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "bg-primary/10 text-primary border border-primary/20",
        secondary:
          "bg-secondary text-secondary-foreground border border-transparent",
        outline:
          "bg-transparent border border-border text-foreground",
        success:
          "bg-success/10 text-success border border-success/20",
        warning:
          "bg-warning/10 text-warning border border-warning/20",
        destructive:
          "bg-destructive/10 text-destructive border border-destructive/20",
        info:
          "bg-blue-500/10 text-blue-600 border border-blue-500/20",
        muted:
          "bg-muted text-muted-foreground border border-transparent",
      },
      size: {
        default: "px-2.5 py-0.5 text-xs",
        sm: "px-2 py-0.5 text-[10px]",
        lg: "px-3 py-1 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  icon?: React.ReactNode;
  dot?: boolean;
  removable?: boolean;
  onRemove?: () => void;
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  (
    {
      className,
      variant,
      size,
      icon,
      dot,
      removable,
      onRemove,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn(badgeVariants({ variant, size, className }))}
        {...props}
      >
        {dot && (
          <span
            className={cn(
              "h-1.5 w-1.5 rounded-full",
              variant === "success" && "bg-success",
              variant === "warning" && "bg-warning",
              variant === "destructive" && "bg-destructive",
              variant === "info" && "bg-blue-500",
              variant === "default" && "bg-primary",
              variant === "secondary" && "bg-secondary-foreground",
              variant === "muted" && "bg-muted-foreground",
              variant === "outline" && "bg-foreground"
            )}
          />
        )}
        {icon}
        {children}
        {removable && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRemove?.();
            }}
            className="ml-0.5 rounded-full p-0.5 hover:bg-black/10 focus:outline-none"
            aria-label="Remove"
          >
            <svg
              className="h-3 w-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>
    );
  }
);
Badge.displayName = "Badge";

// Status badge helper for common status types
type StatusType =
  | "pending"
  | "approved"
  | "rejected"
  | "live"
  | "draft"
  | "archived"
  | "active"
  | "inactive"
  | "success"
  | "error"
  | "warning"
  | "info";

const statusConfig: Record<
  StatusType,
  { variant: BadgeProps["variant"]; label: string }
> = {
  pending: { variant: "warning", label: "Pending" },
  approved: { variant: "success", label: "Approved" },
  rejected: { variant: "destructive", label: "Rejected" },
  live: { variant: "success", label: "Live" },
  draft: { variant: "muted", label: "Draft" },
  archived: { variant: "muted", label: "Archived" },
  active: { variant: "success", label: "Active" },
  inactive: { variant: "muted", label: "Inactive" },
  success: { variant: "success", label: "Success" },
  error: { variant: "destructive", label: "Error" },
  warning: { variant: "warning", label: "Warning" },
  info: { variant: "info", label: "Info" },
};

interface StatusBadgeProps extends Omit<BadgeProps, "variant"> {
  status: StatusType;
  customLabel?: string;
}

const StatusBadge = React.forwardRef<HTMLDivElement, StatusBadgeProps>(
  ({ status, customLabel, dot = true, ...props }, ref) => {
    const config = statusConfig[status];
    return (
      <Badge ref={ref} variant={config.variant} dot={dot} {...props}>
        {customLabel || config.label}
      </Badge>
    );
  }
);
StatusBadge.displayName = "StatusBadge";

export { Badge, StatusBadge, badgeVariants };
