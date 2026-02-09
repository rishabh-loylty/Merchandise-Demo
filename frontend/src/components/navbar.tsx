"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { useGlobal, type PartnerBank } from "@/context/global-context";
import { useBranding, useStoreConfig } from "@/context/store-config-context";
import { fetcher } from "@/lib/fetcher";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, UserAvatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
	DropdownMenu,
	DropdownMenuTrigger,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
	ChevronDown,
	CreditCard,
	LogOut,
	Search,
	Shield,
	Store,
	User,
	ShoppingBag,
	Menu,
	X,
	Home,
	Package,
	Settings,
	LayoutDashboard,
	ClipboardCheck,
	ListChecks,
	Users,
	Layers,
	Percent,
	Building2,
	Paintbrush,
} from "lucide-react";
import useSWR from "swr";

export function Navbar() {
	const {
		currentRole,
		selectedBank,
		merchantSession,
		setRole,
		setSelectedBank,
		setMerchantSession,
	} = useGlobal();
	const router = useRouter();

	// Fetch partners (banks) from API
	const { data: partners } = useSWR<PartnerBank[]>("/api/partners", fetcher);

	// Auto-select first bank when data loads
	React.useEffect(() => {
		if (partners && partners.length > 0 && !selectedBank) {
			setSelectedBank(partners[0]!);
		}
	}, [partners, selectedBank, setSelectedBank]);

	if (currentRole === "CUSTOMER") {
		return (
			<CustomerNavbar
				banks={partners ?? []}
				selectedBank={selectedBank}
				onBankChange={setSelectedBank}
				onLoginMerchant={() => {
					setRole("MERCHANT");
					router.push("/merchant");
				}}
				onLoginAdmin={() => {
					setRole("ADMIN");
					router.push("/admin");
				}}
			/>
		);
	}

	if (currentRole === "MERCHANT") {
		return (
			<MerchantNavbar
				merchantName={merchantSession?.name}
				merchantEmail={merchantSession?.email}
				onExit={() => {
					setRole("CUSTOMER");
					setMerchantSession(null);
					router.push("/store");
				}}
			/>
		);
	}

	return (
		<AdminNavbar
			onExit={() => {
				setRole("CUSTOMER");
				router.push("/store");
			}}
		/>
	);
}

