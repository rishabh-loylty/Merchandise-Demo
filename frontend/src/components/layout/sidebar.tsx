"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
import type { LucideIcon } from "lucide-react";

// Context for sidebar state
interface SidebarContextValue {
	isCollapsed: boolean;
	toggleCollapsed: () => void;
	isMobileOpen: boolean;
	setMobileOpen: (open: boolean) => void;
}

const SidebarContext = React.createContext<SidebarContextValue | undefined>(
	undefined,
);

export function useSidebar() {
	const context = React.useContext(SidebarContext);
	if (!context) {
		throw new Error("useSidebar must be used within a SidebarProvider");
	}
	return context;
}

// Provider
interface SidebarProviderProps {
	children: React.ReactNode;
	defaultCollapsed?: boolean;
}

export function SidebarProvider({
	children,
	defaultCollapsed = false,
}: SidebarProviderProps) {
	const [isCollapsed, setIsCollapsed] = React.useState(defaultCollapsed);
	const [isMobileOpen, setMobileOpen] = React.useState(false);

	const toggleCollapsed = React.useCallback(() => {
		setIsCollapsed((prev) => !prev);
	}, []);

	return (
		<SidebarContext.Provider
			value={{ isCollapsed, toggleCollapsed, isMobileOpen, setMobileOpen }}
		>
			{children}
		</SidebarContext.Provider>
	);
}

// Main Sidebar component
const sidebarVariants = cva(
	"fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-sidebar-border bg-sidebar-background transition-all duration-300",
	{
		variants: {
			variant: {
				default: "",
				floating: "m-3 h-[calc(100vh-1.5rem)] rounded-xl shadow-lg",
			},
		},
		defaultVariants: {
			variant: "default",
		},
	},
);

interface SidebarProps
	extends React.HTMLAttributes<HTMLDivElement>,
		VariantProps<typeof sidebarVariants> {
	collapsedWidth?: number;
	expandedWidth?: number;
}

export function Sidebar({
	className,
	variant,
	collapsedWidth = 64,
	expandedWidth = 256,
	children,
	...props
}: SidebarProps) {
	const { isCollapsed, isMobileOpen, setMobileOpen } = useSidebar();

	return (
		<>
			{/* Mobile overlay */}
			{isMobileOpen && (
				<div
					className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm lg:hidden"
					onClick={() => setMobileOpen(false)}
				/>
			)}

			{/* Sidebar */}
			<aside
				className={cn(
					sidebarVariants({ variant }),
					"lg:translate-x-0",
					isMobileOpen ? "translate-x-0" : "-translate-x-full",
					className,
				)}
				style={{
					width: isCollapsed ? collapsedWidth : expandedWidth,
				}}
				{...props}
			>
				{children}
			</aside>

			{/* Spacer for main content */}
			<div
				className="hidden shrink-0 lg:block transition-all duration-300"
				style={{
					width: isCollapsed ? collapsedWidth : expandedWidth,
				}}
			/>
		</>
	);
}

// Sidebar header
interface SidebarHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
	logo?: React.ReactNode;
	title?: string;
	subtitle?: string;
}

export function SidebarHeader({
	className,
	logo,
	title,
	subtitle,
	children,
	...props
}: SidebarHeaderProps) {
	const { isCollapsed } = useSidebar();

	return (
		<div
			className={cn(
				"flex h-16 shrink-0 items-center border-b border-sidebar-border px-4",
				className,
			)}
			{...props}
		>
			{children || (
				<div className="flex items-center gap-3 overflow-hidden">
					{logo && (
						<div className="flex h-8 w-8 shrink-0 items-center justify-center">
							{logo}
						</div>
					)}
					{!isCollapsed && (
						<div className="flex flex-col overflow-hidden">
							{title && (
								<span className="truncate text-sm font-semibold text-sidebar-foreground">
									{title}
								</span>
							)}
							{subtitle && (
								<span className="truncate text-xs text-sidebar-foreground/60">
									{subtitle}
								</span>
							)}
						</div>
					)}
				</div>
			)}
		</div>
	);
}

