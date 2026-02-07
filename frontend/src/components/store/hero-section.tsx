"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import {
	ChevronLeft,
	ChevronRight,
	ArrowRight,
	ShoppingBag,
	Sparkles,
	ExternalLink,
} from "lucide-react";
import { useStoreConfig } from "@/context/store-config-context";
import { Button } from "@/components/ui/button";
import type { HeroSectionConfig, HeroSlide } from "@/lib/store-config";
import { cn } from "@/lib/utils";

interface HeroSectionProps {
	className?: string;
}

// Icon mapping for CTA buttons
const CTA_ICONS: Record<string, React.ElementType> = {
	ArrowRight,
	ShoppingBag,
	Sparkles,
	ExternalLink,
};

// Height classes mapping
const getHeightClasses = (
	height: string,
	customHeight: string | null,
	isMobile = false,
) => {
	if (height === "custom" && customHeight) {
		return { style: { minHeight: customHeight } };
	}

	const heightMap: Record<string, string> = {
		small: isMobile ? "min-h-[280px]" : "min-h-[300px] md:min-h-[350px]",
		medium: isMobile ? "min-h-[350px]" : "min-h-[400px] md:min-h-[450px]",
		large: isMobile ? "min-h-[400px]" : "min-h-[500px] md:min-h-[550px]",
		full: "min-h-[calc(100vh-4rem)]",
	};

	return { className: heightMap[height] || heightMap.large };
};

// Title size classes
const getTitleSizeClasses = (size: string) => {
	const sizeMap: Record<string, string> = {
		small: "text-xl md:text-2xl lg:text-3xl",
		medium: "text-2xl md:text-3xl lg:text-4xl",
		large: "text-3xl md:text-4xl lg:text-5xl xl:text-6xl",
		xl: "text-4xl md:text-5xl lg:text-6xl xl:text-7xl",
	};
	return sizeMap[size] || sizeMap.large;
};

// Title weight classes
const getTitleWeightClasses = (weight: string) => {
	const weightMap: Record<string, string> = {
		normal: "font-normal",
		medium: "font-medium",
		semibold: "font-semibold",
		bold: "font-bold",
	};
	return weightMap[weight] || weightMap.bold;
};

// Subtitle size classes
const getSubtitleSizeClasses = (size: string) => {
	const sizeMap: Record<string, string> = {
		small: "text-sm md:text-base",
		medium: "text-base md:text-lg lg:text-xl",
		large: "text-lg md:text-xl lg:text-2xl",
	};
	return sizeMap[size] || sizeMap.medium;
};

// Content max width classes
const getMaxWidthClasses = (maxWidth: string) => {
	const widthMap: Record<string, string> = {
		sm: "max-w-lg",
		md: "max-w-xl",
		lg: "max-w-2xl",
		xl: "max-w-3xl",
		full: "max-w-full",
	};
	return widthMap[maxWidth] || widthMap.lg;
};

// Container max width classes
const getContainerMaxWidthClasses = (maxWidth: string) => {
	const widthMap: Record<string, string> = {
		sm: "max-w-2xl",
		md: "max-w-4xl",
		lg: "max-w-5xl",
		xl: "max-w-6xl",
		"2xl": "max-w-7xl",
		full: "max-w-full",
	};
	return widthMap[maxWidth] || widthMap.xl;
};

// Alignment classes
const getAlignmentClasses = (
	horizontal: string,
	vertical: string = "center",
) => {
	const hAlign: Record<string, string> = {
		left: "items-start text-left",
		center: "items-center text-center",
		right: "items-end text-right",
	};
	const vAlign: Record<string, string> = {
		top: "justify-start pt-16",
		center: "justify-center",
		bottom: "justify-end pb-16",
	};
	return cn(
		hAlign[horizontal] || hAlign.center,
		vAlign[vertical] || vAlign.center,
	);
};

