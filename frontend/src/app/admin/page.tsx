"use client";

import * as React from "react";
import Link from "next/link";
import { fetcher } from "@/lib/fetcher";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, StatCard } from "@/components/ui/card";
import { Badge, StatusBadge } from "@/components/ui/badge";
import {
	Table,
	TableHeader,
	TableBody,
	TableHead,
	TableRow,
	TableCell,
	TableEmpty,
} from "@/components/ui/table";
import {
	PageHeader,
	Container,
	PageWrapper,
} from "@/components/layout/page-header";
import {
	LayoutDashboard,
	ClipboardCheck,
	Store,
	Package,
	Users,
	TrendingUp,
	AlertCircle,
	CheckCircle2,
	Clock,
	ArrowRight,
	RefreshCw,
	Layers,
	Building2,
	Activity,
} from "lucide-react";
import useSWR from "swr";
import type {
	ApiProduct,
	ApiMerchant,
	ApiBrand,
	ApiCategory,
} from "@/lib/types";

// Stats interface
interface DashboardStats {
	pendingReviews: number;
	activeMerchants: number;
	totalProducts: number;
	liveProducts: number;
	totalBrands: number;
	totalCategories: number;
}

export default function AdminDashboardPage() {
	// Fetch data for dashboard
	const { data: pendingProducts, isLoading: loadingPending } = useSWR<
		ApiProduct[]
	>("/api/admin/review", fetcher);
	const { data: merchants, isLoading: loadingMerchants } = useSWR<
		ApiMerchant[]
	>("/api/merchants", fetcher);
	const { data: products, isLoading: loadingProducts } = useSWR<ApiProduct[]>(
		"/api/products?status=all",
		fetcher,
	);
	const { data: brands, isLoading: loadingBrands } = useSWR<ApiBrand[]>(
		"/api/brands",
		fetcher,
	);
	const { data: categories, isLoading: loadingCategories } = useSWR<
		ApiCategory[]
	>("/api/categories", fetcher);

	const isLoading =
		loadingPending ||
		loadingMerchants ||
		loadingProducts ||
		loadingBrands ||
		loadingCategories;

	// Calculate stats
	const stats: DashboardStats = {
		pendingReviews: pendingProducts?.length ?? 0,
		activeMerchants: merchants?.filter((m) => m.is_active)?.length ?? 0,
		totalProducts: products?.length ?? 0,
		liveProducts:
			products?.filter((p) => p.offer_status === "LIVE")?.length ?? 0,
		totalBrands: brands?.length ?? 0,
		totalCategories: categories?.length ?? 0,
	};

	// Recent pending items (top 5)
	const recentPending = pendingProducts?.slice(0, 5) ?? [];

	// Quick actions
	const quickActions = [
		{
			label: "Review Products",
			description: `${stats.pendingReviews} items pending`,
			href: "/admin/review",
			icon: ClipboardCheck,
			variant: stats.pendingReviews > 0 ? "warning" : "default",
		},
		{
			label: "Manage Merchants",
			description: `${stats.activeMerchants} active merchants`,
			href: "/admin/merchants",
			icon: Store,
			variant: "default",
		},
		{
			label: "Manage Brands",
			description: `${stats.totalBrands} brands`,
			href: "/admin/brands",
			icon: Layers,
			variant: "default",
		},
		{
			label: "Manage Partners",
			description: "Loyalty partners & rates",
			href: "/admin/partners",
			icon: Building2,
			variant: "default",
		},
		{
			label: "Store Configuration",
			description: "Customize store appearance",
			href: "/admin/store-config",
			icon: Activity,
			variant: "default",
		},
	];

	return (
		<PageWrapper>
			<Container>
				<PageHeader
					title="Admin Dashboard"
					description="Overview of your marketplace platform"
					icon={LayoutDashboard}
					actions={
						<Button
							variant="outline"
							size="sm"
							onClick={() => window.location.reload()}
							leftIcon={<RefreshCw className="h-4 w-4" />}
						>
							Refresh
						</Button>
					}
				/>

				{/* Stats Grid */}
				<div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
					<StatCard
						title="Pending Reviews"
						value={isLoading ? "..." : stats.pendingReviews}
						icon={<Clock className="h-5 w-5" />}
						description={
							stats.pendingReviews > 0 ? "Requires attention" : "All caught up!"
						}
					/>
					<StatCard
						title="Live Products"
						value={isLoading ? "..." : stats.liveProducts}
						icon={<CheckCircle2 className="h-5 w-5" />}
						description={`of ${stats.totalProducts} total`}
					/>
					<StatCard
						title="Active Merchants"
						value={isLoading ? "..." : stats.activeMerchants}
						icon={<Store className="h-5 w-5" />}
						description="Verified sellers"
					/>
					<StatCard
						title="Total Brands"
						value={isLoading ? "..." : stats.totalBrands}
						icon={<Layers className="h-5 w-5" />}
						description={`${stats.totalCategories} categories`}
					/>
				</div>

				{/* Main Content Grid */}
				<div className="mt-8 grid gap-6 lg:grid-cols-3">
					{/* Quick Actions */}
					<div className="lg:col-span-1">
						<Card padding="none">
							<div className="border-b border-border px-6 py-4">
								<h2 className="text-lg font-semibold text-foreground">
									Quick Actions
								</h2>
							</div>
							<div className="divide-y divide-border">
								{quickActions.map((action) => {
									const Icon = action.icon;
									return (
										<Link
											key={action.href}
											href={action.href}
											className="flex items-center gap-4 px-6 py-4 transition-colors hover:bg-muted/50"
										>
											<div
												className={cn(
													"flex h-10 w-10 items-center justify-center rounded-lg",
													action.variant === "warning"
														? "bg-warning/10 text-warning"
														: "bg-accent text-primary",
												)}
											>
												<Icon className="h-5 w-5" />
											</div>
											<div className="flex-1">
												<p className="text-sm font-medium text-foreground">
													{action.label}
												</p>
												<p className="text-xs text-muted-foreground">
													{action.description}
												</p>
											</div>
											<ArrowRight className="h-4 w-4 text-muted-foreground" />
										</Link>
									);
								})}
							</div>
						</Card>

						{/* Platform Health */}
						<Card className="mt-6" padding="default">
							<h2 className="mb-4 text-lg font-semibold text-foreground">
								Platform Health
							</h2>
							<div className="space-y-4">
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-2">
										<div className="h-2 w-2 rounded-full bg-success" />
										<span className="text-sm text-foreground">API Status</span>
									</div>
									<Badge variant="success" size="sm">
										Operational
									</Badge>
								</div>
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-2">
										<div className="h-2 w-2 rounded-full bg-success" />
										<span className="text-sm text-foreground">Database</span>
									</div>
									<Badge variant="success" size="sm">
										Connected
									</Badge>
								</div>
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-2">
										<div
											className={cn(
												"h-2 w-2 rounded-full",
												stats.pendingReviews > 10 ? "bg-warning" : "bg-success",
											)}
										/>
										<span className="text-sm text-foreground">
											Review Queue
										</span>
									</div>
									<Badge
										variant={stats.pendingReviews > 10 ? "warning" : "success"}
										size="sm"
									>
										{stats.pendingReviews > 10 ? "High" : "Normal"}
									</Badge>
								</div>
							</div>
						</Card>
					</div>

					{/* Pending Reviews Table */}
					<div className="lg:col-span-2">
						<Card padding="none">
							<div className="flex items-center justify-between border-b border-border px-6 py-4">
								<div>
									<h2 className="text-lg font-semibold text-foreground">
										Pending Reviews
									</h2>
									<p className="text-sm text-muted-foreground">
										Products awaiting approval
									</p>
								</div>
								<Button variant="outline" size="sm" asChild>
									<Link href="/admin/review">
										View All
										<ArrowRight className="ml-2 h-4 w-4" />
									</Link>
								</Button>
							</div>

							{isLoading ? (
								<div className="flex items-center justify-center py-12">
									<div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
								</div>
							) : recentPending.length === 0 ? (
								<div className="flex flex-col items-center justify-center py-12 text-center">
									<CheckCircle2 className="mb-4 h-12 w-12 text-success" />
									<h3 className="text-lg font-semibold text-foreground">
										All caught up!
									</h3>
									<p className="text-sm text-muted-foreground">
										No products pending review
									</p>
								</div>
							) : (
								<div className="overflow-x-auto">
									<Table>
										<TableHeader>
											<TableRow>
												<TableHead>Product</TableHead>
												<TableHead>Merchant</TableHead>
												<TableHead>Price</TableHead>
												<TableHead className="text-right">Action</TableHead>
											</TableRow>
										</TableHeader>
										<TableBody>
											{recentPending.map((product) => (
												<TableRow key={product.id}>
													<TableCell>
														<div className="flex items-center gap-3">
															<div className="h-10 w-10 overflow-hidden rounded-lg bg-muted">
																<img
																	src={product.image_url}
																	alt={product.title}
																	className="h-full w-full object-cover"
																/>
															</div>
															<div>
																<p className="text-sm font-medium text-foreground line-clamp-1">
																	{product.title}
																</p>
																<p className="text-xs text-muted-foreground">
																	{product.brand_name}
																</p>
															</div>
														</div>
													</TableCell>
													<TableCell className="text-sm text-muted-foreground">
														{product.merchant_name}
													</TableCell>
													<TableCell className="text-sm font-medium text-foreground">
														₹{product.base_price.toLocaleString()}
													</TableCell>
													<TableCell className="text-right">
														<Button variant="outline" size="sm" asChild>
															<Link href={`/admin/review?id=${product.id}`}>
																Review
															</Link>
														</Button>
													</TableCell>
												</TableRow>
											))}
										</TableBody>
									</Table>
								</div>
							)}
						</Card>

						{/* Recent Activity */}
						<Card className="mt-6" padding="default">
							<h2 className="mb-4 text-lg font-semibold text-foreground">
								Recent Activity
							</h2>
							<div className="space-y-4">
								{[
									{
										action: "Product approved",
										description: "Sony WH-1000XM5 Headphones",
										time: "2 hours ago",
										type: "success",
									},
									{
										action: "New merchant registered",
										description: "TechMart Electronics",
										time: "5 hours ago",
										type: "info",
									},
									{
										action: "Products synced",
										description: "Fashion Hub - 24 new items",
										time: "1 day ago",
										type: "info",
									},
									{
										action: "Product rejected",
										description: "Invalid pricing detected",
										time: "2 days ago",
										type: "warning",
									},
								].map((activity, index) => (
									<div key={index} className="flex items-start gap-3">
										<div
											className={cn(
												"mt-1 h-2 w-2 rounded-full",
												activity.type === "success" && "bg-success",
												activity.type === "warning" && "bg-warning",
												activity.type === "info" && "bg-primary",
											)}
										/>
										<div className="flex-1">
											<p className="text-sm font-medium text-foreground">
												{activity.action}
											</p>
											<p className="text-xs text-muted-foreground">
												{activity.description}
											</p>
										</div>
										<span className="text-xs text-muted-foreground">
											{activity.time}
										</span>
									</div>
								))}
							</div>
						</Card>
					</div>
				</div>
			</Container>
		</PageWrapper>
	);
}
