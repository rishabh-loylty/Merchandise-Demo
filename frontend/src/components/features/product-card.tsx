"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Heart, ShoppingCart, Star, Eye } from "lucide-react";

const productCardVariants = cva(
	"group relative overflow-hidden rounded-xl border bg-card transition-all duration-300",
	{
		variants: {
			variant: {
				default: "border-border hover:border-primary/50 hover:shadow-lg",
				elevated: "border-border shadow-md hover:shadow-xl",
				minimal: "border-transparent hover:border-border",
				compact: "border-border",
			},
			size: {
				default: "",
				sm: "",
				lg: "",
			},
		},
		defaultVariants: {
			variant: "default",
			size: "default",
		},
	},
);

export interface ProductCardProps
	extends React.HTMLAttributes<HTMLDivElement>,
		VariantProps<typeof productCardVariants> {
	product: {
		id: number;
		title: string;
		slug?: string;
		image_url: string;
		base_price: number;
		brand_name?: string;
		rating?: number;
		review_count?: number;
		offer_status?: string;
		current_stock?: number;
		category_name?: string;
		merchant_name?: string;
	};
	href?: string;
	pointsRate?: number;
	bankName?: string;
	showActions?: boolean;
	showBrand?: boolean;
	showRating?: boolean;
	showStock?: boolean;
	showMerchant?: boolean;
	showQuickView?: boolean;
	onAddToCart?: (productId: number) => void;
	onAddToWishlist?: (productId: number) => void;
	onQuickView?: (productId: number) => void;
	isWishlisted?: boolean;
	priority?: boolean;
}

export function ProductCard({
	className,
	variant,
	size,
	product,
	href,
	pointsRate = 0.25,
	bankName,
	showActions = false,
	showBrand = true,
	showRating = true,
	showStock = false,
	showMerchant = false,
	showQuickView = false,
	onAddToCart,
	onAddToWishlist,
	onQuickView,
	isWishlisted = false,
	priority = false,
	...props
}: ProductCardProps) {
	const points = Math.ceil(product.base_price / pointsRate);
	const isOutOfStock =
		product.current_stock !== undefined && product.current_stock <= 0;
	const isLive = product.offer_status === "LIVE";

	const productUrl = href ?? `/store/${product.id}`;

	const handleAddToCart = (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		onAddToCart?.(product.id);
	};

	const handleAddToWishlist = (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		onAddToWishlist?.(product.id);
	};

	const handleQuickView = (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		onQuickView?.(product.id);
	};

	const content = (
		<>
			{/* Image container */}
			<div className="relative aspect-square overflow-hidden bg-muted">
				<Image
					src={product.image_url || "/placeholder.png"}
					alt={product.title}
					fill
					priority={priority}
					className={cn(
						"object-cover transition-transform duration-500 group-hover:scale-105",
						isOutOfStock && "opacity-60 grayscale",
					)}
					sizes={
						size === "lg"
							? "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
							: "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
					}
				/>

				{/* Badges */}
				<div className="absolute left-2 top-2 flex flex-col gap-1.5">
					{isOutOfStock && (
						<Badge variant="destructive" size="sm">
							Out of Stock
						</Badge>
					)}
					{!isLive && product.offer_status && (
						<Badge variant="warning" size="sm">
							Pending
						</Badge>
					)}
				</div>

				{/* Quick actions overlay */}
				{(showActions || showQuickView) && (
					<div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/40 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
						{showQuickView && onQuickView && (
							<button
								type="button"
								onClick={handleQuickView}
								className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-foreground shadow-lg transition-transform hover:scale-110"
								aria-label="Quick view"
							>
								<Eye className="h-5 w-5" />
							</button>
						)}
						{showActions && onAddToCart && !isOutOfStock && (
							<button
								type="button"
								onClick={handleAddToCart}
								className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-110"
								aria-label="Add to cart"
							>
								<ShoppingCart className="h-5 w-5" />
							</button>
						)}
					</div>
				)}

				{/* Wishlist button */}
				{showActions && onAddToWishlist && (
					<button
						type="button"
						onClick={handleAddToWishlist}
						className={cn(
							"absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow-sm transition-all hover:scale-110",
							isWishlisted
								? "text-destructive"
								: "text-muted-foreground hover:text-destructive",
						)}
						aria-label={
							isWishlisted ? "Remove from wishlist" : "Add to wishlist"
						}
					>
						<Heart className={cn("h-4 w-4", isWishlisted && "fill-current")} />
					</button>
				)}
			</div>

			{/* Content */}
			<div className={cn("flex flex-col gap-1 p-4", size === "sm" && "p-3")}>
				{/* Brand */}
				{showBrand && product.brand_name && (
					<p className="text-xs font-semibold uppercase tracking-wider text-primary">
						{product.brand_name}
					</p>
				)}

				{/* Title */}
				<h3
					className={cn(
						"line-clamp-2 font-semibold text-foreground transition-colors group-hover:text-primary",
						size === "sm" ? "text-sm" : "text-base",
					)}
				>
					{product.title}
				</h3>

				{/* Rating */}
				{showRating && product.rating !== undefined && (
					<div className="flex items-center gap-1.5">
						<div className="flex items-center gap-0.5">
							<Star className="h-3.5 w-3.5 fill-warning text-warning" />
							<span className="text-xs font-medium text-foreground">
								{Number(product.rating).toFixed(1)}
							</span>
						</div>
						{product.review_count !== undefined && (
							<span className="text-xs text-muted-foreground">
								({product.review_count.toLocaleString()})
							</span>
						)}
					</div>
				)}

				{/* Merchant */}
				{showMerchant && product.merchant_name && (
					<p className="text-xs text-muted-foreground">
						Sold by {product.merchant_name}
					</p>
				)}

				{/* Stock indicator */}
				{showStock &&
					product.current_stock !== undefined &&
					product.current_stock > 0 && (
						<p className="text-xs text-success">
							{product.current_stock < 10
								? `Only ${product.current_stock} left`
								: "In Stock"}
						</p>
					)}

				{/* Price */}
				<div className="mt-2 flex flex-col gap-0.5">
					<div className="flex items-baseline gap-1.5">
						<span
							className={cn(
								"font-bold text-primary",
								size === "sm" ? "text-base" : "text-lg",
							)}
						>
							{points.toLocaleString()}
						</span>
						<span className="text-xs font-medium text-muted-foreground">
							pts
						</span>
					</div>
					<div className="flex items-center gap-1.5 text-xs text-muted-foreground">
						<span>₹{product.base_price.toLocaleString()}</span>
						{bankName && <span>• {bankName}</span>}
					</div>
				</div>
			</div>
		</>
	);

	if (href) {
		return (
			<Link
				href={productUrl}
				className={cn(productCardVariants({ variant, size, className }))}
			>
				{content}
			</Link>
		);
	}

	return (
		<div
			className={cn(productCardVariants({ variant, size, className }))}
			{...props}
		>
			{content}
		</div>
	);
}