// Sidebar content (scrollable area)
export function SidebarContent({
	className,
	children,
	...props
}: React.HTMLAttributes<HTMLDivElement>) {
	return (
		<div
			className={cn("flex-1 overflow-y-auto overflow-x-hidden py-4", className)}
			{...props}
		>
			{children}
		</div>
	);
}

// Sidebar footer
export function SidebarFooter({
	className,
	children,
	...props
}: React.HTMLAttributes<HTMLDivElement>) {
	return (
		<div
			className={cn("shrink-0 border-t border-sidebar-border p-4", className)}
			{...props}
		>
			{children}
		</div>
	);
}

// Sidebar section/group
interface SidebarGroupProps extends React.HTMLAttributes<HTMLDivElement> {
	title?: string;
}

export function SidebarGroup({
	className,
	title,
	children,
	...props
}: SidebarGroupProps) {
	const { isCollapsed } = useSidebar();

	return (
		<div className={cn("px-3 py-2", className)} {...props}>
			{title && !isCollapsed && (
				<h4 className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/50">
					{title}
				</h4>
			)}
			{title && isCollapsed && (
				<div className="mb-2 mx-auto h-px w-6 bg-sidebar-border" />
			)}
			<div className="space-y-1">{children}</div>
		</div>
	);
}

// Sidebar nav item
interface SidebarItemProps extends React.HTMLAttributes<HTMLElement> {
	href?: string;
	icon?: LucideIcon;
	isActive?: boolean;
	badge?: string | number;
	disabled?: boolean;
	external?: boolean;
}

export function SidebarItem({
	className,
	href,
	icon: Icon,
	isActive,
	badge,
	disabled,
	external,
	children,
	onClick,
	...props
}: SidebarItemProps) {
	const { isCollapsed, setMobileOpen } = useSidebar();
	const pathname = usePathname();

	const active = isActive ?? (href && pathname === href);

	const handleClick = (e: React.MouseEvent<HTMLElement>) => {
		if (disabled) {
			e.preventDefault();
			return;
		}
		setMobileOpen(false);
		onClick?.(e);
	};

	const content = (
		<>
			{Icon && (
				<Icon
					className={cn(
						"h-5 w-5 shrink-0 transition-colors",
						active
							? "text-sidebar-primary"
							: "text-sidebar-foreground/70 group-hover:text-sidebar-foreground",
					)}
				/>
			)}
			{!isCollapsed && (
				<>
					<span className="flex-1 truncate">{children}</span>
					{badge !== undefined && (
						<span
							className={cn(
								"ml-auto flex h-5 min-w-[1.25rem] items-center justify-center rounded-full px-1.5 text-xs font-medium",
								active
									? "bg-sidebar-primary/20 text-sidebar-primary"
									: "bg-sidebar-accent text-sidebar-accent-foreground",
							)}
						>
							{badge}
						</span>
					)}
				</>
			)}
		</>
	);

	const itemClasses = cn(
		"group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
		active
			? "bg-sidebar-accent text-sidebar-accent-foreground"
			: "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
		disabled && "pointer-events-none opacity-50",
		isCollapsed && "justify-center px-0",
		className,
	);

	if (href) {
		return (
			<Link
				href={href}
				className={itemClasses}
				onClick={handleClick}
				target={external ? "_blank" : undefined}
				rel={external ? "noopener noreferrer" : undefined}
				{...(props as React.AnchorHTMLAttributes<HTMLAnchorElement>)}
			>
				{content}
			</Link>
		);
	}

	return (
		<button
			type="button"
			className={itemClasses}
			onClick={handleClick}
			disabled={disabled}
			{...(props as React.ButtonHTMLAttributes<HTMLButtonElement>)}
		>
			{content}
		</button>
	);
}

// Collapsible sidebar item with submenu
interface SidebarSubmenuProps extends React.HTMLAttributes<HTMLDivElement> {
	icon?: LucideIcon;
	title: string;
	defaultOpen?: boolean;
	badge?: string | number;
}

