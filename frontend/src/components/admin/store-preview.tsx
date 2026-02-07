"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
	Monitor,
	Tablet,
	Smartphone,
	RefreshCw,
	ExternalLink,
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
} from "lucide-react";
import type {
	StoreConfig,
	HeroSectionConfig,
	HeroSlide,
	CategoriesSectionConfig,
	TrustBadgesSectionConfig,
} from "@/lib/store-config";

type DeviceSize = "desktop" | "tablet" | "mobile";

interface StorePreviewProps {
	config: StoreConfig;
	className?: string;
}

// Icon mapping for CTA buttons
const CTA_ICONS: Record<string, React.ElementType> = {
	ArrowRight,
	ShoppingBag,
	Sparkles,
	ExternalLink,
};

// Trust badge icons
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

	const deviceWidths: Record<DeviceSize, string> = {
		desktop: "100%",
		tablet: "768px",
		mobile: "375px",
	};

	const deviceHeights: Record<DeviceSize, string> = {
		desktop: "100%",
		tablet: "1024px",
		mobile: "667px",
	};

	const handleRefresh = () => {
		setRefreshKey((prev) => prev + 1);
	};

	return (
		<div
			className={cn(
				"flex flex-col h-full bg-muted/30 rounded-lg border border-border overflow-hidden",
				isExpanded && "fixed inset-4 z-50 bg-background shadow-2xl",
				className,
			)}
		>
			{/* Preview Header */}
			<div className="flex items-center justify-between px-4 py-2 bg-card border-b border-border">
				<div className="flex items-center gap-2">
					<div className="flex gap-1.5">
						<div className="w-3 h-3 rounded-full bg-red-500" />
						<div className="w-3 h-3 rounded-full bg-yellow-500" />
						<div className="w-3 h-3 rounded-full bg-green-500" />
					</div>
					<span className="text-sm font-medium text-muted-foreground ml-2">
						Live Preview
					</span>
				</div>

				<div className="flex items-center gap-1">
					{/* Device Size Toggles */}
					<div className="flex items-center gap-1 mr-2 p-1 bg-muted rounded-lg">
						<button
							onClick={() => setDeviceSize("desktop")}
							className={cn(
								"p-1.5 rounded-md transition-colors",
								deviceSize === "desktop"
									? "bg-background text-foreground shadow-sm"
									: "text-muted-foreground hover:text-foreground",
							)}
							title="Desktop view"
						>
							<Monitor className="h-4 w-4" />
						</button>
						<button
							onClick={() => setDeviceSize("tablet")}
							className={cn(
								"p-1.5 rounded-md transition-colors",
								deviceSize === "tablet"
									? "bg-background text-foreground shadow-sm"
									: "text-muted-foreground hover:text-foreground",
							)}
							title="Tablet view"
						>
							<Tablet className="h-4 w-4" />
						</button>
						<button
							onClick={() => setDeviceSize("mobile")}
							className={cn(
								"p-1.5 rounded-md transition-colors",
								deviceSize === "mobile"
									? "bg-background text-foreground shadow-sm"
									: "text-muted-foreground hover:text-foreground",
							)}
							title="Mobile view"
						>
							<Smartphone className="h-4 w-4" />
						</button>
					</div>

					<button
						onClick={handleRefresh}
						className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
						title="Refresh preview"
					>
						<RefreshCw className="h-4 w-4" />
					</button>

					<button
						onClick={() => setIsExpanded(!isExpanded)}
						className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
						title={isExpanded ? "Minimize" : "Maximize"}
					>
						{isExpanded ? (
							<Minimize2 className="h-4 w-4" />
						) : (
							<Maximize2 className="h-4 w-4" />
						)}
					</button>

					{isExpanded && (
						<button
							onClick={() => setIsExpanded(false)}
							className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors ml-1"
							title="Close"
						>
							<X className="h-4 w-4" />
						</button>
					)}
				</div>
			</div>

			{/* URL Bar */}
			<div className="flex items-center gap-2 px-4 py-2 bg-muted/50 border-b border-border">
				<div className="flex items-center gap-1">
					<button className="p-1 rounded text-muted-foreground hover:text-foreground">
						<ChevronLeft className="h-4 w-4" />
					</button>
					<button className="p-1 rounded text-muted-foreground hover:text-foreground">
						<ChevronRight className="h-4 w-4" />
					</button>
				</div>
				<div className="flex-1 flex items-center gap-2 px-3 py-1.5 bg-background rounded-lg border border-border">
					<div className="w-4 h-4 rounded-full bg-green-500/20 flex items-center justify-center">
						<div className="w-2 h-2 rounded-full bg-green-500" />
					</div>
					<span className="text-sm text-muted-foreground">
						{config.branding.storeName.toLowerCase().replace(/\s+/g, "-")}
						.rewards.com
					</span>
				</div>
			</div>

			{/* Preview Content */}
			<div className="flex-1 overflow-auto bg-muted/20 p-4">
				<div
					key={refreshKey}
					className={cn(
						"mx-auto bg-background rounded-lg shadow-lg overflow-hidden transition-all duration-300",
						deviceSize !== "desktop" && "border border-border",
					)}
					style={{
						width: deviceWidths[deviceSize],
						maxWidth: "100%",
						minHeight:
							deviceSize === "desktop" ? "auto" : deviceHeights[deviceSize],
					}}
				>
					{/* Apply theme colors via CSS variables */}
					<div
						style={
							{
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
							} as React.CSSProperties
						}
					>
						{/* Preview Header */}
						<PreviewHeader config={config} deviceSize={deviceSize} />

						{/* Preview Sections */}
						<PreviewHero config={config} deviceSize={deviceSize} />
						<PreviewCategories config={config} deviceSize={deviceSize} />
						<PreviewTrustBadges config={config} deviceSize={deviceSize} />
						<PreviewProducts config={config} deviceSize={deviceSize} />
						<PreviewFooter config={config} deviceSize={deviceSize} />
					</div>
				</div>
			</div>

			{/* Preview Footer */}
			<div className="px-4 py-2 bg-card border-t border-border">
				<div className="flex items-center justify-between text-xs text-muted-foreground">
					<span>Preview updates automatically as you make changes</span>
					<span>
						{deviceSize === "desktop" ? "100%" : deviceWidths[deviceSize]}
					</span>
				</div>
			</div>
		</div>
	);
}

