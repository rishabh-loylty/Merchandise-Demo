"use client";

import * as React from "react";
import { useStoreConfig } from "@/context/store-config-context";
import { useGlobal } from "@/context/global-context";
import {
	HeroSection,
	CategoriesSection,
	FeaturedProductsSection,
	NewArrivalsSection,
	DealsSection,
	TrustBadgesSection,
	BrandsSection,
	StoreFooter,
} from "@/components/store";
import type { HomepageSection, HomepageSectionType } from "@/lib/store-config";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

// Section renderer component
function SectionRenderer({ section }: { section: HomepageSection }) {
	if (!section.enabled) return null;

	switch (section.type) {
		case "hero":
			return <HeroSection />;
		case "categories":
			return <CategoriesSection />;
		case "featuredProducts":
			return <FeaturedProductsSection />;
		case "newArrivals":
			return <NewArrivalsSection />;
		case "deals":
			return <DealsSection />;
		case "trustBadges":
			return <TrustBadgesSection />;
		case "brands":
			return <BrandsSection />;
		case "promotionalBanner":
			return <PromotionalBannerSection config={section.config as any} />;
		case "newsletter":
			return <NewsletterSection config={section.config as any} />;
		case "testimonials":
			return <TestimonialsSection config={section.config as any} />;
		case "customHtml":
			return <CustomHtmlSection config={section.config as any} />;
		default:
			return null;
	}
}

// Promotional Banner Section
function PromotionalBannerSection({ config }: { config: any }) {
	if (!config?.banners?.length) return null;

	const layoutClasses = {
		single: "grid-cols-1",
		double: "grid-cols-1 md:grid-cols-2",
		triple: "grid-cols-1 md:grid-cols-3",
		grid: "grid-cols-2 md:grid-cols-4",
	};

	return (
		<section className="py-8 md:py-12">
			<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
				<div
					className={cn(
						"grid gap-4",
						layoutClasses[config.layout as keyof typeof layoutClasses] ||
							layoutClasses.double,
					)}
				>
					{config.banners.map((banner: any) => (
						<a
							key={banner.id}
							href={banner.link}
							className="group relative overflow-hidden rounded-xl aspect-[2/1]"
						>
							<img
								src={banner.image}
								alt={banner.alt}
								className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
							/>
							<div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
						</a>
					))}
				</div>
			</div>
		</section>
	);
}

// Newsletter Section
function NewsletterSection({ config }: { config: any }) {
	const [email, setEmail] = React.useState("");
	const [subscribed, setSubscribed] = React.useState(false);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (email) {
			setSubscribed(true);
			setEmail("");
			setTimeout(() => setSubscribed(false), 3000);
		}
	};

	return (
		<section
			className="py-16 md:py-20"
			style={
				config?.backgroundColor
					? { backgroundColor: config.backgroundColor }
					: undefined
			}
		>
			<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
				<div className="flex flex-col items-center text-center lg:flex-row lg:items-center lg:text-left lg:justify-between gap-8">
					<div className="max-w-xl">
						<h2 className="text-2xl font-bold text-foreground md:text-3xl">
							{config?.title || "Subscribe to our Newsletter"}
						</h2>
						{config?.subtitle && (
							<p className="mt-2 text-muted-foreground">{config.subtitle}</p>
						)}
					</div>
					<form onSubmit={handleSubmit} className="flex w-full max-w-md gap-2">
						<input
							type="email"
							placeholder={config?.placeholder || "Enter your email"}
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							className="flex-1 rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
							required
						/>
						<button
							type="submit"
							className="rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
						>
							{subscribed ? "Subscribed!" : config?.buttonText || "Subscribe"}
						</button>
					</form>
				</div>
			</div>
		</section>
	);
}