// Animation classes
const getAnimationClasses = (animation: string, delay: number = 0) => {
	const animationMap: Record<string, string> = {
		none: "",
		fadeIn: "animate-in fade-in duration-700",
		slideUp: "animate-in fade-in slide-in-from-bottom-8 duration-700",
		slideDown: "animate-in fade-in slide-in-from-top-8 duration-700",
		zoomIn: "animate-in fade-in zoom-in-95 duration-700",
	};
	const baseClass = animationMap[animation] || "";
	const delayClass = delay > 0 ? `delay-[${delay}ms]` : "";
	return cn(baseClass, delayClass);
};

// CTA Button styles
const getCtaStyles = (style: string, size: string) => {
	const sizeClasses: Record<string, string> = {
		sm: "px-4 py-2 text-sm",
		md: "px-6 py-2.5 text-base",
		lg: "px-8 py-3 text-lg",
	};

	const styleClasses: Record<string, string> = {
		solid: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg",
		outline:
			"border-2 border-current bg-transparent hover:bg-white/10 backdrop-blur-sm",
		ghost: "bg-white/10 hover:bg-white/20 backdrop-blur-sm",
		gradient:
			"bg-gradient-to-r from-primary to-primary/80 text-primary-foreground hover:opacity-90 shadow-lg",
	};

	return cn(
		"inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-all duration-200 hover:scale-105",
		sizeClasses[size] || sizeClasses.lg,
		styleClasses[style] || styleClasses.solid,
	);
};

// Check if slide should be visible based on dates
const isSlideVisible = (slide: HeroSlide): boolean => {
	if (!slide.enabled) return false;

	const now = new Date();

	if (slide.startDate) {
		const startDate = new Date(slide.startDate);
		if (now < startDate) return false;
	}

	if (slide.endDate) {
		const endDate = new Date(slide.endDate);
		if (now > endDate) return false;
	}

	return true;
};

// Main Hero Section Component
export function HeroSection({ className }: HeroSectionProps) {
	const { config } = useStoreConfig();
	const heroSection = config.homepage.sections.find((s) => s.type === "hero");

	if (!heroSection?.enabled) return null;

	const heroConfig = heroSection.config as HeroSectionConfig;

	// Filter visible slides
	const visibleSlides = (heroConfig.slides || []).filter(isSlideVisible);

	if (visibleSlides.length === 0) return null;

	const { style } = heroConfig;

	// Render based on style
	if (style === "static" || visibleSlides.length === 1) {
		return (
			<StaticHero
				slide={visibleSlides[0]!}
				config={heroConfig}
				className={className}
			/>
		);
	}

	if (style === "gradient") {
		return (
			<GradientHero
				slide={visibleSlides[0]!}
				config={heroConfig}
				className={className}
			/>
		);
	}

	return (
		<CarouselHero
			slides={visibleSlides}
			config={heroConfig}
			className={className}
		/>
	);
}