// Preview Header Component
function PreviewHeader({
	config,
	deviceSize,
}: {
	config: StoreConfig;
	deviceSize: DeviceSize;
}) {
	const { branding, header, theme } = config;

	return (
		<header
			className="border-b"
			style={{
				backgroundColor: header.backgroundColor || "var(--preview-background)",
				borderColor: "var(--preview-border)",
			}}
		>
			<div
				className={cn(
					"flex items-center justify-between px-4 py-3",
					deviceSize === "mobile" && "px-3 py-2",
				)}
			>
				{/* Logo */}
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
								deviceSize === "mobile" ? "h-6 w-6" : "h-8 w-8",
							)}
							style={{ backgroundColor: "var(--preview-primary)" }}
						>
							<ShoppingBag
								className={cn(deviceSize === "mobile" ? "h-3 w-3" : "h-4 w-4")}
								style={{ color: "var(--preview-primary-foreground)" }}
							/>
						</div>
					)}
					<span
						className={cn(
							"font-semibold",
							deviceSize === "mobile" ? "text-sm hidden" : "text-base",
						)}
						style={{ color: "var(--preview-foreground)" }}
					>
						{branding.storeName}
					</span>
				</div>

				{/* Search & Actions */}
				<div className="flex items-center gap-2">
					{header.showSearch && deviceSize !== "mobile" && (
						<div
							className="flex items-center gap-2 px-3 py-1.5 rounded-lg border"
							style={{
								backgroundColor: "var(--preview-muted)",
								borderColor: "var(--preview-border)",
							}}
						>
							<Search
								className="h-4 w-4"
								style={{ color: "var(--preview-muted-foreground)" }}
							/>
							<span
								className="text-sm"
								style={{ color: "var(--preview-muted-foreground)" }}
							>
								Search...
							</span>
						</div>
					)}
					{deviceSize === "mobile" && (
						<button className="p-2">
							<Search
								className="h-5 w-5"
								style={{ color: "var(--preview-foreground)" }}
							/>
						</button>
					)}
				</div>
			</div>
		</header>
	);
}