export function SidebarSubmenu({
	className,
	icon: Icon,
	title,
	defaultOpen = false,
	badge,
	children,
	...props
}: SidebarSubmenuProps) {
	const { isCollapsed } = useSidebar();
	const [isOpen, setIsOpen] = React.useState(defaultOpen);
	const pathname = usePathname();

	// Check if any child is active
	const childrenArray = React.Children.toArray(children);
	const hasActiveChild = childrenArray.some((child) => {
		if (React.isValidElement<{ href?: string }>(child) && child.props.href) {
			return pathname === child.props.href;
		}
		return false;
	});

	React.useEffect(() => {
		if (hasActiveChild) {
			setIsOpen(true);
		}
	}, [hasActiveChild]);

	if (isCollapsed) {
		return (
			<div className={cn("relative group", className)} {...props}>
				<button
					type="button"
					className={cn(
						"flex w-full items-center justify-center rounded-lg px-0 py-2.5 text-sm font-medium transition-all",
						hasActiveChild
							? "bg-sidebar-accent text-sidebar-accent-foreground"
							: "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
					)}
				>
					{Icon && <Icon className="h-5 w-5" />}
				</button>
				{/* Tooltip/flyout for collapsed state */}
				<div className="invisible absolute left-full top-0 z-50 ml-2 min-w-[12rem] rounded-lg border border-sidebar-border bg-sidebar-background p-1 opacity-0 shadow-lg transition-all group-hover:visible group-hover:opacity-100">
					<div className="px-3 py-2 text-xs font-semibold text-sidebar-foreground/50">
						{title}
					</div>
					{children}
				</div>
			</div>
		);
	}

	return (
		<div className={className} {...props}>
			<button
				type="button"
				onClick={() => setIsOpen(!isOpen)}
				className={cn(
					"group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
					hasActiveChild
						? "text-sidebar-foreground"
						: "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
				)}
			>
				{Icon && (
					<Icon
						className={cn(
							"h-5 w-5 shrink-0 transition-colors",
							hasActiveChild
								? "text-sidebar-primary"
								: "text-sidebar-foreground/70 group-hover:text-sidebar-foreground",
						)}
					/>
				)}
				<span className="flex-1 truncate text-left">{title}</span>
				{badge !== undefined && (
					<span className="flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-sidebar-accent px-1.5 text-xs font-medium text-sidebar-accent-foreground">
						{badge}
					</span>
				)}
				<ChevronDown
					className={cn(
						"h-4 w-4 shrink-0 text-sidebar-foreground/50 transition-transform",
						isOpen && "rotate-180",
					)}
				/>
			</button>
			{isOpen && <div className="mt-1 space-y-1 pl-10">{children}</div>}
		</div>
	);
}

// Collapse toggle button
export function SidebarCollapseButton({
	className,
	...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
	const { isCollapsed, toggleCollapsed } = useSidebar();

	return (
		<button
			type="button"
			onClick={toggleCollapsed}
			className={cn(
				"hidden lg:flex h-8 w-8 items-center justify-center rounded-lg border border-sidebar-border bg-sidebar-background text-sidebar-foreground/70 transition-all hover:bg-sidebar-accent hover:text-sidebar-foreground",
				className,
			)}
			aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
			{...props}
		>
			{isCollapsed ? (
				<ChevronRight className="h-4 w-4" />
			) : (
				<ChevronLeft className="h-4 w-4" />
			)}
		</button>
	);
}

// Mobile menu trigger
export function SidebarMobileTrigger({
	className,
	...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
	const { setMobileOpen } = useSidebar();

	return (
		<button
			type="button"
			onClick={() => setMobileOpen(true)}
			className={cn(
				"flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-background text-foreground transition-colors hover:bg-muted lg:hidden",
				className,
			)}
			aria-label="Open menu"
			{...props}
		>
			<svg
				className="h-5 w-5"
				fill="none"
				stroke="currentColor"
				viewBox="0 0 24 24"
			>
				<path
					strokeLinecap="round"
					strokeLinejoin="round"
					strokeWidth={2}
					d="M4 6h16M4 12h16M4 18h16"
				/>
			</svg>
		</button>
	);
}
