"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
	Card,
	CardHeader,
	CardTitle,
	CardDescription,
	CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
	Select,
	SelectTrigger,
	SelectContent,
	SelectItem,
	SelectValue,
} from "@/components/ui/select";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
	Plus,
	Trash2,
	ChevronDown,
	ChevronUp,
	GripVertical,
	Eye,
	EyeOff,
	Copy,
	Image as ImageIcon,
	Type,
	Palette,
	MousePointer,
	Smartphone,
	Settings,
	Play,
	Layers,
	Move,
	ArrowRight,
	ShoppingBag,
	Sparkles,
	ExternalLink,
} from "lucide-react";
import type {
	StoreConfig,
	HeroSectionConfig,
	HeroSlide,
	HeroStyle,
	HeroTransition,
	HeroHeight,
	HeroTextAnimation,
	HeroCtaStyle,
	HeroVerticalAlign,
} from "@/lib/store-config";
import { generateId } from "@/lib/store-config";

interface HeroConfigEditorProps {
	config: StoreConfig;
	updateConfig: <K extends keyof StoreConfig>(
		key: K,
		value: StoreConfig[K],
	) => void;
}

// Toggle Switch Component
function ToggleSwitch({
	checked,
	onChange,
	disabled = false,
}: {
	checked: boolean;
	onChange: (checked: boolean) => void;
	disabled?: boolean;
}) {
	return (
		<button
			type="button"
			role="switch"
			aria-checked={checked}
			disabled={disabled}
			onClick={() => onChange(!checked)}
			className={cn(
				"relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
				checked ? "bg-primary" : "bg-muted",
				disabled && "opacity-50 cursor-not-allowed",
			)}
		>
			<span
				className={cn(
					"pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
					checked ? "translate-x-5" : "translate-x-0",
				)}
			/>
		</button>
	);
}

// Color Picker Component
function ColorPicker({
	value,
	onChange,
	label,
}: {
	value: string | null;
	onChange: (value: string | null) => void;
	label?: string;
}) {
	return (
		<div className="flex items-center gap-2">
			{label && <span className="text-sm text-muted-foreground">{label}</span>}
			<div className="relative">
				<input
					type="color"
					value={value || "#000000"}
					onChange={(e) => onChange(e.target.value)}
					className="h-8 w-8 cursor-pointer rounded border border-border"
				/>
			</div>
			<Input
				value={value || ""}
				onChange={(e) => onChange(e.target.value || null)}
				placeholder="#000000"
				className="w-24 h-8 text-xs"
			/>
			{value && (
				<Button
					variant="ghost"
					size="sm"
					className="h-8 w-8 p-0"
					onClick={() => onChange(null)}
				>
					<Trash2 className="h-3 w-3" />
				</Button>
			)}
		</div>
	);
}

// Range Slider Component
function RangeSlider({
	value,
	onChange,
	min,
	max,
	step = 1,
	label,
	suffix = "",
}: {
	value: number;
	onChange: (value: number) => void;
	min: number;
	max: number;
	step?: number;
	label?: string;
	suffix?: string;
}) {
	return (
		<div className="space-y-2">
			{label && (
				<div className="flex items-center justify-between">
					<span className="text-sm font-medium">{label}</span>
					<span className="text-sm text-muted-foreground">
						{value}
						{suffix}
					</span>
				</div>
			)}
			<input
				type="range"
				min={min}
				max={max}
				step={step}
				value={value}
				onChange={(e) => onChange(Number(e.target.value))}
				className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
			/>
		</div>
	);
}

// Section Header Component
function SectionHeader({
	icon: Icon,
	title,
	description,
	isOpen,
	onToggle,
}: {
	icon: React.ElementType;
	title: string;
	description?: string;
	isOpen: boolean;
	onToggle: () => void;
}) {
	return (
		<CollapsibleTrigger
			onClick={onToggle}
			className="flex w-full items-center justify-between p-4 hover:bg-muted/50 transition-colors"
		>
			<div className="flex items-center gap-3">
				<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
					<Icon className="h-4 w-4" />
				</div>
				<div className="text-left">
					<h4 className="text-sm font-medium">{title}</h4>
					{description && (
						<p className="text-xs text-muted-foreground">{description}</p>
					)}
				</div>
			</div>
			{isOpen ? (
				<ChevronUp className="h-4 w-4 text-muted-foreground" />
			) : (
				<ChevronDown className="h-4 w-4 text-muted-foreground" />
			)}
		</CollapsibleTrigger>
	);
}

// Default slide values
const createDefaultSlide = (): HeroSlide => ({
	id: generateId("slide"),
	title: "New Slide",
	subtitle: "Add your subtitle here",
	description: null,
	badge: null,
	image: null,
	mobileImage: null,
	backgroundVideo: null,
	backgroundColor: null,
	backgroundGradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
	backgroundPosition: "center",
	backgroundSize: "cover",
	overlayEnabled: true,
	overlayColor: "#000000",
	overlayOpacity: 0.3,
	textColor: "#ffffff",
	titleSize: "large",
	titleWeight: "bold",
	subtitleSize: "medium",
	alignment: "center",
	verticalAlign: "center",
	textShadow: true,
	maxWidth: "lg",
	ctaText: "Shop Now",
	ctaLink: "/store/search",
	ctaStyle: "solid",
	ctaSize: "lg",
	ctaIcon: "ArrowRight",
	ctaOpenInNewTab: false,
	ctaSecondaryText: null,
	ctaSecondaryLink: null,
	ctaSecondaryStyle: "outline",
	animation: "fadeIn",
	animationDelay: 0,
	enabled: true,
	startDate: null,
	endDate: null,
});

