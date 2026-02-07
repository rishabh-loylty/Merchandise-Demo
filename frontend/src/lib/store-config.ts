// Store Configuration Types and Defaults

// ============ COLOR TYPES ============
export interface ThemeColors {
	primary: string;
	primaryForeground: string;
	secondary: string;
	secondaryForeground: string;
	accent: string;
	accentForeground: string;
	background: string;
	foreground: string;
	muted: string;
	mutedForeground: string;
	card: string;
	cardForeground: string;
	border: string;
	destructive: string;
	destructiveForeground: string;
	success: string;
	successForeground: string;
	warning: string;
	warningForeground: string;
}

// ============ TYPOGRAPHY TYPES ============
export interface ThemeTypography {
	fontFamily: string;
	headingFontFamily: string;
	baseFontSize: string;
	headingWeight: string;
	bodyWeight: string;
	lineHeight: string;
	letterSpacing: string;
}

// ============ THEME TYPES ============
export interface ThemeConfig {
	colors: ThemeColors;
	typography: ThemeTypography;
	borderRadius: string;
	spacing: {
		containerMaxWidth: string;
		sectionPadding: string;
		cardPadding: string;
	};
}

// ============ BRANDING TYPES ============
export interface BrandingConfig {
	storeName: string;
	logo: string | null;
	logoDark: string | null;
	favicon: string | null;
	tagline: string;
}

// ============ HEADER TYPES ============
export type HeaderStyle = "minimal" | "standard" | "centered";

export interface HeaderConfig {
	style: HeaderStyle;
	sticky: boolean;
	showSearch: boolean;
	showPointsBalance: boolean;
	backgroundColor: string | null;
	transparent: boolean;
	navItems: Array<{
		label: string;
		url: string;
		highlight?: boolean;
	}>;
}

// ============ FOOTER TYPES ============
export type FooterStyle = "minimal" | "standard" | "expanded";

export interface FooterConfig {
	style: FooterStyle;
	showSocialLinks: boolean;
	socialLinks: {
		facebook: string | null;
		twitter: string | null;
		instagram: string | null;
		linkedin: string | null;
		youtube: string | null;
	};
	copyrightText: string;
	quickLinks: Array<{
		label: string;
		url: string;
	}>;
	showNewsletter: boolean;
	newsletterTitle: string;
	newsletterDescription: string;
	contactInfo: {
		email: string | null;
		phone: string | null;
		address: string | null;
	};
}

// ============ HERO SECTION TYPES ============
export type HeroStyle = "carousel" | "static" | "split" | "video" | "gradient";
export type HeroTransition = "fade" | "slide" | "zoom" | "none";
export type HeroHeight = "small" | "medium" | "large" | "full" | "custom";
export type HeroTextAnimation =
	| "none"
	| "fadeIn"
	| "slideUp"
	| "slideDown"
	| "zoomIn";
export type HeroCtaStyle = "solid" | "outline" | "ghost" | "gradient";
export type HeroVerticalAlign = "top" | "center" | "bottom";

export interface HeroSlide {
	id: string;
	// Content
	title: string;
	subtitle: string;
	description: string | null;
	badge: string | null; // e.g., "NEW", "LIMITED TIME"

	// Background
	image: string | null;
	mobileImage: string | null; // Different image for mobile
	backgroundVideo: string | null;
	backgroundColor: string | null;
	backgroundGradient: string | null; // e.g., "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
	backgroundPosition: string; // e.g., "center", "top", "bottom"
	backgroundSize: "cover" | "contain" | "auto";

	// Overlay
	overlayEnabled: boolean;
	overlayColor: string;
	overlayOpacity: number;

	// Text styling
	textColor: string | null;
	titleSize: "small" | "medium" | "large" | "xl";
	titleWeight: "normal" | "medium" | "semibold" | "bold";
	subtitleSize: "small" | "medium" | "large";
	alignment: "left" | "center" | "right";
	verticalAlign: HeroVerticalAlign;
	textShadow: boolean;
	maxWidth: "sm" | "md" | "lg" | "xl" | "full";