// Slide Background Component
function SlideBackground({
	slide,
	globalOverlay,
	globalOverlayColor,
	globalOverlayOpacity,
	parallaxEnabled,
	parallaxOffset,
}: {
	slide: HeroSlide;
	globalOverlay: boolean;
	globalOverlayColor: string;
	globalOverlayOpacity: number;
	parallaxEnabled?: boolean;
	parallaxOffset?: number;
}) {
	const parallaxStyle = parallaxEnabled
		? { transform: `translateY(${parallaxOffset || 0}px)` }
		: {};

	return (
		<>
			{/* Background Image */}
			{slide.image && (
				<div
					className="absolute inset-0"
					style={{
						...parallaxStyle,
						backgroundPosition: slide.backgroundPosition || "center",
					}}
				>
					<Image
						src={slide.image}
						alt={slide.title}
						fill
						className={cn(
							"object-cover",
							slide.backgroundSize === "contain" && "object-contain",
							slide.backgroundSize === "auto" && "object-none",
						)}
						priority
					/>
				</div>
			)}

			{/* Background Video */}
			{slide.backgroundVideo && !slide.image && (
				<video
					autoPlay
					loop
					muted
					playsInline
					className="absolute inset-0 h-full w-full object-cover"
					style={parallaxStyle}
				>
					<source src={slide.backgroundVideo} type="video/mp4" />
				</video>
			)}

			{/* Background Gradient */}
			{slide.backgroundGradient && !slide.image && !slide.backgroundVideo && (
				<div
					className="absolute inset-0"
					style={{ background: slide.backgroundGradient, ...parallaxStyle }}
				/>
			)}

			{/* Background Color */}
			{slide.backgroundColor &&
				!slide.image &&
				!slide.backgroundVideo &&
				!slide.backgroundGradient && (
					<div
						className="absolute inset-0"
						style={{ backgroundColor: slide.backgroundColor, ...parallaxStyle }}
					/>
				)}

			{/* Default Gradient */}
			{!slide.image &&
				!slide.backgroundVideo &&
				!slide.backgroundGradient &&
				!slide.backgroundColor && (
					<div
						className="absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-primary/70"
						style={parallaxStyle}
					/>
				)}

			{/* Slide-specific Overlay */}
			{slide.overlayEnabled && (
				<div
					className="absolute inset-0"
					style={{
						backgroundColor: slide.overlayColor || "#000000",
						opacity: slide.overlayOpacity ?? 0.3,
					}}
				/>
			)}

			{/* Global Overlay */}
			{globalOverlay && (
				<div
					className="absolute inset-0"
					style={{
						backgroundColor: globalOverlayColor || "#000000",
						opacity: globalOverlayOpacity ?? 0.4,
					}}
				/>
			)}
		</>
	);
}

