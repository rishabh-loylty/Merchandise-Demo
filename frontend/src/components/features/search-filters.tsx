"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  ChevronDown,
  ChevronUp,
  Filter,
  Star,
  X,
  SlidersHorizontal,
} from "lucide-react";

// Types
export interface FilterCategory {
  id: number;
  name: string;
  slug: string;
  count?: number;
  children?: FilterCategory[];
}

export interface FilterBrand {
  id: number;
  name: string;
  slug: string;
  count?: number;
}

export interface FilterState {
  categories: string[];
  brands: string[];
  priceRange: [number, number];
  minRating: number;
  inStock: boolean;
}

export interface SearchFiltersProps extends React.HTMLAttributes<HTMLDivElement> {
  categories?: FilterCategory[];
  brands?: FilterBrand[];
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  onClearFilters?: () => void;
  maxPrice?: number;
  showInStock?: boolean;
  pointsRate?: number;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  mobileBreakpoint?: "sm" | "md" | "lg";
}

// Filter section component
interface FilterSectionProps {
  title: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
  badge?: number;
  className?: string;
}

function FilterSection({
  title,
  children,
  defaultExpanded = true,
  badge,
  className,
}: FilterSectionProps) {
  const [isExpanded, setIsExpanded] = React.useState(defaultExpanded);

  return (
    <div className={cn("rounded-lg border border-border bg-card", className)}>
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between px-4 py-3 text-sm font-semibold text-foreground hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          {title}
          {badge !== undefined && badge > 0 && (
            <Badge variant="default" size="sm">
              {badge}
            </Badge>
          )}
        </div>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>
      {isExpanded && (
        <div className="border-t border-border px-4 pb-4 pt-3">
          {children}
        </div>
      )}
    </div>
  );
}

// Checkbox item component
interface CheckboxItemProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  count?: number;
  disabled?: boolean;
}

function CheckboxItem({
  label,
  checked,
  onChange,
  count,
  disabled,
}: CheckboxItemProps) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-muted",
        disabled && "cursor-not-allowed opacity-50"
      )}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        className="h-4 w-4 rounded border-border text-primary accent-primary focus:ring-2 focus:ring-primary/20"
      />
      <span className="flex-1 text-foreground">{label}</span>
      {count !== undefined && (
        <span className="text-xs text-muted-foreground">({count})</span>
      )}
    </label>
  );
}

// Rating filter item
interface RatingItemProps {
  rating: number;
  selected: boolean;
  onClick: () => void;
}

function RatingItem({ rating, selected, onClick }: RatingItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-muted",
        selected && "bg-accent text-accent-foreground"
      )}
    >
      <div className="flex items-center gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={cn(
              "h-3.5 w-3.5",
              i < rating ? "fill-warning text-warning" : "text-border"
            )}
          />
        ))}
      </div>
      <span>& Up</span>
    </button>
  );
}