	// Primary CTA Button
	ctaText: string;
	ctaLink: string;
	ctaStyle: HeroCtaStyle;
	ctaSize: "sm" | "md" | "lg";
	ctaIcon: string | null; // Icon name like "ArrowRight", "ShoppingBag"
	ctaOpenInNewTab: boolean;

	// Secondary CTA Button (optional)
	ctaSecondaryText: string | null;
	ctaSecondaryLink: string | null;
	ctaSecondaryStyle: HeroCtaStyle;

	// Animation
	animation: HeroTextAnimation;
	animationDelay: number; // ms

	// Visibility
	enabled: boolean;
	startDate: string | null; // ISO date string for scheduled visibility
	endDate: string | null;
}

export interface HeroSectionConfig {
	// Layout & Style
	style: HeroStyle;
	height: HeroHeight;
	customHeight: string | null; // e.g., "600px", "80vh"
	fullWidth: boolean;
	borderRadius: string; // e.g., "0", "1rem", "2rem"

	// Carousel Settings
	autoRotate: boolean;
	autoRotateSpeed: number; // ms
	pauseOnHover: boolean;
	transition: HeroTransition;
	transitionDuration: number; // ms

	// Navigation
	showDots: boolean;
	dotsPosition: "bottom" | "bottom-left" | "bottom-right";
	dotsStyle: "dots" | "lines" | "numbers";
	showArrows: boolean;
	arrowStyle: "default" | "minimal" | "rounded" | "square";
	arrowPosition: "sides" | "bottom";

	// Global Overlay (applies to all slides without individual overlay)
	overlay: boolean;
	overlayColor: string;
	overlayOpacity: number;
	overlayGradient: string | null; // e.g., "linear-gradient(to top, rgba(0,0,0,0.7), transparent)"

	// Parallax
	parallaxEnabled: boolean;
	parallaxSpeed: number; // 0.1 to 1

	// Content Container
	containerMaxWidth: "sm" | "md" | "lg" | "xl" | "2xl" | "full";
	containerPadding: "none" | "sm" | "md" | "lg";

	// Mobile Settings
	mobileHeight: HeroHeight;
	mobileCustomHeight: string | null;
	hideArrowsOnMobile: boolean;
	stackContentOnMobile: boolean;

	// Slides
	slides: HeroSlide[];
}

// ============ CATEGORIES SECTION TYPES ============
export type CategoryStyle = "grid" | "carousel" | "icons" | "cards";

export interface CategoriesSectionConfig {
	title: string;
	subtitle: string;
	style: CategoryStyle;
	showIcons: boolean;
	showImages: boolean;
	maxItems: number;
	columns: number;
}

// ============ PRODUCTS SECTION TYPES ============
export type ProductSectionStyle = "grid" | "carousel" | "list";
export type ProductFilter =
	| "featured"
	| "bestsellers"
	| "newArrivals"
	| "deals"
	| "all";

export interface ProductsSectionConfig {
	title: string;
	subtitle: string;
	style: ProductSectionStyle;
	maxItems: number;
	columns: number;
	filter: ProductFilter;
	showViewAll: boolean;
	viewAllLink: string;
}

// ============ PROMOTIONAL BANNER TYPES ============
export interface PromotionalBanner {
	id: string;
	image: string;
	link: string;
	alt: string;
	width: "full" | "half" | "third";
}

export interface PromotionalBannerSectionConfig {
	layout: "single" | "double" | "triple" | "grid";
	banners: PromotionalBanner[];
	spacing: string;
}

// ============ BRANDS SECTION TYPES ============
export type BrandsSectionStyle = "grid" | "carousel" | "marquee";

export interface BrandsSectionConfig {
	title: string;
	subtitle: string;
	style: BrandsSectionStyle;
	maxItems: number;
	showNames: boolean;
	grayscale: boolean;
}

// ============ TRUST BADGES SECTION TYPES ============
export interface TrustBadge {
	id: string;
	icon: string;
	title: string;
	description: string;
}

export interface TrustBadgesSectionConfig {
	title: string;
	style: "horizontal" | "grid" | "cards";
	badges: TrustBadge[];
}

