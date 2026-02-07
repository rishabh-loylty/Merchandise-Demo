"use client";

import * as React from "react";
import * as AvatarPrimitive from "@radix-ui/react-avatar";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { User } from "lucide-react";

const avatarVariants = cva(
  "relative flex shrink-0 overflow-hidden rounded-full bg-muted",
  {
    variants: {
      size: {
        xs: "h-6 w-6 text-xs",
        sm: "h-8 w-8 text-xs",
        default: "h-10 w-10 text-sm",
        lg: "h-12 w-12 text-base",
        xl: "h-16 w-16 text-lg",
        "2xl": "h-20 w-20 text-xl",
      },
      shape: {
        circle: "rounded-full",
        square: "rounded-lg",
      },
    },
    defaultVariants: {
      size: "default",
      shape: "circle",
    },
  }
);

export interface AvatarProps
  extends React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>,
    VariantProps<typeof avatarVariants> {
  src?: string;
  alt?: string;
  fallback?: string;
  showBadge?: boolean;
  badgeColor?: "success" | "warning" | "destructive" | "muted";
  badgePosition?: "top-right" | "bottom-right";
}

const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  AvatarProps
>(
  (
    {
      className,
      size,
      shape,
      src,
      alt,
      fallback,
      showBadge,
      badgeColor = "success",
      badgePosition = "bottom-right",
      ...props
    },
    ref
  ) => {
    const initials = fallback
      ? fallback
          .split(" ")
          .map((word) => word[0])
          .join("")
          .toUpperCase()
          .slice(0, 2)
      : null;

    const badgeColors = {
      success: "bg-success",
      warning: "bg-warning",
      destructive: "bg-destructive",
      muted: "bg-muted-foreground",
    };

    const badgePositions = {
      "top-right": "top-0 right-0",
      "bottom-right": "bottom-0 right-0",
    };

    return (
      <div className="relative inline-flex">
        <AvatarPrimitive.Root
          ref={ref}
          className={cn(avatarVariants({ size, shape, className }))}
          {...props}
        >
          <AvatarPrimitive.Image
            src={src}
            alt={alt || "Avatar"}
            className="aspect-square h-full w-full object-cover"
          />
          <AvatarPrimitive.Fallback className="flex h-full w-full items-center justify-center bg-muted font-medium text-muted-foreground">
            {initials || <User className="h-1/2 w-1/2" />}
          </AvatarPrimitive.Fallback>
        </AvatarPrimitive.Root>
        {showBadge && (
          <span
            className={cn(
              "absolute block rounded-full ring-2 ring-background",
              badgeColors[badgeColor],
              badgePositions[badgePosition],
              size === "xs" && "h-1.5 w-1.5",
              size === "sm" && "h-2 w-2",
              size === "default" && "h-2.5 w-2.5",
              size === "lg" && "h-3 w-3",
              size === "xl" && "h-3.5 w-3.5",
              size === "2xl" && "h-4 w-4"
            )}
          />
        )}
      </div>
    );
  }
);
Avatar.displayName = "Avatar";

// Avatar group component
interface AvatarGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  max?: number;
  size?: VariantProps<typeof avatarVariants>["size"];
  children: React.ReactNode;
}

const AvatarGroup = React.forwardRef<HTMLDivElement, AvatarGroupProps>(
  ({ className, max = 5, size = "default", children, ...props }, ref) => {
    const childArray = React.Children.toArray(children);
    const visibleAvatars = childArray.slice(0, max);
    const remainingCount = childArray.length - max;

    const overlapSizes = {
      xs: "-space-x-2",
      sm: "-space-x-2.5",
      default: "-space-x-3",
      lg: "-space-x-4",
      xl: "-space-x-5",
      "2xl": "-space-x-6",
    };

    return (
      <div
        ref={ref}
        className={cn(
          "flex items-center",
          overlapSizes[size || "default"],
          className
        )}
        {...props}
      >
        {visibleAvatars.map((child, index) => (
          <div
            key={index}
            className="relative ring-2 ring-background rounded-full"
            style={{ zIndex: visibleAvatars.length - index }}
          >
            {React.isValidElement(child)
              ? React.cloneElement(child as React.ReactElement<AvatarProps>, { size })
              : child}
          </div>
        ))}
        {remainingCount > 0 && (
          <div
            className={cn(
              "relative flex items-center justify-center rounded-full bg-muted text-muted-foreground font-medium ring-2 ring-background",
              avatarVariants({ size })
            )}
            style={{ zIndex: 0 }}
          >
            +{remainingCount}
          </div>
        )}
      </div>
    );
  }
);
AvatarGroup.displayName = "AvatarGroup";

// User avatar with name/email
interface UserAvatarProps extends AvatarProps {
  name?: string;
  email?: string;
  description?: string;
  orientation?: "horizontal" | "vertical";
  reverse?: boolean;
}

const UserAvatar = React.forwardRef<HTMLDivElement, UserAvatarProps>(
  (
    {
      name,
      email,
      description,
      orientation = "horizontal",
      reverse = false,
      className,
      size = "default",
      ...avatarProps
    },
    ref
  ) => {
    const content = (
      <>
        <Avatar size={size} fallback={name} {...avatarProps} />
        {(name || email || description) && (
          <div
            className={cn(
              "flex flex-col",
              orientation === "horizontal" ? "text-left" : "text-center"
            )}
          >
            {name && (
              <span className="text-sm font-medium text-foreground leading-tight">
                {name}
              </span>
            )}
            {email && (
              <span className="text-xs text-muted-foreground leading-tight">
                {email}
              </span>
            )}
            {description && (
              <span className="text-xs text-muted-foreground leading-tight">
                {description}
              </span>
            )}
          </div>
        )}
      </>
    );

    return (
      <div
        ref={ref}
        className={cn(
          "inline-flex items-center gap-3",
          orientation === "vertical" && "flex-col gap-2",
          reverse && orientation === "horizontal" && "flex-row-reverse",
          className
        )}
      >
        {content}
      </div>
    );
  }
);
UserAvatar.displayName = "UserAvatar";

export { Avatar, AvatarGroup, UserAvatar, avatarVariants };