// Main SearchFilters component
export function SearchFilters({
  className,
  categories = [],
  brands = [],
  filters,
  onFiltersChange,
  onClearFilters,
  maxPrice = 100000,
  showInStock = true,
  pointsRate = 0.25,
  collapsible = true,
  defaultCollapsed = false,
  mobileBreakpoint = "md",
  ...props
}: SearchFiltersProps) {
  const [isOpen, setIsOpen] = React.useState(!defaultCollapsed);
  const [localPriceMin, setLocalPriceMin] = React.useState(String(filters.priceRange[0]));
  const [localPriceMax, setLocalPriceMax] = React.useState(String(filters.priceRange[1]));

  // Sync local price state with filters
  React.useEffect(() => {
    setLocalPriceMin(String(filters.priceRange[0]));
    setLocalPriceMax(String(filters.priceRange[1]));
  }, [filters.priceRange]);

  const hasActiveFilters =
    filters.categories.length > 0 ||
    filters.brands.length > 0 ||
    filters.priceRange[0] > 0 ||
    filters.priceRange[1] < maxPrice ||
    filters.minRating > 0 ||
    filters.inStock;

  const activeFilterCount =
    filters.categories.length +
    filters.brands.length +
    (filters.priceRange[0] > 0 || filters.priceRange[1] < maxPrice ? 1 : 0) +
    (filters.minRating > 0 ? 1 : 0) +
    (filters.inStock ? 1 : 0);

  const handleCategoryToggle = (slug: string) => {
    const newCategories = filters.categories.includes(slug)
      ? filters.categories.filter((c) => c !== slug)
      : [...filters.categories, slug];
    onFiltersChange({ ...filters, categories: newCategories });
  };

  const handleBrandToggle = (name: string) => {
    const newBrands = filters.brands.includes(name)
      ? filters.brands.filter((b) => b !== name)
      : [...filters.brands, name];
    onFiltersChange({ ...filters, brands: newBrands });
  };

  const handlePriceChange = () => {
    const min = Math.max(0, Number(localPriceMin) || 0);
    const max = Math.min(maxPrice, Number(localPriceMax) || maxPrice);
    onFiltersChange({ ...filters, priceRange: [min, Math.max(min, max)] });
  };

  const handleRatingChange = (rating: number) => {
    onFiltersChange({
      ...filters,
      minRating: filters.minRating === rating ? 0 : rating,
    });
  };

  const handleInStockChange = (checked: boolean) => {
    onFiltersChange({ ...filters, inStock: checked });
  };

  const handleClear = () => {
    onClearFilters?.();
  };

  const calculatePoints = (price: number) => {
    return Math.ceil(price / pointsRate).toLocaleString();
  };

  const breakpointClass = {
    sm: "sm:block",
    md: "md:block",
    lg: "lg:block",
  };

  const filterContent = (
    <div className="flex flex-col gap-4">
      {/* Clear filters */}
      {hasActiveFilters && onClearFilters && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleClear}
          className="w-full border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
          leftIcon={<X className="h-4 w-4" />}
        >
          Clear All Filters ({activeFilterCount})
        </Button>
      )}

      {/* Categories */}
      {categories.length > 0 && (
        <FilterSection
          title="Category"
          badge={filters.categories.length}
          defaultExpanded
        >
          <div className="flex flex-col gap-0.5 max-h-64 overflow-y-auto">
            {categories.map((category) => (
              <React.Fragment key={category.id}>
                <CheckboxItem
                  label={category.name}
                  checked={filters.categories.includes(category.slug)}
                  onChange={() => handleCategoryToggle(category.slug)}
                  count={category.count}
                />
                {category.children?.map((child) => (
                  <div key={child.id} className="ml-4">
                    <CheckboxItem
                      label={child.name}
                      checked={filters.categories.includes(child.slug)}
                      onChange={() => handleCategoryToggle(child.slug)}
                      count={child.count}
                    />
                  </div>
                ))}
              </React.Fragment>
            ))}
          </div>
        </FilterSection>
      )}

      {/* Price Range */}
      <FilterSection
        title="Price Range"
        badge={
          filters.priceRange[0] > 0 || filters.priceRange[1] < maxPrice ? 1 : 0
        }
        defaultExpanded
      >
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Input
              type="number"
              placeholder="Min"
              value={localPriceMin}
              onChange={(e) => setLocalPriceMin(e.target.value)}
              onBlur={handlePriceChange}
              onKeyDown={(e) => e.key === "Enter" && handlePriceChange()}
              inputSize="sm"
              className="flex-1"
              min={0}
              max={maxPrice}
            />
            <span className="text-muted-foreground">-</span>
            <Input
              type="number"
              placeholder="Max"
              value={localPriceMax}
              onChange={(e) => setLocalPriceMax(e.target.value)}
              onBlur={handlePriceChange}
              onKeyDown={(e) => e.key === "Enter" && handlePriceChange()}
              inputSize="sm"
              className="flex-1"
              min={0}
              max={maxPrice}
            />
          </div>
          <input
            type="range"
            min={0}
            max={maxPrice}
            step={100}
            value={filters.priceRange[1]}
            onChange={(e) => {
              setLocalPriceMax(e.target.value);
              onFiltersChange({
                ...filters,
                priceRange: [filters.priceRange[0], Number(e.target.value)],
              });
            }}
            className="w-full accent-primary"
          />
          <p className="text-xs text-muted-foreground">
            {calculatePoints(filters.priceRange[0])} -{" "}
            {calculatePoints(filters.priceRange[1])} pts
          </p>
        </div>
      </FilterSection>

      {/* Brands */}
      {brands.length > 0 && (
        <FilterSection
          title="Brand"
          badge={filters.brands.length}
          defaultExpanded={filters.brands.length > 0}
        >
          <div className="flex flex-col gap-0.5 max-h-64 overflow-y-auto">
            {brands.map((brand) => (
              <CheckboxItem
                key={brand.id}
                label={brand.name}
                checked={filters.brands.includes(brand.name)}
                onChange={() => handleBrandToggle(brand.name)}
                count={brand.count}
              />
            ))}
          </div>
        </FilterSection>
      )}

      {/* Rating */}
      <FilterSection
        title="Rating"
        badge={filters.minRating > 0 ? 1 : 0}
        defaultExpanded={filters.minRating > 0}
      >
        <div className="flex flex-col gap-0.5">
          {[4, 3, 2, 1].map((rating) => (
            <RatingItem
              key={rating}
              rating={rating}
              selected={filters.minRating === rating}
              onClick={() => handleRatingChange(rating)}
            />
          ))}
        </div>
      </FilterSection>

      {/* In Stock */}
      {showInStock && (
        <FilterSection title="Availability" defaultExpanded={filters.inStock}>
          <CheckboxItem
            label="In Stock Only"
            checked={filters.inStock}
            onChange={handleInStockChange}
          />
        </FilterSection>
      )}
    </div>
  );

  return (
    <aside className={cn("", className)} {...props}>
      {/* Mobile filter button */}
      {collapsible && (
        <div className={cn("mb-4", breakpointClass[mobileBreakpoint].replace("block", "hidden"))}>
          <Button
            variant="outline"
            onClick={() => setIsOpen(!isOpen)}
            className="w-full justify-between"
            leftIcon={<SlidersHorizontal className="h-4 w-4" />}
            rightIcon={
              activeFilterCount > 0 ? (
                <Badge variant="default" size="sm">
                  {activeFilterCount}
                </Badge>
              ) : undefined
            }
          >
            Filters
          </Button>
        </div>
      )}

      {/* Desktop filters (always visible) */}
      <div className={cn("hidden", breakpointClass[mobileBreakpoint])}>
        {filterContent}
      </div>

      {/* Mobile filters (collapsible) */}
      {collapsible && isOpen && (
        <div
          className={cn(
            "fixed inset-0 z-50 overflow-y-auto bg-background p-6",
            breakpointClass[mobileBreakpoint].replace("block", "hidden")
          )}
        >
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-foreground">Filters</h2>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          {filterContent}
          <div className="sticky bottom-0 mt-6 border-t border-border bg-background pt-4">
            <Button
              variant="default"
              className="w-full"
              onClick={() => setIsOpen(false)}
            >
              Apply Filters
            </Button>
          </div>
        </div>
      )}
    </aside>
  );
}