// Slide Content Component
function SlideContent({
	slide,
	containerMaxWidth,
}: {
	slide: HeroSlide;
	containerMaxWidth: string;
}) {
	const IconComponent = slide.ctaIcon ? CTA_ICONS[slide.ctaIcon] : null;

	return (
		<div
			className={cn(
				"relative z-10 flex h-full flex-col px-4 py-12 md:px-8 lg:px-16",
				getAlignmentClasses(slide.alignment, slide.verticalAlign),
			)}
		>
			<div
				className={cn(
					"mx-auto w-full",
					getContainerMaxWidthClasses(containerMaxWidth),
				)}
			>
				<div
					className={cn(
						getMaxWidthClasses(slide.maxWidth),
						slide.alignment === "center" && "mx-auto",
						slide.alignment === "right" && "ml-auto",
					)}
				>
					{/* Badge */}
					{slide.badge && (
						<div
							className={cn(
								"mb-4",
								getAnimationClasses(slide.animation, slide.animationDelay),
							)}
						>
							<span
								className="inline-block rounded-full bg-white/20 px-4 py-1.5 text-sm font-medium backdrop-blur-sm"
								style={{ color: slide.textColor || "#ffffff" }}
							>
								{slide.badge}
							</span>
						</div>
					)}

					{/* Title */}
					<h1
						className={cn(
							"mb-4 tracking-tight",
							getTitleSizeClasses(slide.titleSize),
							getTitleWeightClasses(slide.titleWeight),
							slide.textShadow && "drop-shadow-lg",
							getAnimationClasses(slide.animation, slide.animationDelay),
						)}
						style={{ color: slide.textColor || "#ffffff" }}
					>
						{slide.title}
					</h1>

					{/* Subtitle */}
					{slide.subtitle && (
						<p
							className={cn(
								"mb-4 opacity-90",
								getSubtitleSizeClasses(slide.subtitleSize),
								slide.textShadow && "drop-shadow-md",
								getAnimationClasses(
									slide.animation,
									slide.animationDelay + 100,
								),
							)}
							style={{ color: slide.textColor || "#ffffff" }}
						>
							{slide.subtitle}
						</p>
					)}

					{/* Description */}
					{slide.description && (
						<p
							className={cn(
								"mb-6 text-base opacity-80 md:text-lg",
								slide.textShadow && "drop-shadow-md",
								getAnimationClasses(
									slide.animation,
									slide.animationDelay + 150,
								),
							)}
							style={{ color: slide.textColor || "#ffffff" }}
						>
							{slide.description}
						</p>
					)}

					{/* CTA Buttons */}
					{(slide.ctaText || slide.ctaSecondaryText) && (
						<div
							className={cn(
								"flex flex-wrap gap-4",
								slide.alignment === "center" && "justify-center",
								slide.alignment === "right" && "justify-end",
								getAnimationClasses(
									slide.animation,
									slide.animationDelay + 200,
								),
							)}
						>
							{/* Primary CTA */}
							{slide.ctaText && slide.ctaLink && (
								<Link
									href={slide.ctaLink}
									target={slide.ctaOpenInNewTab ? "_blank" : undefined}
									rel={
										slide.ctaOpenInNewTab ? "noopener noreferrer" : undefined
									}
									className={getCtaStyles(slide.ctaStyle, slide.ctaSize)}
									style={{ color: slide.textColor || "#ffffff" }}
								>
									{slide.ctaText}
									{IconComponent && <IconComponent className="h-5 w-5" />}
								</Link>
							)}

							{/* Secondary CTA */}
							{slide.ctaSecondaryText && slide.ctaSecondaryLink && (
								<Link
									href={slide.ctaSecondaryLink}
									className={getCtaStyles(
										slide.ctaSecondaryStyle,
										slide.ctaSize,
									)}
									style={{ color: slide.textColor || "#ffffff" }}
								>
									{slide.ctaSecondaryText}
								</Link>
							)}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}

// Static Hero Component
function StaticHero({
	slide,
	config,
	className,
}: {
	slide: HeroSlide;
	config: HeroSectionConfig;
	className?: string;
}) {
	const heightProps = getHeightClasses(config.height, config.customHeight);

	return (
		<section
			className={cn(
				"relative w-full overflow-hidden",
				heightProps.className,
				!config.fullWidth && "mx-auto",
				!config.fullWidth &&
					getContainerMaxWidthClasses(config.containerMaxWidth),
				config.borderRadius && config.borderRadius !== "0" && "rounded-2xl",
				className,
			)}
			style={heightProps.style}
		>
			<SlideBackground
				slide={slide}
				globalOverlay={config.overlay}
				globalOverlayColor={config.overlayColor}
				globalOverlayOpacity={config.overlayOpacity}
			/>
			<SlideContent
				slide={slide}
				containerMaxWidth={config.containerMaxWidth}
			/>
		</section>
	);
}

// Gradient Hero Component
function GradientHero({
	slide,
	config,
	className,
}: {
	slide: HeroSlide;
	config: HeroSectionConfig;
	className?: string;
}) {
	const heightProps = getHeightClasses(config.height, config.customHeight);

	return (
		<section
			className={cn(
				"relative w-full overflow-hidden",
				heightProps.className,
				!config.fullWidth && "mx-auto",
				!config.fullWidth &&
					getContainerMaxWidthClasses(config.containerMaxWidth),
				config.borderRadius && config.borderRadius !== "0" && "rounded-2xl",
				className,
			)}
			style={{
				...heightProps.style,
				background:
					slide.backgroundGradient ||
					"linear-gradient(135deg, var(--color-primary) 0%, var(--color-accent) 100%)",
			}}
		>
			{config.overlay && (
				<div
					className="absolute inset-0"
					style={{
						backgroundColor: config.overlayColor || "#000000",
						opacity: config.overlayOpacity ?? 0.4,
					}}
				/>
			)}
			<SlideContent
				slide={slide}
				containerMaxWidth={config.containerMaxWidth}
			/>
		</section>
	);
}

// Carousel Hero Component
function CarouselHero({
	slides,
	config,
	className,
}: {
	slides: HeroSlide[];
	config: HeroSectionConfig;
	className?: string;
}) {
	const [currentSlide, setCurrentSlide] = React.useState(0);
	const [isAnimating, setIsAnimating] = React.useState(false);
	const [isPaused, setIsPaused] = React.useState(false);
	const timerRef = React.useRef<NodeJS.Timeout | null>(null);

	const heightProps = getHeightClasses(config.height, config.customHeight);

	// Transition classes
	const getTransitionClasses = () => {
		const durationMap: Record<number, string> = {
			300: "duration-300",
			500: "duration-500",
			700: "duration-700",
			1000: "duration-1000",
		};
		return durationMap[config.transitionDuration] || "duration-500";
	};

	const goToSlide = React.useCallback(
		(index: number) => {
			if (isAnimating) return;
			setIsAnimating(true);
			setCurrentSlide(index);
			setTimeout(() => setIsAnimating(false), config.transitionDuration || 500);
		},
		[isAnimating, config.transitionDuration],
	);

	const nextSlide = React.useCallback(() => {
		goToSlide((currentSlide + 1) % slides.length);
	}, [currentSlide, slides.length, goToSlide]);

	const prevSlide = React.useCallback(() => {
		goToSlide((currentSlide - 1 + slides.length) % slides.length);
	}, [currentSlide, slides.length, goToSlide]);

	// Auto-rotate
	React.useEffect(() => {
		if (config.autoRotate && slides.length > 1 && !isPaused) {
			timerRef.current = setInterval(nextSlide, config.autoRotateSpeed || 5000);
		}
		return () => {
			if (timerRef.current) {
				clearInterval(timerRef.current);
			}
		};
	}, [
		config.autoRotate,
		config.autoRotateSpeed,
		nextSlide,
		slides.length,
		isPaused,
	]);

	// Pause on hover
	const handleMouseEnter = () => {
		if (config.pauseOnHover) {
			setIsPaused(true);
		}
	};

	const handleMouseLeave = () => {
		if (config.pauseOnHover) {
			setIsPaused(false);
		}
	};

	// Arrow style classes
	const getArrowClasses = () => {
		const baseClasses =
			"absolute z-20 flex items-center justify-center transition-all focus:outline-none focus:ring-2 focus:ring-primary";
		const positionClasses =
			config.arrowPosition === "bottom"
				? "bottom-6"
				: "top-1/2 -translate-y-1/2";

		const styleMap: Record<string, string> = {
			default:
				"rounded-full bg-card/80 p-2 shadow-lg backdrop-blur-sm hover:bg-card hover:scale-110",
			minimal: "rounded-full bg-transparent p-2 hover:bg-white/10",
			rounded:
				"rounded-full bg-primary/80 p-3 text-primary-foreground hover:bg-primary",
			square:
				"rounded-lg bg-card/80 p-2 shadow-lg backdrop-blur-sm hover:bg-card",
		};

		return cn(
			baseClasses,
			positionClasses,
			styleMap[config.arrowStyle] || styleMap.default,
		);
	};

	// Dots style classes
	const getDotClasses = (isActive: boolean) => {
		const baseClasses =
			"transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2";

		if (config.dotsStyle === "lines") {
			return cn(
				baseClasses,
				"h-1 rounded-full",
				isActive ? "w-8 bg-white" : "w-4 bg-white/50 hover:bg-white/70",
			);
		}

		if (config.dotsStyle === "numbers") {
			return cn(
				baseClasses,
				"h-6 w-6 rounded-full text-xs font-medium",
				isActive
					? "bg-white text-primary"
					: "bg-white/30 text-white hover:bg-white/50",
			);
		}

		// Default dots
		return cn(
			baseClasses,
			"h-2 rounded-full",
			isActive ? "w-8 bg-white" : "w-2 bg-white/50 hover:bg-white/70",
		);
	};

	// Dots position classes
	const getDotsPositionClasses = () => {
		const positionMap: Record<string, string> = {
			bottom: "bottom-6 left-1/2 -translate-x-1/2",
			"bottom-left": "bottom-6 left-6",
			"bottom-right": "bottom-6 right-6",
		};
		return positionMap[config.dotsPosition] || positionMap.bottom;
	};

	return (
		<section
			className={cn(
				"relative w-full overflow-hidden",
				heightProps.className,
				!config.fullWidth && "mx-auto",
				!config.fullWidth &&
					getContainerMaxWidthClasses(config.containerMaxWidth),
				config.borderRadius && config.borderRadius !== "0" && "rounded-2xl",
				className,
			)}
			style={heightProps.style}
			onMouseEnter={handleMouseEnter}
			onMouseLeave={handleMouseLeave}
		>
			{/* Slides Container */}
			{config.transition === "fade" ? (
				// Fade transition
				<div className="relative h-full w-full">
					{slides.map((slide, index) => (
						<div
							key={slide.id || index}
							className={cn(
								"absolute inset-0 transition-opacity",
								getTransitionClasses(),
								index === currentSlide ? "opacity-100 z-10" : "opacity-0 z-0",
							)}
						>
							<SlideBackground
								slide={slide}
								globalOverlay={config.overlay}
								globalOverlayColor={config.overlayColor}
								globalOverlayOpacity={config.overlayOpacity}
							/>
							<SlideContent
								slide={slide}
								containerMaxWidth={config.containerMaxWidth}
							/>
						</div>
					))}
				</div>
			) : config.transition === "zoom" ? (
				// Zoom transition
				<div className="relative h-full w-full">
					{slides.map((slide, index) => (
						<div
							key={slide.id || index}
							className={cn(
								"absolute inset-0 transition-all",
								getTransitionClasses(),
								index === currentSlide
									? "opacity-100 scale-100 z-10"
									: "opacity-0 scale-110 z-0",
							)}
						>
							<SlideBackground
								slide={slide}
								globalOverlay={config.overlay}
								globalOverlayColor={config.overlayColor}
								globalOverlayOpacity={config.overlayOpacity}
							/>
							<SlideContent
								slide={slide}
								containerMaxWidth={config.containerMaxWidth}
							/>
						</div>
					))}
				</div>
			) : (
				// Slide transition (default)
				<div
					className={cn(
						"flex h-full transition-transform ease-out",
						getTransitionClasses(),
					)}
					style={{ transform: `translateX(-${currentSlide * 100}%)` }}
				>
					{slides.map((slide, index) => (
						<div key={slide.id || index} className="relative min-w-full h-full">
							<SlideBackground
								slide={slide}
								globalOverlay={config.overlay}
								globalOverlayColor={config.overlayColor}
								globalOverlayOpacity={config.overlayOpacity}
							/>
							<SlideContent
								slide={slide}
								containerMaxWidth={config.containerMaxWidth}
							/>
						</div>
					))}
				</div>
			)}

			{/* Navigation Arrows */}
			{config.showArrows && slides.length > 1 && (
				<>
					<button
						onClick={prevSlide}
						className={cn(
							getArrowClasses(),
							config.arrowPosition === "bottom"
								? "left-1/2 -translate-x-12"
								: "left-4",
							config.hideArrowsOnMobile && "hidden md:flex",
						)}
						aria-label="Previous slide"
					>
						<ChevronLeft className="h-5 w-5" />
					</button>
					<button
						onClick={nextSlide}
						className={cn(
							getArrowClasses(),
							config.arrowPosition === "bottom"
								? "left-1/2 translate-x-4"
								: "right-4",
							config.hideArrowsOnMobile && "hidden md:flex",
						)}
						aria-label="Next slide"
					>
						<ChevronRight className="h-5 w-5" />
					</button>
				</>
			)}

			{/* Dots Navigation */}
			{config.showDots && slides.length > 1 && (
				<div
					className={cn("absolute z-20 flex gap-2", getDotsPositionClasses())}
				>
					{slides.map((_, index) => (
						<button
							key={index}
							onClick={() => goToSlide(index)}
							className={getDotClasses(currentSlide === index)}
							aria-label={`Go to slide ${index + 1}`}
							aria-current={currentSlide === index ? "true" : "false"}
						>
							{config.dotsStyle === "numbers" ? index + 1 : null}
						</button>
					))}
				</div>
			)}
		</section>
	);
}

export default HeroSection;
