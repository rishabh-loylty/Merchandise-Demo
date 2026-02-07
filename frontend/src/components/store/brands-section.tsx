"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useStoreConfig } from "@/context/store-config-context";
import { fetcher } from "@/lib/fetcher";
import type { ApiBrand } from "@/lib/types";
import type { BrandsSectionConfig } from "@/lib/store-config";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import useSWR from "swr";

interface BrandsSectionProps {
  className?: string;
  brands?: ApiBrand[];
  title?: string;
  subtitle?: string;
  style?: "grid" | "carousel" | "marquee";
  maxItems?: number;
  showNames?: boolean;
  grayscale?: boolean;
}

export function BrandsSection({
  className,
  brands: externalBrands,
  title: externalTitle,
  subtitle: externalSubtitle,
  style: externalStyle,
  maxItems: externalMaxItems,
  showNames: externalShowNames,
  grayscale: externalGrayscale,
}: BrandsSectionProps) {
  const { config } = useStoreConfig();
  const brandsSection = config.homepage.sections.find((s) => s.type === "brands");

  const { data: fetchedBrands } = useSWR<ApiBrand[]>(
    !externalBrands ? "/api/brands" : null,
    fetcher
  );

  if (!brandsSection?.enabled && !externalBrands) return null;

  const sectionConfig = brandsSection?.config as BrandsSectionConfig | undefined;

  const title = externalTitle ?? sectionConfig?.title;
  const subtitle = externalSubtitle ?? sectionConfig?.subtitle;
  const style = externalStyle ?? sectionConfig?.style ?? "carousel";
  const maxItems = externalMaxItems ?? sectionConfig?.maxItems ?? 10;
  const showNames = externalShowNames ?? sectionConfig?.showNames ?? true;
  const grayscale = externalGrayscale ?? sectionConfig?.grayscale ?? false;

  const allBrands = externalBrands ?? fetchedBrands ?? [];
  const displayBrands = allBrands.filter((b) => b.is_active).slice(0, maxItems);

  if (displayBrands.length === 0) return null;

  return (
    <section className={cn("py-12 md:py-16", className)}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        {(title || subtitle) && (
          <div className="mb-8 text-center">
            {title && (
              <h2 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="mt-2 text-muted-foreground">
                {subtitle}
              </p>
            )}
          </div>
        )}

        {/* Brands Display */}
        {style === "marquee" ? (
          <MarqueeBrands brands={displayBrands} showNames={showNames} grayscale={grayscale} />
        ) : style === "grid" ? (
          <GridBrands brands={displayBrands} showNames={showNames} grayscale={grayscale} />
        ) : (
          <CarouselBrands brands={displayBrands} showNames={showNames} grayscale={grayscale} />
        )}
      </div>
    </section>
  );
}

// Brand Logo Component
function BrandLogo({
  brand,
  showName,
  grayscale,
  className,
}: {
  brand: ApiBrand;
  showName: boolean;
  grayscale: boolean;
  className?: string;
}) {
  // Generate a placeholder logo with brand initials if no logo_url
  const initials = brand.name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <Link
      href={`/store/search?brand=${brand.slug}`}
      className={cn(
        "group flex flex-col items-center gap-3 transition-all duration-300",
        className
      )}
    >
      <div
        className={cn(
          "flex h-20 w-20 items-center justify-center rounded-xl border border-border bg-card p-3 transition-all duration-300",
          "group-hover:border-primary group-hover:shadow-lg group-hover:-translate-y-1",
          grayscale && "grayscale group-hover:grayscale-0"
        )}
      >
        {brand.logo_url ? (
          <Image
            src={brand.logo_url}
            alt={brand.name}
            width={64}
            height={64}
            className="h-14 w-14 object-contain"
          />
        ) : (
          <span className="text-xl font-bold text-primary">
            {initials}
          </span>
        )}
      </div>
      {showName && (
        <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
          {brand.name}
        </span>
      )}
    </Link>
  );
}

// Grid Layout
function GridBrands({
  brands,
  showNames,
  grayscale,
}: {
  brands: ApiBrand[];
  showNames: boolean;
  grayscale: boolean;
}) {
  return (
    <div className="grid grid-cols-3 gap-6 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
      {brands.map((brand) => (
        <BrandLogo
          key={brand.id}
          brand={brand}
          showName={showNames}
          grayscale={grayscale}
        />
      ))}
    </div>
  );
}