// Preview Hero Component
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
	const firstSlide = slides.find((s) => s.enabled) || slides[0];

	if (!firstSlide) return null;

	const heightMap: Record<string, string> = {
		small: deviceSize === "mobile" ? "180px" : "250px",
		medium: deviceSize === "mobile" ? "220px" : "320px",
		large: deviceSize === "mobile" ? "280px" : "400px",
		full: deviceSize === "mobile" ? "350px" : "500px",
	};

	const height = heightMap[heroConfig.height] || heightMap.large;

	// Get title size classes
	const titleSizeMap: Record<string, string> = {
		small: deviceSize === "mobile" ? "text-lg" : "text-xl",
		medium: deviceSize === "mobile" ? "text-xl" : "text-2xl",
		large: deviceSize === "mobile" ? "text-2xl" : "text-3xl",
		xl: deviceSize === "mobile" ? "text-3xl" : "text-4xl",
	};

	const subtitleSizeMap: Record<string, string> = {
		small: "text-xs",
		medium: deviceSize === "mobile" ? "text-sm" : "text-base",
		large: deviceSize === "mobile" ? "text-base" : "text-lg",
	};

	const IconComponent = firstSlide.ctaIcon
		? CTA_ICONS[firstSlide.ctaIcon]
		: null;

	return (
		<section className="relative overflow-hidden" style={{ height }}>
			{/* Background */}
			{firstSlide.image ? (
				<div
					className="absolute inset-0 bg-cover bg-center"
					style={{
						backgroundImage: `url(${firstSlide.image})`,
						backgroundPosition: firstSlide.backgroundPosition || "center",
					}}
				/>
			) : firstSlide.backgroundGradient ? (
				<div
					className="absolute inset-0"
					style={{ background: firstSlide.backgroundGradient }}
				/>
			) : (
				<div
					className="absolute inset-0"
					style={{
						background: `linear-gradient(135deg, var(--preview-primary) 0%, var(--preview-accent) 100%)`,
					}}
				/>
			)}

			{/* Overlay */}
			{(firstSlide.overlayEnabled || heroConfig.overlay) && (
				<div
					className="absolute inset-0"
					style={{
						backgroundColor:
							firstSlide.overlayColor || heroConfig.overlayColor || "#000000",
						opacity:
							firstSlide.overlayOpacity ?? heroConfig.overlayOpacity ?? 0.4,
					}}
				/>
			)}

			{/* Content */}
			<div
				className={cn(
					"relative z-10 h-full flex flex-col px-4 py-6",
					firstSlide.alignment === "left" && "items-start text-left",
					firstSlide.alignment === "center" && "items-center text-center",
					firstSlide.alignment === "right" && "items-end text-right",
					firstSlide.verticalAlign === "top" && "justify-start",
					firstSlide.verticalAlign === "center" && "justify-center",
					firstSlide.verticalAlign === "bottom" && "justify-end",
				)}
			>
				<div
					className={cn(
						firstSlide.alignment === "center" && "mx-auto",
						firstSlide.alignment === "right" && "ml-auto",
					)}
					style={{ maxWidth: deviceSize === "mobile" ? "100%" : "80%" }}
				>
					{/* Badge */}
					{firstSlide.badge && (
						<span
							className="inline-block px-3 py-1 mb-3 text-xs font-medium rounded-full"
							style={{
								backgroundColor: "rgba(255,255,255,0.2)",
								color: firstSlide.textColor || "#ffffff",
							}}
						>
							{firstSlide.badge}
						</span>
					)}

					{/* Title */}
					<h1
						className={cn(
							"font-bold mb-2",
							titleSizeMap[firstSlide.titleSize] || titleSizeMap.large,
							firstSlide.textShadow && "drop-shadow-lg",
						)}
						style={{ color: firstSlide.textColor || "#ffffff" }}
					>
						{firstSlide.title}
					</h1>

					{/* Subtitle */}
					{firstSlide.subtitle && (
						<p
							className={cn(
								"mb-4 opacity-90",
								subtitleSizeMap[firstSlide.subtitleSize] ||
									subtitleSizeMap.medium,
								firstSlide.textShadow && "drop-shadow-md",
							)}
							style={{ color: firstSlide.textColor || "#ffffff" }}
						>
							{firstSlide.subtitle}
						</p>
					)}

					{/* CTA Buttons */}
					{firstSlide.ctaText && (
						<div
							className={cn(
								"flex gap-2",
								firstSlide.alignment === "center" && "justify-center",
								firstSlide.alignment === "right" && "justify-end",
								deviceSize === "mobile" && "flex-col",
							)}
						>
							<button
								className={cn(
									"inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all",
									deviceSize === "mobile"
										? "px-4 py-2 text-sm"
										: "px-5 py-2.5 text-sm",
								)}
								style={{
									backgroundColor:
										firstSlide.ctaStyle === "outline" ||
										firstSlide.ctaStyle === "ghost"
											? "transparent"
											: "var(--preview-primary)",
									color:
										firstSlide.ctaStyle === "outline" ||
										firstSlide.ctaStyle === "ghost"
											? firstSlide.textColor || "#ffffff"
											: "var(--preview-primary-foreground)",
									border:
										firstSlide.ctaStyle === "outline"
											? `2px solid ${firstSlide.textColor || "#ffffff"}`
											: "none",
								}}
							>
								{firstSlide.ctaText}
								{IconComponent && <IconComponent className="h-4 w-4" />}
							</button>

							{firstSlide.ctaSecondaryText && deviceSize !== "mobile" && (
								<button
									className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm rounded-lg font-medium"
									style={{
										backgroundColor: "transparent",
										color: firstSlide.textColor || "#ffffff",
										border: `2px solid ${firstSlide.textColor || "#ffffff"}`,
									}}
								>
									{firstSlide.ctaSecondaryText}
								</button>
							)}
						</div>
					)}
				</div>
			</div>

			{/* Navigation Dots */}
			{heroConfig.showDots && slides.length > 1 && (
				<div
					className={cn(
						"absolute z-20 flex gap-1.5",
						heroConfig.dotsPosition === "bottom" &&
							"bottom-4 left-1/2 -translate-x-1/2",
						heroConfig.dotsPosition === "bottom-left" && "bottom-4 left-4",
						heroConfig.dotsPosition === "bottom-right" && "bottom-4 right-4",
					)}
				>
					{slides.slice(0, 3).map((_, index) => (
						<div
							key={index}
							className={cn(
								"rounded-full transition-all",
								heroConfig.dotsStyle === "lines"
									? index === 0
										? "w-6 h-1 bg-white"
										: "w-3 h-1 bg-white/50"
									: index === 0
										? "w-6 h-2 bg-white"
										: "w-2 h-2 bg-white/50",
							)}
						/>
					))}
				</div>
			)}

			{/* Navigation Arrows */}
			{heroConfig.showArrows &&
				slides.length > 1 &&
				deviceSize !== "mobile" && (
					<>
						<button
							className={cn(
								"absolute top-1/2 -translate-y-1/2 left-2 z-20 p-1.5 rounded-full bg-white/80 text-gray-800",
								heroConfig.arrowStyle === "minimal" &&
									"bg-transparent text-white",
								heroConfig.arrowStyle === "rounded" && "bg-white p-2",
							)}
						>
							<ChevronLeft className="h-4 w-4" />
						</button>
						<button
							className={cn(
								"absolute top-1/2 -translate-y-1/2 right-2 z-20 p-1.5 rounded-full bg-white/80 text-gray-800",
								heroConfig.arrowStyle === "minimal" &&
									"bg-transparent text-white",
								heroConfig.arrowStyle === "rounded" && "bg-white p-2",
							)}
						>
							<ChevronRight className="h-4 w-4" />
						</button>
					</>
				)}
		</section>
	);
}

