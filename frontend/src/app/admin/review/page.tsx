"use client";

import * as React from "react";
import Image from "next/image";
import { fetcher } from "@/lib/fetcher";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge, StatusBadge } from "@/components/ui/badge";
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
import {
	Table,
	TableHeader,
	TableBody,
	TableHead,
	TableRow,
	TableCell,
	TableEmpty,
	TablePagination,
} from "@/components/ui/table";
import { SimpleTabs } from "@/components/ui/tabs";
import {
	PageHeader,
	Container,
	PageWrapper,
} from "@/components/layout/page-header";
import { toast } from "@/components/providers";
import {
	ClipboardCheck,
	Search,
	Check,
	X,
	ChevronDown,
	Eye,
	AlertTriangle,
	CheckCircle2,
	XCircle,
	Filter,
	RefreshCw,
	ArrowRight,
	Package,
	Store,
	Tag,
	Layers,
} from "lucide-react";
import useSWR from "swr";
import type { ApiProduct, ApiBrand, ApiCategory } from "@/lib/types";

// Rejection reason presets
const REJECTION_REASONS = [
	{ value: "pricing", label: "Invalid or unrealistic pricing" },
	{ value: "images", label: "Poor quality or inappropriate images" },
	{ value: "description", label: "Incomplete or misleading description" },
	{ value: "category", label: "Incorrect category assignment" },
	{ value: "brand", label: "Brand verification failed" },
	{ value: "duplicate", label: "Duplicate product listing" },
	{ value: "prohibited", label: "Prohibited item category" },
	{ value: "quality", label: "Product quality concerns" },
	{ value: "other", label: "Other (specify below)" },
];