// ============ DEALS SECTION TYPES ============
export interface DealsSectionConfig {
	title: string;
	subtitle: string;
	showCountdown: boolean;
	countdownEndDate: string | null;
	maxItems: number;
	style: ProductSectionStyle;
}

// ============ NEW ARRIVALS SECTION TYPES ============
export interface NewArrivalsSectionConfig {
	title: string;
	subtitle: string;
	style: ProductSectionStyle;
	maxItems: number;
	daysConsideredNew: number;
}

// ============ TESTIMONIALS SECTION TYPES ============
export interface Testimonial {
	id: string;
	name: string;
	role: string;
	avatar: string | null;
	content: string;
	rating: number;
}

export interface TestimonialsSectionConfig {
	title: string;
	subtitle: string;
	style: "carousel" | "grid" | "masonry";
	testimonials: Testimonial[];
}

// ============ NEWSLETTER SECTION TYPES ============
export interface NewsletterSectionConfig {
	title: string;
	subtitle: string;
	placeholder: string;
	buttonText: string;
	backgroundColor: string | null;
	showImage: boolean;
	image: string | null;
}

// ============ HOMEPAGE SECTION TYPES ============
export type HomepageSectionType =
	| "hero"
	| "categories"
	| "featuredProducts"
	| "promotionalBanner"
	| "brands"
	| "trustBadges"
	| "deals"
	| "newArrivals"
	| "testimonials"
	| "newsletter"
	| "customHtml";

export interface HomepageSection {
	id: string;
	type: HomepageSectionType;
	enabled: boolean;
	config:
		| HeroSectionConfig
		| CategoriesSectionConfig
		| ProductsSectionConfig
		| PromotionalBannerSectionConfig
		| BrandsSectionConfig
		| TrustBadgesSectionConfig
		| DealsSectionConfig
		| NewArrivalsSectionConfig
		| TestimonialsSectionConfig
		| NewsletterSectionConfig
		| { html: string };
}

export interface HomepageConfig {
	sections: HomepageSection[];
}

// ============ PRODUCT CARD TYPES ============
export type ImageAspectRatio = "square" | "portrait" | "landscape" | "auto";
export type HoverEffect = "none" | "zoom" | "slide" | "fade";

export interface ProductCardConfig {
	showBrand: boolean;
	showRating: boolean;
	showPointsPrice: boolean;
	showCurrencyPrice: boolean;
	showQuickView: boolean;
	showWishlist: boolean;
	showAddToCart: boolean;
	imageAspectRatio: ImageAspectRatio;
	hoverEffect: HoverEffect;
	showBadges: boolean;
	badgeStyle: "rounded" | "square" | "pill";
}

// ============ PRODUCT LISTING TYPES ============
export type ViewMode = "grid" | "list";
export type SortOption =
	| "featured"
	| "newest"
	| "priceAsc"
	| "priceDesc"
	| "rating"
	| "name";
export type FilterPosition = "left" | "top" | "drawer";

export interface ProductListingConfig {
	defaultView: ViewMode;
	productsPerRow: 2 | 3 | 4 | 5 | 6;
	productsPerPage: number;
	defaultSort: SortOption;
	showFilters: boolean;
	filterPosition: FilterPosition;
	showSorting: boolean;
	showViewToggle: boolean;
	infiniteScroll: boolean;
}

// ============ POINTS DISPLAY TYPES ============
export type PrimaryDisplay = "points" | "currency" | "both";

export interface PointsDisplayConfig {
	showPointsProminent: boolean;
	pointsLabel: string;
	pointsIcon: string | null;
	showCurrencyEquivalent: boolean;
	primaryDisplay: PrimaryDisplay;
	conversionFormat: string;
}

// ============ COMPONENT STYLES TYPES ============
export type ButtonStyle = "solid" | "outline" | "ghost" | "link";
export type ButtonSize = "sm" | "md" | "lg";
export type TextTransform = "none" | "uppercase" | "lowercase" | "capitalize";
export type ShadowSize = "none" | "sm" | "md" | "lg" | "xl";
export type CardHoverEffect = "none" | "lift" | "shadow" | "border" | "scale";
export type InputStyle = "outline" | "filled" | "underline";

