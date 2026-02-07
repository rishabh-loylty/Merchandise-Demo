"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { useStoreConfig } from "@/context/store-config-context";
import { fetcher } from "@/lib/fetcher";
import type { ApiCategory } from "@/lib/types";
import type { CategoriesSectionConfig } from "@/lib/store-config";
import { cn } from "@/lib/utils";
import useSWR from "swr";
import {
	BookOpen,
	ChefHat,
	Dumbbell,
	Shirt,
	Smartphone,
	Sofa,
	ShoppingBag,
	ChevronLeft,
	ChevronRight,
	type LucideIcon,
} from "lucide-react";

// Icon mapping for categories
const ICON_MAP: Record<string, LucideIcon> = {
	ChefHat,
	Smartphone,
	Shirt,
	Sofa,
	Dumbbell,
	BookOpen,
	ShoppingBag,
};

interface CategoriesSectionProps {
	className?: string;
}

export function CategoriesSection({ className }: CategoriesSectionProps) {
	const { config } = useStoreConfig();
	const categoriesSection = config.homepage.sections.find(
		(s) => s.type === "categories",
	);

	const { data: allCategories } = useSWR<ApiCategory[]>(
		"/api/categories",
		fetcher,
	);

	if (!categoriesSection?.enabled) return null;

	const sectionConfig = categoriesSection.config as CategoriesSectionConfig;
	const { title, subtitle, style, showIcons, maxItems, columns } =
		sectionConfig;

	// Get top-level categories only
	const topCategories =
		allCategories?.filter((c) => c.parent_id === null) ?? [];
	const displayCategories = topCategories.slice(0, maxItems || 6);

	if (displayCategories.length === 0) return null;

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
							<p className="mt-2 text-muted-foreground">{subtitle}</p>
						)}
					</div>
				)}

				{/* Categories Display */}
				{style === "carousel" ? (
					<CarouselCategories
						categories={displayCategories}
						showIcons={showIcons}
					/>
				) : style === "icons" ? (
					<IconCategories categories={displayCategories} columns={columns} />
				) : style === "cards" ? (
					<CardCategories categories={displayCategories} columns={columns} />
				) : (
					<GridCategories
						categories={displayCategories}
						showIcons={showIcons}
						columns={columns}
					/>
				)}
			</div>
		</section>
	);
}

// Grid Layout
function GridCategories({
	categories,
	showIcons,
	columns = 6,
}: {
	categories: ApiCategory[];
	showIcons: boolean;
	columns?: number;
}) {
	const gridCols = {
		2: "grid-cols-2",
		3: "grid-cols-2 md:grid-cols-3",
		4: "grid-cols-2 md:grid-cols-4",
		5: "grid-cols-2 md:grid-cols-3 lg:grid-cols-5",
		6: "grid-cols-2 md:grid-cols-3 lg:grid-cols-6",
	};

	return (
		<div
			className={cn(
				"grid gap-4",
				gridCols[columns as keyof typeof gridCols] || gridCols[6],
			)}
		>
			{categories.map((category) => {
				const IconComponent =
					(category.icon && ICON_MAP[category.icon]) || ShoppingBag;

				return (
					<Link
						key={category.id}
						href={`/store/search?category=${category.slug}`}
						className="group flex flex-col items-center gap-3 rounded-xl border border-border bg-card p-6 text-center transition-all duration-200 hover:border-primary hover:shadow-lg hover:-translate-y-1"
					>
						{showIcons && (
							<div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent text-primary transition-colors duration-200 group-hover:bg-primary group-hover:text-primary-foreground">
								<IconComponent className="h-8 w-8" />
							</div>
						)}
						<span className="text-sm font-medium text-foreground group-hover:text-primary">
							{category.name}
						</span>
					</Link>
				);
			})}
		</div>
	);
}

// Icon-only Layout (compact)
function IconCategories({
	categories,
	columns = 6,
}: {
	categories: ApiCategory[];
	columns?: number;
}) {
	const gridCols = {
		4: "grid-cols-4",
		5: "grid-cols-5",
		6: "grid-cols-3 sm:grid-cols-6",
		8: "grid-cols-4 sm:grid-cols-8",
	};

	return (
		<div
			className={cn(
				"grid gap-6",
				gridCols[columns as keyof typeof gridCols] || gridCols[6],
			)}
		>
			{categories.map((category) => {
				const IconComponent =
					(category.icon && ICON_MAP[category.icon]) || ShoppingBag;

				return (
					<Link
						key={category.id}
						href={`/store/search?category=${category.slug}`}
						className="group flex flex-col items-center gap-2 text-center"
					>
						<div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent text-primary transition-all duration-200 group-hover:bg-primary group-hover:text-primary-foreground group-hover:scale-110 group-hover:shadow-lg">
							<IconComponent className="h-6 w-6" />
						</div>
						<span className="text-xs font-medium text-muted-foreground group-hover:text-foreground">
							{category.name}
						</span>
					</Link>
				);
			})}
		</div>
	);
}

