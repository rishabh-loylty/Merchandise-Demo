"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { Star, Eye, Heart, ShoppingCart } from "lucide-react";
import { useStoreConfig } from "@/context/store-config-context";
import { useGlobal } from "@/context/global-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { ApiProduct } from "@/lib/types";
import { cn } from "@/lib/utils";

interface ProductCardProps {
  product: ApiProduct;
  className?: string;
  priority?: boolean;
}

export function ProductCard({ product, className, priority = false }: ProductCardProps) {
  const { config } = useStoreConfig();
  const { selectedBank } = useGlobal();
  const [isHovered, setIsHovered] = React.useState(false);
  const [isWishlisted, setIsWishlisted] = React.useState(false);

  const {
    showBrand,
    showRating,
    showPointsPrice,
    showCurrencyPrice,
    showQuickView,
    showWishlist,
    showAddToCart,
    imageAspectRatio,
    hoverEffect,
    showBadges,
    badgeStyle,
  } = config.productCard;

  const { pointsLabel, primaryDisplay } = config.pointsDisplay;
  const { borderRadius, shadow, border, hoverEffect: cardHoverEffect } = config.components.cards;

  // Calculate points
  const rate = selectedBank?.points_to_currency_rate ?? 0.25;
  const points = Math.ceil(product.base_price / rate);

  // Aspect ratio classes
  const aspectRatioClasses = {
    square: "aspect-square",
    portrait: "aspect-[3/4]",
    landscape: "aspect-[4/3]",
    auto: "aspect-auto min-h-[200px]",
  };

  // Image hover effect classes
  const imageHoverClasses = {
    none: "",
    zoom: "group-hover:scale-110",
    slide: "group-hover:translate-x-2",
    fade: "group-hover:opacity-80",
  };

  // Card hover effect classes
  const cardHoverClasses = {
    none: "",
    lift: "hover:-translate-y-1",
    shadow: "hover:shadow-xl",
    border: "hover:border-primary",
    scale: "hover:scale-[1.02]",
  };

  // Shadow classes
  const shadowClasses = {
    none: "",
    sm: "shadow-sm",
    md: "shadow-md",
    lg: "shadow-lg",
    xl: "shadow-xl",
  };

  // Badge style classes
  const badgeStyleClasses = {
    rounded: "rounded-md",
    square: "rounded-none",
    pill: "rounded-full",
  };

  // Determine if product is new (within last 30 days - mock)
  const isNew = product.id % 3 === 0; // Mock logic
  const isOnSale = product.id % 5 === 0; // Mock logic
  const isOutOfStock = product.current_stock === 0;

  return (
    <Link
      href={`/store/${product.id}`}
      className={cn(
        "group relative flex flex-col overflow-hidden bg-card text-card-foreground transition-all duration-300",
        border && "border border-border",
        shadowClasses[shadow],
        cardHoverClasses[cardHoverEffect],
        className
      )}
      style={{ borderRadius }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image Container */}
      <div
        className={cn(
          "relative w-full overflow-hidden bg-muted",
          aspectRatioClasses[imageAspectRatio]
        )}
      >
        <Image
          src={product.image_url}
          alt={product.title}
          fill
          className={cn(
            "object-cover transition-all duration-300",
            imageHoverClasses[hoverEffect]
          )}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          priority={priority}
        />

        {/* Badges */}
        {showBadges && (
          <div className="absolute left-2 top-2 flex flex-col gap-1">
            {isNew && (
              <Badge
                className={cn(
                  "bg-success text-success-foreground text-xs px-2 py-0.5",
                  badgeStyleClasses[badgeStyle]
                )}
              >
                New
              </Badge>
            )}
            {isOnSale && (
              <Badge
                className={cn(
                  "bg-destructive text-destructive-foreground text-xs px-2 py-0.5",
                  badgeStyleClasses[badgeStyle]
                )}
              >
                Sale
              </Badge>
            )}
          </div>
        )}

        {/* Out of Stock Overlay */}
        {isOutOfStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <span className="text-sm font-medium text-muted-foreground">
              Out of Stock
            </span>
          </div>
        )}

        {/* Hover Actions */}
        {(showQuickView || showWishlist || showAddToCart) && (
          <div
            className={cn(
              "absolute bottom-0 left-0 right-0 flex items-center justify-center gap-2 bg-gradient-to-t from-black/60 to-transparent p-3 transition-all duration-300",
              isHovered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            )}
          >
            {showQuickView && (
              <Button
                size="sm"
                variant="secondary"
                className="h-8 w-8 p-0"
                onClick={(e) => {
                  e.preventDefault();
                  // Handle quick view
                }}
                title="Quick View"
              >
                <Eye className="h-4 w-4" />
              </Button>
            )}
            {showWishlist && (
              <Button
                size="sm"
                variant={isWishlisted ? "default" : "secondary"}
                className="h-8 w-8 p-0"
                onClick={(e) => {
                  e.preventDefault();
                  setIsWishlisted(!isWishlisted);
                }}
                title={isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
              >
                <Heart
                  className={cn(
                    "h-4 w-4",
                    isWishlisted && "fill-current"
                  )}
                />
              </Button>
            )}
            {showAddToCart && !isOutOfStock && (
              <Button
                size="sm"
                className="h-8 w-8 p-0"
                onClick={(e) => {
                  e.preventDefault();
                  // Handle add to cart
                }}
                title="Add to Cart"
              >
                <ShoppingCart className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-4">
        {/* Brand */}
        {showBrand && product.brand_name && (
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {product.brand_name}
          </p>
        )}

        {/* Title */}
        <h3 className="mb-2 line-clamp-2 text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
          {product.title}
        </h3>

        {/* Rating */}
        {showRating && (
          <div className="mb-2 flex items-center gap-1">
            <Star className="h-3.5 w-3.5 fill-warning text-warning" />
            <span className="text-xs font-medium text-foreground">
              {Number(product.rating).toFixed(1)}
            </span>
            <span className="text-xs text-muted-foreground">
              ({product.review_count.toLocaleString()})
            </span>
          </div>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Pricing */}
        <div className="mt-auto">
          {primaryDisplay === "points" || primaryDisplay === "both" ? (
            <>
              {showPointsPrice && (
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
                  {selectedBank?.name && (
                    <span className="ml-1">• {selectedBank.name}</span>
                  )}
                </p>
              )}
            </>
          ) : (
            <>
              {showCurrencyPrice && (
                <div className="flex items-baseline gap-1">
                  <span className="text-lg font-bold text-foreground">
                    ₹{product.base_price.toLocaleString()}
                  </span>
                </div>
              )}
              {showPointsPrice && (
                <p className="text-xs text-muted-foreground">
                  or {points.toLocaleString()} {pointsLabel}
                  {selectedBank?.name && (
                    <span className="ml-1">• {selectedBank.name}</span>
                  )}
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </Link>
  );
}

// Skeleton loader for product card
export function ProductCardSkeleton({ className }: { className?: string }) {
  const { config } = useStoreConfig();
  const { imageAspectRatio } = config.productCard;
  const { borderRadius, shadow, border } = config.components.cards;

  const aspectRatioClasses = {
    square: "aspect-square",
    portrait: "aspect-[3/4]",
    landscape: "aspect-[4/3]",
    auto: "aspect-auto min-h-[200px]",
  };

  const shadowClasses = {
    none: "",
    sm: "shadow-sm",
    md: "shadow-md",
    lg: "shadow-lg",
    xl: "shadow-xl",
  };

  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden bg-card animate-pulse",
        border && "border border-border",
        shadowClasses[shadow],
        className
      )}
      style={{ borderRadius }}
    >
      <div
        className={cn(
          "w-full bg-muted",
          aspectRatioClasses[imageAspectRatio]
        )}
      />
      <div className="flex flex-1 flex-col p-4 gap-2">
        <div className="h-3 w-16 rounded bg-muted" />
        <div className="h-4 w-full rounded bg-muted" />
        <div className="h-4 w-3/4 rounded bg-muted" />
        <div className="h-3 w-20 rounded bg-muted" />
        <div className="mt-auto h-5 w-24 rounded bg-muted" />
      </div>
    </div>
  );
}

export default ProductCard;