export interface ComponentStyles {
	buttons: {
		borderRadius: string;
		style: ButtonStyle;
		size: ButtonSize;
		textTransform: TextTransform;
	};
	cards: {
		borderRadius: string;
		shadow: ShadowSize;
		border: boolean;
		hoverEffect: CardHoverEffect;
	};
	inputs: {
		borderRadius: string;
		style: InputStyle;
	};
	badges: {
		borderRadius: string;
		style: "solid" | "outline";
	};
}

// ============ FEATURES TYPES ============
export interface FeaturesConfig {
	wishlist: boolean;
	compare: boolean;
	quickView: boolean;
	socialSharing: boolean;
	recentlyViewed: boolean;
	productReviews: boolean;
	searchSuggestions: boolean;
	recentSearches: boolean;
}

// ============ SEO TYPES ============
export interface SeoConfig {
	metaTitle: string;
	metaDescription: string;
	ogImage: string | null;
	keywords: string[];
}

// ============ ANALYTICS TYPES ============
export interface AnalyticsConfig {
	googleAnalyticsId: string | null;
	googleTagManagerId: string | null;
	facebookPixelId: string | null;
	customScripts: string;
}

// ============ MAIN STORE CONFIG TYPE ============
export interface StoreConfig {
	theme: ThemeConfig;
	branding: BrandingConfig;
	header: HeaderConfig;
	footer: FooterConfig;
	homepage: HomepageConfig;
	productCard: ProductCardConfig;
	productListing: ProductListingConfig;
	pointsDisplay: PointsDisplayConfig;
	components: ComponentStyles;
	features: FeaturesConfig;
	seo: SeoConfig;
	analytics: AnalyticsConfig;
	customCss: string;
}