export default function AdminReviewPage() {
	const {
		data: pendingProducts,
		isLoading,
		mutate,
	} = useSWR<ApiProduct[]>("/api/admin/review", fetcher);
	const { data: brands } = useSWR<ApiBrand[]>("/api/brands", fetcher);
	const { data: categories } = useSWR<ApiCategory[]>(
		"/api/categories",
		fetcher,
	);

	const [selectedProduct, setSelectedProduct] =
		React.useState<ApiProduct | null>(null);
	const [reviewModalOpen, setReviewModalOpen] = React.useState(false);
	const [rejectModalOpen, setRejectModalOpen] = React.useState(false);
	const [searchQuery, setSearchQuery] = React.useState("");
	const [filterMerchant, setFilterMerchant] = React.useState<string>("all");

	// Get unique merchants from products
	const merchants = React.useMemo(() => {
		if (!pendingProducts) return [];
		const uniqueMerchants = new Map<number, string>();
		pendingProducts.forEach((p) => {
			if (p.merchant_id && p.merchant_name) {
				uniqueMerchants.set(p.merchant_id, p.merchant_name);
			}
		});
		return Array.from(uniqueMerchants.entries()).map(([id, name]) => ({
			id,
			name,
		}));
	}, [pendingProducts]);

	// Filter products
	const filteredProducts = React.useMemo(() => {
		if (!pendingProducts) return [];
		return pendingProducts.filter((p) => {
			const matchesSearch =
				!searchQuery ||
				p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
				p.brand_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
				p.merchant_name?.toLowerCase().includes(searchQuery.toLowerCase());
			const matchesMerchant =
				filterMerchant === "all" || String(p.merchant_id) === filterMerchant;
			return matchesSearch && matchesMerchant;
		});
	}, [pendingProducts, searchQuery, filterMerchant]);

	const handleOpenReview = (product: ApiProduct) => {
		setSelectedProduct(product);
		setReviewModalOpen(true);
	};

	const handleOpenReject = (product: ApiProduct) => {
		setSelectedProduct(product);
		setRejectModalOpen(true);
	};

	const handleApproveSuccess = () => {
		setReviewModalOpen(false);
		setSelectedProduct(null);
		mutate();
		toast.success("Product approved successfully", {
			description: "The product is now live on the marketplace.",
		});
	};

	const handleRejectSuccess = () => {
		setRejectModalOpen(false);
		setSelectedProduct(null);
		mutate();
		toast.success("Product rejected", {
			description: "The merchant has been notified with the rejection reason.",
		});
	};

	const handleQuickApprove = async (product: ApiProduct) => {
		try {
			const res = await fetch(`/api/admin/review/${product.id}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ action: "approve" }),
			});
			if (!res.ok) throw new Error("Failed to approve");
			mutate();
			toast.success("Product approved", {
				description: product.title,
			});
		} catch {
			toast.error("Failed to approve product");
		}
	};

	return (
		<PageWrapper>
			<Container>
				<PageHeader
					title="Product Review"
					description="Review and approve products before they go live on the marketplace"
					icon={ClipboardCheck}
					badge={
						pendingProducts && pendingProducts.length > 0 ? (
							<Badge variant="warning" size="lg">
								{pendingProducts.length} Pending
							</Badge>
						) : null
					}
					actions={
						<Button
							variant="outline"
							size="sm"
							onClick={() => mutate()}
							leftIcon={<RefreshCw className="h-4 w-4" />}
						>
							Refresh
						</Button>
					}
				/>

				{/* Filters */}
				<Card className="mt-6" padding="sm">
					<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
						<div className="flex flex-1 items-center gap-3">
							<div className="relative flex-1 max-w-md">
								<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
								<Input
									placeholder="Search products, brands, merchants..."
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
									className="pl-10"
									inputSize="sm"
								/>
							</div>
							<Select value={filterMerchant} onValueChange={setFilterMerchant}>
								<SelectTrigger className="w-[180px]" size="sm">
									<SelectValue placeholder="All Merchants" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">All Merchants</SelectItem>
									{merchants.map((m) => (
										<SelectItem key={m.id} value={String(m.id)}>
											{m.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div className="text-sm text-muted-foreground">
							{filteredProducts.length} of {pendingProducts?.length ?? 0} items
						</div>
					</div>
				</Card>

				{/* Review Table */}
				<Card className="mt-6" padding="none">
					{isLoading ? (
						<div className="flex items-center justify-center py-20">
							<div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
						</div>
					) : filteredProducts.length === 0 ? (
						<div className="flex flex-col items-center justify-center py-20 text-center">
							{pendingProducts?.length === 0 ? (
								<>
									<CheckCircle2 className="mb-4 h-16 w-16 text-success" />
									<h3 className="mb-2 text-xl font-semibold text-foreground">
										All caught up!
									</h3>
									<p className="text-muted-foreground">
										No products pending review at the moment.
									</p>
								</>
							) : (
								<>
									<Search className="mb-4 h-16 w-16 text-muted-foreground" />
									<h3 className="mb-2 text-xl font-semibold text-foreground">
										No matching products
									</h3>
									<p className="text-muted-foreground">
										Try adjusting your search or filter criteria.
									</p>
									<Button
										variant="outline"
										className="mt-4"
										onClick={() => {
											setSearchQuery("");
											setFilterMerchant("all");
										}}
									>
										Clear Filters
									</Button>
								</>
							)}
						</div>
					) : (
						<div className="overflow-x-auto">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead className="w-[350px]">Product</TableHead>
										<TableHead>Merchant</TableHead>
										<TableHead>Category</TableHead>
										<TableHead>Price</TableHead>
										<TableHead>Status</TableHead>
										<TableHead className="text-right">Actions</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{filteredProducts.map((product) => (
										<TableRow key={product.id}>
											<TableCell>
												<div className="flex items-center gap-3">
													<div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
														<Image
															src={product.image_url}
															alt={product.title}
															fill
															className="object-cover"
															sizes="56px"
														/>
													</div>
													<div className="min-w-0">
														<p className="font-medium text-foreground line-clamp-1">
															{product.title}
														</p>
														<p className="text-xs text-muted-foreground">
															{product.brand_name} • SKU: {product.sku}
														</p>
														{product.raw_vendor &&
															product.raw_vendor !== product.brand_name && (
																<p className="text-xs text-warning">
																	Original vendor: {product.raw_vendor}
																</p>
															)}
													</div>
												</div>
											</TableCell>
											<TableCell>
												<div className="flex items-center gap-2">
													<Store className="h-4 w-4 text-muted-foreground" />
													<span className="text-sm text-foreground">
														{product.merchant_name}
													</span>
												</div>
											</TableCell>
											<TableCell>
												<div className="flex items-center gap-2">
													<Tag className="h-4 w-4 text-muted-foreground" />
													<span className="text-sm text-foreground">
														{product.category_name ||
															product.raw_product_type ||
															"Uncategorized"}
													</span>
												</div>
											</TableCell>
											<TableCell>
												<p className="font-medium text-foreground">
													₹{product.base_price.toLocaleString()}
												</p>
											</TableCell>
											<TableCell>
												<StatusBadge
													status="pending"
													customLabel="Pending Review"
												/>
											</TableCell>
											<TableCell>
												<div className="flex items-center justify-end gap-2">
													<Button
														variant="ghost"
														size="icon-sm"
														onClick={() => handleOpenReview(product)}
														title="Review Details"
													>
														<Eye className="h-4 w-4" />
													</Button>
													<Button
														variant="success"
														size="sm"
														onClick={() => handleQuickApprove(product)}
														leftIcon={<Check className="h-4 w-4" />}
													>
														Approve
													</Button>
													<Button
														variant="destructive"
														size="sm"
														onClick={() => handleOpenReject(product)}
														leftIcon={<X className="h-4 w-4" />}
													>
														Reject
													</Button>
												</div>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</div>
					)}
				</Card>

				{/* Review Modal */}
				{selectedProduct && (
					<ReviewModal
						open={reviewModalOpen}
						onOpenChange={setReviewModalOpen}
						product={selectedProduct}
						brands={brands ?? []}
						categories={categories ?? []}
						onApprove={handleApproveSuccess}
						onReject={() => {
							setReviewModalOpen(false);
							setRejectModalOpen(true);
						}}
					/>
				)}

				{/* Reject Modal */}
				{selectedProduct && (
					<RejectModal
						open={rejectModalOpen}
						onOpenChange={setRejectModalOpen}
						product={selectedProduct}
						onSuccess={handleRejectSuccess}
					/>
				)}
			</Container>
		</PageWrapper>
	);
}

// Review Modal Component
function ReviewModal({
	open,
	onOpenChange,
	product,
	brands,
	categories,
	onApprove,
	onReject,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	product: ApiProduct;
	brands: ApiBrand[];
	categories: ApiCategory[];
	onApprove: () => void;
	onReject: () => void;
}) {
	const [editTitle, setEditTitle] = React.useState(product.title);
	const [selectedBrandId, setSelectedBrandId] = React.useState(
		String(product.brand_id ?? ""),
	);
	const [selectedCategoryId, setSelectedCategoryId] = React.useState(
		String(product.category_id ?? ""),
	);
	const [isApproving, setIsApproving] = React.useState(false);
	const [brandSearch, setBrandSearch] = React.useState("");

	const topCategories = categories.filter((c) => c.parent_id === null);
	const selectedCategory = topCategories.find(
		(c) => String(c.id) === selectedCategoryId,
	);

	const filteredBrands = React.useMemo(() => {
		if (!brandSearch) return brands;
		return brands.filter((b) =>
			b.name.toLowerCase().includes(brandSearch.toLowerCase()),
		);
	}, [brands, brandSearch]);

	const handleApprove = async () => {
		setIsApproving(true);
		try {
			const res = await fetch(`/api/admin/review/${product.id}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					action: "approve",
					title: editTitle,
					brand_id: selectedBrandId ? Number(selectedBrandId) : undefined,
					category_id: selectedCategoryId
						? Number(selectedCategoryId)
						: undefined,
				}),
			});
			if (!res.ok) throw new Error("Failed to approve");
			onApprove();
		} catch {
			toast.error("Failed to approve product");
		}
		setIsApproving(false);
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent size="lg" className="max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>Review Product</DialogTitle>
					<DialogDescription>
						Review and optionally edit product details before approval.
					</DialogDescription>
				</DialogHeader>

				<div className="mt-4 space-y-6">
					{/* Product Preview */}
					<div className="flex gap-4 rounded-lg border border-border bg-muted/30 p-4">
						<div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
							<Image
								src={product.image_url}
								alt={product.title}
								fill
								className="object-cover"
								sizes="96px"
							/>
						</div>
						<div className="min-w-0 flex-1">
							<p className="font-semibold text-foreground">{product.title}</p>
							<p className="text-sm text-muted-foreground">
								SKU: {product.sku}
							</p>
							<p className="text-sm text-muted-foreground">
								Merchant: {product.merchant_name}
							</p>
							<p className="mt-1 text-lg font-bold text-primary">
								₹{product.base_price.toLocaleString()}
							</p>
						</div>
					</div>

					{/* Original Data */}
					<div>
						<h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
							<div className="flex h-5 w-5 items-center justify-center rounded bg-muted text-xs font-bold">
								1
							</div>
							Original Data from Source
						</h4>
						<div className="grid gap-4 rounded-lg border border-border bg-muted/50 p-4 sm:grid-cols-2">
							<div>
								<p className="text-xs font-medium text-muted-foreground">
									Title
								</p>
								<p className="mt-1 text-sm text-foreground">
									{product.raw_title ?? product.title}
								</p>
							</div>
							<div>
								<p className="text-xs font-medium text-muted-foreground">
									Vendor
								</p>
								<p className="mt-1 text-sm text-foreground">
									{product.raw_vendor ?? "Not specified"}
								</p>
							</div>
							<div>
								<p className="text-xs font-medium text-muted-foreground">
									Product Type
								</p>
								<p className="mt-1 text-sm text-foreground">
									{product.raw_product_type ?? "Not specified"}
								</p>
							</div>
							<div>
								<p className="text-xs font-medium text-muted-foreground">
									Current Brand
								</p>
								<p className="mt-1 text-sm text-foreground">
									{product.brand_name ?? "Not mapped"}
								</p>
							</div>
						</div>
					</div>

					{/* Master Catalog Mapping */}
					<div>
						<h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
							<div className="flex h-5 w-5 items-center justify-center rounded bg-primary text-xs font-bold text-primary-foreground">
								2
							</div>
							Master Catalog Mapping
						</h4>
						<div className="space-y-4 rounded-lg border border-primary/20 bg-accent/30 p-4">
							{/* Title */}
							<div>
								<label
									htmlFor="edit-title"
									className="mb-1.5 block text-sm font-medium text-foreground"
								>
									Product Title
								</label>
								<Input
									id="edit-title"
									value={editTitle}
									onChange={(e) => setEditTitle(e.target.value)}
									placeholder="Enter product title"
								/>
							</div>

							{/* Brand */}
							<div>
								<label className="mb-1.5 block text-sm font-medium text-foreground">
									Brand Mapping
								</label>
								<Select
									value={selectedBrandId}
									onValueChange={setSelectedBrandId}
								>
									<SelectTrigger>
										<SelectValue placeholder="Select brand..." />
									</SelectTrigger>
									<SelectContent>
										<div className="p-2">
											<Input
												placeholder="Search brands..."
												value={brandSearch}
												onChange={(e) => setBrandSearch(e.target.value)}
												inputSize="sm"
											/>
										</div>
										<div className="max-h-[200px] overflow-y-auto">
											{filteredBrands.map((brand) => (
												<SelectItem key={brand.id} value={String(brand.id)}>
													{brand.name}
												</SelectItem>
											))}
										</div>
									</SelectContent>
								</Select>
								{product.raw_vendor && (
									<p className="mt-1 text-xs text-muted-foreground">
										Original vendor:{" "}
										<span className="text-foreground">
											{product.raw_vendor}
										</span>
									</p>
								)}
							</div>

							{/* Category */}
							<div>
								<label className="mb-1.5 block text-sm font-medium text-foreground">
									Category
								</label>
								<Select
									value={selectedCategoryId}
									onValueChange={setSelectedCategoryId}
								>
									<SelectTrigger>
										<SelectValue placeholder="Select category..." />
									</SelectTrigger>
									<SelectContent>
										{topCategories.map((cat) => (
											<SelectItem key={cat.id} value={String(cat.id)}>
												{cat.name}
											</SelectItem>
										))}
									</SelectContent>
								</Select>

								{/* Sub-category */}
								{selectedCategory?.children &&
									selectedCategory.children.length > 0 && (
										<div className="mt-3">
											<label className="mb-1.5 block text-xs text-muted-foreground">
												Sub-category (optional)
											</label>
											<Select>
												<SelectTrigger size="sm">
													<SelectValue placeholder="Select sub-category..." />
												</SelectTrigger>
												<SelectContent>
													{selectedCategory.children.map((sub) => (
														<SelectItem key={sub.id} value={String(sub.id)}>
															{sub.name}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										</div>
									)}
							</div>
						</div>
					</div>
				</div>

				<DialogFooter className="mt-6">
					<Button variant="outline" onClick={() => onOpenChange(false)}>
						Cancel
					</Button>
					<Button
						variant="destructive"
						onClick={onReject}
						leftIcon={<X className="h-4 w-4" />}
					>
						Reject
					</Button>
					<Button
						variant="success"
						onClick={handleApprove}
						isLoading={isApproving}
						leftIcon={<Check className="h-4 w-4" />}
					>
						Approve
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

// Reject Modal Component
function RejectModal({
	open,
	onOpenChange,
	product,
	onSuccess,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	product: ApiProduct;
	onSuccess: () => void;
}) {
	const [selectedReason, setSelectedReason] = React.useState("");
	const [customReason, setCustomReason] = React.useState("");
	const [isRejecting, setIsRejecting] = React.useState(false);

	const selectedReasonLabel = REJECTION_REASONS.find(
		(r) => r.value === selectedReason,
	)?.label;
	const isOtherReason = selectedReason === "other";
	const finalReason = isOtherReason
		? customReason
		: selectedReasonLabel || selectedReason;
	const canSubmit = selectedReason && (!isOtherReason || customReason.trim());

	const handleReject = async () => {
		if (!canSubmit) return;
		setIsRejecting(true);
		try {
			const res = await fetch(`/api/admin/review/${product.id}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					action: "reject",
					rejection_reason: finalReason,
				}),
			});
			if (!res.ok) throw new Error("Failed to reject");
			onSuccess();
		} catch {
			toast.error("Failed to reject product");
		}
		setIsRejecting(false);
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent size="default">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2 text-destructive">
						<AlertTriangle className="h-5 w-5" />
						Reject Product
					</DialogTitle>
					<DialogDescription>
						Please provide a reason for rejection. This will be shared with the
						merchant so they can make necessary corrections.
					</DialogDescription>
				</DialogHeader>

				<div className="mt-4 space-y-4">
					{/* Product Info */}
					<div className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 p-3">
						<div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
							<Image
								src={product.image_url}
								alt={product.title}
								fill
								className="object-cover"
								sizes="48px"
							/>
						</div>
						<div className="min-w-0 flex-1">
							<p className="font-medium text-foreground line-clamp-1">
								{product.title}
							</p>
							<p className="text-xs text-muted-foreground">
								{product.merchant_name} • ₹{product.base_price.toLocaleString()}
							</p>
						</div>
					</div>

					{/* Rejection Reason Selector */}
					<div>
						<label className="mb-1.5 block text-sm font-medium text-foreground">
							Rejection Reason <span className="text-destructive">*</span>
						</label>
						<Select value={selectedReason} onValueChange={setSelectedReason}>
							<SelectTrigger variant={!selectedReason ? "error" : "default"}>
								<SelectValue placeholder="Select a reason..." />
							</SelectTrigger>
							<SelectContent>
								{REJECTION_REASONS.map((reason) => (
									<SelectItem key={reason.value} value={reason.value}>
										{reason.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					{/* Custom Reason Input */}
					{isOtherReason && (
						<div>
							<label className="mb-1.5 block text-sm font-medium text-foreground">
								Specify Reason <span className="text-destructive">*</span>
							</label>
							<Textarea
								value={customReason}
								onChange={(e) => setCustomReason(e.target.value)}
								placeholder="Please provide a detailed reason for rejection..."
								variant={!customReason.trim() ? "error" : "default"}
								showCount
								maxLength={500}
							/>
						</div>
					)}

					{/* Additional Notes */}
					{selectedReason && !isOtherReason && (
						<div>
							<label className="mb-1.5 block text-sm font-medium text-foreground">
								Additional Notes (Optional)
							</label>
							<Textarea
								value={customReason}
								onChange={(e) => setCustomReason(e.target.value)}
								placeholder="Add any additional context or suggestions..."
								showCount
								maxLength={500}
							/>
						</div>
					)}

					{/* Preview */}
					{canSubmit && (
						<div className="rounded-lg border border-warning/30 bg-warning/10 p-3">
							<p className="text-xs font-medium text-warning">
								Rejection message to merchant:
							</p>
							<p className="mt-1 text-sm text-foreground">
								{finalReason}
								{customReason && !isOtherReason && (
									<>
										<br />
										<span className="text-muted-foreground">
											Note: {customReason}
										</span>
									</>
								)}
							</p>
						</div>
					)}
				</div>

				<DialogFooter className="mt-6">
					<Button variant="outline" onClick={() => onOpenChange(false)}>
						Cancel
					</Button>
					<Button
						variant="destructive"
						onClick={handleReject}
						isLoading={isRejecting}
						disabled={!canSubmit}
						leftIcon={<XCircle className="h-4 w-4" />}
					>
						Confirm Rejection
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