// Card Layout (with potential images)
function CardCategories({
	categories,
	columns = 4,
}: {
	categories: ApiCategory[];
	columns?: number;
}) {
	const gridCols = {
		2: "grid-cols-1 sm:grid-cols-2",
		3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
		4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
		6: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-6",
	};

	// Placeholder images for categories (would come from API in production)
	const categoryImages: Record<string, string> = {
		kitchen:
			"https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop",
		electronics:
			"https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400&h=300&fit=crop",
		fashion:
			"https://images.unsplash.com/photo-1445205170230-053b83016050?w=400&h=300&fit=crop",
		home: "https://images.unsplash.com/photo-1484101403633-562f891dc89a?w=400&h=300&fit=crop",
		fitness:
			"https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&h=300&fit=crop",
		books:
			"https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&h=300&fit=crop",
	};

	return (
		<div
			className={cn(
				"grid gap-4",
				gridCols[columns as keyof typeof gridCols] || gridCols[4],
			)}
		>
			{categories.map((category) => {
				const imageUrl =
					categoryImages[category.slug] ||
					categoryImages.home ||
					"https://images.unsplash.com/photo-1484101403633-562f891dc89a?w=400&h=300&fit=crop";

				return (
					<Link
						key={category.id}
						href={`/store/search?category=${category.slug}`}
						className="group relative overflow-hidden rounded-xl aspect-[4/3]"
					>
						<Image
							src={imageUrl}
							alt={category.name}
							fill
							className="object-cover transition-transform duration-300 group-hover:scale-110"
						/>
						<div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
						<div className="absolute inset-0 flex items-end p-4">
							<div>
								<h3 className="text-lg font-semibold text-white">
									{category.name}
								</h3>
								<p className="text-sm text-white/70">Shop now →</p>
							</div>
						</div>
					</Link>
				);
			})}
		</div>
	);
}

// Carousel Layout
function CarouselCategories({
	categories,
	showIcons,
}: {
	categories: ApiCategory[];
	showIcons: boolean;
}) {
	const scrollContainerRef = React.useRef<HTMLDivElement>(null);
	const [canScrollLeft, setCanScrollLeft] = React.useState(false);
	const [canScrollRight, setCanScrollRight] = React.useState(true);

	const checkScroll = React.useCallback(() => {
		const container = scrollContainerRef.current;
		if (container) {
			setCanScrollLeft(container.scrollLeft > 0);
			setCanScrollRight(
				container.scrollLeft <
					container.scrollWidth - container.clientWidth - 10,
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
	}, [checkScroll]);

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
		<div className="relative">
			{/* Scroll Buttons */}
			{canScrollLeft && (
				<button
					onClick={() => scroll("left")}
					className="absolute -left-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-card p-2 shadow-lg border border-border transition-all hover:bg-muted hover:scale-110"
					aria-label="Scroll left"
				>
					<ChevronLeft className="h-5 w-5 text-foreground" />
				</button>
			)}
			{canScrollRight && (
				<button
					onClick={() => scroll("right")}
					className="absolute -right-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-card p-2 shadow-lg border border-border transition-all hover:bg-muted hover:scale-110"
					aria-label="Scroll right"
				>
					<ChevronRight className="h-5 w-5 text-foreground" />
				</button>
			)}

			{/* Scrollable Container */}
			<div
				ref={scrollContainerRef}
				className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth pb-2"
				style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
			>
				{categories.map((category) => {
					const IconComponent =
						(category.icon && ICON_MAP[category.icon]) || ShoppingBag;

					return (
						<Link
							key={category.id}
							href={`/store/search?category=${category.slug}`}
							className="group flex flex-shrink-0 flex-col items-center gap-3 rounded-xl border border-border bg-card p-6 text-center transition-all duration-200 hover:border-primary hover:shadow-lg hover:-translate-y-1 w-[140px]"
						>
							{showIcons && (
								<div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent text-primary transition-colors duration-200 group-hover:bg-primary group-hover:text-primary-foreground">
									<IconComponent className="h-7 w-7" />
								</div>
							)}
							<span className="text-sm font-medium text-foreground group-hover:text-primary whitespace-nowrap">
								{category.name}
							</span>
						</Link>
					);
				})}
			</div>
		</div>
	);
}

export default CategoriesSection;