// ============ DEFAULT CONFIGURATION ============
export const defaultStoreConfig: StoreConfig = {
	theme: {
		colors: {
			primary: "#1e40af",
			primaryForeground: "#ffffff",
			secondary: "#f1f5f9",
			secondaryForeground: "#0f172a",
			accent: "#dbeafe",
			accentForeground: "#1e3a5f",
			background: "#ffffff",
			foreground: "#0f172a",
			muted: "#f1f5f9",
			mutedForeground: "#64748b",
			card: "#ffffff",
			cardForeground: "#0f172a",
			border: "#e2e8f0",
			destructive: "#dc2626",
			destructiveForeground: "#ffffff",
			success: "#16a34a",
			successForeground: "#ffffff",
			warning: "#ca8a04",
			warningForeground: "#ffffff",
		},
		typography: {
			fontFamily: "Inter, system-ui, sans-serif",
			headingFontFamily: "Inter, system-ui, sans-serif",
			baseFontSize: "16px",
			headingWeight: "700",
			bodyWeight: "400",
			lineHeight: "1.5",
			letterSpacing: "0",
		},
		borderRadius: "0.5rem",
		spacing: {
			containerMaxWidth: "1280px",
			sectionPadding: "3rem",
			cardPadding: "1rem",
		},
	},
	branding: {
		storeName: "Rewards Store",
		logo: null,
		logoDark: null,
		favicon: null,
		tagline: "Redeem your points for amazing rewards",
	},
	header: {
		style: "standard",
		sticky: true,
		showSearch: true,
		showPointsBalance: true,
		backgroundColor: null,
		transparent: false,
		navItems: [],
	},
	footer: {
		style: "standard",
		showSocialLinks: true,
		socialLinks: {
			facebook: null,
			twitter: null,
			instagram: null,
			linkedin: null,
			youtube: null,
		},
		copyrightText: "© 2025 All rights reserved.",
		quickLinks: [
			{ label: "About Us", url: "/about" },
			{ label: "Contact", url: "/contact" },
			{ label: "Terms & Conditions", url: "/terms" },
			{ label: "Privacy Policy", url: "/privacy" },
		],
		showNewsletter: false,
		newsletterTitle: "Subscribe to our newsletter",
		newsletterDescription: "Get updates on new products and exclusive offers",
		contactInfo: {
			email: null,
			phone: null,
			address: null,
		},
	},
	homepage: {
		sections: [
			{
				id: "hero-1",
				type: "hero",
				enabled: true,
				config: {
					// Layout & Style
					style: "carousel",
					height: "large",
					customHeight: null,
					fullWidth: true,
					borderRadius: "0",

					// Carousel Settings
					autoRotate: true,
					autoRotateSpeed: 5000,
					pauseOnHover: true,
					transition: "fade",
					transitionDuration: 500,

					// Navigation
					showDots: true,
					dotsPosition: "bottom",
					dotsStyle: "dots",
					showArrows: true,
					arrowStyle: "default",
					arrowPosition: "sides",

					// Global Overlay
					overlay: false,
					overlayColor: "#000000",
					overlayOpacity: 0.4,
					overlayGradient: null,

					// Parallax
					parallaxEnabled: false,
					parallaxSpeed: 0.5,

					// Content Container
					containerMaxWidth: "xl",
					containerPadding: "lg",

					// Mobile Settings
					mobileHeight: "medium",
					mobileCustomHeight: null,
					hideArrowsOnMobile: true,
					stackContentOnMobile: false,

					// Slides
					slides: [
						{
							id: "slide-1",
							// Content
							title: "Redeem Your Rewards",
							subtitle: "Turn your points into premium products",
							description: null,
							badge: null,

							// Background
							image: null,
							mobileImage: null,
							backgroundVideo: null,
							backgroundColor: null,
							backgroundGradient:
								"linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
							backgroundPosition: "center",
							backgroundSize: "cover",

							// Overlay
							overlayEnabled: true,
							overlayColor: "#000000",
							overlayOpacity: 0.3,

							// Text styling
							textColor: "#ffffff",
							titleSize: "large",
							titleWeight: "bold",
							subtitleSize: "medium",
							alignment: "center",
							verticalAlign: "center",
							textShadow: true,
							maxWidth: "lg",

							// Primary CTA
							ctaText: "Shop Now",
							ctaLink: "/store/search",
							ctaStyle: "solid",
							ctaSize: "lg",
							ctaIcon: "ArrowRight",
							ctaOpenInNewTab: false,

							// Secondary CTA
							ctaSecondaryText: null,
							ctaSecondaryLink: null,
							ctaSecondaryStyle: "outline",

							// Animation
							animation: "fadeIn",
							animationDelay: 0,

							// Visibility
							enabled: true,
							startDate: null,
							endDate: null,
						},
					],
				} as HeroSectionConfig,
			},
			{
				id: "categories-1",
				type: "categories",
				enabled: true,
				config: {
					title: "Shop by Category",
					subtitle: "Explore our wide range of categories",
					style: "grid",
					showIcons: true,
					showImages: false,
					maxItems: 6,
					columns: 6,
				} as CategoriesSectionConfig,
			},
			{
				id: "featured-1",
				type: "featuredProducts",
				enabled: true,
				config: {
					title: "Featured Products",
					subtitle: "Hand-picked products just for you",
					style: "grid",
					maxItems: 8,
					columns: 4,
					filter: "featured",
					showViewAll: true,
					viewAllLink: "/store/search",
				} as ProductsSectionConfig,
			},
			{
				id: "trust-1",
				type: "trustBadges",
				enabled: true,
				config: {
					title: "",
					style: "horizontal",
					badges: [
						{
							id: "badge-1",
							icon: "Shield",
							title: "Secure Redemption",
							description: "100% safe & secure",
						},
						{
							id: "badge-2",
							icon: "Truck",
							title: "Fast Delivery",
							description: "Quick shipping",
						},
						{
							id: "badge-3",
							icon: "RefreshCw",
							title: "Easy Returns",
							description: "Hassle-free returns",
						},
						{
							id: "badge-4",
							icon: "Headphones",
							title: "24/7 Support",
							description: "Always here to help",
						},
					],
				} as TrustBadgesSectionConfig,
			},
			{
				id: "brands-1",
				type: "brands",
				enabled: true,
				config: {
					title: "Top Brands",
					subtitle: "Shop from your favorite brands",
					style: "carousel",
					maxItems: 10,
					showNames: true,
					grayscale: false,
				} as BrandsSectionConfig,
			},
			{
				id: "new-1",
				type: "newArrivals",
				enabled: true,
				config: {
					title: "New Arrivals",
					subtitle: "Check out the latest additions",
					style: "carousel",
					maxItems: 8,
					daysConsideredNew: 30,
				} as NewArrivalsSectionConfig,
			},
		],
	},
	productCard: {
		showBrand: true,
		showRating: true,
		showPointsPrice: true,
		showCurrencyPrice: true,
		showQuickView: false,
		showWishlist: false,
		showAddToCart: false,
		imageAspectRatio: "square",
		hoverEffect: "zoom",
		showBadges: true,
		badgeStyle: "rounded",
	},
	productListing: {
		defaultView: "grid",
		productsPerRow: 4,
		productsPerPage: 12,
		defaultSort: "featured",
		showFilters: true,
		filterPosition: "left",
		showSorting: true,
		showViewToggle: true,
		infiniteScroll: false,
	},
	pointsDisplay: {
		showPointsProminent: true,
		pointsLabel: "pts",
		pointsIcon: null,
		showCurrencyEquivalent: true,
		primaryDisplay: "points",
		conversionFormat: "1 pt = ₹{rate}",
	},
	components: {
		buttons: {
			borderRadius: "0.5rem",
			style: "solid",
			size: "md",
			textTransform: "none",
		},
		cards: {
			borderRadius: "0.75rem",
			shadow: "sm",
			border: true,
			hoverEffect: "lift",
		},
		inputs: {
			borderRadius: "0.5rem",
			style: "outline",
		},
		badges: {
			borderRadius: "9999px",
			style: "solid",
		},
	},
	features: {
		wishlist: false,
		compare: false,
		quickView: false,
		socialSharing: true,
		recentlyViewed: true,
		productReviews: true,
		searchSuggestions: true,
		recentSearches: true,
	},
	seo: {
		metaTitle: "Rewards Store - Redeem Your Points",
		metaDescription:
			"Redeem your reward points for premium products from top brands.",
		ogImage: null,
		keywords: ["rewards", "points", "redemption", "shopping"],
	},
	analytics: {
		googleAnalyticsId: null,
		googleTagManagerId: null,
		facebookPixelId: null,
		customScripts: "",
	},
	customCss: "",
};