// Slide Editor Component
function SlideEditor({
	slide,
	index,
	onUpdate,
	onRemove,
	onDuplicate,
	onMoveUp,
	onMoveDown,
	isFirst,
	isLast,
}: {
	slide: HeroSlide;
	index: number;
	onUpdate: (updates: Partial<HeroSlide>) => void;
	onRemove: () => void;
	onDuplicate: () => void;
	onMoveUp: () => void;
	onMoveDown: () => void;
	isFirst: boolean;
	isLast: boolean;
}) {
	const [isOpen, setIsOpen] = React.useState(index === 0);
	const [activeTab, setActiveTab] = React.useState<
		"content" | "background" | "styling" | "cta" | "advanced"
	>("content");

	return (
		<div
			className={cn(
				"rounded-lg border transition-all",
				slide.enabled
					? "border-border bg-card"
					: "border-dashed border-muted bg-muted/30",
			)}
		>
			{/* Slide Header */}
			<div className="flex items-center gap-2 p-3 border-b border-border">
				<button className="cursor-grab hover:bg-muted rounded p-1">
					<GripVertical className="h-4 w-4 text-muted-foreground" />
				</button>

				<button
					onClick={() => setIsOpen(!isOpen)}
					className="flex-1 flex items-center gap-3 text-left"
				>
					{slide.image ? (
						<div className="h-10 w-16 rounded bg-muted overflow-hidden">
							<img
								src={slide.image}
								alt=""
								className="h-full w-full object-cover"
							/>
						</div>
					) : slide.backgroundGradient ? (
						<div
							className="h-10 w-16 rounded"
							style={{ background: slide.backgroundGradient }}
						/>
					) : (
						<div
							className="h-10 w-16 rounded"
							style={{ backgroundColor: slide.backgroundColor || "#e2e8f0" }}
						/>
					)}
					<div>
						<div className="flex items-center gap-2">
							<span className="text-sm font-medium">
								{slide.title || `Slide ${index + 1}`}
							</span>
							{slide.badge && (
								<Badge variant="secondary" className="text-xs">
									{slide.badge}
								</Badge>
							)}
						</div>
						<span className="text-xs text-muted-foreground line-clamp-1">
							{slide.subtitle}
						</span>
					</div>
				</button>

				<div className="flex items-center gap-1">
					<Button
						variant="ghost"
						size="sm"
						className="h-8 w-8 p-0"
						onClick={() => onUpdate({ enabled: !slide.enabled })}
						title={slide.enabled ? "Disable slide" : "Enable slide"}
					>
						{slide.enabled ? (
							<Eye className="h-4 w-4" />
						) : (
							<EyeOff className="h-4 w-4 text-muted-foreground" />
						)}
					</Button>
					<Button
						variant="ghost"
						size="sm"
						className="h-8 w-8 p-0"
						onClick={onMoveUp}
						disabled={isFirst}
					>
						<ChevronUp className="h-4 w-4" />
					</Button>
					<Button
						variant="ghost"
						size="sm"
						className="h-8 w-8 p-0"
						onClick={onMoveDown}
						disabled={isLast}
					>
						<ChevronDown className="h-4 w-4" />
					</Button>
					<Button
						variant="ghost"
						size="sm"
						className="h-8 w-8 p-0"
						onClick={onDuplicate}
						title="Duplicate slide"
					>
						<Copy className="h-4 w-4" />
					</Button>
					<Button
						variant="ghost"
						size="sm"
						className="h-8 w-8 p-0 text-destructive hover:text-destructive"
						onClick={onRemove}
						title="Delete slide"
					>
						<Trash2 className="h-4 w-4" />
					</Button>
					<Button
						variant="ghost"
						size="sm"
						className="h-8 w-8 p-0"
						onClick={() => setIsOpen(!isOpen)}
					>
						{isOpen ? (
							<ChevronUp className="h-4 w-4" />
						) : (
							<ChevronDown className="h-4 w-4" />
						)}
					</Button>
				</div>
			</div>

			{/* Slide Content */}
			{isOpen && (
				<div className="p-4">
					{/* Tabs */}
					<div className="flex gap-1 mb-4 p-1 bg-muted rounded-lg">
						{[
							{ id: "content", label: "Content", icon: Type },
							{ id: "background", label: "Background", icon: ImageIcon },
							{ id: "styling", label: "Styling", icon: Palette },
							{ id: "cta", label: "Buttons", icon: MousePointer },
							{ id: "advanced", label: "Advanced", icon: Settings },
						].map((tab) => (
							<button
								key={tab.id}
								onClick={() => setActiveTab(tab.id as typeof activeTab)}
								className={cn(
									"flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
									activeTab === tab.id
										? "bg-background text-foreground shadow-sm"
										: "text-muted-foreground hover:text-foreground",
								)}
							>
								<tab.icon className="h-3.5 w-3.5" />
								<span className="hidden sm:inline">{tab.label}</span>
							</button>
						))}
					</div>

					{/* Content Tab */}
					{activeTab === "content" && (
						<div className="space-y-4">
							<div>
								<label className="text-sm font-medium mb-1.5 block">
									Badge Text (optional)
								</label>
								<Input
									value={slide.badge || ""}
									onChange={(e) => onUpdate({ badge: e.target.value || null })}
									placeholder="e.g., NEW, LIMITED TIME, SALE"
								/>
							</div>
							<div>
								<label className="text-sm font-medium mb-1.5 block">
									Title *
								</label>
								<Input
									value={slide.title}
									onChange={(e) => onUpdate({ title: e.target.value })}
									placeholder="Enter slide title"
								/>
							</div>
							<div>
								<label className="text-sm font-medium mb-1.5 block">
									Subtitle
								</label>
								<Input
									value={slide.subtitle}
									onChange={(e) => onUpdate({ subtitle: e.target.value })}
									placeholder="Enter subtitle"
								/>
							</div>
							<div>
								<label className="text-sm font-medium mb-1.5 block">
									Description (optional)
								</label>
								<Textarea
									value={slide.description || ""}
									onChange={(e) =>
										onUpdate({ description: e.target.value || null })
									}
									placeholder="Additional description text"
									rows={3}
								/>
							</div>
						</div>
					)}

					{/* Background Tab */}
					{activeTab === "background" && (
						<div className="space-y-4">
							<div>
								<label className="text-sm font-medium mb-1.5 block">
									Background Image URL
								</label>
								<Input
									value={slide.image || ""}
									onChange={(e) => onUpdate({ image: e.target.value || null })}
									placeholder="https://example.com/image.jpg"
								/>
								{slide.image && (
									<div className="mt-2 relative aspect-video max-w-xs rounded-lg overflow-hidden bg-muted">
										<img
											src={slide.image}
											alt="Preview"
											className="w-full h-full object-cover"
										/>
									</div>
								)}
							</div>

							<div>
								<label className="text-sm font-medium mb-1.5 block">
									Mobile Image URL (optional)
								</label>
								<Input
									value={slide.mobileImage || ""}
									onChange={(e) =>
										onUpdate({ mobileImage: e.target.value || null })
									}
									placeholder="Different image for mobile devices"
								/>
							</div>

							<div>
								<label className="text-sm font-medium mb-1.5 block">
									Background Video URL (optional)
								</label>
								<Input
									value={slide.backgroundVideo || ""}
									onChange={(e) =>
										onUpdate({ backgroundVideo: e.target.value || null })
									}
									placeholder="https://example.com/video.mp4"
								/>
							</div>

							<div className="grid gap-4 sm:grid-cols-2">
								<div>
									<label className="text-sm font-medium mb-1.5 block">
										Background Color
									</label>
									<ColorPicker
										value={slide.backgroundColor}
										onChange={(value) => onUpdate({ backgroundColor: value })}
									/>
								</div>
								<div>
									<label className="text-sm font-medium mb-1.5 block">
										Background Position
									</label>
									<Select
										value={slide.backgroundPosition}
										onValueChange={(value) =>
											onUpdate({ backgroundPosition: value })
										}
									>
										<SelectTrigger>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="center">Center</SelectItem>
											<SelectItem value="top">Top</SelectItem>
											<SelectItem value="bottom">Bottom</SelectItem>
											<SelectItem value="left">Left</SelectItem>
											<SelectItem value="right">Right</SelectItem>
										</SelectContent>
									</Select>
								</div>
							</div>

							<div>
								<label className="text-sm font-medium mb-1.5 block">
									Background Gradient
								</label>
								<Input
									value={slide.backgroundGradient || ""}
									onChange={(e) =>
										onUpdate({ backgroundGradient: e.target.value || null })
									}
									placeholder="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
								/>
								{slide.backgroundGradient && (
									<div
										className="mt-2 h-12 rounded-lg"
										style={{ background: slide.backgroundGradient }}
									/>
								)}
								<div className="mt-2 flex flex-wrap gap-2">
									{[
										"linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
										"linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
										"linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
										"linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
										"linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
										"linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)",
									].map((gradient) => (
										<button
											key={gradient}
											onClick={() => onUpdate({ backgroundGradient: gradient })}
											className="h-8 w-8 rounded-md border border-border hover:ring-2 ring-primary"
											style={{ background: gradient }}
											title="Apply gradient"
										/>
									))}
								</div>
							</div>

							<div className="space-y-3 p-3 rounded-lg bg-muted/50">
								<div className="flex items-center justify-between">
									<span className="text-sm font-medium">Overlay</span>
									<ToggleSwitch
										checked={slide.overlayEnabled}
										onChange={(checked) =>
											onUpdate({ overlayEnabled: checked })
										}
									/>
								</div>
								{slide.overlayEnabled && (
									<>
										<div>
											<label className="text-sm text-muted-foreground mb-1.5 block">
												Overlay Color
											</label>
											<ColorPicker
												value={slide.overlayColor}
												onChange={(value) =>
													onUpdate({ overlayColor: value || "#000000" })
												}
											/>
										</div>
										<RangeSlider
											label="Overlay Opacity"
											value={slide.overlayOpacity}
											onChange={(value) => onUpdate({ overlayOpacity: value })}
											min={0}
											max={1}
											step={0.05}
											suffix=""
										/>
									</>
								)}
							</div>
						</div>
					)}

					{/* Styling Tab */}
					{activeTab === "styling" && (
						<div className="space-y-4">
							<div className="grid gap-4 sm:grid-cols-2">
								<div>
									<label className="text-sm font-medium mb-1.5 block">
										Text Color
									</label>
									<ColorPicker
										value={slide.textColor}
										onChange={(value) => onUpdate({ textColor: value })}
									/>
								</div>
								<div>
									<label className="text-sm font-medium mb-1.5 block">
										Content Max Width
									</label>
									<Select
										value={slide.maxWidth}
										onValueChange={(value: HeroSlide["maxWidth"]) =>
											onUpdate({ maxWidth: value })
										}
									>
										<SelectTrigger>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="sm">Small (640px)</SelectItem>
											<SelectItem value="md">Medium (768px)</SelectItem>
											<SelectItem value="lg">Large (1024px)</SelectItem>
											<SelectItem value="xl">XL (1280px)</SelectItem>
											<SelectItem value="full">Full Width</SelectItem>
										</SelectContent>
									</Select>
								</div>
							</div>

							<div className="grid gap-4 sm:grid-cols-3">
								<div>
									<label className="text-sm font-medium mb-1.5 block">
										Title Size
									</label>
									<Select
										value={slide.titleSize}
										onValueChange={(value: HeroSlide["titleSize"]) =>
											onUpdate({ titleSize: value })
										}
									>
										<SelectTrigger>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="small">Small</SelectItem>
											<SelectItem value="medium">Medium</SelectItem>
											<SelectItem value="large">Large</SelectItem>
											<SelectItem value="xl">Extra Large</SelectItem>
										</SelectContent>
									</Select>
								</div>
								<div>
									<label className="text-sm font-medium mb-1.5 block">
										Title Weight
									</label>
									<Select
										value={slide.titleWeight}
										onValueChange={(value: HeroSlide["titleWeight"]) =>
											onUpdate({ titleWeight: value })
										}
									>
										<SelectTrigger>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="normal">Normal</SelectItem>
											<SelectItem value="medium">Medium</SelectItem>
											<SelectItem value="semibold">Semibold</SelectItem>
											<SelectItem value="bold">Bold</SelectItem>
										</SelectContent>
									</Select>
								</div>
								<div>
									<label className="text-sm font-medium mb-1.5 block">
										Subtitle Size
									</label>
									<Select
										value={slide.subtitleSize}
										onValueChange={(value: HeroSlide["subtitleSize"]) =>
											onUpdate({ subtitleSize: value })
										}
									>
										<SelectTrigger>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="small">Small</SelectItem>
											<SelectItem value="medium">Medium</SelectItem>
											<SelectItem value="large">Large</SelectItem>
										</SelectContent>
									</Select>
								</div>
							</div>

							<div className="grid gap-4 sm:grid-cols-2">
								<div>
									<label className="text-sm font-medium mb-1.5 block">
										Horizontal Alignment
									</label>
									<Select
										value={slide.alignment}
										onValueChange={(value: HeroSlide["alignment"]) =>
											onUpdate({ alignment: value })
										}
									>
										<SelectTrigger>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="left">Left</SelectItem>
											<SelectItem value="center">Center</SelectItem>
											<SelectItem value="right">Right</SelectItem>
										</SelectContent>
									</Select>
								</div>
								<div>
									<label className="text-sm font-medium mb-1.5 block">
										Vertical Alignment
									</label>
									<Select
										value={slide.verticalAlign}
										onValueChange={(value: HeroVerticalAlign) =>
											onUpdate({ verticalAlign: value })
										}
									>
										<SelectTrigger>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="top">Top</SelectItem>
											<SelectItem value="center">Center</SelectItem>
											<SelectItem value="bottom">Bottom</SelectItem>
										</SelectContent>
									</Select>
								</div>
							</div>

							<div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
								<div>
									<span className="text-sm font-medium">Text Shadow</span>
									<p className="text-xs text-muted-foreground">
										Add shadow for better readability
									</p>
								</div>
								<ToggleSwitch
									checked={slide.textShadow}
									onChange={(checked) => onUpdate({ textShadow: checked })}
								/>
							</div>

							<div>
								<label className="text-sm font-medium mb-1.5 block">
									Animation
								</label>
								<Select
									value={slide.animation}
									onValueChange={(value: HeroTextAnimation) =>
										onUpdate({ animation: value })
									}
								>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="none">None</SelectItem>
										<SelectItem value="fadeIn">Fade In</SelectItem>
										<SelectItem value="slideUp">Slide Up</SelectItem>
										<SelectItem value="slideDown">Slide Down</SelectItem>
										<SelectItem value="zoomIn">Zoom In</SelectItem>
									</SelectContent>
								</Select>
							</div>
						</div>
					)}

					{/* CTA Tab */}
					{activeTab === "cta" && (
						<div className="space-y-6">
							{/* Primary CTA */}
							<div className="space-y-4">
								<h5 className="text-sm font-medium flex items-center gap-2">
									<MousePointer className="h-4 w-4" />
									Primary Button
								</h5>
								<div className="grid gap-4 sm:grid-cols-2">
									<div>
										<label className="text-sm font-medium mb-1.5 block">
											Button Text
										</label>
										<Input
											value={slide.ctaText}
											onChange={(e) => onUpdate({ ctaText: e.target.value })}
											placeholder="Shop Now"
										/>
									</div>
									<div>
										<label className="text-sm font-medium mb-1.5 block">
											Button Link
										</label>
										<Input
											value={slide.ctaLink}
											onChange={(e) => onUpdate({ ctaLink: e.target.value })}
											placeholder="/store/search"
										/>
									</div>
								</div>
								<div className="grid gap-4 sm:grid-cols-3">
									<div>
										<label className="text-sm font-medium mb-1.5 block">
											Style
										</label>
										<Select
											value={slide.ctaStyle}
											onValueChange={(value: HeroCtaStyle) =>
												onUpdate({ ctaStyle: value })
											}
										>
											<SelectTrigger>
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="solid">Solid</SelectItem>
												<SelectItem value="outline">Outline</SelectItem>
												<SelectItem value="ghost">Ghost</SelectItem>
												<SelectItem value="gradient">Gradient</SelectItem>
											</SelectContent>
										</Select>
									</div>
									<div>
										<label className="text-sm font-medium mb-1.5 block">
											Size
										</label>
										<Select
											value={slide.ctaSize}
											onValueChange={(value: HeroSlide["ctaSize"]) =>
												onUpdate({ ctaSize: value })
											}
										>
											<SelectTrigger>
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="sm">Small</SelectItem>
												<SelectItem value="md">Medium</SelectItem>
												<SelectItem value="lg">Large</SelectItem>
											</SelectContent>
										</Select>
									</div>
									<div>
										<label className="text-sm font-medium mb-1.5 block">
											Icon
										</label>
										<Select
											value={slide.ctaIcon || "none"}
											onValueChange={(value) =>
												onUpdate({ ctaIcon: value === "none" ? null : value })
											}
										>
											<SelectTrigger>
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="none">No Icon</SelectItem>
												<SelectItem value="ArrowRight">Arrow Right</SelectItem>
												<SelectItem value="ShoppingBag">
													Shopping Bag
												</SelectItem>
												<SelectItem value="Sparkles">Sparkles</SelectItem>
												<SelectItem value="ExternalLink">
													External Link
												</SelectItem>
											</SelectContent>
										</Select>
									</div>
								</div>
								<div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
									<span className="text-sm font-medium">Open in new tab</span>
									<ToggleSwitch
										checked={slide.ctaOpenInNewTab}
										onChange={(checked) =>
											onUpdate({ ctaOpenInNewTab: checked })
										}
									/>
								</div>
							</div>

							{/* Secondary CTA */}
							<div className="space-y-4 pt-4 border-t border-border">
								<h5 className="text-sm font-medium flex items-center gap-2">
									<MousePointer className="h-4 w-4 text-muted-foreground" />
									Secondary Button (optional)
								</h5>
								<div className="grid gap-4 sm:grid-cols-2">
									<div>
										<label className="text-sm font-medium mb-1.5 block">
											Button Text
										</label>
										<Input
											value={slide.ctaSecondaryText || ""}
											onChange={(e) =>
												onUpdate({
													ctaSecondaryText: e.target.value || null,
												})
											}
											placeholder="Learn More"
										/>
									</div>
									<div>
										<label className="text-sm font-medium mb-1.5 block">
											Button Link
										</label>
										<Input
											value={slide.ctaSecondaryLink || ""}
											onChange={(e) =>
												onUpdate({
													ctaSecondaryLink: e.target.value || null,
												})
											}
											placeholder="/about"
										/>
									</div>
								</div>
								<div>
									<label className="text-sm font-medium mb-1.5 block">
										Style
									</label>
									<Select
										value={slide.ctaSecondaryStyle}
										onValueChange={(value: HeroCtaStyle) =>
											onUpdate({ ctaSecondaryStyle: value })
										}
									>
										<SelectTrigger className="w-40">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="solid">Solid</SelectItem>
											<SelectItem value="outline">Outline</SelectItem>
											<SelectItem value="ghost">Ghost</SelectItem>
										</SelectContent>
									</Select>
								</div>
							</div>
						</div>
					)}

					{/* Advanced Tab */}
					{activeTab === "advanced" && (
						<div className="space-y-4">
							<div className="p-3 rounded-lg bg-muted/50">
								<div className="flex items-center justify-between mb-2">
									<span className="text-sm font-medium">Slide Enabled</span>
									<ToggleSwitch
										checked={slide.enabled}
										onChange={(checked) => onUpdate({ enabled: checked })}
									/>
								</div>
								<p className="text-xs text-muted-foreground">
									Disabled slides will not be shown in the carousel
								</p>
							</div>

							<div>
								<label className="text-sm font-medium mb-1.5 block">
									Animation Delay (ms)
								</label>
								<Input
									type="number"
									value={slide.animationDelay}
									onChange={(e) =>
										onUpdate({ animationDelay: Number(e.target.value) })
									}
									placeholder="0"
									min={0}
									max={2000}
									step={100}
								/>
								<p className="text-xs text-muted-foreground mt-1">
									Delay before content animation starts
								</p>
							</div>

							<div className="grid gap-4 sm:grid-cols-2">
								<div>
									<label className="text-sm font-medium mb-1.5 block">
										Start Date (optional)
									</label>
									<Input
										type="datetime-local"
										value={slide.startDate || ""}
										onChange={(e) =>
											onUpdate({ startDate: e.target.value || null })
										}
									/>
									<p className="text-xs text-muted-foreground mt-1">
										Show slide only after this date
									</p>
								</div>
								<div>
									<label className="text-sm font-medium mb-1.5 block">
										End Date (optional)
									</label>
									<Input
										type="datetime-local"
										value={slide.endDate || ""}
										onChange={(e) =>
											onUpdate({ endDate: e.target.value || null })
										}
									/>
									<p className="text-xs text-muted-foreground mt-1">
										Hide slide after this date
									</p>
								</div>
							</div>
						</div>
					)}
				</div>
			)}
		</div>
	);
}

