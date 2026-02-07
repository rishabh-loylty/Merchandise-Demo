"use client";

import * as React from "react";
import { useStoreConfig } from "@/context/store-config-context";
import type { TrustBadgesSectionConfig, TrustBadge } from "@/lib/store-config";
import { cn } from "@/lib/utils";
import {
  Shield,
  Truck,
  RefreshCw,
  Headphones,
  CreditCard,
  Award,
  Clock,
  CheckCircle,
  Lock,
  Gift,
  Percent,
  Heart,
  Star,
  Zap,
  Package,
  ThumbsUp,
  type LucideIcon,
} from "lucide-react";

// Icon mapping for trust badges
const ICON_MAP: Record<string, LucideIcon> = {
  Shield,
  Truck,
  RefreshCw,
  Headphones,
  CreditCard,
  Award,
  Clock,
  CheckCircle,
  Lock,
  Gift,
  Percent,
  Heart,
  Star,
  Zap,
  Package,
  ThumbsUp,
};

interface TrustBadgesSectionProps {
  className?: string;
  badges?: TrustBadge[];
  style?: "horizontal" | "grid" | "cards";
  title?: string;
}

export function TrustBadgesSection({
  className,
  badges: externalBadges,
  style: externalStyle,
  title: externalTitle,
}: TrustBadgesSectionProps) {
  const { config } = useStoreConfig();
  const trustSection = config.homepage.sections.find((s) => s.type === "trustBadges");

  if (!trustSection?.enabled && !externalBadges) return null;

  const sectionConfig = trustSection?.config as TrustBadgesSectionConfig | undefined;

  const badges = externalBadges ?? sectionConfig?.badges ?? [];
  const style = externalStyle ?? sectionConfig?.style ?? "horizontal";
  const title = externalTitle ?? sectionConfig?.title;

  if (badges.length === 0) return null;

  return (
    <section className={cn("py-10 md:py-14 bg-muted/30", className)}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Title */}
        {title && (
          <h2 className="mb-8 text-center text-xl font-semibold text-foreground md:text-2xl">
            {title}
          </h2>
        )}

        {/* Badges Display */}
        {style === "cards" ? (
          <CardBadges badges={badges} />
        ) : style === "grid" ? (
          <GridBadges badges={badges} />
        ) : (
          <HorizontalBadges badges={badges} />
        )}
      </div>
    </section>
  );
}

// Horizontal Layout (default)
function HorizontalBadges({ badges }: { badges: TrustBadge[] }) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12 lg:gap-16">
      {badges.map((badge) => {
        const IconComponent = ICON_MAP[badge.icon] || Shield;

        return (
          <div
            key={badge.id}
            className="flex items-center gap-3 group"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary transition-all duration-300 group-hover:bg-primary group-hover:text-primary-foreground group-hover:scale-110">
              <IconComponent className="h-6 w-6" />
            </div>
            <div className="text-left">
              <h3 className="text-sm font-semibold text-foreground">
                {badge.title}
              </h3>
              {badge.description && (
                <p className="text-xs text-muted-foreground">
                  {badge.description}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Grid Layout
function GridBadges({ badges }: { badges: TrustBadge[] }) {
  const gridCols = badges.length <= 3
    ? "grid-cols-1 sm:grid-cols-3"
    : "grid-cols-2 sm:grid-cols-4";

  return (
    <div className={cn("grid gap-6", gridCols)}>
      {badges.map((badge) => {
        const IconComponent = ICON_MAP[badge.icon] || Shield;

        return (
          <div
            key={badge.id}
            className="flex flex-col items-center text-center group"
          >
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary transition-all duration-300 group-hover:bg-primary group-hover:text-primary-foreground group-hover:scale-110">
              <IconComponent className="h-7 w-7" />
            </div>
            <h3 className="text-sm font-semibold text-foreground">
              {badge.title}
            </h3>
            {badge.description && (
              <p className="mt-1 text-xs text-muted-foreground">
                {badge.description}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

// Cards Layout
function CardBadges({ badges }: { badges: TrustBadge[] }) {
  const gridCols = badges.length <= 3
    ? "grid-cols-1 sm:grid-cols-3"
    : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4";

  return (
    <div className={cn("grid gap-4", gridCols)}>
      {badges.map((badge) => {
        const IconComponent = ICON_MAP[badge.icon] || Shield;

        return (
          <div
            key={badge.id}
            className="group flex flex-col items-center rounded-xl border border-border bg-card p-6 text-center transition-all duration-300 hover:border-primary hover:shadow-lg hover:-translate-y-1"
          >
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent text-primary transition-all duration-300 group-hover:bg-primary group-hover:text-primary-foreground group-hover:scale-110">
              <IconComponent className="h-8 w-8" />
            </div>
            <h3 className="text-base font-semibold text-foreground">
              {badge.title}
            </h3>
            {badge.description && (
              <p className="mt-2 text-sm text-muted-foreground">
                {badge.description}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default TrustBadgesSection;