// Customer Navbar
function CustomerNavbar({
	banks,
	selectedBank,
	onBankChange,
	onLoginMerchant,
	onLoginAdmin,
}: {
	banks: PartnerBank[];
	selectedBank: PartnerBank | null;
	onBankChange: (bank: PartnerBank) => void;
	onLoginMerchant: () => void;
	onLoginAdmin: () => void;
}) {
	const [searchQuery, setSearchQuery] = React.useState("");
	const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
	const router = useRouter();
	const branding = useBranding();
	const { config } = useStoreConfig();

	const handleSearch = (e: React.FormEvent) => {
		e.preventDefault();
		if (searchQuery.trim()) {
			router.push(`/store/search?q=${encodeURIComponent(searchQuery.trim())}`);
			setSearchQuery("");
		}
	};

	return (
		<header
			className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
			style={{
				backgroundColor: config.header.backgroundColor || undefined,
			}}
		>
			<div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
				{/* Logo */}
				<Link
					href="/store"
					className="flex items-center gap-2 text-xl font-bold tracking-tight text-foreground transition-colors hover:text-primary"
				>
					{branding.logo ? (
						<Image
							src={branding.logo}
							alt={branding.storeName}
							width={32}
							height={32}
							className="h-8 w-auto object-contain"
						/>
					) : (
						<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
							<ShoppingBag className="h-5 w-5 text-primary-foreground" />
						</div>
					)}
					<span className="hidden sm:inline">{branding.storeName}</span>
				</Link>

				{/* Search Bar - Desktop */}
				<form
					onSubmit={handleSearch}
					className="hidden flex-1 max-w-xl md:flex"
				>
					<div className="relative w-full">
						<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
						<Input
							type="search"
							placeholder="Search products, brands, categories..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="w-full pl-10 pr-4"
							variant="ghost"
						/>
					</div>
				</form>

				{/* Right Section */}
				<div className="flex items-center gap-2">
					{/* Bank Selector */}
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button
								variant="outline"
								size="sm"
								className="hidden sm:flex gap-2"
							>
								<CreditCard className="h-4 w-4 text-primary" />
								<span className="max-w-[100px] truncate">
									{selectedBank?.name ?? "Select Bank"}
								</span>
								<ChevronDown className="h-3 w-3 opacity-50" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end" className="w-64">
							<DropdownMenuLabel>Select Your Bank</DropdownMenuLabel>
							<DropdownMenuSeparator />
							{banks.map((bank) => (
								<DropdownMenuItem
									key={bank.id}
									onClick={() => onBankChange(bank)}
									className="flex items-center justify-between"
								>
									<span
										className={cn(
											selectedBank?.id === bank.id &&
												"font-medium text-primary",
										)}
									>
										{bank.name}
									</span>
									<span className="text-xs text-muted-foreground">
										1 pt = ₹{bank.points_to_currency_rate}
									</span>
								</DropdownMenuItem>
							))}
						</DropdownMenuContent>
					</DropdownMenu>

					{/* User Menu */}
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="ghost" size="icon" className="relative">
								<Avatar size="sm" fallback="U" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end" className="w-56">
							<DropdownMenuLabel>My Account</DropdownMenuLabel>
							<DropdownMenuSeparator />
							<DropdownMenuItem onClick={onLoginMerchant}>
								<Store className="mr-2 h-4 w-4" />
								Merchant Portal
							</DropdownMenuItem>
							<DropdownMenuItem onClick={onLoginAdmin}>
								<Shield className="mr-2 h-4 w-4" />
								Admin Console
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>

					{/* Mobile Menu Toggle */}
					<Button
						variant="ghost"
						size="icon"
						className="md:hidden"
						onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
					>
						{mobileMenuOpen ? (
							<X className="h-5 w-5" />
						) : (
							<Menu className="h-5 w-5" />
						)}
					</Button>
				</div>
			</div>

			{/* Mobile Search */}
			<div className="border-t border-border px-4 py-2 md:hidden">
				<form onSubmit={handleSearch}>
					<div className="relative">
						<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
						<Input
							type="search"
							placeholder="Search products..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="w-full pl-10"
							inputSize="sm"
						/>
					</div>
				</form>
			</div>

			{/* Mobile Menu */}
			{mobileMenuOpen && (
				<div className="border-t border-border bg-background px-4 py-4 md:hidden">
					<div className="flex flex-col gap-2">
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button variant="outline" className="w-full justify-between">
									<div className="flex items-center gap-2">
										<CreditCard className="h-4 w-4 text-primary" />
										{selectedBank?.name ?? "Select Bank"}
									</div>
									<ChevronDown className="h-4 w-4 opacity-50" />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent className="w-[calc(100vw-2rem)]">
								{banks.map((bank) => (
									<DropdownMenuItem
										key={bank.id}
										onClick={() => onBankChange(bank)}
										className="flex items-center justify-between"
									>
										<span>{bank.name}</span>
										<span className="text-xs text-muted-foreground">
											1 pt = ₹{bank.points_to_currency_rate}
										</span>
									</DropdownMenuItem>
								))}
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
				</div>
			)}
		</header>
	);
}