// Preview Categories Component
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

	const categoriesConfig = categoriesSection.config as CategoriesSectionConfig;

	// Mock categories
	const mockCategories = [
		{ name: "Electronics", icon: "📱" },
		{ name: "Fashion", icon: "👕" },
		{ name: "Home", icon: "🏠" },
		{ name: "Kitchen", icon: "🍳" },
		{ name: "Fitness", icon: "💪" },
		{ name: "Books", icon: "📚" },
	];

	const displayCount =
		deviceSize === "mobile" ? 4 : categoriesConfig.maxItems || 6;

	return (
		<section
			className="py-6 px-4"
			style={{ backgroundColor: "var(--preview-background)" }}
		>
			{/* Title */}
			{categoriesConfig.title && (
				<div
					className={cn(
						"mb-4",
						categoriesConfig.style === "grid" && "text-center",
					)}
				>
					<h2
						className={cn(
							"font-bold",
							deviceSize === "mobile" ? "text-lg" : "text-xl",
						)}
						style={{ color: "var(--preview-foreground)" }}
					>
						{categoriesConfig.title}
					</h2>
					{categoriesConfig.subtitle && (
						<p
							className="text-sm mt-1"
							style={{ color: "var(--preview-muted-foreground)" }}
						>
							{categoriesConfig.subtitle}
						</p>
					)}
				</div>
			)}

			{/* Categories Grid */}
			<div
				className={cn(
					"grid gap-3",
					deviceSize === "mobile"
						? "grid-cols-2"
						: "grid-cols-3 sm:grid-cols-6",
				)}
			>
				{mockCategories.slice(0, displayCount).map((category, index) => (
					<div
						key={index}
						className="flex flex-col items-center gap-2 p-3 rounded-lg border transition-colors cursor-pointer hover:border-primary"
						style={{
							backgroundColor: "var(--preview-card)",
							borderColor: "var(--preview-border)",
						}}
					>
						{categoriesConfig.showIcons && (
							<div
								className={cn(
									"flex items-center justify-center rounded-full",
									deviceSize === "mobile"
										? "h-10 w-10 text-xl"
										: "h-12 w-12 text-2xl",
								)}
								style={{ backgroundColor: "var(--preview-accent)" }}
							>
								{category.icon}
							</div>
						)}
						<span
							className={cn(
								"font-medium text-center",
								deviceSize === "mobile" ? "text-xs" : "text-sm",
							)}
							style={{ color: "var(--preview-foreground)" }}
						>
							{category.name}
						</span>
					</div>
				))}
			</div>
		</section>
	);
}

