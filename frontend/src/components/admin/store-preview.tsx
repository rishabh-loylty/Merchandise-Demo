"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  Monitor,
  Tablet,
  Smartphone,
  RefreshCw,
  Maximize2,
  Minimize2,
  X,
  ChevronLeft,
  ChevronRight,
  Search,
  ShoppingBag,
  ArrowRight,
  Sparkles,
  Shield,
  Truck,
  Award,
  Headphones,
  ExternalLink,
  Menu,
  User,
} from "lucide-react";
import type {
  StoreConfig,
  HeroSectionConfig,
  CategoriesSectionConfig,
  TrustBadgesSectionConfig,
} from "@/lib/store-config";

// Types
type DeviceSize = "desktop" | "tablet" | "mobile";

interface StorePreviewProps {
  config: StoreConfig;
  className?: string;
}

// Icon mappings
const CTA_ICONS: Record<string, React.ElementType> = {
  ArrowRight,
  ShoppingBag,
  Sparkles,
  ExternalLink,
};

const TRUST_ICONS: Record<string, React.ElementType> = {
  Shield,
  Truck,
  Award,
  Headphones,
};

export function StorePreview({ config, className }: StorePreviewProps) {
  const [deviceSize, setDeviceSize] = React.useState<DeviceSize>("desktop");
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [refreshKey, setRefreshKey] = React.useState(0);

  const deviceDimensions: Record<
    DeviceSize,
    { width: string; height: string }
  > = {
    desktop: { width: "100%", height: "100%" },
    tablet: { width: "768px", height: "1024px" },
    mobile: { width: "375px", height: "667px" },
  };

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  // Determine branding name for URL bar
  const storeSlug = config.branding.storeName
    ? config.branding.storeName.toLowerCase().replace(/[^a-z0-9]+/g, "-")
    : "store";

  return (
    <div
      className={cn(
        "flex flex-col h-full bg-background border border-border rounded-lg overflow-hidden transition-all duration-300",
        isExpanded && "fixed inset-4 z-50 shadow-2xl ring-1 ring-border mt-14",
        className,
      )}
    >
      {/* Preview Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-muted/30 border-b border-border select-none">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5 mr-2">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
          </div>
          <span className="text-xs font-medium text-muted-foreground hidden sm:inline-block">
            Live Preview
          </span>
        </div>

        <div className="flex items-center gap-1">
          <div className="flex items-center gap-0.5 p-1 bg-muted rounded-md mr-2">
            {(["desktop", "tablet", "mobile"] as const).map((size) => (
              <button
                key={size}
                onClick={() => setDeviceSize(size)}
                className={cn(
                  "p-1.5 rounded-sm transition-all duration-200",
                  deviceSize === size
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-background/50",
                )}
                title={`${size.charAt(0).toUpperCase() + size.slice(1)} view`}
              >
                {size === "desktop" && <Monitor className="h-3.5 w-3.5" />}
                {size === "tablet" && <Tablet className="h-3.5 w-3.5" />}
                {size === "mobile" && <Smartphone className="h-3.5 w-3.5" />}
              </button>
            ))}
          </div>

          <div className="h-4 w-px bg-border mx-1" />

          <button
            onClick={handleRefresh}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            title="Refresh preview"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            title={isExpanded ? "Minimize" : "Maximize"}
          >
            {isExpanded ? (
              <Minimize2 className="h-3.5 w-3.5" />
            ) : (
              <Maximize2 className="h-3.5 w-3.5" />
            )}
          </button>

          {isExpanded && (
            <button
              onClick={() => setIsExpanded(false)}
              className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors ml-1"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Browser URL Bar Simulation */}
      <div className="flex items-center gap-3 px-4 py-2 bg-background border-b border-border">
        <div className="flex items-center gap-1 text-muted-foreground/50">
          <ChevronLeft className="h-4 w-4" />
          <ChevronRight className="h-4 w-4" />
        </div>
        <div className="flex-1 flex items-center gap-2 px-3 py-1.5 bg-muted/30 rounded-md border border-border/50 text-xs text-muted-foreground font-mono">
          <div className="w-3 h-3 rounded-full bg-green-500/20 flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
          </div>
          <span className="opacity-50">https://</span>
          <span className="text-foreground/80">{storeSlug}.rewards.com</span>
        </div>
      </div>

      {/* Preview Canvas */}
      <div className="flex-1 overflow-hidden bg-muted/10 relative">
        <div className="absolute inset-0 overflow-y-auto overflow-x-hidden flex flex-col items-center py-4">
          <div
            key={refreshKey}
            className={cn(
              "bg-background transition-all duration-300 origin-top shadow-lg overflow-hidden",
              deviceSize !== "desktop" && "border border-border rounded-[2rem]",
            )}
            style={{
              width: deviceDimensions[deviceSize].width,
              minHeight:
                deviceSize === "desktop"
                  ? "100%"
                  : deviceDimensions[deviceSize].height,
              // Inject theme variables
              ...({
                "--preview-primary": config.theme.colors.primary,
                "--preview-primary-foreground":
                  config.theme.colors.primaryForeground,
                "--preview-secondary": config.theme.colors.secondary,
                "--preview-accent": config.theme.colors.accent,
                "--preview-background": config.theme.colors.background,
                "--preview-foreground": config.theme.colors.foreground,
                "--preview-muted": config.theme.colors.muted,
                "--preview-muted-foreground":
                  config.theme.colors.mutedForeground,
                "--preview-border": config.theme.colors.border,
                "--preview-card": config.theme.colors.card,
                "--preview-radius": config.theme.borderRadius,
                fontFamily: config.theme.typography.fontFamily,
              } as React.CSSProperties),
            }}
          >
            {/* Header */}
            <PreviewHeader config={config} deviceSize={deviceSize} />

            {/* Dynamic Sections */}
            <main className="flex flex-col">
              {config.homepage.sections.map((section) => {
                if (!section.enabled) return null;

                switch (section.type) {
                  case "hero":
                    return (
                      <PreviewHero
                        key={section.id}
                        config={config}
                        deviceSize={deviceSize}
                      />
                    );
                  case "categories":
                    return (
                      <PreviewCategories
                        key={section.id}
                        config={config}
                        deviceSize={deviceSize}
                      />
                    );
                  case "trustBadges":
                    return (
                      <PreviewTrustBadges
                        key={section.id}
                        config={config}
                        deviceSize={deviceSize}
                      />
                    );
                  case "featuredProducts":
                    return (
                      <PreviewProducts
                        key={section.id}
                        config={config}
                        deviceSize={deviceSize}
                      />
                    );
                  default:
                    return null;
                }
              })}
            </main>

            {/* Footer */}
            <PreviewFooter config={config} deviceSize={deviceSize} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// SUB-COMPONENTS
// ==========================================

function PreviewHeader({
  config,
  deviceSize,
}: {
  config: StoreConfig;
  deviceSize: DeviceSize;
}) {
  const { branding, header } = config;

  return (
    <header
      className="sticky top-0 z-40 border-b transition-colors"
      style={{
        backgroundColor: header.backgroundColor || "var(--preview-background)",
        borderColor: "var(--preview-border)",
        position: header.sticky ? "sticky" : "relative",
      }}
    >
      <div
        className={cn(
          "px-4 py-3 flex items-center justify-between",
          deviceSize === "mobile" && "px-3",
        )}
      >
        {/* Mobile Menu & Logo */}
        <div className="flex items-center gap-3">
          {deviceSize === "mobile" && (
            <Menu
              className="h-5 w-5"
              style={{ color: "var(--preview-foreground)" }}
            />
          )}

          <div className="flex items-center gap-2">
            {branding.logo ? (
              <img
                src={branding.logo}
                alt={branding.storeName}
                className={cn(
                  "object-contain",
                  deviceSize === "mobile" ? "h-6" : "h-8",
                )}
              />
            ) : (
              <div
                className={cn(
                  "flex items-center justify-center rounded-lg",
                  deviceSize === "mobile" ? "h-8 w-8" : "h-9 w-9",
                )}
                style={{ backgroundColor: "var(--preview-primary)" }}
              >
                <ShoppingBag
                  className={cn(
                    deviceSize === "mobile" ? "h-4 w-4" : "h-5 w-5",
                  )}
                  style={{ color: "var(--preview-primary-foreground)" }}
                />
              </div>
            )}
            {(!branding.logo || deviceSize !== "mobile") && (
              <span
                className={cn(
                  "font-bold tracking-tight",
                  deviceSize === "mobile" ? "text-lg" : "text-xl",
                )}
                style={{
                  color: "var(--preview-foreground)",
                  fontFamily: config.theme.typography.headingFontFamily,
                }}
              >
                {branding.storeName}
              </span>
            )}
          </div>
        </div>

        {/* Desktop Navigation & Actions */}
        <div className="flex items-center gap-4">
          {header.showSearch && deviceSize !== "mobile" && (
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-full border w-[200px]"
              style={{
                backgroundColor: "var(--preview-muted)",
                borderColor: "var(--preview-border)",
              }}
            >
              <Search
                className="h-4 w-4"
                style={{ color: "var(--preview-muted-foreground)" }}
              />
              <span className="text-sm opacity-50">Search...</span>
            </div>
          )}

          <div className="flex items-center gap-3">
            {header.showSearch && deviceSize === "mobile" && (
              <Search
                className="h-5 w-5"
                style={{ color: "var(--preview-foreground)" }}
              />
            )}

            {header.showPointsBalance && (
              <div
                className="flex flex-col items-end leading-none"
                style={{ color: "var(--preview-foreground)" }}
              >
                <span className="text-[10px] uppercase opacity-70 font-semibold">
                  Balance
                </span>
                <span
                  className="text-sm font-bold"
                  style={{ color: "var(--preview-primary)" }}
                >
                  2,450 pts
                </span>
              </div>
            )}

            <div
              className="h-8 w-8 rounded-full flex items-center justify-center border"
              style={{ borderColor: "var(--preview-border)" }}
            >
              <User
                className="h-4 w-4"
                style={{ color: "var(--preview-foreground)" }}
              />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

function PreviewHero({
  config,
  deviceSize,
}: {
  config: StoreConfig;
  deviceSize: DeviceSize;
}) {
  const heroSection = config.homepage.sections.find((s) => s.type === "hero");
  if (!heroSection?.enabled) return null;

  const heroConfig = heroSection.config as HeroSectionConfig;
  const slides = heroConfig.slides || [];
  // Default to first slide if none enabled, purely for preview purposes
  const activeSlide = slides.find((s) => s.enabled) || slides[0];

  if (!activeSlide)
    return (
      <div className="h-40 flex items-center justify-center bg-muted">
        <span className="text-muted-foreground">
          Add a hero slide to see preview
        </span>
      </div>
    );

  const heightMap: Record<string, string> = {
    small: deviceSize === "mobile" ? "200px" : "300px",
    medium: deviceSize === "mobile" ? "250px" : "400px",
    large: deviceSize === "mobile" ? "300px" : "500px",
    full: deviceSize === "mobile" ? "350px" : "600px",
  };

  const height = heightMap[heroConfig.height] || heightMap.large;
  const IconComponent = activeSlide.ctaIcon
    ? CTA_ICONS[activeSlide.ctaIcon]
    : null;

  return (
    <section className="relative overflow-hidden group" style={{ height }}>
      {/* Background */}
      <div className="absolute inset-0">
        {activeSlide.image ? (
          <div
            className="w-full h-full bg-cover bg-no-repeat"
            style={{
              backgroundImage: `url(${activeSlide.image})`,
              backgroundPosition: activeSlide.backgroundPosition || "center",
            }}
          />
        ) : (
          <div
            className="w-full h-full"
            style={{
              background:
                activeSlide.backgroundGradient ||
                `linear-gradient(135deg, var(--preview-primary) 0%, var(--preview-accent) 100%)`,
            }}
          />
        )}
      </div>

      {/* Overlay */}
      {(activeSlide.overlayEnabled || heroConfig.overlay) && (
        <div
          className="absolute inset-0 transition-opacity"
          style={{
            backgroundColor:
              activeSlide.overlayColor || heroConfig.overlayColor || "#000000",
            opacity:
              activeSlide.overlayOpacity ?? heroConfig.overlayOpacity ?? 0.4,
          }}
        />
      )}

      {/* Content Container */}
      <div
        className={cn(
          "relative z-10 h-full flex flex-col px-6 py-8",
          // Horizontal Alignment
          activeSlide.alignment === "left" && "items-start text-left",
          activeSlide.alignment === "center" && "items-center text-center",
          activeSlide.alignment === "right" && "items-end text-right",
          // Vertical Alignment
          activeSlide.verticalAlign === "top" && "justify-start",
          activeSlide.verticalAlign === "center" && "justify-center",
          activeSlide.verticalAlign === "bottom" && "justify-end",
        )}
      >
        <div
          className="max-w-[80%]"
          style={{ width: deviceSize === "mobile" ? "100%" : "auto" }}
        >
          {activeSlide.badge && (
            <span
              className="inline-block px-3 py-1 mb-4 text-xs font-semibold rounded-full uppercase tracking-wider"
              style={{
                backgroundColor: "rgba(255,255,255,0.15)",
                color: activeSlide.textColor || "#ffffff",
                backdropFilter: "blur(4px)",
              }}
            >
              {activeSlide.badge}
            </span>
          )}

          <h2
            className={cn(
              "font-bold leading-tight mb-3",
              activeSlide.textShadow && "drop-shadow-lg",
            )}
            style={{
              color: activeSlide.textColor || "#ffffff",
              fontFamily: config.theme.typography.headingFontFamily,
              fontSize: deviceSize === "mobile" ? "1.75rem" : "3rem",
            }}
          >
            {activeSlide.title}
          </h2>

          {activeSlide.subtitle && (
            <p
              className={cn(
                "mb-6 max-w-lg",
                activeSlide.textShadow && "drop-shadow-md",
              )}
              style={{
                color: activeSlide.textColor || "#ffffff",
                opacity: 0.9,
                fontSize: deviceSize === "mobile" ? "0.9rem" : "1.125rem",
              }}
            >
              {activeSlide.subtitle}
            </p>
          )}

          {activeSlide.ctaText && (
            <div
              className={cn(
                "flex flex-wrap gap-3",
                activeSlide.alignment === "center" && "justify-center",
                activeSlide.alignment === "right" && "justify-end",
              )}
            >
              <button
                className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold rounded-md transition-transform active:scale-95"
                style={{
                  backgroundColor:
                    activeSlide.ctaStyle === "outline"
                      ? "transparent"
                      : "var(--preview-primary)",
                  color:
                    activeSlide.ctaStyle === "outline"
                      ? activeSlide.textColor || "#ffffff"
                      : "var(--preview-primary-foreground)",
                  border:
                    activeSlide.ctaStyle === "outline"
                      ? `2px solid ${activeSlide.textColor || "#ffffff"}`
                      : "none",
                  borderRadius: "var(--preview-radius)",
                }}
              >
                {activeSlide.ctaText}
                {IconComponent && <IconComponent className="h-4 w-4" />}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Arrows (Desktop Only) */}
      {heroConfig.showArrows &&
        slides.length > 1 &&
        deviceSize === "desktop" && (
          <>
            <button className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-background/20 hover:bg-background/40 backdrop-blur-sm text-white transition-colors">
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-background/20 hover:bg-background/40 backdrop-blur-sm text-white transition-colors">
              <ChevronRight className="h-6 w-6" />
            </button>
          </>
        )}
    </section>
  );
}

function PreviewCategories({
  config,
  deviceSize,
}: {
  config: StoreConfig;
  deviceSize: DeviceSize;
}) {
  const categoriesSection = config.homepage.sections.find(
    (s) => s.type === "categories",
  );
  if (!categoriesSection?.enabled) return null;

  const catConfig = categoriesSection.config as CategoriesSectionConfig;
  const mockCategories = [
    { name: "Electronics", icon: "Smartphone" },
    { name: "Fashion", icon: "Shirt" },
    { name: "Home & Living", icon: "Home" },
    { name: "Beauty", icon: "Sparkles" },
    { name: "Sports", icon: "Dumbbell" },
    { name: "Books", icon: "Book" },
    { name: "Toys", icon: "Gamepad2" },
    { name: "Automotive", icon: "Car" },
  ];

  // Determine grid columns based on device size manually
  const gridCols = deviceSize === "mobile" ? 2 : 6;
  const limit = deviceSize === "mobile" ? 4 : catConfig.maxItems || 6;

  return (
    <section
      className="py-8 px-4"
      style={{ backgroundColor: "var(--preview-background)" }}
    >
      {catConfig.title && (
        <div
          className={cn("mb-6", catConfig.style === "grid" && "text-center")}
        >
          <h2
            className="text-xl font-bold mb-1"
            style={{
              color: "var(--preview-foreground)",
              fontFamily: config.theme.typography.headingFontFamily,
            }}
          >
            {catConfig.title}
          </h2>
          {catConfig.subtitle && (
            <p
              className="text-sm"
              style={{ color: "var(--preview-muted-foreground)" }}
            >
              {catConfig.subtitle}
            </p>
          )}
        </div>
      )}

      <div
        className="grid gap-4"
        style={{
          gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))`,
        }}
      >
        {mockCategories.slice(0, limit).map((cat, i) => (
          <div
            key={i}
            className="flex flex-col items-center justify-center gap-3 p-4 rounded-lg border hover:border-primary/50 transition-colors cursor-pointer text-center group"
            style={{
              backgroundColor: "var(--preview-card)",
              borderColor: "var(--preview-border)",
              borderRadius: "var(--preview-radius)",
            }}
          >
            {catConfig.showIcons && (
              <div
                className="h-12 w-12 rounded-full flex items-center justify-center transition-transform group-hover:scale-110"
                style={{ backgroundColor: "var(--preview-accent)" }}
              >
                {/* Placeholder for dynamic icons */}
                <span className="text-xl">
                  {["📱", "👕", "🏠", "💄", "⚽", "📚", "🎮", "🚗"][i]}
                </span>
              </div>
            )}
            <span
              className="text-sm font-medium"
              style={{ color: "var(--preview-foreground)" }}
            >
              {cat.name}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

function PreviewTrustBadges({
  config,
  deviceSize,
}: {
  config: StoreConfig;
  deviceSize: DeviceSize;
}) {
  const section = config.homepage.sections.find(
    (s) => s.type === "trustBadges",
  );
  if (!section?.enabled) return null;

  const trustConfig = section.config as TrustBadgesSectionConfig;
  const badges = trustConfig.badges || [
    { icon: "Shield", title: "Secure Payment", description: "100% secure" },
    {
      icon: "Truck",
      title: "Fast Delivery",
      description: "Across the country",
    },
    {
      icon: "Award",
      title: "Quality Guarantee",
      description: "Certified products",
    },
    {
      icon: "Headphones",
      title: "24/7 Support",
      description: "Dedicated team",
    },
  ];

  const displayBadges = badges.slice(0, deviceSize === "mobile" ? 2 : 4);
  const gridCols = deviceSize === "mobile" ? 2 : 4;

  return (
    <section
      className="py-6 px-4"
      style={{ backgroundColor: "var(--preview-muted)" }}
    >
      <div
        className="grid gap-4"
        style={{ gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))` }}
      >
        {displayBadges.map((badge, i) => {
          const Icon = TRUST_ICONS[badge.icon] || Shield;
          return (
            <div
              key={i}
              className={cn(
                "flex items-center gap-3",
                trustConfig.style === "cards" &&
                  "p-4 rounded-lg border bg-card",
              )}
              style={{
                backgroundColor:
                  trustConfig.style === "cards"
                    ? "var(--preview-card)"
                    : "transparent",
                borderColor: "var(--preview-border)",
                flexDirection: deviceSize === "mobile" ? "column" : "row",
                textAlign: deviceSize === "mobile" ? "center" : "left",
              }}
            >
              <div
                className="p-2.5 rounded-full shrink-0"
                style={{
                  backgroundColor: "var(--preview-background)",
                  color: "var(--preview-primary)",
                }}
              >
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h4
                  className="text-sm font-bold"
                  style={{ color: "var(--preview-foreground)" }}
                >
                  {badge.title}
                </h4>
                {deviceSize !== "mobile" && (
                  <p
                    className="text-xs mt-0.5 truncate"
                    style={{ color: "var(--preview-muted-foreground)" }}
                  >
                    {badge.description}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function PreviewProducts({
  config,
  deviceSize,
}: {
  config: StoreConfig;
  deviceSize: DeviceSize;
}) {
  const { productCard, pointsDisplay } = config;
  const productsSection = config.homepage.sections.find(
    (s) => s.type === "featuredProducts",
  );

  if (!productsSection?.enabled) return null;

  const mockProducts = [
    {
      id: 1,
      name: "Premium Wireless Noise Cancelling Headphones",
      brand: "Sony",
      price: 24999,
      points: 12500,
      img: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80",
    },
    {
      id: 2,
      name: "Smart Fitness Watch Series 7",
      brand: "Apple",
      price: 34900,
      points: 17450,
      img: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&q=80",
    },
    {
      id: 3,
      name: "Mechanical Gaming Keyboard RGB",
      brand: "Logitech",
      price: 8999,
      points: 4500,
      img: "https://images.unsplash.com/photo-1587829741301-dc798b91add1?w=500&q=80",
    },
    {
      id: 4,
      name: "Professional Camera Lens 50mm",
      brand: "Canon",
      price: 12500,
      points: 6250,
      img: "https://images.unsplash.com/photo-1617005082133-548c4dd27f35?w=500&q=80",
    },
  ];

  const limit = deviceSize === "mobile" ? 2 : 4;
  const gridCols = deviceSize === "mobile" ? 2 : 4;

  return (
    <section
      className="py-8 px-4"
      style={{ backgroundColor: "var(--preview-background)" }}
    >
      <div className="flex items-center justify-between mb-6">
        <h2
          className="text-xl font-bold"
          style={{
            color: "var(--preview-foreground)",
            fontFamily: config.theme.typography.headingFontFamily,
          }}
        >
          Featured Rewards
        </h2>
        <button
          className="text-sm font-medium hover:underline"
          style={{ color: "var(--preview-primary)" }}
        >
          View All
        </button>
      </div>

      <div
        className="grid gap-4"
        style={{ gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))` }}
      >
        {mockProducts.slice(0, limit).map((product) => (
          <div
            key={product.id}
            className="group relative rounded-lg border overflow-hidden bg-card transition-shadow hover:shadow-lg"
            style={{
              borderColor: "var(--preview-border)",
              backgroundColor: "var(--preview-card)",
              borderRadius: "var(--preview-radius)",
            }}
          >
            {/* Image */}
            <div className="aspect-square bg-muted relative overflow-hidden">
              <img
                src={product.img}
                alt={product.name}
                className={cn(
                  "w-full h-full object-cover transition-transform duration-500",
                  productCard.hoverEffect === "zoom" && "group-hover:scale-110",
                )}
              />
              {productCard.showBadges && (
                <div className="absolute top-2 left-2">
                  <span
                    className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide rounded-sm"
                    style={{
                      backgroundColor: "var(--preview-secondary)",
                      color: "var(--preview-secondary-foreground)",
                    }}
                  >
                    New
                  </span>
                </div>
              )}
            </div>

            {/* Details */}
            <div className="p-3">
              {productCard.showBrand && (
                <p
                  className="text-xs mb-1 opacity-70"
                  style={{ color: "var(--preview-muted-foreground)" }}
                >
                  {product.brand}
                </p>
              )}
              <h3
                className="text-sm font-medium leading-snug mb-2 line-clamp-2 min-h-[2.5em]"
                style={{ color: "var(--preview-foreground)" }}
              >
                {product.name}
              </h3>

              <div className="space-y-1">
                {productCard.showPointsPrice && (
                  <p
                    className="font-bold text-sm"
                    style={{ color: "var(--preview-primary)" }}
                  >
                    {product.points.toLocaleString()}{" "}
                    {pointsDisplay.pointsLabel || "pts"}
                  </p>
                )}
                {productCard.showCurrencyPrice && (
                  <p
                    className="text-xs opacity-70"
                    style={{ color: "var(--preview-muted-foreground)" }}
                  >
                    + ₹{product.price.toLocaleString()}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function PreviewFooter({
  config,
  deviceSize,
}: {
  config: StoreConfig;
  deviceSize: DeviceSize;
}) {
  const { branding, footer } = config;

  if (footer.style === "minimal") {
    return (
      <footer
        className="py-4 px-6 text-center border-t text-xs"
        style={{
          backgroundColor: "var(--preview-muted)",
          color: "var(--preview-muted-foreground)",
          borderColor: "var(--preview-border)",
        }}
      >
        {footer.copyrightText ||
          `© ${new Date().getFullYear()} ${branding.storeName}`}
      </footer>
    );
  }

  return (
    <footer
      className="py-10 px-6 border-t mt-auto"
      style={{
        backgroundColor: "var(--preview-muted)",
        borderColor: "var(--preview-border)",
      }}
    >
      <div
        className={cn(
          "grid gap-8",
          deviceSize === "mobile" ? "grid-cols-1 text-center" : "grid-cols-4",
        )}
      >
        {/* Brand Column */}
        <div
          className={cn(
            "col-span-1",
            deviceSize === "mobile" && "flex flex-col items-center",
          )}
        >
          <span
            className="font-bold text-lg mb-2 block"
            style={{ color: "var(--preview-foreground)" }}
          >
            {branding.storeName}
          </span>
          {branding.tagline && (
            <p
              className="text-sm opacity-70 mb-4"
              style={{ color: "var(--preview-muted-foreground)" }}
            >
              {branding.tagline}
            </p>
          )}
          {footer.showSocialLinks && (
            <div className="flex gap-2">
              {["facebook", "twitter", "instagram"].map((social) => (
                <div
                  key={social}
                  className="h-8 w-8 rounded-full flex items-center justify-center bg-background border border-border opacity-70 hover:opacity-100"
                >
                  <span className="text-[10px] capitalize">{social[0]}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Link Columns (Hidden on mobile for simplicity in preview) */}
        {deviceSize !== "mobile" && (
          <>
            <div className="col-span-1">
              <h4
                className="font-semibold mb-3 text-sm"
                style={{ color: "var(--preview-foreground)" }}
              >
                Shop
              </h4>
              <ul
                className="space-y-2 text-sm opacity-70"
                style={{ color: "var(--preview-muted-foreground)" }}
              >
                <li>All Products</li>
                <li>New Arrivals</li>
                <li>Featured</li>
                <li>Deals</li>
              </ul>
            </div>
            <div className="col-span-1">
              <h4
                className="font-semibold mb-3 text-sm"
                style={{ color: "var(--preview-foreground)" }}
              >
                Support
              </h4>
              <ul
                className="space-y-2 text-sm opacity-70"
                style={{ color: "var(--preview-muted-foreground)" }}
              >
                <li>Help Center</li>
                <li>FAQs</li>
                <li>Returns</li>
                <li>Contact Us</li>
              </ul>
            </div>
          </>
        )}
      </div>

      <div
        className="mt-8 pt-4 border-t text-center text-xs opacity-50"
        style={{
          borderColor: "var(--preview-border)",
          color: "var(--preview-muted-foreground)",
        }}
      >
        {footer.copyrightText ||
          `© ${new Date().getFullYear()} ${branding.storeName}. All rights reserved.`}
      </div>
    </footer>
  );
}

export default StorePreview;