// Active filter tags component
interface ActiveFiltersProps {
  filters: FilterState;
  categories?: FilterCategory[];
  brands?: FilterBrand[];
  maxPrice?: number;
  onRemoveCategory?: (slug: string) => void;
  onRemoveBrand?: (name: string) => void;
  onClearPriceRange?: () => void;
  onClearRating?: () => void;
  onClearInStock?: () => void;
  onClearAll?: () => void;
  className?: string;
}

export function ActiveFilters({
  filters,
  categories = [],
  brands = [],
  maxPrice = 100000,
  onRemoveCategory,
  onRemoveBrand,
  onClearPriceRange,
  onClearRating,
  onClearInStock,
  onClearAll,
  className,
}: ActiveFiltersProps) {
  const hasActiveFilters =
    filters.categories.length > 0 ||
    filters.brands.length > 0 ||
    filters.priceRange[0] > 0 ||
    filters.priceRange[1] < maxPrice ||
    filters.minRating > 0 ||
    filters.inStock;

  if (!hasActiveFilters) return null;

  const getCategoryName = (slug: string) => {
    const findCategory = (cats: FilterCategory[]): string | null => {
      for (const cat of cats) {
        if (cat.slug === slug) return cat.name;
        if (cat.children) {
          const found = findCategory(cat.children);
          if (found) return found;
        }
      }
      return null;
    };
    return findCategory(categories) || slug;
  };

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <span className="text-sm font-medium text-muted-foreground">
        Active filters:
      </span>

      {/* Category tags */}
      {filters.categories.map((slug) => (
        <Badge
          key={slug}
          variant="secondary"
          removable
          onRemove={() => onRemoveCategory?.(slug)}
        >
          {getCategoryName(slug)}
        </Badge>
      ))}

      {/* Brand tags */}
      {filters.brands.map((name) => (
        <Badge
          key={name}
          variant="secondary"
          removable
          onRemove={() => onRemoveBrand?.(name)}
        >
          {name}
        </Badge>
      ))}

      {/* Price range tag */}
      {(filters.priceRange[0] > 0 || filters.priceRange[1] < maxPrice) && (
        <Badge variant="secondary" removable onRemove={onClearPriceRange}>
          ₹{filters.priceRange[0].toLocaleString()} - ₹
          {filters.priceRange[1].toLocaleString()}
        </Badge>
      )}

      {/* Rating tag */}
      {filters.minRating > 0 && (
        <Badge variant="secondary" removable onRemove={onClearRating}>
          {filters.minRating}+ Stars
        </Badge>
      )}

      {/* In stock tag */}
      {filters.inStock && (
        <Badge variant="secondary" removable onRemove={onClearInStock}>
          In Stock
        </Badge>
      )}

      {/* Clear all */}
      {onClearAll && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearAll}
          className="text-destructive hover:text-destructive"
        >
          Clear All
        </Button>
      )}
    </div>
  );
}

