"use client";

import { useGlobal } from "@/context/global-context";
import { BRANDS, CATEGORIES, PRODUCTS } from "@/lib/mock-data";
import type { Product } from "@/lib/mock-data";
import {
  ChevronDown,
  ChevronUp,
  Filter,
  Search,
  Star,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";

function SearchContent() {
  const searchParams = useSearchParams();
  const { selectedBank } = useGlobal();
  const query = searchParams.get("q") ?? "";
  const categoryParam = searchParams.get("category") ?? "";

  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100000]);
  const [minRating, setMinRating] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    category: true,
    price: true,
    brand: true,
    rating: true,
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const liveProducts = useMemo(
    () => PRODUCTS.filter((p) => p.status === "LIVE"),
    []
  );

  const filteredProducts = useMemo(() => {
    let results = [...liveProducts];

    if (categoryParam) {
      results = results.filter((p) => p.category === categoryParam);
    }
    if (query) {
      const q = query.toLowerCase();
      results = results.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q)
      );
    }
    if (selectedBrands.length > 0) {
      results = results.filter((p) => selectedBrands.includes(p.brand));
    }
    if (priceRange[0] > 0) {
      results = results.filter((p) => p.basePrice >= priceRange[0]);
    }
    if (priceRange[1] < 100000) {
      results = results.filter((p) => p.basePrice <= priceRange[1]);
    }
    if (minRating > 0) {
      results = results.filter((p) => p.rating >= minRating);
    }

    return results;
  }, [liveProducts, categoryParam, query, selectedBrands, priceRange, minRating]);

  const calculatePoints = useCallback(
    (price: number) =>
      Math.ceil(price / selectedBank.pointRatio).toLocaleString(),
    [selectedBank]
  );

  const toggleBrand = (brand: string) => {
    setSelectedBrands((prev) =>
      prev.includes(brand)
        ? prev.filter((b) => b !== brand)
        : [...prev, brand]
    );
  };

  const categoryName = categoryParam
    ? CATEGORIES.find((c) => c.id === categoryParam)?.name
    : null;

  const clearFilters = () => {
    setSelectedBrands([]);
    setPriceRange([0, 100000]);
    setMinRating(0);
  };

  const hasActiveFilters =
    selectedBrands.length > 0 || priceRange[0] > 0 || priceRange[1] < 100000 || minRating > 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {query
              ? `Results for "${query}"`
              : categoryName
                ? categoryName
                : "All Products"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {filteredProducts.length} product
            {filteredProducts.length !== 1 ? "s" : ""} found
          </p>
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground md:hidden"
        >
          <Filter className="h-4 w-4" />
          Filters
        </button>
      </div>

      <div className="flex gap-6">
        {/* Sidebar Filters */}
        <aside
          className={`${
            showFilters ? "fixed inset-0 z-50 block bg-card p-6 overflow-y-auto" : "hidden"
          } w-full flex-shrink-0 md:block md:w-64 md:static md:bg-transparent md:p-0`}
        >
          <div className="mb-4 flex items-center justify-between md:hidden">
            <h2 className="text-lg font-bold text-foreground">Filters</h2>
            <button onClick={() => setShowFilters(false)}>
              <X className="h-5 w-5 text-foreground" />
            </button>
          </div>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="mb-4 w-full rounded-lg border border-destructive px-3 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive hover:text-destructive-foreground"
            >
              Clear All Filters
            </button>
          )}

          {/* Category Filter */}
          <div className="mb-4 rounded-lg border border-border bg-card p-4">
            <button
              onClick={() => toggleSection("category")}
              className="flex w-full items-center justify-between text-sm font-semibold text-foreground"
            >
              Category
              {expandedSections.category ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>
            {expandedSections.category && (
              <div className="mt-3 flex flex-col gap-2">
                <Link
                  href="/store/search"
                  className={`rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-muted ${
                    !categoryParam
                      ? "bg-accent font-medium text-accent-foreground"
                      : "text-foreground"
                  }`}
                >
                  All Categories
                </Link>
                {CATEGORIES.map((cat) => (
                  <Link
                    key={cat.id}
                    href={`/store/search?category=${cat.id}${query ? `&q=${query}` : ""}`}
                    className={`rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-muted ${
                      categoryParam === cat.id
                        ? "bg-accent font-medium text-accent-foreground"
                        : "text-foreground"
                    }`}
                  >
                    {cat.name}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Price Range Filter */}
          <div className="mb-4 rounded-lg border border-border bg-card p-4">
            <button
              onClick={() => toggleSection("price")}
              className="flex w-full items-center justify-between text-sm font-semibold text-foreground"
            >
              Price Range
              {expandedSections.price ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>
            {expandedSections.price && (
              <div className="mt-3">
                <div className="flex items-center gap-2 text-sm">
                  <input
                    type="number"
                    value={priceRange[0]}
                    onChange={(e) =>
                      setPriceRange([Number(e.target.value), priceRange[1]])
                    }
                    className="w-full rounded-md border border-border bg-muted px-2 py-1.5 text-sm text-foreground"
                    placeholder="Min"
                  />
                  <span className="text-muted-foreground">-</span>
                  <input
                    type="number"
                    value={priceRange[1]}
                    onChange={(e) =>
                      setPriceRange([priceRange[0], Number(e.target.value)])
                    }
                    className="w-full rounded-md border border-border bg-muted px-2 py-1.5 text-sm text-foreground"
                    placeholder="Max"
                  />
                </div>
                <div className="mt-2">
                  <input
                    type="range"
                    min={0}
                    max={100000}
                    step={500}
                    value={priceRange[1]}
                    onChange={(e) =>
                      setPriceRange([priceRange[0], Number(e.target.value)])
                    }
                    className="w-full accent-primary"
                  />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Points: {calculatePoints(priceRange[0])} -{" "}
                  {calculatePoints(priceRange[1])} pts
                </p>
              </div>
            )}
          </div>

          {/* Brand Filter */}
          <div className="mb-4 rounded-lg border border-border bg-card p-4">
            <button
              onClick={() => toggleSection("brand")}
              className="flex w-full items-center justify-between text-sm font-semibold text-foreground"
            >
              Brand
              {expandedSections.brand ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>
            {expandedSections.brand && (
              <div className="mt-3 flex flex-col gap-2">
                {BRANDS.map((brand) => (
                  <label
                    key={brand}
                    className="flex cursor-pointer items-center gap-2 text-sm text-foreground"
                  >
                    <input
                      type="checkbox"
                      checked={selectedBrands.includes(brand)}
                      onChange={() => toggleBrand(brand)}
                      className="h-4 w-4 rounded border-border accent-primary"
                    />
                    {brand}
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Rating Filter */}
          <div className="rounded-lg border border-border bg-card p-4">
            <button
              onClick={() => toggleSection("rating")}
              className="flex w-full items-center justify-between text-sm font-semibold text-foreground"
            >
              Rating
              {expandedSections.rating ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>
            {expandedSections.rating && (
              <div className="mt-3 flex flex-col gap-2">
                {[4, 3, 2, 1].map((rating) => (
                  <button
                    key={rating}
                    onClick={() => setMinRating(minRating === rating ? 0 : rating)}
                    className={`flex items-center gap-1 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-muted ${
                      minRating === rating
                        ? "bg-accent text-accent-foreground"
                        : "text-foreground"
                    }`}
                  >
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-3.5 w-3.5 ${
                          i < rating
                            ? "fill-warning text-warning"
                            : "text-border"
                        }`}
                      />
                    ))}
                    <span className="ml-1">{"& Up"}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </aside>

        {/* Product Grid */}
        <div className="flex-1">
          {filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Search className="mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="mb-2 text-lg font-semibold text-foreground">
                No products found
              </h3>
              <p className="text-sm text-muted-foreground">
                Try adjusting your filters or search query
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  calculatePoints={calculatePoints}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ProductCard({
  product,
  calculatePoints,
}: {
  product: Product;
  calculatePoints: (price: number) => string;
}) {
  const { selectedBank } = useGlobal();

  return (
    <Link
      href={`/store/${product.id}`}
      className="group overflow-hidden rounded-xl border border-border bg-card transition-all hover:shadow-lg"
    >
      <div className="relative aspect-square overflow-hidden bg-muted">
        <Image
          src={product.image}
          alt={product.title}
          fill
          className="object-cover transition-transform group-hover:scale-105"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
      </div>
      <div className="p-4">
        <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {product.brand}
        </p>
        <h3 className="mb-2 line-clamp-2 text-sm font-semibold text-foreground">
          {product.title}
        </h3>
        <div className="mb-2 flex items-center gap-1">
          <Star className="h-3.5 w-3.5 fill-warning text-warning" />
          <span className="text-xs font-medium text-foreground">
            {product.rating}
          </span>
          <span className="text-xs text-muted-foreground">
            ({product.reviewCount.toLocaleString()})
          </span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-lg font-bold text-primary">
            {calculatePoints(product.basePrice)} pts
          </span>
          <span className="text-xs text-muted-foreground">
            ({selectedBank.name})
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}