// Main Hero Config Editor Component
export function HeroConfigEditor({
	config,
	updateConfig,
}: HeroConfigEditorProps) {
	const [globalSettingsOpen, setGlobalSettingsOpen] = React.useState(true);
	const [carouselSettingsOpen, setCarouselSettingsOpen] = React.useState(false);
	const [mobileSettingsOpen, setMobileSettingsOpen] = React.useState(false);

	const heroSection = config.homepage.sections.find((s) => s.type === "hero");
	if (!heroSection) return null;

	const heroConfig = heroSection.config as HeroSectionConfig;
	const slides = heroConfig.slides || [];

	const updateHeroConfig = (updates: Partial<HeroSectionConfig>) => {
		const newSections = config.homepage.sections.map((s) => {
			if (s.type === "hero") {
				return {
					...s,
					config: { ...heroConfig, ...updates } as typeof s.config,
				};
			}
			return s;
		});
		updateConfig("homepage", { ...config.homepage, sections: newSections });
	};

	const addSlide = () => {
		const newSlide = createDefaultSlide();
		updateHeroConfig({ slides: [...slides, newSlide] });
	};

	const updateSlide = (slideId: string, updates: Partial<HeroSlide>) => {
		const newSlides = slides.map((s) =>
			s.id === slideId ? { ...s, ...updates } : s,
		);
		updateHeroConfig({ slides: newSlides });
	};

	const removeSlide = (slideId: string) => {
		const newSlides = slides.filter((s) => s.id !== slideId);
		updateHeroConfig({ slides: newSlides });
	};

	const duplicateSlide = (slideId: string) => {
		const slideIndex = slides.findIndex((s) => s.id === slideId);
		if (slideIndex === -1) return;
		const slideToCopy = slides[slideIndex];
		if (!slideToCopy) return;
		const newSlide: HeroSlide = {
			...slideToCopy,
			id: generateId("slide"),
			title: `${slideToCopy.title} (Copy)`,
		};
		const newSlides = [...slides];
		newSlides.splice(slideIndex + 1, 0, newSlide);
		updateHeroConfig({ slides: newSlides });
	};

	const moveSlide = (slideId: string, direction: "up" | "down") => {
		const slideIndex = slides.findIndex((s) => s.id === slideId);
		if (slideIndex === -1) return;
		const newIndex = direction === "up" ? slideIndex - 1 : slideIndex + 1;
		if (newIndex < 0 || newIndex >= slides.length) return;
		const newSlides = [...slides];
		const [removed] = newSlides.splice(slideIndex, 1);
		if (!removed) return;
		newSlides.splice(newIndex, 0, removed);
		updateHeroConfig({ slides: newSlides });
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<Layers className="h-5 w-5" />
					Hero Banner Configuration
				</CardTitle>
				<CardDescription>
					Fully customize the hero banner with slides, animations, and styling
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-6">
				{/* Global Settings */}
				<Collapsible
					open={globalSettingsOpen}
					onOpenChange={setGlobalSettingsOpen}
				>
					<div className="rounded-lg border border-border overflow-hidden">
						<SectionHeader
							icon={Settings}
							title="Layout & Style"
							description="Banner style, height, and display options"
							isOpen={globalSettingsOpen}
							onToggle={() => setGlobalSettingsOpen(!globalSettingsOpen)}
						/>
						<CollapsibleContent>
							<div className="p-4 space-y-4 border-t border-border">
								<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
									<div>
										<label className="text-sm font-medium mb-1.5 block">
											Banner Style
										</label>
										<Select
											value={heroConfig.style}
											onValueChange={(value: HeroStyle) =>
												updateHeroConfig({ style: value })
											}
										>
											<SelectTrigger>
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="carousel">Carousel</SelectItem>
												<SelectItem value="static">Static (Single)</SelectItem>
												<SelectItem value="split">Split Layout</SelectItem>
												<SelectItem value="gradient">Gradient Only</SelectItem>
											</SelectContent>
										</Select>
									</div>
									<div>
										<label className="text-sm font-medium mb-1.5 block">
											Height
										</label>
										<Select
											value={heroConfig.height}
											onValueChange={(value: HeroHeight) =>
												updateHeroConfig({ height: value })
											}
										>
											<SelectTrigger>
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="small">Small (350px)</SelectItem>
												<SelectItem value="medium">Medium (450px)</SelectItem>
												<SelectItem value="large">Large (550px)</SelectItem>
												<SelectItem value="full">Full Screen</SelectItem>
												<SelectItem value="custom">Custom</SelectItem>
											</SelectContent>
										</Select>
									</div>
									{heroConfig.height === "custom" && (
										<div>
											<label className="text-sm font-medium mb-1.5 block">
												Custom Height
											</label>
											<Input
												value={heroConfig.customHeight || ""}
												onChange={(e) =>
													updateHeroConfig({
														customHeight: e.target.value || null,
													})
												}
												placeholder="600px or 80vh"
											/>
										</div>
									)}
									<div>
										<label className="text-sm font-medium mb-1.5 block">
											Content Width
										</label>
										<Select
											value={heroConfig.containerMaxWidth}
											onValueChange={(
												value: HeroSectionConfig["containerMaxWidth"],
											) => updateHeroConfig({ containerMaxWidth: value })}
										>
											<SelectTrigger>
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="sm">Small</SelectItem>
												<SelectItem value="md">Medium</SelectItem>
												<SelectItem value="lg">Large</SelectItem>
												<SelectItem value="xl">XL</SelectItem>
												<SelectItem value="2xl">2XL</SelectItem>
												<SelectItem value="full">Full Width</SelectItem>
											</SelectContent>
										</Select>
									</div>
								</div>

								<div className="grid gap-4 sm:grid-cols-2">
									<div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
										<div>
											<span className="text-sm font-medium">Full Width</span>
											<p className="text-xs text-muted-foreground">
												Extend to screen edges
											</p>
										</div>
										<ToggleSwitch
											checked={heroConfig.fullWidth}
											onChange={(checked) =>
												updateHeroConfig({ fullWidth: checked })
											}
										/>
									</div>
									<div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
										<div>
											<span className="text-sm font-medium">
												Parallax Effect
											</span>
											<p className="text-xs text-muted-foreground">
												Background parallax scrolling
											</p>
										</div>
										<ToggleSwitch
											checked={heroConfig.parallaxEnabled}
											onChange={(checked) =>
												updateHeroConfig({ parallaxEnabled: checked })
											}
										/>
									</div>
								</div>

								{/* Global Overlay */}
								<div className="space-y-3 p-3 rounded-lg bg-muted/50">
									<div className="flex items-center justify-between">
										<span className="text-sm font-medium">Global Overlay</span>
										<ToggleSwitch
											checked={heroConfig.overlay}
											onChange={(checked) =>
												updateHeroConfig({ overlay: checked })
											}
										/>
									</div>
									{heroConfig.overlay && (
										<>
											<div className="flex items-center gap-4">
												<label className="text-sm text-muted-foreground">
													Color
												</label>
												<ColorPicker
													value={heroConfig.overlayColor}
													onChange={(value) =>
														updateHeroConfig({
															overlayColor: value || "#000000",
														})
													}
												/>
											</div>
											<RangeSlider
												label="Opacity"
												value={heroConfig.overlayOpacity}
												onChange={(value) =>
													updateHeroConfig({ overlayOpacity: value })
												}
												min={0}
												max={1}
												step={0.05}
											/>
										</>
									)}
								</div>
							</div>
						</CollapsibleContent>
					</div>
				</Collapsible>

				{/* Carousel Settings */}
				{(heroConfig.style === "carousel" || slides.length > 1) && (
					<Collapsible
						open={carouselSettingsOpen}
						onOpenChange={setCarouselSettingsOpen}
					>
						<div className="rounded-lg border border-border overflow-hidden">
							<SectionHeader
								icon={Play}
								title="Carousel Settings"
								description="Auto-play, transitions, and navigation"
								isOpen={carouselSettingsOpen}
								onToggle={() => setCarouselSettingsOpen(!carouselSettingsOpen)}
							/>
							<CollapsibleContent>
								<div className="p-4 space-y-4 border-t border-border">
									<div className="grid gap-4 sm:grid-cols-2">
										<div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
											<div>
												<span className="text-sm font-medium">Auto Rotate</span>
												<p className="text-xs text-muted-foreground">
													Automatically cycle slides
												</p>
											</div>
											<ToggleSwitch
												checked={heroConfig.autoRotate}
												onChange={(checked) =>
													updateHeroConfig({ autoRotate: checked })
												}
											/>
										</div>
										<div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
											<div>
												<span className="text-sm font-medium">
													Pause on Hover
												</span>
												<p className="text-xs text-muted-foreground">
													Stop rotation when hovering
												</p>
											</div>
											<ToggleSwitch
												checked={heroConfig.pauseOnHover}
												onChange={(checked) =>
													updateHeroConfig({ pauseOnHover: checked })
												}
											/>
										</div>
									</div>

									{heroConfig.autoRotate && (
										<RangeSlider
											label="Rotation Speed"
											value={heroConfig.autoRotateSpeed}
											onChange={(value) =>
												updateHeroConfig({ autoRotateSpeed: value })
											}
											min={2000}
											max={10000}
											step={500}
											suffix="ms"
										/>
									)}

									<div className="grid gap-4 sm:grid-cols-2">
										<div>
											<label className="text-sm font-medium mb-1.5 block">
												Transition Effect
											</label>
											<Select
												value={heroConfig.transition}
												onValueChange={(value: HeroTransition) =>
													updateHeroConfig({ transition: value })
												}
											>
												<SelectTrigger>
													<SelectValue />
												</SelectTrigger>
												<SelectContent>
													<SelectItem value="fade">Fade</SelectItem>
													<SelectItem value="slide">Slide</SelectItem>
													<SelectItem value="zoom">Zoom</SelectItem>
													<SelectItem value="none">None</SelectItem>
												</SelectContent>
											</Select>
										</div>
										<div>
											<label className="text-sm font-medium mb-1.5 block">
												Transition Duration
											</label>
											<Select
												value={heroConfig.transitionDuration.toString()}
												onValueChange={(value) =>
													updateHeroConfig({
														transitionDuration: Number(value),
													})
												}
											>
												<SelectTrigger>
													<SelectValue />
												</SelectTrigger>
												<SelectContent>
													<SelectItem value="300">Fast (300ms)</SelectItem>
													<SelectItem value="500">Normal (500ms)</SelectItem>
													<SelectItem value="700">Slow (700ms)</SelectItem>
													<SelectItem value="1000">Very Slow (1s)</SelectItem>
												</SelectContent>
											</Select>
										</div>
									</div>

									{/* Navigation */}
									<div className="pt-4 border-t border-border space-y-4">
										<h5 className="text-sm font-medium">Navigation</h5>
										<div className="grid gap-4 sm:grid-cols-2">
											<div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
												<span className="text-sm font-medium">Show Dots</span>
												<ToggleSwitch
													checked={heroConfig.showDots}
													onChange={(checked) =>
														updateHeroConfig({ showDots: checked })
													}
												/>
											</div>
											<div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
												<span className="text-sm font-medium">Show Arrows</span>
												<ToggleSwitch
													checked={heroConfig.showArrows}
													onChange={(checked) =>
														updateHeroConfig({ showArrows: checked })
													}
												/>
											</div>
										</div>

										{heroConfig.showDots && (
											<div className="grid gap-4 sm:grid-cols-2">
												<div>
													<label className="text-sm font-medium mb-1.5 block">
														Dots Position
													</label>
													<Select
														value={heroConfig.dotsPosition}
														onValueChange={(
															value: HeroSectionConfig["dotsPosition"],
														) => updateHeroConfig({ dotsPosition: value })}
													>
														<SelectTrigger>
															<SelectValue />
														</SelectTrigger>
														<SelectContent>
															<SelectItem value="bottom">
																Bottom Center
															</SelectItem>
															<SelectItem value="bottom-left">
																Bottom Left
															</SelectItem>
															<SelectItem value="bottom-right">
																Bottom Right
															</SelectItem>
														</SelectContent>
													</Select>
												</div>
												<div>
													<label className="text-sm font-medium mb-1.5 block">
														Dots Style
													</label>
													<Select
														value={heroConfig.dotsStyle}
														onValueChange={(
															value: HeroSectionConfig["dotsStyle"],
														) => updateHeroConfig({ dotsStyle: value })}
													>
														<SelectTrigger>
															<SelectValue />
														</SelectTrigger>
														<SelectContent>
															<SelectItem value="dots">Dots</SelectItem>
															<SelectItem value="lines">Lines</SelectItem>
															<SelectItem value="numbers">Numbers</SelectItem>
														</SelectContent>
													</Select>
												</div>
											</div>
										)}

										{heroConfig.showArrows && (
											<div className="grid gap-4 sm:grid-cols-2">
												<div>
													<label className="text-sm font-medium mb-1.5 block">
														Arrow Style
													</label>
													<Select
														value={heroConfig.arrowStyle}
														onValueChange={(
															value: HeroSectionConfig["arrowStyle"],
														) => updateHeroConfig({ arrowStyle: value })}
													>
														<SelectTrigger>
															<SelectValue />
														</SelectTrigger>
														<SelectContent>
															<SelectItem value="default">Default</SelectItem>
															<SelectItem value="minimal">Minimal</SelectItem>
															<SelectItem value="rounded">Rounded</SelectItem>
															<SelectItem value="square">Square</SelectItem>
														</SelectContent>
													</Select>
												</div>
												<div>
													<label className="text-sm font-medium mb-1.5 block">
														Arrow Position
													</label>
													<Select
														value={heroConfig.arrowPosition}
														onValueChange={(
															value: HeroSectionConfig["arrowPosition"],
														) => updateHeroConfig({ arrowPosition: value })}
													>
														<SelectTrigger>
															<SelectValue />
														</SelectTrigger>
														<SelectContent>
															<SelectItem value="sides">Sides</SelectItem>
															<SelectItem value="bottom">Bottom</SelectItem>
														</SelectContent>
													</Select>
												</div>
											</div>
										)}
									</div>
								</div>
							</CollapsibleContent>
						</div>
					</Collapsible>
				)}

				{/* Mobile Settings */}
				<Collapsible
					open={mobileSettingsOpen}
					onOpenChange={setMobileSettingsOpen}
				>
					<div className="rounded-lg border border-border overflow-hidden">
						<SectionHeader
							icon={Smartphone}
							title="Mobile Settings"
							description="Responsive settings for mobile devices"
							isOpen={mobileSettingsOpen}
							onToggle={() => setMobileSettingsOpen(!mobileSettingsOpen)}
						/>
						<CollapsibleContent>
							<div className="p-4 space-y-4 border-t border-border">
								<div className="grid gap-4 sm:grid-cols-2">
									<div>
										<label className="text-sm font-medium mb-1.5 block">
											Mobile Height
										</label>
										<Select
											value={heroConfig.mobileHeight}
											onValueChange={(value: HeroHeight) =>
												updateHeroConfig({ mobileHeight: value })
											}
										>
											<SelectTrigger>
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="small">Small</SelectItem>
												<SelectItem value="medium">Medium</SelectItem>
												<SelectItem value="large">Large</SelectItem>
												<SelectItem value="full">Full Screen</SelectItem>
												<SelectItem value="custom">Custom</SelectItem>
											</SelectContent>
										</Select>
									</div>
									{heroConfig.mobileHeight === "custom" && (
										<div>
											<label className="text-sm font-medium mb-1.5 block">
												Custom Mobile Height
											</label>
											<Input
												value={heroConfig.mobileCustomHeight || ""}
												onChange={(e) =>
													updateHeroConfig({
														mobileCustomHeight: e.target.value || null,
													})
												}
												placeholder="400px or 60vh"
											/>
										</div>
									)}
								</div>
								<div className="grid gap-4 sm:grid-cols-2">
									<div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
										<div>
											<span className="text-sm font-medium">Hide Arrows</span>
											<p className="text-xs text-muted-foreground">
												Hide navigation arrows on mobile
											</p>
										</div>
										<ToggleSwitch
											checked={heroConfig.hideArrowsOnMobile}
											onChange={(checked) =>
												updateHeroConfig({ hideArrowsOnMobile: checked })
											}
										/>
									</div>
									<div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
										<div>
											<span className="text-sm font-medium">Stack Content</span>
											<p className="text-xs text-muted-foreground">
												Stack text and buttons vertically
											</p>
										</div>
										<ToggleSwitch
											checked={heroConfig.stackContentOnMobile}
											onChange={(checked) =>
												updateHeroConfig({ stackContentOnMobile: checked })
											}
										/>
									</div>
								</div>
							</div>
						</CollapsibleContent>
					</div>
				</Collapsible>

				{/* Slides */}
				<div className="space-y-4">
					<div className="flex items-center justify-between">
						<div>
							<h4 className="text-sm font-medium">Slides</h4>
							<p className="text-xs text-muted-foreground">
								{slides.length} slide{slides.length !== 1 ? "s" : ""} configured
							</p>
						</div>
						<Button size="sm" onClick={addSlide}>
							<Plus className="h-4 w-4 mr-1" />
							Add Slide
						</Button>
					</div>

					<div className="space-y-3">
						{slides.map((slide, index) => (
							<SlideEditor
								key={slide.id}
								slide={slide}
								index={index}
								onUpdate={(updates) => updateSlide(slide.id, updates)}
								onRemove={() => removeSlide(slide.id)}
								onDuplicate={() => duplicateSlide(slide.id)}
								onMoveUp={() => moveSlide(slide.id, "up")}
								onMoveDown={() => moveSlide(slide.id, "down")}
								isFirst={index === 0}
								isLast={index === slides.length - 1}
							/>
						))}
					</div>

					{slides.length === 0 && (
						<div className="text-center py-8 border-2 border-dashed border-border rounded-lg">
							<ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
							<h3 className="text-sm font-medium mb-1">No slides yet</h3>
							<p className="text-xs text-muted-foreground mb-4">
								Add your first slide to get started
							</p>
							<Button size="sm" onClick={addSlide}>
								<Plus className="h-4 w-4 mr-1" />
								Add First Slide
							</Button>
						</div>
					)}
				</div>
			</CardContent>
		</Card>
	);
}

export default HeroConfigEditor;