// Preview Trust Badges Component
function PreviewTrustBadges({
	config,
	deviceSize,
}: {
	config: StoreConfig;
	deviceSize: DeviceSize;
}) {
	const trustSection = config.homepage.sections.find(
		(s) => s.type === "trustBadges",
	);
	if (!trustSection?.enabled) return null;

	const trustConfig = trustSection.config as TrustBadgesSectionConfig;
	const badges = trustConfig.badges || [
		{ icon: "Shield", title: "Secure", description: "100% secure payments" },
		{ icon: "Truck", title: "Fast Delivery", description: "Free shipping" },
		{ icon: "Award", title: "Genuine", description: "Authentic products" },
		{ icon: "Headphones", title: "Support", description: "24/7 assistance" },
	];

	return (
		<section
			className="py-6 px-4"
			style={{ backgroundColor: "var(--preview-muted)" }}
		>
			{trustConfig.title && (
				<h2
					className={cn(
						"font-bold text-center mb-4",
						deviceSize === "mobile" ? "text-lg" : "text-xl",
					)}
					style={{ color: "var(--preview-foreground)" }}
				>
					{trustConfig.title}
				</h2>
			)}

			<div
				className={cn(
					"grid gap-4",
					deviceSize === "mobile" ? "grid-cols-2" : "grid-cols-4",
				)}
			>
				{badges
					.slice(0, deviceSize === "mobile" ? 4 : 4)
					.map((badge, index) => {
						const IconComponent = TRUST_ICONS[badge.icon] || Shield;
						return (
							<div
								key={index}
								className={cn(
									"flex items-center gap-3 p-3",
									trustConfig.style === "cards" && "rounded-lg border",
								)}
								style={{
									backgroundColor:
										trustConfig.style === "cards"
											? "var(--preview-card)"
											: "transparent",
									borderColor: "var(--preview-border)",
								}}
							>
								<div
									className="flex items-center justify-center h-10 w-10 rounded-full"
									style={{
										backgroundColor: "var(--preview-accent)",
										color: "var(--preview-primary)",
									}}
								>
									<IconComponent className="h-5 w-5" />
								</div>
								<div className="flex-1 min-w-0">
									<p
										className={cn(
											"font-medium truncate",
											deviceSize === "mobile" ? "text-xs" : "text-sm",
										)}
										style={{ color: "var(--preview-foreground)" }}
									>
										{badge.title}
									</p>
									{deviceSize !== "mobile" && (
										<p
											className="text-xs truncate"
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

// Preview Products Component
function PreviewProducts({
	config,
	deviceSize,
}: {
	config: StoreConfig;
	deviceSize: DeviceSize;
}) {
	const productsSection = config.homepage.sections.find(
		(s) => s.type === "featuredProducts",
	);
	if (!productsSection?.enabled) return null;

	const { productCard, pointsDisplay } = config;

	// Mock products
	const mockProducts = [
		{
			name: "Wireless Headphones",
			brand: "Sony",
			price: 4999,
			points: 19996,
			rating: 4.5,
			image:
				"https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&h=200&fit=crop",
		},
		{
			name: "Smart Watch",
			brand: "Samsung",
			price: 8999,
			points: 35996,
			rating: 4.3,
			image:
				"https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&h=200&fit=crop",
		},
		{
			name: "Running Shoes",
			brand: "Nike",
			price: 5999,
			points: 23996,
			rating: 4.7,
			image:
				"https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=200&h=200&fit=crop",
		},
		{
			name: "Air Fryer",
			brand: "Philips",
			price: 6499,
			points: 25996,
			rating: 4.4,
			image:
				"https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=200&h=200&fit=crop",
		},
	];

	const displayCount = deviceSize === "mobile" ? 2 : 4;

	return (
		<section
			className="py-6 px-4"
			style={{ backgroundColor: "var(--preview-background)" }}
		>
			{/* Title */}
			<div className="flex items-center justify-between mb-4">
				<h2
					className={cn(
						"font-bold",
						deviceSize === "mobile" ? "text-lg" : "text-xl",
					)}
					style={{ color: "var(--preview-foreground)" }}
				>
					Featured Products
				</h2>
				<button
					className="text-sm font-medium"
					style={{ color: "var(--preview-primary)" }}
				>
					View All
				</button>
			</div>

			{/* Products Grid */}
			<div
				className={cn(
					"grid gap-3",
					deviceSize === "mobile" ? "grid-cols-2" : "grid-cols-4",
				)}
			>
				{mockProducts.slice(0, displayCount).map((product, index) => (
					<div
						key={index}
						className="rounded-lg border overflow-hidden transition-shadow hover:shadow-md"
						style={{
							backgroundColor: "var(--preview-card)",
							borderColor: "var(--preview-border)",
						}}
					>
						{/* Product Image */}
						<div
							className="relative aspect-square bg-cover bg-center"
							style={{ backgroundImage: `url(${product.image})` }}
						>
							{productCard.showBadges && index === 0 && (
								<span
									className="absolute top-2 left-2 px-2 py-0.5 text-xs font-medium rounded"
									style={{
										backgroundColor: "var(--preview-primary)",
										color: "var(--preview-primary-foreground)",
									}}
								>
									Featured
								</span>
							)}
						</div>

						{/* Product Info */}
						<div className="p-3">
							{productCard.showBrand && (
								<p
									className="text-xs mb-1"
									style={{ color: "var(--preview-muted-foreground)" }}
								>
									{product.brand}
								</p>
							)}
							<h3
								className={cn(
									"font-medium mb-1 line-clamp-2",
									deviceSize === "mobile" ? "text-xs" : "text-sm",
								)}
								style={{ color: "var(--preview-foreground)" }}
							>
								{product.name}
							</h3>

							{productCard.showRating && (
								<div className="flex items-center gap-1 mb-2">
									<span className="text-yellow-500 text-xs">★</span>
									<span
										className="text-xs"
										style={{ color: "var(--preview-muted-foreground)" }}
									>
										{product.rating}
									</span>
								</div>
							)}

							{/* Price */}
							<div className="space-y-0.5">
								{productCard.showPointsPrice && (
									<p
										className={cn(
											"font-semibold",
											deviceSize === "mobile" ? "text-sm" : "text-base",
										)}
										style={{ color: "var(--preview-primary)" }}
									>
										{product.points.toLocaleString()}{" "}
										{pointsDisplay.pointsLabel}
									</p>
								)}
								{productCard.showCurrencyPrice && (
									<p
										className="text-xs"
										style={{ color: "var(--preview-muted-foreground)" }}
									>
										₹{product.price.toLocaleString()}
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

// Preview Footer Component
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
				className="py-4 px-4 border-t text-center"
				style={{
					backgroundColor: "var(--preview-muted)",
					borderColor: "var(--preview-border)",
				}}
			>
				<p
					className="text-xs"
					style={{ color: "var(--preview-muted-foreground)" }}
				>
					{footer.copyrightText}
				</p>
			</footer>
		);
	}

	return (
		<footer
			className="py-6 px-4 border-t"
			style={{
				backgroundColor: "var(--preview-muted)",
				borderColor: "var(--preview-border)",
			}}
		>
			<div
				className={cn("space-y-4", deviceSize === "mobile" && "text-center")}
			>
				{/* Logo & Tagline */}
				<div className="flex items-center gap-2 justify-center sm:justify-start">
					{branding.logo ? (
						<img
							src={branding.logo}
							alt={branding.storeName}
							className="h-6 object-contain"
						/>
					) : (
						<div
							className="flex items-center justify-center h-6 w-6 rounded"
							style={{ backgroundColor: "var(--preview-primary)" }}
						>
							<ShoppingBag
								className="h-3 w-3"
								style={{ color: "var(--preview-primary-foreground)" }}
							/>
						</div>
					)}
					<span
						className="text-sm font-semibold"
						style={{ color: "var(--preview-foreground)" }}
					>
						{branding.storeName}
					</span>
				</div>

				{branding.tagline && (
					<p
						className="text-xs max-w-xs"
						style={{ color: "var(--preview-muted-foreground)" }}
					>
						{branding.tagline}
					</p>
				)}

				{/* Quick Links */}
				{footer.quickLinks &&
					footer.quickLinks.length > 0 &&
					deviceSize !== "mobile" && (
						<div className="flex flex-wrap gap-4">
							{footer.quickLinks.slice(0, 4).map((link, index) => (
								<span
									key={index}
									className="text-xs cursor-pointer hover:underline"
									style={{ color: "var(--preview-muted-foreground)" }}
								>
									{link.label}
								</span>
							))}
						</div>
					)}

				{/* Social Links */}
				{footer.showSocialLinks && (
					<div className="flex gap-2 justify-center sm:justify-start">
						{["facebook", "twitter", "instagram", "linkedin"].map((social) => (
							<div
								key={social}
								className="w-7 h-7 rounded-full flex items-center justify-center text-xs"
								style={{
									backgroundColor: "var(--preview-background)",
									color: "var(--preview-muted-foreground)",
								}}
							>
								{social[0].toUpperCase()}
							</div>
						))}
					</div>
				)}

				{/* Copyright */}
				<p
					className="text-xs pt-2 border-t"
					style={{
						color: "var(--preview-muted-foreground)",
						borderColor: "var(--preview-border)",
					}}
				>
					{footer.copyrightText}
				</p>
			</div>
		</footer>
	);
}

export default StorePreview;
