"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

// Breadcrumb types
interface BreadcrumbItem {
	label: string;
	href?: string;
	icon?: LucideIcon;
}

// Page header props
interface PageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
	title: string;
	description?: string;
	icon?: LucideIcon;
	breadcrumbs?: BreadcrumbItem[];
	actions?: React.ReactNode;
	badge?: React.ReactNode;
	backHref?: string;
	backLabel?: string;
	variant?: "default" | "compact" | "hero";
}

export function PageHeader({
	className,
	title,
	description,
	icon: Icon,
	breadcrumbs,
	actions,
	badge,
	backHref,
	backLabel = "Back",
	variant = "default",
	children,
	...props
}: PageHeaderProps) {
	return (
		<div
			className={cn(
				"flex flex-col gap-4",
				variant === "hero" && "pb-6 border-b border-border mb-6",
				variant === "compact" && "gap-2",
				className,
			)}
			{...props}
		>
			{/* Breadcrumbs */}
			{breadcrumbs && breadcrumbs.length > 0 && (
				<Breadcrumbs items={breadcrumbs} />
			)}

			{/* Back link */}
			{backHref && (
				<Link
					href={backHref}
					className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit"
				>
					<ChevronRight className="h-4 w-4 rotate-180" />
					{backLabel}
				</Link>
			)}

			{/* Main header content */}
			<div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
				<div className="flex items-start gap-4">
					{/* Icon */}
					{Icon && (
						<div
							className={cn(
								"flex items-center justify-center rounded-xl bg-accent text-primary shrink-0",
								variant === "compact" ? "h-10 w-10" : "h-12 w-12",
							)}
						>
							<Icon
								className={cn(variant === "compact" ? "h-5 w-5" : "h-6 w-6")}
							/>
						</div>
					)}

					{/* Title and description */}
					<div className="flex flex-col gap-1">
						<div className="flex items-center gap-3">
							<h1
								className={cn(
									"font-bold tracking-tight text-foreground",
									variant === "hero" && "text-3xl",
									variant === "default" && "text-2xl",
									variant === "compact" && "text-xl",
								)}
							>
								{title}
							</h1>
							{badge}
						</div>
						{description && (
							<p
								className={cn(
									"text-muted-foreground max-w-2xl",
									variant === "compact" ? "text-sm" : "text-base",
								)}
							>
								{description}
							</p>
						)}
					</div>
				</div>

				{/* Actions */}
				{actions && (
					<div className="flex items-center gap-2 shrink-0">{actions}</div>
				)}
			</div>

			{/* Additional content */}
			{children}
		</div>
	);
}

// Breadcrumbs component
interface BreadcrumbsProps {
	items: BreadcrumbItem[];
	className?: string;
	separator?: React.ReactNode;
}

export function Breadcrumbs({
	items,
	className,
	separator = <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50" />,
}: BreadcrumbsProps) {
	return (
		<nav aria-label="Breadcrumb" className={cn("flex items-center", className)}>
			<ol className="flex items-center gap-1.5 text-sm">
				{items.map((item, index) => {
					const isLast = index === items.length - 1;
					const Icon = item.icon;

					return (
						<li key={index} className="flex items-center gap-1.5">
							{index > 0 && <span className="mx-1">{separator}</span>}
							{isLast ? (
								<span className="flex items-center gap-1.5 font-medium text-foreground">
									{Icon && <Icon className="h-3.5 w-3.5" />}
									{item.label}
								</span>
							) : item.href ? (
								<Link
									href={item.href}
									className="flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground"
								>
									{Icon && <Icon className="h-3.5 w-3.5" />}
									{item.label}
								</Link>
							) : (
								<span className="flex items-center gap-1.5 text-muted-foreground">
									{Icon && <Icon className="h-3.5 w-3.5" />}
									{item.label}
								</span>
							)}
						</li>
					);
				})}
			</ol>
		</nav>
	);
}

// Page section component for consistent sectioning
interface PageSectionProps extends React.HTMLAttributes<HTMLDivElement> {
	title?: string;
	description?: string;
	actions?: React.ReactNode;
	noPadding?: boolean;
}

export function PageSection({
	className,
	title,
	description,
	actions,
	noPadding,
	children,
	...props
}: PageSectionProps) {
	return (
		<section
			className={cn(
				"rounded-xl border border-border bg-card",
				!noPadding && "p-6",
				className,
			)}
			{...props}
		>
			{(title || description || actions) && (
				<div
					className={cn(
						"flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between",
						noPadding && "px-6 pt-6",
						children && "mb-4",
					)}
				>
					<div>
						{title && (
							<h2 className="text-lg font-semibold text-foreground">{title}</h2>
						)}
						{description && (
							<p className="text-sm text-muted-foreground">{description}</p>
						)}
					</div>
					{actions && (
						<div className="flex items-center gap-2 mt-2 sm:mt-0">
							{actions}
						</div>
					)}
				</div>
			)}
			{children}
		</section>
	);
}

// Container component for consistent max-width
interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
	size?: "sm" | "md" | "lg" | "xl" | "full";
}

export function Container({
	className,
	size = "xl",
	children,
	...props
}: ContainerProps) {
	const sizeClasses = {
		sm: "max-w-2xl",
		md: "max-w-4xl",
		lg: "max-w-6xl",
		xl: "max-w-7xl",
		full: "max-w-full",
	};

	return (
		<div
			className={cn(
				"mx-auto w-full px-4 sm:px-6 lg:px-8",
				sizeClasses[size],
				className,
			)}
			{...props}
		>
			{children}
		</div>
	);
}

// Page wrapper with consistent padding
interface PageWrapperProps extends React.HTMLAttributes<HTMLDivElement> {
	noPadding?: boolean;
}

export function PageWrapper({
	className,
	noPadding,
	children,
	...props
}: PageWrapperProps) {
	return (
		<div
			className={cn(
				"min-h-[calc(100vh-4rem)]",
				!noPadding && "py-6 lg:py-8",
				className,
			)}
			{...props}
		>
			{children}
		</div>
	);
}
