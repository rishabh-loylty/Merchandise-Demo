import { neon } from "@neondatabase/serverless";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
	console.error("Missing DATABASE_URL. Set it in .env or the shell.");
	process.exit(1);
}

const sql = neon(databaseUrl);

console.log("🔄 Running store_config migration...\n");

// Step 1: Add store_config column if it doesn't exist
console.log("Step 1: Adding store_config column if not exists...");
try {
	await sql.query(`
		ALTER TABLE loyalty_partners
		ADD COLUMN IF NOT EXISTS store_config JSONB DEFAULT '{}'::jsonb
	`);
	console.log("✅ store_config column exists or was added\n");
} catch (err) {
	console.error("❌ Error adding column:", err.message);
	process.exit(1);
}

// Step 2: Check current partners
console.log("Step 2: Checking existing partners...");
const partners = await sql.query(`
	SELECT id, name, store_config
	FROM loyalty_partners
	ORDER BY id
`);
console.log(`Found ${partners.length} partners\n`);

// Default store configuration template
const defaultStoreConfig = {
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
		copyrightText: "© 2025 Rewards Store. All rights reserved.",
		quickLinks: [
			{ label: "About Us", url: "/about" },
			{ label: "Contact", url: "/contact" },
			{ label: "Terms", url: "/terms" },
			{ label: "Privacy", url: "/privacy" },
		],
		showNewsletter: false,
		newsletterTitle: "Subscribe to our newsletter",
		newsletterDescription: "Get the latest updates on new products and offers",
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
					style: "carousel",
					autoRotate: true,
					autoRotateSpeed: 5000,
					showDots: true,
					showArrows: true,
					height: "large",
					overlay: true,
					overlayOpacity: 0.3,
					slides: [
						{
							id: "slide-1",
							title: "Welcome to Rewards Store",
							subtitle: "Redeem your points for amazing products",
							image: null,
							ctaText: "Shop Now",
							ctaLink: "/store/search",
							backgroundColor: "#1e40af",
							textColor: "#ffffff",
							alignment: "center",
						},
					],
				},
			},
			{
				id: "categories-1",
				type: "categories",
				enabled: true,
				config: {
					title: "Shop by Category",
					subtitle: "Browse our wide selection",
					style: "grid",
					showIcons: true,
					showImages: false,
					maxItems: 6,
					columns: 6,
				},
			},
			{
				id: "featured-1",
				type: "featuredProducts",
				enabled: true,
				config: {
					title: "Featured Products",
					subtitle: "Handpicked just for you",
					style: "grid",
					maxItems: 8,
					columns: 4,
					filter: "featured",
					showViewAll: true,
					viewAllLink: "/store/search?featured=true",
				},
			},
			{
				id: "trust-1",
				type: "trustBadges",
				enabled: true,
				config: {
					title: "Why Shop With Us",
					style: "horizontal",
					badges: [
						{
							id: "badge-1",
							icon: "Shield",
							title: "Secure Redemption",
							description: "100% secure point redemption",
						},
						{
							id: "badge-2",
							icon: "Truck",
							title: "Fast Delivery",
							description: "Free delivery on all orders",
						},
						{
							id: "badge-3",
							icon: "Award",
							title: "Genuine Products",
							description: "Authentic brands guaranteed",
						},
						{
							id: "badge-4",
							icon: "Headphones",
							title: "24/7 Support",
							description: "Round the clock assistance",
						},
					],
				},
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
					showNames: false,
					grayscale: false,
				},
			},
			{
				id: "newarrivals-1",
				type: "newArrivals",
				enabled: true,
				config: {
					title: "New Arrivals",
					subtitle: "Fresh picks just in",
					style: "carousel",
					maxItems: 8,
					daysConsideredNew: 30,
				},
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
			"Redeem your loyalty points for amazing products from top brands.",
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

// Bank-specific configurations with official brand colors
const bankConfigs = {
	SBI: {
		theme: {
			colors: {
				...defaultStoreConfig.theme.colors,
				// SBI official blue
				primary: "#22409A",
				primaryForeground: "#ffffff",
				// Light blue accent
				accent: "#E8EEF7",
				accentForeground: "#22409A",
				// Secondary - lighter blue
				secondary: "#F0F4FA",
				secondaryForeground: "#1a3278",
				// Ring color for focus states
				ring: "#22409A",
			},
		},
		branding: {
			storeName: "SBI Rewardz",
			logo: "https://www.sbi.co.in/o/SBIAssetsPath/assets/images/logos/SBI_Colour.png",
			logoDark: null,
			favicon: null,
			tagline: "Redeem your SBI reward points for exclusive products",
		},
		homepage: {
			sections: [
				{
					id: "hero-1",
					type: "hero",
					enabled: true,
					config: {
						style: "carousel",
						height: "large",
						customHeight: null,
						fullWidth: true,
						borderRadius: "0",
						autoRotate: true,
						autoRotateSpeed: 5000,
						pauseOnHover: true,
						transition: "fade",
						transitionDuration: 500,
						showDots: true,
						dotsPosition: "bottom",
						dotsStyle: "dots",
						showArrows: true,
						arrowStyle: "default",
						arrowPosition: "sides",
						overlay: false,
						overlayColor: "#000000",
						overlayOpacity: 0.4,
						overlayGradient: null,
						parallaxEnabled: false,
						parallaxSpeed: 0.5,
						containerMaxWidth: "xl",
						containerPadding: "lg",
						mobileHeight: "medium",
						mobileCustomHeight: null,
						hideArrowsOnMobile: true,
						stackContentOnMobile: false,
						slides: [
							{
								id: "sbi-slide-1",
								title: "Welcome to SBI Rewardz",
								subtitle: "Turn your reward points into premium products",
								description:
									"India's most trusted bank brings you exclusive rewards",
								badge: "EXCLUSIVE",
								image:
									"https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1920&h=1080&fit=crop",
								mobileImage: null,
								backgroundVideo: null,
								backgroundColor: null,
								backgroundGradient:
									"linear-gradient(135deg, #22409A 0%, #1a3278 50%, #0f1d4a 100%)",
								backgroundPosition: "center",
								backgroundSize: "cover",
								overlayEnabled: true,
								overlayColor: "#000000",
								overlayOpacity: 0.4,
								textColor: "#ffffff",
								titleSize: "large",
								titleWeight: "bold",
								subtitleSize: "medium",
								alignment: "center",
								verticalAlign: "center",
								textShadow: true,
								maxWidth: "lg",
								ctaText: "Start Shopping",
								ctaLink: "/store/search",
								ctaStyle: "solid",
								ctaSize: "lg",
								ctaIcon: "ArrowRight",
								ctaOpenInNewTab: false,
								ctaSecondaryText: "View Categories",
								ctaSecondaryLink: "/store/search?view=categories",
								ctaSecondaryStyle: "outline",
								animation: "fadeIn",
								animationDelay: 0,
								enabled: true,
								startDate: null,
								endDate: null,
							},
							{
								id: "sbi-slide-2",
								title: "Festive Season Sale",
								subtitle: "Up to 50% bonus points on select products",
								description: null,
								badge: "LIMITED TIME",
								image:
									"https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1920&h=1080&fit=crop",
								mobileImage: null,
								backgroundVideo: null,
								backgroundColor: null,
								backgroundGradient: null,
								backgroundPosition: "center",
								backgroundSize: "cover",
								overlayEnabled: true,
								overlayColor: "#22409A",
								overlayOpacity: 0.6,
								textColor: "#ffffff",
								titleSize: "large",
								titleWeight: "bold",
								subtitleSize: "medium",
								alignment: "left",
								verticalAlign: "center",
								textShadow: true,
								maxWidth: "md",
								ctaText: "Shop Sale",
								ctaLink: "/store/search?sale=true",
								ctaStyle: "solid",
								ctaSize: "lg",
								ctaIcon: "Sparkles",
								ctaOpenInNewTab: false,
								ctaSecondaryText: null,
								ctaSecondaryLink: null,
								ctaSecondaryStyle: "outline",
								animation: "slideUp",
								animationDelay: 0,
								enabled: true,
								startDate: null,
								endDate: null,
							},
						],
					},
				},
			],
		},
		footer: {
			...defaultStoreConfig.footer,
			copyrightText: "© 2025 State Bank of India. All rights reserved.",
			socialLinks: {
				facebook: "https://www.facebook.com/StateBankOfIndia",
				twitter: "https://twitter.com/TheOfficialSBI",
				instagram: "https://www.instagram.com/officialsbi",
				linkedin: "https://www.linkedin.com/company/state-bank-of-india",
				youtube: "https://www.youtube.com/user/TheOfficialSBI",
			},
		},
	},
	"HDFC Bank": {
		theme: {
			colors: {
				...defaultStoreConfig.theme.colors,
				// HDFC official blue
				primary: "#004B8D",
				primaryForeground: "#ffffff",
				// Light blue accent
				accent: "#E6F0F8",
				accentForeground: "#004B8D",
				// HDFC red for destructive/warnings
				destructive: "#ED232A",
				destructiveForeground: "#ffffff",
				// Secondary
				secondary: "#F5F7FA",
				secondaryForeground: "#003d73",
				ring: "#004B8D",
			},
		},
		branding: {
			storeName: "HDFC SmartBuy",
			logo: "https://www.hdfcbank.com/content/api/contentstream-id/723fb80a-2dde-42a3-9793-7ae1be57c87f/20e93e9f-517d-4b8a-8c29-16b8d0df7e6e",
			logoDark: null,
			favicon: null,
			tagline: "India's No.1 Rewards Program - Shop & Earn More",
		},
		homepage: {
			sections: [
				{
					id: "hero-1",
					type: "hero",
					enabled: true,
					config: {
						style: "carousel",
						height: "large",
						customHeight: null,
						fullWidth: true,
						borderRadius: "0",
						autoRotate: true,
						autoRotateSpeed: 6000,
						pauseOnHover: true,
						transition: "slide",
						transitionDuration: 500,
						showDots: true,
						dotsPosition: "bottom",
						dotsStyle: "lines",
						showArrows: true,
						arrowStyle: "rounded",
						arrowPosition: "sides",
						overlay: false,
						overlayColor: "#000000",
						overlayOpacity: 0.4,
						overlayGradient: null,
						parallaxEnabled: false,
						parallaxSpeed: 0.5,
						containerMaxWidth: "xl",
						containerPadding: "lg",
						mobileHeight: "medium",
						mobileCustomHeight: null,
						hideArrowsOnMobile: true,
						stackContentOnMobile: false,
						slides: [
							{
								id: "hdfc-slide-1",
								title: "HDFC SmartBuy",
								subtitle: "India's #1 Rewards Program",
								description: "Shop smart, earn more with every purchase",
								badge: "10X REWARDS",
								image:
									"https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1920&h=1080&fit=crop",
								mobileImage: null,
								backgroundVideo: null,
								backgroundColor: null,
								backgroundGradient:
									"linear-gradient(135deg, #004B8D 0%, #003366 100%)",
								backgroundPosition: "center",
								backgroundSize: "cover",
								overlayEnabled: true,
								overlayColor: "#004B8D",
								overlayOpacity: 0.5,
								textColor: "#ffffff",
								titleSize: "xl",
								titleWeight: "bold",
								subtitleSize: "large",
								alignment: "center",
								verticalAlign: "center",
								textShadow: true,
								maxWidth: "lg",
								ctaText: "Explore Rewards",
								ctaLink: "/store/search",
								ctaStyle: "solid",
								ctaSize: "lg",
								ctaIcon: "ShoppingBag",
								ctaOpenInNewTab: false,
								ctaSecondaryText: "How it Works",
								ctaSecondaryLink: "/about",
								ctaSecondaryStyle: "outline",
								animation: "zoomIn",
								animationDelay: 0,
								enabled: true,
								startDate: null,
								endDate: null,
							},
							{
								id: "hdfc-slide-2",
								title: "Premium Electronics",
								subtitle: "Redeem points for top brands",
								description: null,
								badge: "NEW ARRIVALS",
								image:
									"https://images.unsplash.com/photo-1468495244123-6c6c332eeece?w=1920&h=1080&fit=crop",
								mobileImage: null,
								backgroundVideo: null,
								backgroundColor: null,
								backgroundGradient: null,
								backgroundPosition: "center",
								backgroundSize: "cover",
								overlayEnabled: true,
								overlayColor: "#000000",
								overlayOpacity: 0.5,
								textColor: "#ffffff",
								titleSize: "large",
								titleWeight: "bold",
								subtitleSize: "medium",
								alignment: "right",
								verticalAlign: "center",
								textShadow: true,
								maxWidth: "md",
								ctaText: "Shop Electronics",
								ctaLink: "/store/search?category=electronics",
								ctaStyle: "solid",
								ctaSize: "lg",
								ctaIcon: "ArrowRight",
								ctaOpenInNewTab: false,
								ctaSecondaryText: null,
								ctaSecondaryLink: null,
								ctaSecondaryStyle: "outline",
								animation: "slideUp",
								animationDelay: 0,
								enabled: true,
								startDate: null,
								endDate: null,
							},
						],
					},
				},
			],
		},
		footer: {
			...defaultStoreConfig.footer,
			copyrightText: "© 2025 HDFC Bank Ltd. All rights reserved.",
			socialLinks: {
				facebook: "https://www.facebook.com/HDFCBANK",
				twitter: "https://twitter.com/HDFC_Bank",
				instagram: "https://www.instagram.com/hdfcbank",
				linkedin: "https://www.linkedin.com/company/hdfc-bank",
				youtube: "https://www.youtube.com/user/hdfcbank",
			},
		},
	},
	"Axis Bank": {
		theme: {
			colors: {
				...defaultStoreConfig.theme.colors,
				// Axis Bank burgundy/maroon
				primary: "#97144D",
				primaryForeground: "#ffffff",
				// Light pink accent
				accent: "#FCE8EF",
				accentForeground: "#97144D",
				// Secondary
				secondary: "#FDF5F8",
				secondaryForeground: "#7a1040",
				// Success green (Axis uses a teal green)
				success: "#00836C",
				successForeground: "#ffffff",
				ring: "#97144D",
			},
		},
		branding: {
			storeName: "Axis Edge Rewards",
			logo: "https://www.axisbank.com/assets/images/axis-bank-logo.png",
			logoDark: null,
			favicon: null,
			tagline: "Dil se Open - Redeem your rewards for exciting products",
		},
		homepage: {
			sections: [
				{
					id: "hero-1",
					type: "hero",
					enabled: true,
					config: {
						style: "carousel",
						height: "large",
						customHeight: null,
						fullWidth: true,
						borderRadius: "0",
						autoRotate: true,
						autoRotateSpeed: 5000,
						pauseOnHover: true,
						transition: "fade",
						transitionDuration: 700,
						showDots: true,
						dotsPosition: "bottom-right",
						dotsStyle: "dots",
						showArrows: true,
						arrowStyle: "minimal",
						arrowPosition: "sides",
						overlay: false,
						overlayColor: "#000000",
						overlayOpacity: 0.4,
						overlayGradient: null,
						parallaxEnabled: false,
						parallaxSpeed: 0.5,
						containerMaxWidth: "xl",
						containerPadding: "lg",
						mobileHeight: "medium",
						mobileCustomHeight: null,
						hideArrowsOnMobile: true,
						stackContentOnMobile: false,
						slides: [
							{
								id: "axis-slide-1",
								title: "Dil Se Open",
								subtitle: "Experience Premium Rewards with Axis Bank",
								description:
									"Unlock a world of exclusive rewards and privileges",
								badge: "EDGE REWARDS",
								image:
									"https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1920&h=1080&fit=crop",
								mobileImage: null,
								backgroundVideo: null,
								backgroundColor: null,
								backgroundGradient:
									"linear-gradient(135deg, #97144D 0%, #6b0f37 50%, #4a0a27 100%)",
								backgroundPosition: "center",
								backgroundSize: "cover",
								overlayEnabled: true,
								overlayColor: "#97144D",
								overlayOpacity: 0.5,
								textColor: "#ffffff",
								titleSize: "xl",
								titleWeight: "bold",
								subtitleSize: "large",
								alignment: "left",
								verticalAlign: "center",
								textShadow: true,
								maxWidth: "lg",
								ctaText: "Explore Now",
								ctaLink: "/store/search",
								ctaStyle: "solid",
								ctaSize: "lg",
								ctaIcon: "ArrowRight",
								ctaOpenInNewTab: false,
								ctaSecondaryText: "View Catalog",
								ctaSecondaryLink: "/store/search?view=catalog",
								ctaSecondaryStyle: "ghost",
								animation: "slideUp",
								animationDelay: 0,
								enabled: true,
								startDate: null,
								endDate: null,
							},
							{
								id: "axis-slide-2",
								title: "Fashion Forward",
								subtitle: "Top fashion brands at your fingertips",
								description: null,
								badge: "TRENDING",
								image:
									"https://images.unsplash.com/photo-1445205170230-053b83016050?w=1920&h=1080&fit=crop",
								mobileImage: null,
								backgroundVideo: null,
								backgroundColor: null,
								backgroundGradient: null,
								backgroundPosition: "center",
								backgroundSize: "cover",
								overlayEnabled: true,
								overlayColor: "#000000",
								overlayOpacity: 0.4,
								textColor: "#ffffff",
								titleSize: "large",
								titleWeight: "bold",
								subtitleSize: "medium",
								alignment: "center",
								verticalAlign: "center",
								textShadow: true,
								maxWidth: "md",
								ctaText: "Shop Fashion",
								ctaLink: "/store/search?category=fashion",
								ctaStyle: "solid",
								ctaSize: "lg",
								ctaIcon: "ShoppingBag",
								ctaOpenInNewTab: false,
								ctaSecondaryText: null,
								ctaSecondaryLink: null,
								ctaSecondaryStyle: "outline",
								animation: "fadeIn",
								animationDelay: 0,
								enabled: true,
								startDate: null,
								endDate: null,
							},
						],
					},
				},
			],
		},
		footer: {
			...defaultStoreConfig.footer,
			copyrightText: "© 2025 Axis Bank. All rights reserved.",
			socialLinks: {
				facebook: "https://www.facebook.com/axisbank",
				twitter: "https://twitter.com/AxisBank",
				instagram: "https://www.instagram.com/axis_bank",
				linkedin: "https://www.linkedin.com/company/axis-bank",
				youtube: "https://www.youtube.com/user/axisbank",
			},
		},
	},
	"Yes Bank": {
		theme: {
			colors: {
				...defaultStoreConfig.theme.colors,
				// Yes Bank blue
				primary: "#00518F",
				primaryForeground: "#ffffff",
				// Light blue accent
				accent: "#E6F1F8",
				accentForeground: "#00518F",
				// Yes Bank uses orange as secondary
				secondary: "#FFF5E6",
				secondaryForeground: "#cc6600",
				// Warning in Yes Bank orange
				warning: "#F7941D",
				warningForeground: "#ffffff",
				ring: "#00518F",
			},
		},
		branding: {
			storeName: "Yes Rewardz",
			logo: "https://www.yesbank.in/o/YESBankContentPath/images/yesbank-logo.svg",
			logoDark: null,
			favicon: null,
			tagline: "Experience our World - Redeem for Exclusive Rewards",
		},
		homepage: {
			sections: [
				{
					id: "hero-1",
					type: "hero",
					enabled: true,
					config: {
						style: "carousel",
						height: "large",
						customHeight: null,
						fullWidth: true,
						borderRadius: "0",
						autoRotate: true,
						autoRotateSpeed: 5000,
						pauseOnHover: true,
						transition: "zoom",
						transitionDuration: 600,
						showDots: true,
						dotsPosition: "bottom",
						dotsStyle: "numbers",
						showArrows: true,
						arrowStyle: "square",
						arrowPosition: "sides",
						overlay: false,
						overlayColor: "#000000",
						overlayOpacity: 0.4,
						overlayGradient: null,
						parallaxEnabled: false,
						parallaxSpeed: 0.5,
						containerMaxWidth: "xl",
						containerPadding: "lg",
						mobileHeight: "medium",
						mobileCustomHeight: null,
						hideArrowsOnMobile: true,
						stackContentOnMobile: false,
						slides: [
							{
								id: "yes-slide-1",
								title: "Yes to Rewards",
								subtitle: "Experience our World of Exclusive Benefits",
								description: "Your Yes Bank points unlock premium products",
								badge: "YES REWARDZ",
								image:
									"https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=1920&h=1080&fit=crop",
								mobileImage: null,
								backgroundVideo: null,
								backgroundColor: null,
								backgroundGradient:
									"linear-gradient(135deg, #00518F 0%, #F7941D 100%)",
								backgroundPosition: "center",
								backgroundSize: "cover",
								overlayEnabled: true,
								overlayColor: "#00518F",
								overlayOpacity: 0.6,
								textColor: "#ffffff",
								titleSize: "large",
								titleWeight: "bold",
								subtitleSize: "medium",
								alignment: "center",
								verticalAlign: "center",
								textShadow: true,
								maxWidth: "lg",
								ctaText: "Start Redeeming",
								ctaLink: "/store/search",
								ctaStyle: "gradient",
								ctaSize: "lg",
								ctaIcon: "Sparkles",
								ctaOpenInNewTab: false,
								ctaSecondaryText: "Learn More",
								ctaSecondaryLink: "/about",
								ctaSecondaryStyle: "outline",
								animation: "zoomIn",
								animationDelay: 0,
								enabled: true,
								startDate: null,
								endDate: null,
							},
						],
					},
				},
			],
		},
		footer: {
			...defaultStoreConfig.footer,
			copyrightText: "© 2025 Yes Bank Ltd. All rights reserved.",
			socialLinks: {
				facebook: "https://www.facebook.com/yesbank",
				twitter: "https://twitter.com/YESBANK",
				instagram: "https://www.instagram.com/yesbank",
				linkedin: "https://www.linkedin.com/company/yes-bank",
				youtube: "https://www.youtube.com/user/YesBankIndia",
			},
		},
	},
	"IndusInd Bank": {
		theme: {
			colors: {
				...defaultStoreConfig.theme.colors,
				// IndusInd maroon/magenta
				primary: "#9E1F63",
				primaryForeground: "#ffffff",
				// Light pink accent
				accent: "#FAEAF3",
				accentForeground: "#9E1F63",
				// Secondary - IndusInd also uses a blue
				secondary: "#E8F4FC",
				secondaryForeground: "#0066B3",
				// IndusInd blue for info/success
				success: "#0066B3",
				successForeground: "#ffffff",
				ring: "#9E1F63",
			},
		},
		branding: {
			storeName: "IndusInd Rewards",
			logo: "https://www.indusind.com/content/dam/indusind-corporate/logos/indusind-bank-logo.svg",
			logoDark: null,
			favicon: null,
			tagline: "We Make You Feel Richer - Exclusive Rewards Await",
		},
		homepage: {
			sections: [
				{
					id: "hero-1",
					type: "hero",
					enabled: true,
					config: {
						style: "carousel",
						height: "large",
						customHeight: null,
						fullWidth: true,
						borderRadius: "0",
						autoRotate: true,
						autoRotateSpeed: 5000,
						pauseOnHover: true,
						transition: "fade",
						transitionDuration: 500,
						showDots: true,
						dotsPosition: "bottom",
						dotsStyle: "dots",
						showArrows: true,
						arrowStyle: "default",
						arrowPosition: "sides",
						overlay: false,
						overlayColor: "#000000",
						overlayOpacity: 0.4,
						overlayGradient: null,
						parallaxEnabled: false,
						parallaxSpeed: 0.5,
						containerMaxWidth: "xl",
						containerPadding: "lg",
						mobileHeight: "medium",
						mobileCustomHeight: null,
						hideArrowsOnMobile: true,
						stackContentOnMobile: false,
						slides: [
							{
								id: "indusind-slide-1",
								title: "Feel Richer",
								subtitle: "Exclusive Rewards with IndusInd Bank",
								description: "Transform your points into premium experiences",
								badge: "INDUS REWARDS",
								image:
									"https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=1920&h=1080&fit=crop",
								mobileImage: null,
								backgroundVideo: null,
								backgroundColor: null,
								backgroundGradient:
									"linear-gradient(135deg, #9E1F63 0%, #0066B3 100%)",
								backgroundPosition: "center",
								backgroundSize: "cover",
								overlayEnabled: true,
								overlayColor: "#000000",
								overlayOpacity: 0.4,
								textColor: "#ffffff",
								titleSize: "xl",
								titleWeight: "bold",
								subtitleSize: "large",
								alignment: "center",
								verticalAlign: "center",
								textShadow: true,
								maxWidth: "lg",
								ctaText: "Discover Rewards",
								ctaLink: "/store/search",
								ctaStyle: "solid",
								ctaSize: "lg",
								ctaIcon: "Sparkles",
								ctaOpenInNewTab: false,
								ctaSecondaryText: "View Benefits",
								ctaSecondaryLink: "/about",
								ctaSecondaryStyle: "outline",
								animation: "fadeIn",
								animationDelay: 0,
								enabled: true,
								startDate: null,
								endDate: null,
							},
							{
								id: "indusind-slide-2",
								title: "Home & Living",
								subtitle: "Transform your space with premium products",
								description: null,
								badge: "NEW COLLECTION",
								image:
									"https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1920&h=1080&fit=crop",
								mobileImage: null,
								backgroundVideo: null,
								backgroundColor: null,
								backgroundGradient: null,
								backgroundPosition: "center",
								backgroundSize: "cover",
								overlayEnabled: true,
								overlayColor: "#9E1F63",
								overlayOpacity: 0.5,
								textColor: "#ffffff",
								titleSize: "large",
								titleWeight: "bold",
								subtitleSize: "medium",
								alignment: "left",
								verticalAlign: "center",
								textShadow: true,
								maxWidth: "md",
								ctaText: "Shop Home",
								ctaLink: "/store/search?category=home",
								ctaStyle: "solid",
								ctaSize: "lg",
								ctaIcon: "ArrowRight",
								ctaOpenInNewTab: false,
								ctaSecondaryText: null,
								ctaSecondaryLink: null,
								ctaSecondaryStyle: "outline",
								animation: "slideUp",
								animationDelay: 0,
								enabled: true,
								startDate: null,
								endDate: null,
							},
						],
					},
				},
			],
		},
		footer: {
			...defaultStoreConfig.footer,
			copyrightText: "© 2025 IndusInd Bank Ltd. All rights reserved.",
			socialLinks: {
				facebook: "https://www.facebook.com/indusindbank",
				twitter: "https://twitter.com/MyIndusIndBank",
				instagram: "https://www.instagram.com/indusind_bank",
				linkedin: "https://www.linkedin.com/company/indusind-bank",
				youtube: "https://www.youtube.com/user/indusindbank",
			},
		},
	},
};

// Deep merge helper
function deepMerge(target, source) {
	const result = { ...target };
	for (const key in source) {
		if (
			source[key] &&
			typeof source[key] === "object" &&
			!Array.isArray(source[key]) &&
			target[key] &&
			typeof target[key] === "object"
		) {
			result[key] = deepMerge(target[key], source[key]);
		} else if (source[key] !== undefined) {
			result[key] = source[key];
		}
	}
	return result;
}

// Step 3: Update partners with store config
console.log("Step 3: Updating partners with store configurations...\n");

for (const partner of partners) {
	const existingConfig = partner.store_config || {};
	const hasConfig = Object.keys(existingConfig).length > 0;

	// Get bank-specific config or use default
	const bankConfig = bankConfigs[partner.name] || {};
	const mergedConfig = deepMerge(defaultStoreConfig, bankConfig);

	// New config takes priority over existing (to update branding/colors)
	// Only preserve fields that aren't in the new bank config
	const finalConfig = hasConfig
		? deepMerge(existingConfig, mergedConfig)
		: mergedConfig;

	try {
		await sql.query(
			`UPDATE loyalty_partners SET store_config = $1::jsonb WHERE id = $2`,
			[JSON.stringify(finalConfig), partner.id],
		);
		console.log(
			`✅ Updated ${partner.name} (ID: ${partner.id}) ${hasConfig ? "(merged with existing)" : "(new config)"}`,
		);
	} catch (err) {
		console.error(`❌ Failed to update ${partner.name}:`, err.message);
	}
}

// Step 4: Verify
console.log("\nStep 4: Verifying migration...");
const verifyResults = await sql.query(`
	SELECT id, name,
		   CASE WHEN store_config IS NOT NULL AND store_config::text != '{}' THEN 'Yes' ELSE 'No' END as has_config,
		   COALESCE(store_config->'branding'->>'storeName', 'N/A') as store_name
	FROM loyalty_partners
	ORDER BY id
`);

console.log("\n┌─────┬─────────────────┬────────────┬──────────────────────┐");
console.log("│ ID  │ Partner         │ Has Config │ Store Name           │");
console.log("├─────┼─────────────────┼────────────┼──────────────────────┤");
for (const row of verifyResults) {
	const id = String(row.id).padEnd(3);
	const name = row.name.padEnd(15);
	const hasConfig = row.has_config.padEnd(10);
	const storeName = (row.store_name || "N/A").substring(0, 20).padEnd(20);
	console.log(`│ ${id} │ ${name} │ ${hasConfig} │ ${storeName} │`);
}
console.log("└─────┴─────────────────┴────────────┴──────────────────────┘");

console.log("\n✅ Migration complete!");
