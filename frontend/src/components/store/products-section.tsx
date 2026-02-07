"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { useStoreConfig } from "@/context/store-config-context";
import { fetcher } from "@/lib/fetcher";
import type { ApiProduct } from "@/lib/types";
import type { ProductsSectionConfig, NewArrivalsSectionConfig, DealsSectionConfig } from "@/lib/store-config";
import { ProductCard, ProductCardSkeleton } from "./product-card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import useSWR from "swr";

type SectionType = "featuredProducts" | "newArrivals" | "deals" | "products";

interface ProductsSectionProps {
  sectionType?: SectionType;
  className?: string;
  products?: ApiProduct[];
  title?: string;
  subtitle?: string;
  showViewAll?: boolean;
  viewAllLink?: string;
  maxItems?: number;
  style?: "grid" | "carousel" | "list";
  columns?: number;
}

export function ProductsSection({
  sectionType = "featuredProducts",
  className,
  products: externalProducts,
  title: externalTitle,
  subtitle: externalSubtitle,
  showViewAll: externalShowViewAll,
  viewAllLink: externalViewAllLink,
  maxItems: externalMaxItems,
  style: externalStyle,
  columns: externalColumns,
}: ProductsSectionProps) {
  const { config } = useStoreConfig();

  // Find the section config
  const section = config.homepage.sections.find((s) => s.type === sectionType);

  // Get config values (external props override config)
  let sectionConfig: Partial<ProductsSectionConfig & NewArrivalsSectionConfig & DealsSectionConfig> = {};

  if (section?.config) {
    sectionConfig = section.config as ProductsSectionConfig;
  }

  const title = externalTitle ?? sectionConfig.title ?? "Products";
  const subtitle = externalSubtitle ?? sectionConfig.subtitle;
  const showViewAll = externalShowViewAll ?? sectionConfig.showViewAll ?? true;
  const viewAllLink = externalViewAllLink ?? sectionConfig.viewAllLink ?? "/store/search";
  const maxItems = externalMaxItems ?? sectionConfig.maxItems ?? 8;
  const style = externalStyle ?? sectionConfig.style ?? "grid";
  const columns = externalColumns ?? (sectionConfig as ProductsSectionConfig).columns ?? 4;

  // Fetch products if not provided externally
  const { data: fetchedProducts, isLoading } = useSWR<ApiProduct[]>(
    !externalProducts ? "/api/products?status=LIVE" : null,
    fetcher
  );

  const products = externalProducts ?? fetchedProducts ?? [];
  const displayProducts = products.slice(0, maxItems);

  // Don't render if section is disabled (unless external products provided)
  if (!externalProducts && section && !section.enabled) {
    return null;
  }

  if (!externalProducts && !isLoading && displayProducts.length === 0) {
    return null;
  }

  return (
    <section className={cn("py-12 md:py-16", className)}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
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
          {showViewAll && (
            <Link
              href={viewAllLink}
              className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:text-primary/80 transition-colors group"
            >
              View All
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          )}
        </div>

        {/* Products Display */}
        {isLoading ? (
          <ProductsGridSkeleton columns={columns} count={maxItems} />
        ) : style === "carousel" ? (
          <ProductsCarousel products={displayProducts} />
        ) : style === "list" ? (
          <ProductsList products={displayProducts} />
        ) : (
          <ProductsGrid products={displayProducts} columns={columns} />
        )}
      </div>
    </section>
  );
}

// Grid Layout
function ProductsGrid({
  products,
  columns = 4,
}: {
  products: ApiProduct[];
  columns?: number;
}) {
  const gridCols = {
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
    5: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5",
    6: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-6",
  };

  return (
    <div className={cn("grid gap-4 md:gap-6", gridCols[columns as keyof typeof gridCols] || gridCols[4])}>
      {products.map((product, index) => (
        <ProductCard
          key={product.id}
          product={product}
          priority={index < 4}
        />
      ))}
    </div>
  );
}

// Grid Skeleton
function ProductsGridSkeleton({
  columns = 4,
  count = 8,
}: {
  columns?: number;
  count?: number;
}) {
  const gridCols = {
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
    5: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5",
    6: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-6",
  };

  return (
    <div className={cn("grid gap-4 md:gap-6", gridCols[columns as keyof typeof gridCols] || gridCols[4])}>
      {Array.from({ length: count }).map((_, index) => (
        <ProductCardSkeleton key={index} />
      ))}
    </div>
  );
}