// Merchant Navbar
function MerchantNavbar({
	merchantName,
	merchantEmail,
	onExit,
}: {
	merchantName?: string;
	merchantEmail?: string;
	onExit: () => void;
}) {
	const pathname = usePathname();

	const navItems = [
		{ href: "/merchant/dashboard", label: "Dashboard", icon: LayoutDashboard },
		{ href: "/merchant/products", label: "Products", icon: Package },
	];

	return (
		<header className="sticky top-0 z-50 w-full border-b border-border bg-slate-900">
			<div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
				{/* Logo & Title */}
				<div className="flex items-center gap-4">
					<div className="flex items-center gap-2">
						<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
							<Store className="h-5 w-5 text-primary-foreground" />
						</div>
						<div className="hidden sm:block">
							<p className="text-sm font-semibold text-white">
								Merchant Portal
							</p>
							<p className="text-xs text-slate-400">{merchantName}</p>
						</div>
					</div>

					{/* Navigation */}
					<nav className="hidden md:flex items-center gap-1 ml-8">
						{navItems.map((item) => {
							const Icon = item.icon;
							const isActive = pathname === item.href;
							return (
								<Link
									key={item.href}
									href={item.href}
									className={cn(
										"flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
										isActive
											? "bg-white/10 text-white"
											: "text-slate-300 hover:bg-white/5 hover:text-white",
									)}
								>
									<Icon className="h-4 w-4" />
									{item.label}
								</Link>
							);
						})}
					</nav>
				</div>

				{/* Right Section */}
				<div className="flex items-center gap-3">
					<Button
						variant="outline"
						size="sm"
						onClick={onExit}
						className="border-slate-600 bg-transparent text-white hover:bg-white/10"
					>
						<LogOut className="mr-2 h-4 w-4" />
						<span className="hidden sm:inline">Exit to Store</span>
					</Button>
				</div>
			</div>
		</header>
	);
}

// Admin Navbar
function AdminNavbar({ onExit }: { onExit: () => void }) {
	const pathname = usePathname();

	const navItems = [
		{ href: "/admin", label: "Overview", icon: LayoutDashboard },
		{ href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
		{ href: "/admin/queue", label: "Queue", icon: ListChecks },
		{ href: "/admin/review", label: "Review", icon: ClipboardCheck },
		{ href: "/admin/catalog", label: "Catalog", icon: Package },
		{ href: "/admin/merchants", label: "Merchants", icon: Store },
		{ href: "/admin/brands", label: "Brands", icon: Layers },
		{ href: "/admin/categories", label: "Categories", icon: Package },
		{ href: "/admin/partners", label: "Partners", icon: Building2 },
		{ href: "/admin/margins", label: "Margins", icon: Percent },
		{ href: "/admin/store-config", label: "Store Config", icon: Paintbrush },
	];

	return (
		<header className="sticky top-0 z-50 w-full border-b border-border bg-slate-900">
			<div className="mx-auto flex h-16 max-w-full items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
				{/* Logo & Title */}
				<div className="flex items-center gap-4">
					<div className="flex items-center gap-2">
						<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
							<Shield className="h-5 w-5 text-primary-foreground" />
						</div>
						<div className="hidden sm:block">
							<p className="text-sm font-semibold text-white">Admin Console</p>
							<p className="text-xs text-slate-400">Rewardify Platform</p>
						</div>
					</div>

					{/* Navigation */}
					<nav className="hidden lg:flex items-center gap-1 ml-8">
						{navItems.map((item) => {
							const Icon = item.icon;
							const isActive =
								pathname === item.href ||
								(item.href !== "/admin" && pathname.startsWith(item.href));
							return (
								<Link
									key={item.href}
									href={item.href}
									className={cn(
										"flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
										isActive
											? "bg-white/10 text-white"
											: "text-slate-300 hover:bg-white/5 hover:text-white",
									)}
								>
									<Icon className="h-4 w-4" />
									{item.label}
								</Link>
							);
						})}
					</nav>
				</div>

				{/* Mobile Navigation */}
				<div className="lg:hidden">
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="ghost" size="icon" className="text-white">
								<Menu className="h-5 w-5" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end" className="w-56">
							{navItems.map((item) => {
								const Icon = item.icon;
								return (
									<DropdownMenuItem key={item.href} asChild>
										<Link href={item.href} className="flex items-center gap-2">
											<Icon className="h-4 w-4" />
											{item.label}
										</Link>
									</DropdownMenuItem>
								);
							})}
							<DropdownMenuSeparator />
							<DropdownMenuItem onClick={onExit} className="text-destructive">
								<LogOut className="mr-2 h-4 w-4" />
								Exit to Store
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>

				{/* Right Section */}
				<div className="hidden lg:flex items-center gap-3">
					<Button
						variant="outline"
						size="sm"
						onClick={onExit}
						className="border-slate-600 bg-transparent text-white hover:bg-white/10"
					>
						<LogOut className="mr-2 h-4 w-4" />
						Exit to Store
					</Button>
				</div>
			</div>
		</header>
	);
}
