"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { fetcher } from "@/lib/fetcher";
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
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
	DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
	PageHeader,
	Container,
	PageWrapper,
} from "@/components/layout/page-header";
import { toast } from "@/components/providers";
import {
	Palette,
	Type,
	Layout,
	Layers,
	ShoppingBag,
	Settings,
	Save,
	RotateCcw,
	Eye,
	GripVertical,
	ChevronUp,
	ChevronDown,
	Trash2,
	Plus,
	Image as ImageIcon,
	Link as LinkIcon,
	CheckCircle,
	XCircle,
	Info,
	Building2,
	Paintbrush,
	ExternalLink,
	PanelRightOpen,
	PanelRightClose,
} from "lucide-react";
import useSWR from "swr";
import type {
	StoreConfig,
	HomepageSection,
	HeroSlide,
	TrustBadge,
} from "@/lib/store-config";
import { defaultStoreConfig, generateId } from "@/lib/store-config";
import { HeroConfigEditor } from "@/components/admin/hero-config-editor";
import { StorePreview } from "@/components/admin/store-preview";

// Types
interface Partner {
	id: number;
	name: string;
	is_active: boolean;
	store_config: StoreConfig | null;
}

export default function AdminStoreConfigPage() {
	const [selectedPartnerId, setSelectedPartnerId] = React.useState<
		number | null
	>(null);
	const [config, setConfig] = React.useState<StoreConfig>(defaultStoreConfig);
	const [originalConfig, setOriginalConfig] =
		React.useState<StoreConfig>(defaultStoreConfig);
	const [isSaving, setIsSaving] = React.useState(false);
	const [hasChanges, setHasChanges] = React.useState(false);
	const [activeTab, setActiveTab] = React.useState("branding");
	const [showPreview, setShowPreview] = React.useState(true);

	// Fetch partners
	const { data: partners, isLoading: partnersLoading } = useSWR<Partner[]>(
		"/api/partners",
		fetcher,
	);

	// Fetch selected partner's config
	const { data: partnerConfig, mutate: mutateConfig } = useSWR<{
		id: number;
		name: string;
		store_config: StoreConfig;
	}>(
		selectedPartnerId
			? `/api/partners/${selectedPartnerId}/store-config`
			: null,
		fetcher,
	);

	// Load config when partner changes
	React.useEffect(() => {
		if (partnerConfig?.store_config) {
			const merged = mergeStoreConfig(
				defaultStoreConfig,
				partnerConfig.store_config,
			);
			setConfig(merged);
			setOriginalConfig(merged);
			setHasChanges(false);
		}
	}, [partnerConfig]);

	// Track changes
	React.useEffect(() => {
		setHasChanges(JSON.stringify(config) !== JSON.stringify(originalConfig));
	}, [config, originalConfig]);

	// Update config helper
	const updateConfig = <K extends keyof StoreConfig>(
		key: K,
		value: StoreConfig[K],
	) => {
		setConfig((prev) => ({ ...prev, [key]: value }));
	};

	// Save configuration
	const handleSave = async () => {
		if (!selectedPartnerId) return;

		setIsSaving(true);
		try {
			const response = await fetch(
				`/api/partners/${selectedPartnerId}/store-config`,
				{
					method: "PUT",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ store_config: config }),
				},
			);

			if (!response.ok) {
				throw new Error("Failed to save configuration");
			}

			setOriginalConfig(config);
			setHasChanges(false);
			mutateConfig();
			toast.success("Store configuration saved successfully");
		} catch (error) {
			toast.error("Failed to save configuration");
			console.error(error);
		} finally {
			setIsSaving(false);
		}
	};

	// Reset to original
	const handleReset = () => {
		setConfig(originalConfig);
		setHasChanges(false);
		toast.info("Changes reverted");
	};

	// Reset to defaults
	const handleResetToDefaults = () => {
		setConfig(defaultStoreConfig);
		toast.info("Reset to default configuration");
	};

	const selectedPartner = partners?.find((p) => p.id === selectedPartnerId);

	return (
		<PageWrapper>
			<PageHeader
				title="Store Configuration"
				description="Customize the rewards store appearance and behavior for each partner bank"
				icon={Paintbrush}
				badge={
					hasChanges ? (
						<Badge
							variant="outline"
							className="bg-warning/10 text-warning border-warning"
						>
							Unsaved Changes
						</Badge>
					) : undefined
				}
			/>

			<Container className="py-6">
				{/* Partner Selector */}
				<Card className="mb-6">
					<CardContent className="pt-6">
						<div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
							<div className="flex items-center gap-2">
								<Building2 className="h-5 w-5 text-muted-foreground" />
								<span className="font-medium">Select Partner:</span>
							</div>
							<Select
								value={selectedPartnerId?.toString() || ""}
								onValueChange={(val) => setSelectedPartnerId(Number(val))}
							>
								<SelectTrigger className="w-[250px]">
									<SelectValue placeholder="Choose a partner bank..." />
								</SelectTrigger>
								<SelectContent>
									{partners?.map((partner) => (
										<SelectItem key={partner.id} value={partner.id.toString()}>
											<div className="flex items-center gap-2">
												{partner.name}
												{!partner.is_active && (
													<Badge variant="outline" className="text-xs">
														Inactive
													</Badge>
												)}
											</div>
										</SelectItem>
									))}
								</SelectContent>
							</Select>

							{selectedPartner && (
								<div className="flex items-center gap-2 ml-auto">
									<Button
										variant="outline"
										size="sm"
										onClick={() => setShowPreview(!showPreview)}
									>
										<Eye className="h-4 w-4 mr-2" />
										{showPreview ? "Hide Preview" : "Show Preview"}
									</Button>
									<Button
										variant="outline"
										size="sm"
										onClick={() => window.open("/store", "_blank")}
									>
										<ExternalLink className="h-4 w-4 mr-2" />
										Open Store
									</Button>
									<Button
										variant="outline"
										size="sm"
										onClick={handleResetToDefaults}
										disabled={!selectedPartnerId}
									>
										<RotateCcw className="h-4 w-4 mr-2" />
										Reset to Defaults
									</Button>
									<Button
										variant="outline"
										size="sm"
										onClick={handleReset}
										disabled={!hasChanges}
									>
										Discard Changes
									</Button>
									<Button
										size="sm"
										onClick={handleSave}
										disabled={!hasChanges || isSaving}
									>
										<Save className="h-4 w-4 mr-2" />
										{isSaving ? "Saving..." : "Save Changes"}
									</Button>
								</div>
							)}
						</div>
					</CardContent>
				</Card>

				{!selectedPartnerId ? (
					<Card>
						<CardContent className="py-16 text-center">
							<Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
							<h3 className="text-lg font-semibold mb-2">
								No Partner Selected
							</h3>
							<p className="text-muted-foreground">
								Select a partner bank above to configure their store settings.
							</p>
						</CardContent>
					</Card>
				) : (
					<div
						className={cn(
							"grid gap-6 transition-all duration-300",
							showPreview
								? "lg:grid-cols-[1fr,480px] xl:grid-cols-[1fr,560px]"
								: "grid-cols-1",
						)}
					>
						{/* Editor Panel */}
						<div className="min-w-0">
							<Tabs
								value={activeTab}
								onValueChange={setActiveTab}
								className="space-y-6"
							>
								<TabsList className="mb-6 flex-wrap h-auto gap-1">
									<TabsTrigger value="branding" className="gap-2">
										<ImageIcon className="h-4 w-4" />
										Branding
									</TabsTrigger>
									<TabsTrigger value="theme" className="gap-2">
										<Palette className="h-4 w-4" />
										Theme & Colors
									</TabsTrigger>
									<TabsTrigger value="typography" className="gap-2">
										<Type className="h-4 w-4" />
										Typography
									</TabsTrigger>
									<TabsTrigger value="layout" className="gap-2">
										<Layout className="h-4 w-4" />
										Layout
									</TabsTrigger>
									<TabsTrigger value="homepage" className="gap-2">
										<Layers className="h-4 w-4" />
										Homepage
									</TabsTrigger>
									<TabsTrigger value="products" className="gap-2">
										<ShoppingBag className="h-4 w-4" />
										Products
									</TabsTrigger>
									<TabsTrigger value="features" className="gap-2">
										<Settings className="h-4 w-4" />
										Features
									</TabsTrigger>
								</TabsList>

								{/* Branding Tab */}
								<TabsContent value="branding">
									<BrandingTab config={config} updateConfig={updateConfig} />
								</TabsContent>

								{/* Theme Tab */}
								<TabsContent value="theme">
									<ThemeTab config={config} updateConfig={updateConfig} />
								</TabsContent>

								{/* Typography Tab */}
								<TabsContent value="typography">
									<TypographyTab config={config} updateConfig={updateConfig} />
								</TabsContent>

								{/* Layout Tab */}
								<TabsContent value="layout">
									<LayoutTab config={config} updateConfig={updateConfig} />
								</TabsContent>

								{/* Homepage Tab */}
								<TabsContent value="homepage">
									<HomepageTab config={config} updateConfig={updateConfig} />
								</TabsContent>

								{/* Products Tab */}
								<TabsContent value="products">
									<ProductsTab config={config} updateConfig={updateConfig} />
								</TabsContent>

								{/* Features Tab */}
								<TabsContent value="features">
									<FeaturesTab config={config} updateConfig={updateConfig} />
								</TabsContent>
							</Tabs>
						</div>

						{/* Preview Panel */}
						{showPreview && (
							<div className="hidden lg:block sticky top-24 h-[calc(100vh-8rem)]">
								<StorePreview config={config} className="h-full" />
							</div>
						)}
					</div>
				)}
			</Container>
		</PageWrapper>
	);
}