// Carousel Layout
function ProductsCarousel({ products }: { products: ApiProduct[] }) {
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
  }, [checkScroll, products]);

  const scroll = (direction: "left" | "right") => {
    const container = scrollContainerRef.current;
    if (container) {
      const cardWidth = 280;
      const gap = 16;
      const scrollAmount = cardWidth + gap;
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
        className="flex gap-4 overflow-x-auto scroll-smooth pb-4 -mb-4"
        style={{
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {products.map((product, index) => (
          <div
            key={product.id}
            className="flex-shrink-0 w-[260px] sm:w-[280px]"
          >
            <ProductCard
              product={product}
              priority={index < 4}
            />
          </div>
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

// List Layout
function ProductsList({ products }: { products: ApiProduct[] }) {
  return (
    <div className="flex flex-col gap-4">
      {products.map((product, index) => (
        <ProductCardList key={product.id} product={product} priority={index < 4} />
      ))}
    </div>
  );
}

// List version of product card
function ProductCardList({
  product,
  priority = false,
}: {
  product: ApiProduct;
  priority?: boolean;
}) {
  const { config } = useStoreConfig();
  const { selectedBank } = useGlobal();
  const { showBrand, showRating, showPointsPrice, showCurrencyPrice } = config.productCard;
  const { pointsLabel, primaryDisplay } = config.pointsDisplay;
  const { borderRadius, shadow, border } = config.components.cards;

  const rate = selectedBank?.points_to_currency_rate ?? 0.25;
  const points = Math.ceil(product.base_price / rate);

  const shadowClasses = {
    none: "",
    sm: "shadow-sm",
    md: "shadow-md",
    lg: "shadow-lg",
    xl: "shadow-xl",
  };

  return (
    <Link
      href={`/store/${product.id}`}
      className={cn(
        "group flex gap-4 overflow-hidden bg-card text-card-foreground transition-all duration-300 hover:-translate-y-0.5 p-4",
        border && "border border-border",
        shadowClasses[shadow],
        "hover:shadow-lg hover:border-primary/50"
      )}
      style={{ borderRadius }}
    >
      {/* Image */}
      <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg bg-muted sm:h-32 sm:w-32">
        <Image
          src={product.image_url}
          alt={product.title}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-110"
          sizes="128px"
          priority={priority}
        />
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col justify-center min-w-0">
        {showBrand && product.brand_name && (
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {product.brand_name}
          </p>
        )}
        <h3 className="mt-1 line-clamp-2 text-base font-semibold text-foreground group-hover:text-primary transition-colors">
          {product.title}
        </h3>
        {showRating && (
          <div className="mt-1 flex items-center gap-1">
            <Star className="h-3.5 w-3.5 fill-warning text-warning" />
            <span className="text-xs font-medium text-foreground">
              {Number(product.rating).toFixed(1)}
            </span>
            <span className="text-xs text-muted-foreground">
              ({product.review_count.toLocaleString()} reviews)
            </span>
          </div>
        )}
        <div className="mt-2">
          {(primaryDisplay === "points" || primaryDisplay === "both") && showPointsPrice && (
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-primary">
                {points.toLocaleString()}
              </span>
              <span className="text-sm font-medium text-primary">
                {pointsLabel}
              </span>
            </div>
          )}
          {showCurrencyPrice && (
            <p className="text-xs text-muted-foreground">
              ₹{product.base_price.toLocaleString()}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}

// Import for list card
import { Star } from "lucide-react";
import { useGlobal } from "@/context/global-context";
import Image from "next/image";

// Export specific section components for convenience
export function FeaturedProductsSection(props: Omit<ProductsSectionProps, "sectionType">) {
  return <ProductsSection {...props} sectionType="featuredProducts" />;
}

export function NewArrivalsSection(props: Omit<ProductsSectionProps, "sectionType">) {
  return <ProductsSection {...props} sectionType="newArrivals" />;
}

export function DealsSection(props: Omit<ProductsSectionProps, "sectionType">) {
  return <ProductsSection {...props} sectionType="deals" />;
}

export default ProductsSection;
