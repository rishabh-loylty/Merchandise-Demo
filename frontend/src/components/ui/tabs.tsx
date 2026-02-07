"use client";

import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const Tabs = TabsPrimitive.Root;

const tabsListVariants = cva(
  "inline-flex items-center justify-center text-muted-foreground",
  {
    variants: {
      variant: {
        default:
          "h-10 rounded-lg bg-muted p-1 gap-1",
        underline:
          "border-b border-border gap-4 bg-transparent h-auto p-0 rounded-none",
        pills:
          "gap-2 bg-transparent p-0 rounded-none",
        cards:
          "gap-2 bg-transparent p-0 rounded-none",
      },
      size: {
        default: "",
        sm: "h-9 text-xs",
        lg: "h-12 text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface TabsListProps
  extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>,
    VariantProps<typeof tabsListVariants> {}

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  TabsListProps
>(({ className, variant, size, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(tabsListVariants({ variant, size, className }))}
    data-variant={variant}
    {...props}
  />
));
TabsList.displayName = TabsPrimitive.List.displayName;

const tabsTriggerVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "rounded-md px-3 py-1.5 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm",
        underline:
          "border-b-2 border-transparent px-1 pb-3 pt-2 data-[state=active]:border-primary data-[state=active]:text-foreground rounded-none",
        pills:
          "rounded-full px-4 py-2 border border-transparent hover:bg-muted data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:border-primary",
        cards:
          "rounded-lg px-4 py-2.5 border border-border bg-card hover:bg-muted data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:border-primary",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface TabsTriggerProps
  extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>,
    VariantProps<typeof tabsTriggerVariants> {
  icon?: React.ReactNode;
  badge?: string | number;
}

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  TabsTriggerProps
>(({ className, variant, icon, badge, children, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(tabsTriggerVariants({ variant, className }))}
    {...props}
  >
    {icon && <span className="flex-shrink-0">{icon}</span>}
    {children}
    {badge !== undefined && (
      <span className="ml-1.5 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-muted px-1.5 text-xs font-medium text-muted-foreground data-[state=active]:bg-primary-foreground/20 data-[state=active]:text-primary-foreground">
        {badge}
      </span>
    )}
  </TabsPrimitive.Trigger>
));
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-4 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 data-[state=inactive]:hidden",
      className
    )}
    {...props}
  />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;

// Vertical tabs component
interface VerticalTabsProps extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.Root> {
  items: Array<{
    value: string;
    label: string;
    icon?: React.ReactNode;
    badge?: string | number;
    content: React.ReactNode;
  }>;
  sidebarClassName?: string;
  contentClassName?: string;
}

const VerticalTabs = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Root>,
  VerticalTabsProps
>(
  (
    { items, sidebarClassName, contentClassName, className, defaultValue, ...props },
    ref
  ) => (
    <Tabs
      ref={ref}
      defaultValue={defaultValue || items[0]?.value}
      orientation="vertical"
      className={cn("flex gap-6", className)}
      {...props}
    >
      <TabsList
        className={cn(
          "flex h-auto flex-col items-stretch justify-start gap-1 rounded-none bg-transparent p-0",
          sidebarClassName
        )}
      >
        {items.map((item) => (
          <TabsTrigger
            key={item.value}
            value={item.value}
            className="justify-start rounded-lg px-4 py-2.5 text-left hover:bg-muted data-[state=active]:bg-accent data-[state=active]:text-accent-foreground"
          >
            {item.icon && <span className="mr-2 flex-shrink-0">{item.icon}</span>}
            <span className="flex-1">{item.label}</span>
            {item.badge !== undefined && (
              <span className="ml-auto flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-muted px-1.5 text-xs font-medium text-muted-foreground">
                {item.badge}
              </span>
            )}
          </TabsTrigger>
        ))}
      </TabsList>
      <div className={cn("flex-1", contentClassName)}>
        {items.map((item) => (
          <TabsContent key={item.value} value={item.value} className="mt-0">
            {item.content}
          </TabsContent>
        ))}
      </div>
    </Tabs>
  )
);
VerticalTabs.displayName = "VerticalTabs";

// Simple tabs component for quick usage
interface SimpleTabsProps {
  items: Array<{
    value: string;
    label: string;
    icon?: React.ReactNode;
    badge?: string | number;
    content: React.ReactNode;
  }>;
  defaultValue?: string;
  variant?: "default" | "underline" | "pills" | "cards";
  className?: string;
  listClassName?: string;
  contentClassName?: string;
  onValueChange?: (value: string) => void;
}

const SimpleTabs = ({
  items,
  defaultValue,
  variant = "default",
  className,
  listClassName,
  contentClassName,
  onValueChange,
}: SimpleTabsProps) => (
  <Tabs
    defaultValue={defaultValue || items[0]?.value}
    onValueChange={onValueChange}
    className={className}
  >
    <TabsList variant={variant} className={cn("w-full sm:w-auto", listClassName)}>
      {items.map((item) => (
        <TabsTrigger
          key={item.value}
          value={item.value}
          variant={variant}
          icon={item.icon}
          badge={item.badge}
        >
          {item.label}
        </TabsTrigger>
      ))}
    </TabsList>
    {items.map((item) => (
      <TabsContent key={item.value} value={item.value} className={contentClassName}>
        {item.content}
      </TabsContent>
    ))}
  </Tabs>
);

export {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  VerticalTabs,
  SimpleTabs,
  tabsListVariants,
  tabsTriggerVariants,
};