// Carousel Layout
function CarouselBrands({
  brands,
  showNames,
  grayscale,
}: {
  brands: ApiBrand[];
  showNames: boolean;
  grayscale: boolean;
}) {
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = React.useState(false);
  const [canScrollRight, setCanScrollRight] = React.useState(true);

  const checkScroll = React.useCallback(() => {
    const container = scrollContainerRef.current;
    if (container) {
      setCanScrollLeft(container.scrollLeft > 0);
      setCanScrollRight(
        container.scrollLeft < container.scrollWidth - container.clientWidth - 10
      );
    }
  }, []);

  React.useEffect(() => {
    checkScroll();
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener("scroll", checkScroll);
      window.addEventListener("resize", checkScroll);
    }
    return () => {
      if (container) {
        container.removeEventListener("scroll", checkScroll);
      }
      window.removeEventListener("resize", checkScroll);
    };
  }, [checkScroll, brands]);

  const scroll = (direction: "left" | "right") => {
    const container = scrollContainerRef.current;
    if (container) {
      const scrollAmount = 200;
      container.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  return (
    <div className="relative group">
      {/* Scroll Buttons */}
      <Button
        variant="outline"
        size="icon"
        onClick={() => scroll("left")}
        className={cn(
          "absolute -left-4 top-1/2 z-10 -translate-y-1/2 h-10 w-10 rounded-full shadow-lg transition-all",
          !canScrollLeft && "opacity-0 pointer-events-none",
          "opacity-0 group-hover:opacity-100"
        )}
        aria-label="Scroll left"
      >
        <ChevronLeft className="h-5 w-5" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        onClick={() => scroll("right")}
        className={cn(
          "absolute -right-4 top-1/2 z-10 -translate-y-1/2 h-10 w-10 rounded-full shadow-lg transition-all",
          !canScrollRight && "opacity-0 pointer-events-none",
          "opacity-0 group-hover:opacity-100"
        )}
        aria-label="Scroll right"
      >
        <ChevronRight className="h-5 w-5" />
      </Button>

      {/* Scrollable Container */}
      <div
        ref={scrollContainerRef}
        className="flex gap-6 overflow-x-auto scroll-smooth pb-4 -mb-4"
        style={{
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {brands.map((brand) => (
          <BrandLogo
            key={brand.id}
            brand={brand}
            showName={showNames}
            grayscale={grayscale}
            className="flex-shrink-0"
          />
        ))}
      </div>

      {/* Gradient Edges */}
      {canScrollLeft && (
        <div className="absolute left-0 top-0 bottom-4 w-8 bg-gradient-to-r from-background to-transparent pointer-events-none" />
      )}
      {canScrollRight && (
        <div className="absolute right-0 top-0 bottom-4 w-8 bg-gradient-to-l from-background to-transparent pointer-events-none" />
      )}
    </div>
  );
}

// Marquee Layout (infinite scroll animation)
function MarqueeBrands({
  brands,
  showNames,
  grayscale,
}: {
  brands: ApiBrand[];
  showNames: boolean;
  grayscale: boolean;
}) {
  // Duplicate brands for seamless loop
  const duplicatedBrands = [...brands, ...brands];

  return (
    <div className="relative overflow-hidden">
      {/* Gradient Edges */}
      <div className="absolute left-0 top-0 bottom-0 z-10 w-16 bg-gradient-to-r from-background to-transparent pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 z-10 w-16 bg-gradient-to-l from-background to-transparent pointer-events-none" />

      {/* Marquee Animation */}
      <div className="flex animate-marquee gap-8 hover:pause-animation">
        {duplicatedBrands.map((brand, index) => (
          <BrandLogo
            key={`${brand.id}-${index}`}
            brand={brand}
            showName={showNames}
            grayscale={grayscale}
            className="flex-shrink-0"
          />
        ))}
      </div>

      {/* Add custom marquee animation styles */}
      <style jsx>{`
        @keyframes marquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .animate-marquee {
          animation: marquee 30s linear infinite;
        }
        .hover\\:pause-animation:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
}

export default BrandsSection;