// ============ BRANDING TAB ============
function BrandingTab({
	config,
	updateConfig,
}: {
	config: StoreConfig;
	updateConfig: <K extends keyof StoreConfig>(
		key: K,
		value: StoreConfig[K],
	) => void;
}) {
	const { branding } = config;

	const updateBranding = (updates: Partial<typeof branding>) => {
		updateConfig("branding", { ...branding, ...updates });
	};

	return (
		<div className="grid gap-6 lg:grid-cols-2">
			<Card>
				<CardHeader>
					<CardTitle>Store Identity</CardTitle>
					<CardDescription>
						Configure the basic identity of your rewards store
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div>
						<label className="text-sm font-medium mb-1.5 block">
							Store Name
						</label>
						<Input
							value={branding.storeName}
							onChange={(e) => updateBranding({ storeName: e.target.value })}
							placeholder="e.g., SBI Rewardz"
						/>
					</div>
					<div>
						<label className="text-sm font-medium mb-1.5 block">Tagline</label>
						<Input
							value={branding.tagline}
							onChange={(e) => updateBranding({ tagline: e.target.value })}
							placeholder="e.g., Redeem your points for amazing rewards"
						/>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Logo & Favicon</CardTitle>
					<CardDescription>
						Upload your brand assets (URLs to images)
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div>
						<label className="text-sm font-medium mb-1.5 block">
							Logo URL (Light)
						</label>
						<Input
							value={branding.logo || ""}
							onChange={(e) => updateBranding({ logo: e.target.value || null })}
							placeholder="https://example.com/logo.png"
						/>
						{branding.logo && (
							<div className="mt-2 p-4 bg-muted rounded-lg">
								<img
									src={branding.logo}
									alt="Logo preview"
									className="h-12 object-contain"
								/>
							</div>
						)}
					</div>
					<div>
						<label className="text-sm font-medium mb-1.5 block">
							Logo URL (Dark)
						</label>
						<Input
							value={branding.logoDark || ""}
							onChange={(e) =>
								updateBranding({ logoDark: e.target.value || null })
							}
							placeholder="https://example.com/logo-dark.png"
						/>
					</div>
					<div>
						<label className="text-sm font-medium mb-1.5 block">
							Favicon URL
						</label>
						<Input
							value={branding.favicon || ""}
							onChange={(e) =>
								updateBranding({ favicon: e.target.value || null })
							}
							placeholder="https://example.com/favicon.ico"
						/>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}

// ============ THEME TAB ============
function ThemeTab({
	config,
	updateConfig,
}: {
	config: StoreConfig;
	updateConfig: <K extends keyof StoreConfig>(
		key: K,
		value: StoreConfig[K],
	) => void;
}) {
	const { theme } = config;
	const { colors } = theme;

	const updateColor = (colorKey: keyof typeof colors, value: string) => {
		updateConfig("theme", {
			...theme,
			colors: { ...colors, [colorKey]: value },
		});
	};

	const colorGroups = [
		{
			title: "Primary Colors",
			colors: [
				{ key: "primary", label: "Primary" },
				{ key: "primaryForeground", label: "Primary Foreground" },
			],
		},
		{
			title: "Secondary Colors",
			colors: [
				{ key: "secondary", label: "Secondary" },
				{ key: "secondaryForeground", label: "Secondary Foreground" },
			],
		},
		{
			title: "Accent Colors",
			colors: [
				{ key: "accent", label: "Accent" },
				{ key: "accentForeground", label: "Accent Foreground" },
			],
		},
		{
			title: "Background Colors",
			colors: [
				{ key: "background", label: "Background" },
				{ key: "foreground", label: "Foreground" },
				{ key: "card", label: "Card" },
				{ key: "cardForeground", label: "Card Foreground" },
			],
		},
		{
			title: "Neutral Colors",
			colors: [
				{ key: "muted", label: "Muted" },
				{ key: "mutedForeground", label: "Muted Foreground" },
				{ key: "border", label: "Border" },
			],
		},
		{
			title: "Status Colors",
			colors: [
				{ key: "destructive", label: "Destructive" },
				{ key: "success", label: "Success" },
				{ key: "warning", label: "Warning" },
			],
		},
	];

	return (
		<div className="space-y-6">
			{colorGroups.map((group) => (
				<Card key={group.title}>
					<CardHeader>
						<CardTitle className="text-base">{group.title}</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
							{group.colors.map(({ key, label }) => (
								<ColorPicker
									key={key}
									label={label}
									value={colors[key as keyof typeof colors]}
									onChange={(value) =>
										updateColor(key as keyof typeof colors, value)
									}
								/>
							))}
						</div>
					</CardContent>
				</Card>
			))}

			<Card>
				<CardHeader>
					<CardTitle className="text-base">Component Styles</CardTitle>
					<CardDescription>
						Customize the appearance of UI components
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
						<div>
							<label className="text-sm font-medium mb-1.5 block">
								Border Radius
							</label>
							<Select
								value={theme.borderRadius}
								onValueChange={(value) =>
									updateConfig("theme", { ...theme, borderRadius: value })
								}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="0">None (0)</SelectItem>
									<SelectItem value="0.25rem">Small (0.25rem)</SelectItem>
									<SelectItem value="0.5rem">Medium (0.5rem)</SelectItem>
									<SelectItem value="0.75rem">Large (0.75rem)</SelectItem>
									<SelectItem value="1rem">Extra Large (1rem)</SelectItem>
									<SelectItem value="9999px">Full (Pill)</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<div>
							<label className="text-sm font-medium mb-1.5 block">
								Container Max Width
							</label>
							<Select
								value={theme.spacing.containerMaxWidth}
								onValueChange={(value) =>
									updateConfig("theme", {
										...theme,
										spacing: { ...theme.spacing, containerMaxWidth: value },
									})
								}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="1024px">Narrow (1024px)</SelectItem>
									<SelectItem value="1152px">Medium (1152px)</SelectItem>
									<SelectItem value="1280px">Wide (1280px)</SelectItem>
									<SelectItem value="1440px">Extra Wide (1440px)</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<div>
							<label className="text-sm font-medium mb-1.5 block">
								Section Padding
							</label>
							<Select
								value={theme.spacing.sectionPadding}
								onValueChange={(value) =>
									updateConfig("theme", {
										...theme,
										spacing: { ...theme.spacing, sectionPadding: value },
									})
								}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="2rem">Compact (2rem)</SelectItem>
									<SelectItem value="3rem">Normal (3rem)</SelectItem>
									<SelectItem value="4rem">Spacious (4rem)</SelectItem>
									<SelectItem value="5rem">Extra Spacious (5rem)</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}

// ============ TYPOGRAPHY TAB ============
function TypographyTab({
	config,
	updateConfig,
}: {
	config: StoreConfig;
	updateConfig: <K extends keyof StoreConfig>(
		key: K,
		value: StoreConfig[K],
	) => void;
}) {
	const { theme } = config;
	const { typography } = theme;

	const updateTypography = (updates: Partial<typeof typography>) => {
		updateConfig("theme", {
			...theme,
			typography: { ...typography, ...updates },
		});
	};

	const fontOptions = [
		"Inter, system-ui, sans-serif",
		"system-ui, sans-serif",
		"Roboto, sans-serif",
		"Open Sans, sans-serif",
		"Lato, sans-serif",
		"Poppins, sans-serif",
		"Montserrat, sans-serif",
		"Nunito, sans-serif",
	];

	return (
		<div className="grid gap-6 lg:grid-cols-2">
			<Card>
				<CardHeader>
					<CardTitle>Font Families</CardTitle>
					<CardDescription>
						Choose fonts for headings and body text
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div>
						<label className="text-sm font-medium mb-1.5 block">
							Heading Font
						</label>
						<Select
							value={typography.headingFontFamily}
							onValueChange={(value) =>
								updateTypography({ headingFontFamily: value })
							}
						>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{fontOptions.map((font) => (
									<SelectItem key={font} value={font}>
										<span style={{ fontFamily: font }}>
											{font.split(",")[0]}
										</span>
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					<div>
						<label className="text-sm font-medium mb-1.5 block">
							Body Font
						</label>
						<Select
							value={typography.fontFamily}
							onValueChange={(value) => updateTypography({ fontFamily: value })}
						>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{fontOptions.map((font) => (
									<SelectItem key={font} value={font}>
										<span style={{ fontFamily: font }}>
											{font.split(",")[0]}
										</span>
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Font Settings</CardTitle>
					<CardDescription>Configure font sizes and weights</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div>
						<label className="text-sm font-medium mb-1.5 block">
							Base Font Size
						</label>
						<Select
							value={typography.baseFontSize}
							onValueChange={(value) =>
								updateTypography({ baseFontSize: value })
							}
						>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="14px">Small (14px)</SelectItem>
								<SelectItem value="16px">Normal (16px)</SelectItem>
								<SelectItem value="18px">Large (18px)</SelectItem>
							</SelectContent>
						</Select>
					</div>
					<div>
						<label className="text-sm font-medium mb-1.5 block">
							Heading Weight
						</label>
						<Select
							value={typography.headingWeight}
							onValueChange={(value) =>
								updateTypography({ headingWeight: value })
							}
						>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="500">Medium (500)</SelectItem>
								<SelectItem value="600">Semi-Bold (600)</SelectItem>
								<SelectItem value="700">Bold (700)</SelectItem>
								<SelectItem value="800">Extra Bold (800)</SelectItem>
							</SelectContent>
						</Select>
					</div>
					<div>
						<label className="text-sm font-medium mb-1.5 block">
							Line Height
						</label>
						<Select
							value={typography.lineHeight}
							onValueChange={(value) => updateTypography({ lineHeight: value })}
						>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="1.25">Tight (1.25)</SelectItem>
								<SelectItem value="1.5">Normal (1.5)</SelectItem>
								<SelectItem value="1.75">Relaxed (1.75)</SelectItem>
								<SelectItem value="2">Loose (2)</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}

// ============ LAYOUT TAB ============
function LayoutTab({
	config,
	updateConfig,
}: {
	config: StoreConfig;
	updateConfig: <K extends keyof StoreConfig>(
		key: K,
		value: StoreConfig[K],
	) => void;
}) {
	const { header, footer } = config;

	const updateHeader = (updates: Partial<typeof header>) => {
		updateConfig("header", { ...header, ...updates });
	};

	const updateFooter = (updates: Partial<typeof footer>) => {
		updateConfig("footer", { ...footer, ...updates });
	};

	return (
		<div className="grid gap-6 lg:grid-cols-2">
			{/* Header Settings */}
			<Card>
				<CardHeader>
					<CardTitle>Header</CardTitle>
					<CardDescription>Configure the store header</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div>
						<label className="text-sm font-medium mb-1.5 block">
							Header Style
						</label>
						<Select
							value={header.style}
							onValueChange={(value: any) => updateHeader({ style: value })}
						>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="minimal">Minimal</SelectItem>
								<SelectItem value="standard">Standard</SelectItem>
								<SelectItem value="centered">Centered</SelectItem>
							</SelectContent>
						</Select>
					</div>
					<div className="flex items-center justify-between">
						<div>
							<p className="text-sm font-medium">Sticky Header</p>
							<p className="text-xs text-muted-foreground">
								Header stays visible while scrolling
							</p>
						</div>
						<ToggleSwitch
							checked={header.sticky}
							onChange={(checked) => updateHeader({ sticky: checked })}
						/>
					</div>
					<div className="flex items-center justify-between">
						<div>
							<p className="text-sm font-medium">Show Search Bar</p>
							<p className="text-xs text-muted-foreground">
								Display search input in header
							</p>
						</div>
						<ToggleSwitch
							checked={header.showSearch}
							onChange={(checked) => updateHeader({ showSearch: checked })}
						/>
					</div>
					<div className="flex items-center justify-between">
						<div>
							<p className="text-sm font-medium">Show Points Balance</p>
							<p className="text-xs text-muted-foreground">
								Display user's points in header
							</p>
						</div>
						<ToggleSwitch
							checked={header.showPointsBalance}
							onChange={(checked) =>
								updateHeader({ showPointsBalance: checked })
							}
						/>
					</div>
				</CardContent>
			</Card>

			{/* Footer Settings */}
			<Card>
				<CardHeader>
					<CardTitle>Footer</CardTitle>
					<CardDescription>Configure the store footer</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div>
						<label className="text-sm font-medium mb-1.5 block">
							Footer Style
						</label>
						<Select
							value={footer.style}
							onValueChange={(value: any) => updateFooter({ style: value })}
						>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="minimal">Minimal</SelectItem>
								<SelectItem value="standard">Standard</SelectItem>
								<SelectItem value="expanded">Expanded</SelectItem>
							</SelectContent>
						</Select>
					</div>
					<div>
						<label className="text-sm font-medium mb-1.5 block">
							Copyright Text
						</label>
						<Input
							value={footer.copyrightText}
							onChange={(e) => updateFooter({ copyrightText: e.target.value })}
							placeholder="© 2025 Your Company"
						/>
					</div>
					<div className="flex items-center justify-between">
						<div>
							<p className="text-sm font-medium">Show Social Links</p>
							<p className="text-xs text-muted-foreground">
								Display social media icons
							</p>
						</div>
						<ToggleSwitch
							checked={footer.showSocialLinks}
							onChange={(checked) => updateFooter({ showSocialLinks: checked })}
						/>
					</div>
					<div className="flex items-center justify-between">
						<div>
							<p className="text-sm font-medium">Show Newsletter</p>
							<p className="text-xs text-muted-foreground">
								Display newsletter subscription form
							</p>
						</div>
						<ToggleSwitch
							checked={footer.showNewsletter}
							onChange={(checked) => updateFooter({ showNewsletter: checked })}
						/>
					</div>
				</CardContent>
			</Card>

			{/* Social Links */}
			{footer.showSocialLinks && (
				<Card className="lg:col-span-2">
					<CardHeader>
						<CardTitle>Social Media Links</CardTitle>
						<CardDescription>
							Add your social media profile URLs
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
							{Object.entries(footer.socialLinks).map(([key, value]) => (
								<div key={key}>
									<label className="text-sm font-medium mb-1.5 block capitalize">
										{key}
									</label>
									<Input
										value={value || ""}
										onChange={(e) =>
											updateFooter({
												socialLinks: {
													...footer.socialLinks,
													[key]: e.target.value || null,
												},
											})
										}
										placeholder={`https://${key}.com/yourprofile`}
									/>
								</div>
							))}
						</div>
					</CardContent>
				</Card>
			)}
		</div>
	);
}

// ============ HOMEPAGE TAB ============
function HomepageTab({
	config,
	updateConfig,
}: {
	config: StoreConfig;
	updateConfig: <K extends keyof StoreConfig>(
		key: K,
		value: StoreConfig[K],
	) => void;
}) {
	const { homepage } = config;

	const updateSections = (sections: HomepageSection[]) => {
		updateConfig("homepage", { ...homepage, sections });
	};

	const toggleSection = (sectionId: string) => {
		const newSections = homepage.sections.map((s) =>
			s.id === sectionId ? { ...s, enabled: !s.enabled } : s,
		);
		updateSections(newSections);
	};

	const moveSection = (index: number, direction: "up" | "down") => {
		const newIndex = direction === "up" ? index - 1 : index + 1;
		if (newIndex < 0 || newIndex >= homepage.sections.length) return;

		const newSections = [...homepage.sections];
		const temp = newSections[index];
		const swapItem = newSections[newIndex];
		if (temp && swapItem) {
			newSections[index] = swapItem;
			newSections[newIndex] = temp;
		}
		updateSections(newSections);
	};

	const sectionLabels: Record<string, string> = {
		hero: "Hero Banner",
		categories: "Categories",
		featuredProducts: "Featured Products",
		promotionalBanner: "Promotional Banner",
		brands: "Brands",
		trustBadges: "Trust Badges",
		deals: "Deals & Offers",
		newArrivals: "New Arrivals",
		testimonials: "Testimonials",
		newsletter: "Newsletter",
		customHtml: "Custom HTML",
	};

	return (
		<div className="space-y-6">
			<Card>
				<CardHeader>
					<CardTitle>Homepage Sections</CardTitle>
					<CardDescription>
						Enable, disable, and reorder sections on your homepage. Drag to
						reorder.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="space-y-2">
						{homepage.sections.map((section, index) => (
							<div
								key={section.id}
								className={cn(
									"flex items-center gap-3 rounded-lg border p-3 transition-colors",
									section.enabled
										? "border-border bg-card"
										: "border-dashed border-muted bg-muted/30",
								)}
							>
								<div className="flex flex-col gap-1">
									<Button
										variant="ghost"
										size="sm"
										className="h-6 w-6 p-0"
										onClick={() => moveSection(index, "up")}
										disabled={index === 0}
									>
										<ChevronUp className="h-4 w-4" />
									</Button>
									<Button
										variant="ghost"
										size="sm"
										className="h-6 w-6 p-0"
										onClick={() => moveSection(index, "down")}
										disabled={index === homepage.sections.length - 1}
									>
										<ChevronDown className="h-4 w-4" />
									</Button>
								</div>

								<div className="flex-1">
									<p className="font-medium">
										{sectionLabels[section.type] || section.type}
									</p>
									<p className="text-xs text-muted-foreground">
										{section.type}
									</p>
								</div>

								<ToggleSwitch
									checked={section.enabled}
									onChange={() => toggleSection(section.id)}
								/>
							</div>
						))}
					</div>
				</CardContent>
			</Card>

			{/* Hero Configuration */}
			{homepage.sections.find((s) => s.type === "hero")?.enabled && (
				<HeroConfigEditor config={config} updateConfig={updateConfig} />
			)}
		</div>
	);
}

// ============ PRODUCTS TAB ============
function ProductsTab({
	config,
	updateConfig,
}: {
	config: StoreConfig;
	updateConfig: <K extends keyof StoreConfig>(
		key: K,
		value: StoreConfig[K],
	) => void;
}) {
	const { productCard, productListing, pointsDisplay } = config;

	const updateProductCard = (updates: Partial<typeof productCard>) => {
		updateConfig("productCard", { ...productCard, ...updates });
	};

	const updateProductListing = (updates: Partial<typeof productListing>) => {
		updateConfig("productListing", { ...productListing, ...updates });
	};

	const updatePointsDisplay = (updates: Partial<typeof pointsDisplay>) => {
		updateConfig("pointsDisplay", { ...pointsDisplay, ...updates });
	};

	return (
		<div className="grid gap-6 lg:grid-cols-2">
			<Card>
				<CardHeader>
					<CardTitle>Product Card</CardTitle>
					<CardDescription>
						Configure how products are displayed
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="grid gap-4 grid-cols-2">
						<ToggleRow
							label="Show Brand"
							checked={productCard.showBrand}
							onChange={(checked) => updateProductCard({ showBrand: checked })}
						/>
						<ToggleRow
							label="Show Rating"
							checked={productCard.showRating}
							onChange={(checked) => updateProductCard({ showRating: checked })}
						/>
						<ToggleRow
							label="Show Points Price"
							checked={productCard.showPointsPrice}
							onChange={(checked) =>
								updateProductCard({ showPointsPrice: checked })
							}
						/>
						<ToggleRow
							label="Show Currency Price"
							checked={productCard.showCurrencyPrice}
							onChange={(checked) =>
								updateProductCard({ showCurrencyPrice: checked })
							}
						/>
						<ToggleRow
							label="Show Badges"
							checked={productCard.showBadges}
							onChange={(checked) => updateProductCard({ showBadges: checked })}
						/>
						<ToggleRow
							label="Show Wishlist"
							checked={productCard.showWishlist}
							onChange={(checked) =>
								updateProductCard({ showWishlist: checked })
							}
						/>
					</div>
					<div>
						<label className="text-sm font-medium mb-1.5 block">
							Image Aspect Ratio
						</label>
						<Select
							value={productCard.imageAspectRatio}
							onValueChange={(value: any) =>
								updateProductCard({ imageAspectRatio: value })
							}
						>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="square">Square (1:1)</SelectItem>
								<SelectItem value="portrait">Portrait (3:4)</SelectItem>
								<SelectItem value="landscape">Landscape (4:3)</SelectItem>
							</SelectContent>
						</Select>
					</div>
					<div>
						<label className="text-sm font-medium mb-1.5 block">
							Hover Effect
						</label>
						<Select
							value={productCard.hoverEffect}
							onValueChange={(value: any) =>
								updateProductCard({ hoverEffect: value })
							}
						>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="none">None</SelectItem>
								<SelectItem value="zoom">Zoom</SelectItem>
								<SelectItem value="fade">Fade</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Product Listing</CardTitle>
					<CardDescription>Configure product listing pages</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div>
						<label className="text-sm font-medium mb-1.5 block">
							Default View
						</label>
						<Select
							value={productListing.defaultView}
							onValueChange={(value: any) =>
								updateProductListing({ defaultView: value })
							}
						>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="grid">Grid</SelectItem>
								<SelectItem value="list">List</SelectItem>
							</SelectContent>
						</Select>
					</div>
					<div>
						<label className="text-sm font-medium mb-1.5 block">
							Products Per Row
						</label>
						<Select
							value={productListing.productsPerRow.toString()}
							onValueChange={(value) =>
								updateProductListing({ productsPerRow: Number(value) as any })
							}
						>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="2">2 Products</SelectItem>
								<SelectItem value="3">3 Products</SelectItem>
								<SelectItem value="4">4 Products</SelectItem>
								<SelectItem value="5">5 Products</SelectItem>
							</SelectContent>
						</Select>
					</div>
					<div>
						<label className="text-sm font-medium mb-1.5 block">
							Products Per Page
						</label>
						<Select
							value={productListing.productsPerPage.toString()}
							onValueChange={(value) =>
								updateProductListing({ productsPerPage: Number(value) })
							}
						>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="8">8 Products</SelectItem>
								<SelectItem value="12">12 Products</SelectItem>
								<SelectItem value="16">16 Products</SelectItem>
								<SelectItem value="24">24 Products</SelectItem>
							</SelectContent>
						</Select>
					</div>
					<div>
						<label className="text-sm font-medium mb-1.5 block">
							Filter Position
						</label>
						<Select
							value={productListing.filterPosition}
							onValueChange={(value: any) =>
								updateProductListing({ filterPosition: value })
							}
						>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="left">Left Sidebar</SelectItem>
								<SelectItem value="top">Top Bar</SelectItem>
								<SelectItem value="drawer">Drawer</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</CardContent>
			</Card>

			<Card className="lg:col-span-2">
				<CardHeader>
					<CardTitle>Points Display</CardTitle>
					<CardDescription>
						Configure how points and prices are shown
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
						<div>
							<label className="text-sm font-medium mb-1.5 block">
								Points Label
							</label>
							<Input
								value={pointsDisplay.pointsLabel}
								onChange={(e) =>
									updatePointsDisplay({ pointsLabel: e.target.value })
								}
								placeholder="pts"
							/>
						</div>
						<div>
							<label className="text-sm font-medium mb-1.5 block">
								Primary Display
							</label>
							<Select
								value={pointsDisplay.primaryDisplay}
								onValueChange={(value: any) =>
									updatePointsDisplay({ primaryDisplay: value })
								}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="points">Points First</SelectItem>
									<SelectItem value="currency">Currency First</SelectItem>
									<SelectItem value="both">Both Equal</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<ToggleRow
							label="Show Points Prominently"
							description="Highlight points pricing"
							checked={pointsDisplay.showPointsProminent}
							onChange={(checked) =>
								updatePointsDisplay({ showPointsProminent: checked })
							}
						/>
						<ToggleRow
							label="Show Currency Equivalent"
							description="Show ₹ value alongside points"
							checked={pointsDisplay.showCurrencyEquivalent}
							onChange={(checked) =>
								updatePointsDisplay({ showCurrencyEquivalent: checked })
							}
						/>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}

// ============ FEATURES TAB ============
function FeaturesTab({
	config,
	updateConfig,
}: {
	config: StoreConfig;
	updateConfig: <K extends keyof StoreConfig>(
		key: K,
		value: StoreConfig[K],
	) => void;
}) {
	const { features } = config;

	const updateFeatures = (updates: Partial<typeof features>) => {
		updateConfig("features", { ...features, ...updates });
	};

	const featuresList = [
		{
			key: "wishlist",
			label: "Wishlist",
			description: "Allow customers to save products",
		},
		{
			key: "compare",
			label: "Compare Products",
			description: "Compare products side by side",
		},
		{
			key: "quickView",
			label: "Quick View",
			description: "Preview products without leaving the page",
		},
		{
			key: "socialSharing",
			label: "Social Sharing",
			description: "Share products on social media",
		},
		{
			key: "recentlyViewed",
			label: "Recently Viewed",
			description: "Show recently viewed products",
		},
		{
			key: "productReviews",
			label: "Product Reviews",
			description: "Display product reviews and ratings",
		},
		{
			key: "searchSuggestions",
			label: "Search Suggestions",
			description: "Show suggestions while typing",
		},
		{
			key: "recentSearches",
			label: "Recent Searches",
			description: "Save and show recent searches",
		},
	];

	return (
		<Card>
			<CardHeader>
				<CardTitle>Feature Toggles</CardTitle>
				<CardDescription>Enable or disable store features</CardDescription>
			</CardHeader>
			<CardContent>
				<div className="grid gap-4 sm:grid-cols-2">
					{featuresList.map(({ key, label, description }) => (
						<div
							key={key}
							className="flex items-center justify-between rounded-lg border border-border p-4"
						>
							<div>
								<p className="font-medium">{label}</p>
								<p className="text-xs text-muted-foreground">{description}</p>
							</div>
							<ToggleSwitch
								checked={features[key as keyof typeof features]}
								onChange={(checked) => updateFeatures({ [key]: checked })}
							/>
						</div>
					))}
				</div>
			</CardContent>
		</Card>
	);
}

// ============ HELPER COMPONENTS ============

// Color Picker Component
function ColorPicker({
	label,
	value,
	onChange,
}: {
	label: string;
	value: string;
	onChange: (value: string) => void;
}) {
	return (
		<div>
			<label className="text-sm font-medium mb-1.5 block">{label}</label>
			<div className="flex gap-2">
				<div
					className="h-10 w-10 rounded-md border border-border cursor-pointer"
					style={{ backgroundColor: value }}
				>
					<input
						type="color"
						value={value}
						onChange={(e) => onChange(e.target.value)}
						className="h-full w-full opacity-0 cursor-pointer"
					/>
				</div>
				<Input
					value={value}
					onChange={(e) => onChange(e.target.value)}
					placeholder="#000000"
					className="flex-1 font-mono text-sm"
				/>
			</div>
		</div>
	);
}

// Toggle Switch Component
function ToggleSwitch({
	checked,
	onChange,
}: {
	checked: boolean;
	onChange: (checked: boolean) => void;
}) {
	return (
		<button
			type="button"
			role="switch"
			aria-checked={checked}
			onClick={() => onChange(!checked)}
			className={cn(
				"relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
				checked ? "bg-primary" : "bg-muted",
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

// Toggle Row Component
function ToggleRow({
	label,
	description,
	checked,
	onChange,
}: {
	label: string;
	description?: string;
	checked: boolean;
	onChange: (checked: boolean) => void;
}) {
	return (
		<div className="flex items-center justify-between">
			<div>
				<p className="text-sm font-medium">{label}</p>
				{description && (
					<p className="text-xs text-muted-foreground">{description}</p>
				)}
			</div>
			<ToggleSwitch checked={checked} onChange={onChange} />
		</div>
	);
}

// Deep merge helper for generic objects
function deepMerge<T extends Record<string, unknown>>(
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

// Type-safe merge for StoreConfig
function mergeStoreConfig(
	target: StoreConfig,
	source: Partial<StoreConfig>,
): StoreConfig {
	return {
		theme: source.theme ? { ...target.theme, ...source.theme } : target.theme,
		branding: source.branding
			? { ...target.branding, ...source.branding }
			: target.branding,
		header: source.header
			? { ...target.header, ...source.header }
			: target.header,
		footer: source.footer
			? { ...target.footer, ...source.footer }
			: target.footer,
		homepage: source.homepage
			? { ...target.homepage, ...source.homepage }
			: target.homepage,
		productCard: source.productCard
			? { ...target.productCard, ...source.productCard }
			: target.productCard,
		productListing: source.productListing
			? { ...target.productListing, ...source.productListing }
			: target.productListing,
		pointsDisplay: source.pointsDisplay
			? { ...target.pointsDisplay, ...source.pointsDisplay }
			: target.pointsDisplay,
		components: source.components
			? { ...target.components, ...source.components }
			: target.components,
		features: source.features
			? { ...target.features, ...source.features }
			: target.features,
		seo: source.seo ? { ...target.seo, ...source.seo } : target.seo,
		analytics: source.analytics
			? { ...target.analytics, ...source.analytics }
			: target.analytics,
		customCss:
			source.customCss !== undefined ? source.customCss : target.customCss,
	};
}