// Grid layout helper
interface ProductGridProps extends React.HTMLAttributes<HTMLDivElement> {
	columns?: 2 | 3 | 4 | 5 | 6;
	gap?: "sm" | "default" | "lg";
}

export function ProductGrid({
	className,
	columns = 4,
	gap = "default",
	children,
	...props
}: ProductGridProps) {
	const columnClasses = {
		2: "grid-cols-1 sm:grid-cols-2",
		3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
		4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
		5: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5",
		6: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6",
	};

	const gapClasses = {
		sm: "gap-3",
		default: "gap-4 lg:gap-6",
		lg: "gap-6 lg:gap-8",
	};

	return (
		<div
			className={cn("grid", columnClasses[columns], gapClasses[gap], className)}
			{...props}
		>
			{children}
		</div>
	);
}

// Skeleton loader for product cards
interface ProductCardSkeletonProps {
	variant?: "default" | "compact";
}

export function ProductCardSkeleton({
	variant = "default",
}: ProductCardSkeletonProps) {
	return (
		<div className="overflow-hidden rounded-xl border border-border bg-card">
			<div className="aspect-square animate-pulse bg-muted" />
			<div
				className={cn(
					"flex flex-col gap-2 p-4",
					variant === "compact" && "p-3",
				)}
			>
				<div className="h-3 w-16 animate-pulse rounded bg-muted" />
				<div className="h-4 w-full animate-pulse rounded bg-muted" />
				<div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
				<div className="h-3 w-20 animate-pulse rounded bg-muted" />
				<div className="mt-2 h-5 w-24 animate-pulse rounded bg-muted" />
			</div>
		</div>
	);
}

export function ProductGridSkeleton({
	count = 8,
	columns = 4,
}: {
	count?: number;
	columns?: 2 | 3 | 4 | 5 | 6;
}) {
	return (
		<ProductGrid columns={columns}>
			{Array.from({ length: count }).map((_, i) => (
				<ProductCardSkeleton key={i} />
			))}
		</ProductGrid>
	);
}