// Testimonials Section
function TestimonialsSection({ config }: { config: any }) {
	if (!config?.testimonials?.length) return null;

	return (
		<section className="py-12 md:py-16 bg-muted/30">
			<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
				{(config.title || config.subtitle) && (
					<div className="mb-10 text-center">
						{config.title && (
							<h2 className="text-2xl font-bold text-foreground md:text-3xl">
								{config.title}
							</h2>
						)}
						{config.subtitle && (
							<p className="mt-2 text-muted-foreground">{config.subtitle}</p>
						)}
					</div>
				)}
				<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
					{config.testimonials.map((testimonial: any) => (
						<div
							key={testimonial.id}
							className="rounded-xl border border-border bg-card p-6 shadow-sm"
						>
							<div className="flex items-center gap-1 mb-4">
								{[...Array(5)].map((_, i) => (
									<svg
										key={i}
										className={cn(
											"h-4 w-4",
											i < testimonial.rating
												? "fill-warning text-warning"
												: "fill-muted text-muted",
										)}
										viewBox="0 0 20 20"
									>
										<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
									</svg>
								))}
							</div>
							<p className="text-sm text-muted-foreground mb-4 line-clamp-4">
								"{testimonial.content}"
							</p>
							<div className="flex items-center gap-3">
								{testimonial.avatar ? (
									<img
										src={testimonial.avatar}
										alt={testimonial.name}
										className="h-10 w-10 rounded-full object-cover"
									/>
								) : (
									<div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
										{testimonial.name.charAt(0)}
									</div>
								)}
								<div>
									<p className="text-sm font-medium text-foreground">
										{testimonial.name}
									</p>
									{testimonial.role && (
										<p className="text-xs text-muted-foreground">
											{testimonial.role}
										</p>
									)}
								</div>
							</div>
						</div>
					))}
				</div>
			</div>
		</section>
	);
}

// Custom HTML Section
function CustomHtmlSection({ config }: { config: any }) {
	if (!config?.html) return null;

	return (
		<section className="py-8">
			<div
				className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"
				dangerouslySetInnerHTML={{ __html: config.html }}
			/>
		</section>
	);
}

// Loading Skeleton
function StoreLoadingSkeleton() {
	return (
		<div className="min-h-screen bg-background">
			{/* Hero Skeleton */}
			<div className="relative w-full min-h-[500px] bg-muted animate-pulse" />

			{/* Categories Skeleton */}
			<div className="py-12">
				<div className="mx-auto max-w-7xl px-4">
					<Skeleton className="h-8 w-48 mx-auto mb-8" />
					<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
						{[...Array(6)].map((_, i) => (
							<div key={i} className="flex flex-col items-center gap-3">
								<Skeleton className="h-16 w-16 rounded-full" />
								<Skeleton className="h-4 w-20" />
							</div>
						))}
					</div>
				</div>
			</div>

			{/* Products Skeleton */}
			<div className="py-12">
				<div className="mx-auto max-w-7xl px-4">
					<Skeleton className="h-8 w-48 mb-8" />
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
						{[...Array(8)].map((_, i) => (
							<div
								key={i}
								className="rounded-xl border border-border overflow-hidden"
							>
								<Skeleton className="aspect-square w-full" />
								<div className="p-4 space-y-2">
									<Skeleton className="h-3 w-16" />
									<Skeleton className="h-4 w-full" />
									<Skeleton className="h-4 w-3/4" />
									<Skeleton className="h-3 w-20" />
									<Skeleton className="h-5 w-24" />
								</div>
							</div>
						))}
					</div>
				</div>
			</div>
		</div>
	);
}

// Points Banner Component
function PointsBanner() {
	const { selectedBank } = useGlobal();

	if (!selectedBank) return null;

	return (
		<div className="bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 border-b border-primary/20">
			<div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
				<div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm">
					<div className="flex items-center gap-2">
						<span className="font-medium text-primary">
							{selectedBank.name}
						</span>
						<span className="text-muted-foreground">•</span>
						<span className="text-foreground">
							1 point = ₹{selectedBank.points_to_currency_rate}
						</span>
					</div>
					<div className="hidden sm:flex items-center gap-4 text-muted-foreground">
						<span>🎁 Free delivery on orders above 5000 pts</span>
						<span>•</span>
						<span>⚡ Instant redemption</span>
					</div>
				</div>
			</div>
		</div>
	);
}

// Main Store Page Component
export default function StorePage() {
	const { config, isLoading, error } = useStoreConfig();
	const { selectedBank } = useGlobal();

	// Show loading state
	if (isLoading) {
		return <StoreLoadingSkeleton />;
	}

	// Show error state
	if (error) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-background">
				<div className="text-center">
					<h2 className="text-xl font-semibold text-foreground mb-2">
						Unable to load store
					</h2>
					<p className="text-muted-foreground">
						Please try refreshing the page.
					</p>
				</div>
			</div>
		);
	}

	// Get enabled sections in order
	const enabledSections = config.homepage.sections.filter((s) => s.enabled);

	return (
		<div className="min-h-screen bg-background">
			{/* Points Banner */}
			<PointsBanner />

			{/* Dynamic Sections */}
			<main>
				{enabledSections.map((section) => (
					<SectionRenderer key={section.id} section={section} />
				))}
			</main>

			{/* Store Footer */}
			<StoreFooter />
		</div>
	);
}
