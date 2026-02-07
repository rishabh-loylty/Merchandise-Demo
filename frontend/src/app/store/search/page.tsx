"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useGlobal } from "@/context/global-context";
import { useStoreConfig } from "@/context/store-config-context";
import { fetcher } from "@/lib/fetcher";
import type { ApiBrand, ApiCategory, ApiProduct } from "@/lib/types";
import {
	ProductCard,
	ProductCardSkeleton,
} from "@/components/store/product-card";
import { StoreFooter } from "@/components/store/store-footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
	Select,
	SelectTrigger,
	SelectContent,
	SelectItem,
	SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
	ChevronDown,
	ChevronUp,
	Filter,
	Search,
	Star,
	X,
	Grid3X3,
	List,
	SlidersHorizontal,
} from "lucide-react";
import useSWR from "swr";

function SearchContent() {
	const searchParams = useSearchParams();
	const { selectedBank } = useGlobal();
	const { config } = useStoreConfig();
	const { productListing, pointsDisplay } = config;

	const query = searchParams.get("q") ?? "";
	const categoryParam = searchParams.get("category") ?? "";
	const brandParam = searchParams.get("brand") ?? "";

	// View and sort state
	const [viewMode, setViewMode] = React.useState<"grid" | "list">(
		productListing.defaultView,
	);
	const [sortBy, setSortBy] = React.useState(productListing.defaultSort);

	// Build API URL with query params
	const apiUrl = React.useMemo(() => {
		const params = new URLSearchParams();
		params.set("status", "LIVE");
		if (query) params.set("q", query);
		if (categoryParam) params.set("category", categoryParam);
		if (brandParam) params.set("brand", brandParam);
		return `/api/products?${params.toString()}`;
	}, [query, categoryParam, brandParam]);

	const { data: products, isLoading } = useSWR<ApiProduct[]>(apiUrl, fetcher);
	const { data: categories } = useSWR<ApiCategory[]>(
		"/api/categories",
		fetcher,
	);
	const { data: brands } = useSWR<ApiBrand[]>("/api/brands", fetcher);

	const topCategories = categories?.filter((c) => c.parent_id === null) ?? [];
	const activeBrands = brands?.filter((b) => b.is_active) ?? [];

	// Filter state
	const [selectedBrands, setSelectedBrands] = React.useState<string[]>(
		brandParam ? [brandParam] : [],
	);
	const [priceRange, setPriceRange] = React.useState<[number, number]>([
		0, 100000,
	]);
	const [minRating, setMinRating] = React.useState(0);
	const [showFilters, setShowFilters] = React.useState(false);
	const [expandedSections, setExpandedSections] = React.useState({
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

	// Client-side filtering for brand, price, rating
	const filteredProducts = React.useMemo(() => {
		let results = products ?? [];

		if (selectedBrands.length > 0) {
			results = results.filter((p) => selectedBrands.includes(p.brand_name));
		}
		if (priceRange[0] > 0) {
			results = results.filter((p) => p.base_price >= priceRange[0]);
		}
		if (priceRange[1] < 100000) {
			results = results.filter((p) => p.base_price <= priceRange[1]);
		}
		if (minRating > 0) {
			results = results.filter((p) => Number(p.rating) >= minRating);
		}

		// Sort
		switch (sortBy) {
			case "priceAsc":
				results = [...results].sort((a, b) => a.base_price - b.base_price);
				break;
			case "priceDesc":
				results = [...results].sort((a, b) => b.base_price - a.base_price);
				break;
			case "rating":
				results = [...results].sort(
					(a, b) => Number(b.rating) - Number(a.rating),
				);
				break;
			case "newest":
				results = [...results].sort((a, b) => b.id - a.id);
				break;
			case "name":
				results = [...results].sort((a, b) => a.title.localeCompare(b.title));
				break;
		}

		return results;
	}, [products, selectedBrands, priceRange, minRating, sortBy]);

	const calculatePoints = React.useCallback(
		(price: number) => {
			const rate = selectedBank?.points_to_currency_rate ?? 0.25;
			return Math.ceil(price / rate).toLocaleString();
		},
		[selectedBank],
	);

	const toggleBrand = (brand: string) => {
		setSelectedBrands((prev) =>
			prev.includes(brand) ? prev.filter((b) => b !== brand) : [...prev, brand],
		);
	};

	const categoryName = categoryParam
		? topCategories.find((c) => c.slug === categoryParam)?.name
		: null;

	const clearFilters = () => {
		setSelectedBrands([]);
		setPriceRange([0, 100000]);
		setMinRating(0);
	};

	const hasActiveFilters =
		selectedBrands.length > 0 ||
		priceRange[0] > 0 ||
		priceRange[1] < 100000 ||
		minRating > 0;

	// Grid columns based on config
	const gridCols = {
		2: "grid-cols-1 sm:grid-cols-2",
		3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
		4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
		5: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5",
		6: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6",
	};

	return (
		<div className="min-h-screen bg-background">
			<div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
				{/* Header */}
				<div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
							{query
								? `Results for "${query}"`
								: categoryName
									? categoryName
									: brandParam
										? `${brandParam} Products`
										: "All Products"}
						</h1>
						<p className="mt-1 text-sm text-muted-foreground">
							{filteredProducts.length} product
							{filteredProducts.length !== 1 ? "s" : ""} found
						</p>
					</div>

					<div className="flex items-center gap-3">
						{/* Mobile Filter Toggle */}
						<Button
							variant="outline"
							size="sm"
							onClick={() => setShowFilters(!showFilters)}
							className="lg:hidden"
						>
							<Filter className="h-4 w-4 mr-2" />
							Filters
							{hasActiveFilters && (
								<Badge
									className="ml-2 h-5 w-5 p-0 justify-center"
									variant="default"
								>
									{selectedBrands.length + (minRating > 0 ? 1 : 0)}
								</Badge>
							)}
						</Button>

						{/* View Toggle */}
						{productListing.showViewToggle && (
							<div className="hidden sm:flex items-center border border-border rounded-lg">
								<button
									onClick={() => setViewMode("grid")}
									className={cn(
										"p-2 transition-colors",
										viewMode === "grid"
											? "bg-primary text-primary-foreground"
											: "text-muted-foreground hover:text-foreground",
									)}
									aria-label="Grid view"
								>
									<Grid3X3 className="h-4 w-4" />
								</button>
								<button
									onClick={() => setViewMode("list")}
									className={cn(
										"p-2 transition-colors",
										viewMode === "list"
											? "bg-primary text-primary-foreground"
											: "text-muted-foreground hover:text-foreground",
									)}
									aria-label="List view"
								>
									<List className="h-4 w-4" />
								</button>
							</div>
						)}

						{/* Sort Dropdown */}
						{productListing.showSorting && (
							<Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
								<SelectTrigger className="w-[160px]">
									<SelectValue placeholder="Sort by" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="featured">Featured</SelectItem>
									<SelectItem value="newest">Newest</SelectItem>
									<SelectItem value="priceAsc">Price: Low to High</SelectItem>
									<SelectItem value="priceDesc">Price: High to Low</SelectItem>
									<SelectItem value="rating">Highest Rated</SelectItem>
									<SelectItem value="name">Name A-Z</SelectItem>
								</SelectContent>
							</Select>
						)}
					</div>
				</div>

				<div className="flex gap-6">
					{/* Sidebar Filters */}
					{productListing.showFilters && (
						<aside
							className={cn(
								"w-full flex-shrink-0 lg:w-64",
								showFilters
									? "fixed inset-0 z-50 overflow-y-auto bg-background p-6 lg:static lg:bg-transparent lg:p-0"
									: "hidden lg:block",
							)}
						>
							{/* Mobile header */}
							<div className="mb-4 flex items-center justify-between lg:hidden">
								<h2 className="text-lg font-bold text-foreground">Filters</h2>
								<Button
									variant="ghost"
									size="sm"
									onClick={() => setShowFilters(false)}
								>
									<X className="h-5 w-5" />
								</Button>
							</div>

							{hasActiveFilters && (
								<Button
									variant="outline"
									size="sm"
									onClick={clearFilters}
									className="mb-4 w-full text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
								>
									Clear All Filters
								</Button>
							)}

							{/* Category Filter */}
							<FilterSection
								title="Category"
								expanded={expandedSections.category}
								onToggle={() => toggleSection("category")}
							>
								<div className="flex flex-col gap-1">
									<Link
										href="/store/search"
										className={cn(
											"rounded-md px-3 py-2 text-sm transition-colors hover:bg-muted",
											!categoryParam
												? "bg-accent font-medium text-accent-foreground"
												: "text-foreground",
										)}
									>
										All Categories
									</Link>
									{topCategories.map((cat) => (
										<Link
											key={cat.id}
											href={`/store/search?category=${cat.slug}${query ? `&q=${query}` : ""}`}
											className={cn(
												"rounded-md px-3 py-2 text-sm transition-colors hover:bg-muted",
												categoryParam === cat.slug
													? "bg-accent font-medium text-accent-foreground"
													: "text-foreground",
											)}
										>
											{cat.name}
										</Link>
									))}
								</div>
							</FilterSection>

							{/* Price Range Filter */}
							<FilterSection
								title="Price Range"
								expanded={expandedSections.price}
								onToggle={() => toggleSection("price")}
							>
								<div className="space-y-3">
									<div className="flex items-center gap-2 text-sm">
										<Input
											type="number"
											value={priceRange[0]}
											onChange={(e) =>
												setPriceRange([Number(e.target.value), priceRange[1]])
											}
											placeholder="Min"
											inputSize="sm"
										/>
										<span className="text-muted-foreground">-</span>
										<Input
											type="number"
											value={priceRange[1]}
											onChange={(e) =>
												setPriceRange([priceRange[0], Number(e.target.value)])
											}
											placeholder="Max"
											inputSize="sm"
										/>
									</div>
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
									<p className="text-xs text-muted-foreground">
										{pointsDisplay.showPointsProminent && (
											<>
												{calculatePoints(priceRange[0])} -{" "}
												{calculatePoints(priceRange[1])}{" "}
												{pointsDisplay.pointsLabel}
											</>
										)}
									</p>
								</div>
							</FilterSection>

							{/* Brand Filter */}
							<FilterSection
								title="Brand"
								expanded={expandedSections.brand}
								onToggle={() => toggleSection("brand")}
							>
								<div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
									{activeBrands.map((brand) => (
										<label
											key={brand.id}
											className="flex cursor-pointer items-center gap-2 text-sm text-foreground"
										>
											<input
												type="checkbox"
												checked={selectedBrands.includes(brand.name)}
												onChange={() => toggleBrand(brand.name)}
												className="h-4 w-4 rounded border-border accent-primary"
											/>
											{brand.name}
										</label>
									))}
								</div>
							</FilterSection>

							{/* Rating Filter */}
							<FilterSection
								title="Rating"
								expanded={expandedSections.rating}
								onToggle={() => toggleSection("rating")}
							>
								<div className="flex flex-col gap-1">
									{[4, 3, 2, 1].map((rating) => (
										<button
											key={rating}
											onClick={() =>
												setMinRating(minRating === rating ? 0 : rating)
											}
											className={cn(
												"flex items-center gap-1 rounded-md px-3 py-2 text-sm transition-colors hover:bg-muted",
												minRating === rating
													? "bg-accent text-accent-foreground"
													: "text-foreground",
											)}
										>
											{Array.from({ length: 5 }).map((_, i) => (
												<Star
													key={i}
													className={cn(
														"h-3.5 w-3.5",
														i < rating
															? "fill-warning text-warning"
															: "text-border",
													)}
												/>
											))}
											<span className="ml-1">& Up</span>
										</button>
									))}
								</div>
							</FilterSection>

							{/* Mobile Apply Button */}
							<div className="mt-6 lg:hidden">
								<Button
									className="w-full"
									onClick={() => setShowFilters(false)}
								>
									Apply Filters
								</Button>
							</div>
						</aside>
					)}

					{/* Product Grid */}
					<div className="flex-1">
						{isLoading ? (
							<div
								className={cn(
									"grid gap-4",
									gridCols[
										productListing.productsPerRow as keyof typeof gridCols
									],
								)}
							>
								{Array.from({ length: productListing.productsPerPage }).map(
									(_, i) => (
										<ProductCardSkeleton key={i} />
									),
								)}
							</div>
						) : filteredProducts.length === 0 ? (
							<div className="flex flex-col items-center justify-center py-20 text-center">
								<Search className="mb-4 h-12 w-12 text-muted-foreground" />
								<h3 className="mb-2 text-lg font-semibold text-foreground">
									No products found
								</h3>
								<p className="text-sm text-muted-foreground mb-4">
									Try adjusting your filters or search query
								</p>
								{hasActiveFilters && (
									<Button variant="outline" onClick={clearFilters}>
										Clear Filters
									</Button>
								)}
							</div>
						) : viewMode === "list" ? (
							<div className="flex flex-col gap-4">
								{filteredProducts.map((product) => (
									<ProductCardList key={product.id} product={product} />
								))}
							</div>
						) : (
							<div
								className={cn(
									"grid gap-4",
									gridCols[
										productListing.productsPerRow as keyof typeof gridCols
									],
								)}
							>
								{filteredProducts.map((product, index) => (
									<ProductCard
										key={product.id}
										product={product}
										priority={index < 8}
									/>
								))}
							</div>
						)}
					</div>
				</div>
			</div>

			<StoreFooter />
		</div>
	);
}

// Filter Section Component
function FilterSection({
	title,
	expanded,
	onToggle,
	children,
}: {
	title: string;
	expanded: boolean;
	onToggle: () => void;
	children: React.ReactNode;
}) {
	return (
		<div className="mb-4 rounded-lg border border-border bg-card p-4">
			<button
				onClick={onToggle}
				className="flex w-full items-center justify-between text-sm font-semibold text-foreground"
			>
				{title}
				{expanded ? (
					<ChevronUp className="h-4 w-4" />
				) : (
					<ChevronDown className="h-4 w-4" />
				)}
			</button>
			{expanded && <div className="mt-3">{children}</div>}
		</div>
	);
}

// List view product card
function ProductCardList({ product }: { product: ApiProduct }) {
	const { config } = useStoreConfig();
	const { selectedBank } = useGlobal();
	const { productCard, pointsDisplay, components } = config;

	const rate = selectedBank?.points_to_currency_rate ?? 0.25;
	const points = Math.ceil(product.base_price / rate);

	return (
		<Link
			href={`/store/${product.id}`}
			className={cn(
				"group flex gap-4 overflow-hidden rounded-xl border border-border bg-card p-4 transition-all duration-300 hover:shadow-lg hover:border-primary/50",
				components.cards.hoverEffect === "lift" && "hover:-translate-y-0.5",
			)}
		>
			{/* Image */}
			<div className="relative h-28 w-28 flex-shrink-0 overflow-hidden rounded-lg bg-muted sm:h-36 sm:w-36">
				<img
					src={product.image_url}
					alt={product.title}
					className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
				/>
			</div>

			{/* Content */}
			<div className="flex flex-1 flex-col justify-center min-w-0">
				{productCard.showBrand && product.brand_name && (
					<p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
						{product.brand_name}
					</p>
				)}
				<h3 className="mt-1 line-clamp-2 text-base font-semibold text-foreground group-hover:text-primary transition-colors">
					{product.title}
				</h3>
				{productCard.showRating && (
					<div className="mt-2 flex items-center gap-1">
						<Star className="h-3.5 w-3.5 fill-warning text-warning" />
						<span className="text-xs font-medium text-foreground">
							{Number(product.rating).toFixed(1)}
						</span>
						<span className="text-xs text-muted-foreground">
							({product.review_count.toLocaleString()} reviews)
						</span>
					</div>
				)}
				<div className="mt-2 flex items-center gap-3">
					{productCard.showPointsPrice && (
						<div className="flex items-baseline gap-1">
							<span className="text-lg font-bold text-primary">
								{points.toLocaleString()}
							</span>
							<span className="text-sm font-medium text-primary">
								{pointsDisplay.pointsLabel}
							</span>
						</div>
					)}
					{productCard.showCurrencyPrice && (
						<span className="text-sm text-muted-foreground">
							₹{product.base_price.toLocaleString()}
						</span>
					)}
				</div>
			</div>
		</Link>
	);
}

export default function SearchPage() {
	return (
		<React.Suspense
			fallback={
				<div className="flex min-h-[50vh] items-center justify-center">
					<div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
				</div>
			}
		>
			<SearchContent />
		</React.Suspense>
	);
}