// Hook for managing filter state
export function useFilters(initialState?: Partial<FilterState>, maxPrice = 100000) {
  const defaultState: FilterState = {
    categories: [],
    brands: [],
    priceRange: [0, maxPrice],
    minRating: 0,
    inStock: false,
    ...initialState,
  };

  const [filters, setFilters] = React.useState<FilterState>(defaultState);

  const clearFilters = React.useCallback(() => {
    setFilters({
      categories: [],
      brands: [],
      priceRange: [0, maxPrice],
      minRating: 0,
      inStock: false,
    });
  }, [maxPrice]);

  const removeCategory = React.useCallback((slug: string) => {
    setFilters((prev) => ({
      ...prev,
      categories: prev.categories.filter((c) => c !== slug),
    }));
  }, []);

  const removeBrand = React.useCallback((name: string) => {
    setFilters((prev) => ({
      ...prev,
      brands: prev.brands.filter((b) => b !== name),
    }));
  }, []);

  const clearPriceRange = React.useCallback(() => {
    setFilters((prev) => ({
      ...prev,
      priceRange: [0, maxPrice],
    }));
  }, [maxPrice]);

  const clearRating = React.useCallback(() => {
    setFilters((prev) => ({
      ...prev,
      minRating: 0,
    }));
  }, []);

  const clearInStock = React.useCallback(() => {
    setFilters((prev) => ({
      ...prev,
      inStock: false,
    }));
  }, []);

  return {
    filters,
    setFilters,
    clearFilters,
    removeCategory,
    removeBrand,
    clearPriceRange,
    clearRating,
    clearInStock,
  };
}