// ============ HELPER FUNCTIONS ============

/**
 * Deep merge two objects, with source values overwriting target values
 */
export function deepMerge<T extends Record<string, unknown>>(
	target: T,
	source: Partial<T>,
): T {
	const result = { ...target };

	for (const key in source) {
		if (Object.prototype.hasOwnProperty.call(source, key)) {
			const sourceValue = source[key];
			const targetValue = target[key];

			if (
				sourceValue !== null &&
				typeof sourceValue === "object" &&
				!Array.isArray(sourceValue) &&
				targetValue !== null &&
				typeof targetValue === "object" &&
				!Array.isArray(targetValue)
			) {
				result[key] = deepMerge(
					targetValue as Record<string, unknown>,
					sourceValue as Record<string, unknown>,
				) as T[Extract<keyof T, string>];
			} else if (sourceValue !== undefined) {
				result[key] = sourceValue as T[Extract<keyof T, string>];
			}
		}
	}

	return result;
}

/**
 * Merge partial store config with defaults
 */
export function mergeWithDefaults(partial: Partial<StoreConfig>): StoreConfig {
	return {
		theme: partial.theme
			? { ...defaultStoreConfig.theme, ...partial.theme }
			: defaultStoreConfig.theme,
		branding: partial.branding
			? { ...defaultStoreConfig.branding, ...partial.branding }
			: defaultStoreConfig.branding,
		header: partial.header
			? { ...defaultStoreConfig.header, ...partial.header }
			: defaultStoreConfig.header,
		footer: partial.footer
			? { ...defaultStoreConfig.footer, ...partial.footer }
			: defaultStoreConfig.footer,
		homepage: partial.homepage
			? { ...defaultStoreConfig.homepage, ...partial.homepage }
			: defaultStoreConfig.homepage,
		productCard: partial.productCard
			? { ...defaultStoreConfig.productCard, ...partial.productCard }
			: defaultStoreConfig.productCard,
		productListing: partial.productListing
			? { ...defaultStoreConfig.productListing, ...partial.productListing }
			: defaultStoreConfig.productListing,
		pointsDisplay: partial.pointsDisplay
			? { ...defaultStoreConfig.pointsDisplay, ...partial.pointsDisplay }
			: defaultStoreConfig.pointsDisplay,
		components: partial.components
			? { ...defaultStoreConfig.components, ...partial.components }
			: defaultStoreConfig.components,
		features: partial.features
			? { ...defaultStoreConfig.features, ...partial.features }
			: defaultStoreConfig.features,
		seo: partial.seo
			? { ...defaultStoreConfig.seo, ...partial.seo }
			: defaultStoreConfig.seo,
		analytics: partial.analytics
			? { ...defaultStoreConfig.analytics, ...partial.analytics }
			: defaultStoreConfig.analytics,
		customCss:
			partial.customCss !== undefined
				? partial.customCss
				: defaultStoreConfig.customCss,
	};
}

/**
 * Generate CSS variables from theme colors
 */
export function generateCssVariables(config: StoreConfig): string {
	const { colors, typography, borderRadius, spacing } = config.theme;

	// Generate CSS variables that override the defaults in globals.css
	return `
    :root {
      --color-primary: ${colors.primary};
      --color-primary-foreground: ${colors.primaryForeground};
      --color-secondary: ${colors.secondary};
      --color-secondary-foreground: ${colors.secondaryForeground};
      --color-accent: ${colors.accent};
      --color-accent-foreground: ${colors.accentForeground};
      --color-background: ${colors.background};
      --color-foreground: ${colors.foreground};
      --color-muted: ${colors.muted};
      --color-muted-foreground: ${colors.mutedForeground};
      --color-card: ${colors.card};
      --color-card-foreground: ${colors.cardForeground};
      --color-border: ${colors.border};
      --color-input: ${colors.border};
      --color-ring: ${colors.primary};
      --color-destructive: ${colors.destructive};
      --color-destructive-foreground: ${colors.destructiveForeground};
      --color-success: ${colors.success};
      --color-success-foreground: ${colors.successForeground};
      --color-warning: ${colors.warning};
      --color-warning-foreground: ${colors.warningForeground};
      --color-popover: ${colors.card};
      --color-popover-foreground: ${colors.cardForeground};

      --font-family: ${typography.fontFamily};
      --font-family-heading: ${typography.headingFontFamily};
      --font-size-base: ${typography.baseFontSize};
      --font-weight-heading: ${typography.headingWeight};
      --font-weight-body: ${typography.bodyWeight};
      --line-height: ${typography.lineHeight};
      --letter-spacing: ${typography.letterSpacing};

      --radius: ${borderRadius};
      --container-max-width: ${spacing.containerMaxWidth};
      --section-padding: ${spacing.sectionPadding};
      --card-padding: ${spacing.cardPadding};
    }
  `.trim();
}

/**
 * Get section config by type
 */
export function getSectionByType(
	config: StoreConfig,
	type: HomepageSectionType,
): HomepageSection | undefined {
	return config.homepage.sections.find((s) => s.type === type);
}

/**
 * Get enabled sections in order
 */
export function getEnabledSections(config: StoreConfig): HomepageSection[] {
	return config.homepage.sections.filter((s) => s.enabled);
}

/**
 * Validate color hex code
 */
export function isValidHexColor(color: string): boolean {
	return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
}

/**
 * Generate unique ID for new sections/items
 */
export function generateId(prefix: string = "item"): string {
	return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
