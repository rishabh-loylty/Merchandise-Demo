"use client";

import * as React from "react";
import { fetcher } from "@/lib/fetcher";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
} from "@/components/ui/table";
import {
	DropdownMenu,
	DropdownMenuTrigger,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
	PageHeader,
	Container,
	PageWrapper,
} from "@/components/layout/page-header";
import { toast } from "@/components/providers";
import {
	Percent,
	Plus,
	Search,
	MoreHorizontal,
	Pencil,
	Trash2,
	RefreshCw,
	CheckCircle2,
	XCircle,
	Store,
	Layers,
	FolderTree,
	Calendar,
	TrendingUp,
	AlertCircle,
} from "lucide-react";
import useSWR from "swr";

// Types
interface MarginRule {
	id: number;
	merchant_id: number;
	merchant_name: string;
	brand_id: number | null;
	brand_name: string | null;
	category_id: number | null;
	category_name: string | null;
	margin_percentage: number;
	valid_from: string;
	valid_to: string | null;
	is_active: boolean;
}

interface Merchant {
	id: number;
	name: string;
	is_active: boolean;
}

interface Brand {
	id: number;
	name: string;
	is_active: boolean;
}

interface Category {
	id: number;
	name: string;
	path: string | null;
	is_active: boolean;
}

export default function AdminMarginsPage() {
	const {
		data: margins,
		isLoading,
		mutate,
	} = useSWR<MarginRule[]>("/api/admin/margins", fetcher);

	const { data: merchants } = useSWR<Merchant[]>(
		"/api/admin/merchants",
		fetcher,
	);
	const { data: brands } = useSWR<Brand[]>("/api/admin/brands", fetcher);
	const { data: categories } = useSWR<Category[]>("/api/categories", fetcher);

	const [searchQuery, setSearchQuery] = React.useState("");
	const [filterMerchant, setFilterMerchant] = React.useState<string>("all");
	const [filterStatus, setFilterStatus] = React.useState<string>("all");
	const [createModalOpen, setCreateModalOpen] = React.useState(false);
	const [editModalOpen, setEditModalOpen] = React.useState(false);
	const [deleteModalOpen, setDeleteModalOpen] = React.useState(false);
	const [selectedMargin, setSelectedMargin] = React.useState<MarginRule | null>(
		null,
	);

	// Flatten categories for easier use
	const flatCategories = React.useMemo(() => {
		if (!categories) return [];
		const flat: Category[] = [];
		const flatten = (cats: Category[]) => {
			for (const cat of cats) {
				flat.push(cat);
				if ((cat as Category & { children?: Category[] }).children) {
					flatten((cat as Category & { children?: Category[] }).children!);
				}
			}
		};
		flatten(categories);
		return flat;
	}, [categories]);

	// Filter margins
	const filteredMargins = React.useMemo(() => {
		if (!margins) return [];
		return margins.filter((m) => {
			const matchesSearch =
				m.merchant_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
				(m.brand_name &&
					m.brand_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
				(m.category_name &&
					m.category_name.toLowerCase().includes(searchQuery.toLowerCase()));
			const matchesMerchant =
				filterMerchant === "all" || m.merchant_id.toString() === filterMerchant;
			const matchesStatus =
				filterStatus === "all" ||
				(filterStatus === "active" && m.is_active) ||
				(filterStatus === "inactive" && !m.is_active);
			return matchesSearch && matchesMerchant && matchesStatus;
		});
	}, [margins, searchQuery, filterMerchant, filterStatus]);

	const handleEdit = (margin: MarginRule) => {
		setSelectedMargin(margin);
		setEditModalOpen(true);
	};

	const handleDelete = (margin: MarginRule) => {
		setSelectedMargin(margin);
		setDeleteModalOpen(true);
	};

	const handleCreateSuccess = () => {
		setCreateModalOpen(false);
		mutate();
		toast.success("Margin rule created successfully");
	};

	const handleEditSuccess = () => {
		setEditModalOpen(false);
		setSelectedMargin(null);
		mutate();
		toast.success("Margin rule updated successfully");
	};

	const handleDeleteSuccess = () => {
		setDeleteModalOpen(false);
		setSelectedMargin(null);
		mutate();
		toast.success("Margin rule deleted successfully");
	};

	const handleToggleActive = async (margin: MarginRule) => {
		try {
			const res = await fetch(`/api/admin/margins/${margin.id}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ is_active: !margin.is_active }),
			});
			if (!res.ok) {
				const error = await res.json();
				throw new Error(error.error || "Failed to update margin rule");
			}
			mutate();
			toast.success(
				margin.is_active ? "Margin rule deactivated" : "Margin rule activated",
			);
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : "Failed to update margin rule",
			);
		}
	};

	// Stats
	const stats = React.useMemo(() => {
		if (!margins) return { total: 0, active: 0, avgMargin: 0 };
		const activeMargins = margins.filter((m) => m.is_active);
		const avgMargin =
			activeMargins.length > 0
				? activeMargins.reduce(
						(sum, m) => sum + Number(m.margin_percentage),
						0,
					) / activeMargins.length
				: 0;
		return {
			total: margins.length,
			active: activeMargins.length,
			avgMargin: avgMargin.toFixed(2),
		};
	}, [margins]);

	// Get rule scope description
	const getRuleScope = (margin: MarginRule) => {
		if (margin.brand_name && margin.category_name) {
			return `${margin.brand_name} in ${margin.category_name}`;
		}
		if (margin.brand_name) {
			return `Brand: ${margin.brand_name}`;
		}
		if (margin.category_name) {
			return `Category: ${margin.category_name}`;
		}
		return "All Products";
	};

	return (
		<PageWrapper>
			<Container>
				<PageHeader
					title="Margin Rules"
					description="Configure profit margins for merchants, brands, and categories"
					icon={Percent}
					actions={
						<div className="flex items-center gap-2">
							<Button
								variant="outline"
								size="sm"
								onClick={() => mutate()}
								leftIcon={<RefreshCw className="h-4 w-4" />}
							>
								Refresh
							</Button>
							<Button
								size="sm"
								onClick={() => setCreateModalOpen(true)}
								leftIcon={<Plus className="h-4 w-4" />}
							>
								Add Margin Rule
							</Button>
						</div>
					}
				/>

				{/* Stats Cards */}
				<div className="mt-6 grid gap-4 sm:grid-cols-3">
					<Card padding="default">
						<div className="flex items-center gap-3">
							<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
								<Percent className="h-5 w-5" />
							</div>
							<div>
								<p className="text-2xl font-bold text-foreground">
									{stats.total}
								</p>
								<p className="text-sm text-muted-foreground">Total Rules</p>
							</div>
						</div>
					</Card>
					<Card padding="default">
						<div className="flex items-center gap-3">
							<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10 text-success">
								<CheckCircle2 className="h-5 w-5" />
							</div>
							<div>
								<p className="text-2xl font-bold text-foreground">
									{stats.active}
								</p>
								<p className="text-sm text-muted-foreground">Active Rules</p>
							</div>
						</div>
					</Card>
					<Card padding="default">
						<div className="flex items-center gap-3">
							<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10 text-warning">
								<TrendingUp className="h-5 w-5" />
							</div>
							<div>
								<p className="text-2xl font-bold text-foreground">
									{stats.avgMargin}%
								</p>
								<p className="text-sm text-muted-foreground">Average Margin</p>
							</div>
						</div>
					</Card>
				</div>

				{/* Info Banner */}
				<Card className="mt-6" padding="default">
					<div className="flex items-start gap-3">
						<AlertCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
						<div className="text-sm">
							<p className="font-medium text-foreground">
								How Margin Rules Work
							</p>
							<p className="text-muted-foreground">
								Margin rules determine the profit percentage added to merchant
								prices. More specific rules (brand + category) take precedence
								over general rules (merchant only). When a product matches
								multiple rules, the most specific active rule is applied.
							</p>
						</div>
					</div>
				</Card>

				{/* Filters */}
				<Card className="mt-6" padding="default">
					<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
						<div className="relative flex-1 max-w-sm">
							<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
							<Input
								placeholder="Search rules..."
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="pl-9"
							/>
						</div>
						<div className="flex items-center gap-2">
							<Select value={filterMerchant} onValueChange={setFilterMerchant}>
								<SelectTrigger className="w-[180px]">
									<SelectValue placeholder="Filter by merchant" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">All Merchants</SelectItem>
									{merchants?.map((m) => (
										<SelectItem key={m.id} value={m.id.toString()}>
											{m.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							<Select value={filterStatus} onValueChange={setFilterStatus}>
								<SelectTrigger className="w-[140px]">
									<SelectValue placeholder="Status" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">All Status</SelectItem>
									<SelectItem value="active">Active</SelectItem>
									<SelectItem value="inactive">Inactive</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>
				</Card>

				{/* Margin Rules Table */}
				<Card className="mt-6" padding="none">
					{isLoading ? (
						<div className="flex items-center justify-center py-12">
							<div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
						</div>
					) : filteredMargins.length === 0 ? (
						<TableEmpty
							icon={<Percent className="h-12 w-12" />}
							title="No margin rules found"
							description={
								searchQuery ||
								filterMerchant !== "all" ||
								filterStatus !== "all"
									? "Try adjusting your search or filters"
									: "Get started by adding your first margin rule"
							}
							action={
								!searchQuery &&
								filterMerchant === "all" &&
								filterStatus === "all" && (
									<Button
										size="sm"
										onClick={() => setCreateModalOpen(true)}
										leftIcon={<Plus className="h-4 w-4" />}
									>
										Add Margin Rule
									</Button>
								)
							}
						/>
					) : (
						<div className="overflow-x-auto">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Merchant</TableHead>
										<TableHead>Scope</TableHead>
										<TableHead>Margin</TableHead>
										<TableHead>Validity</TableHead>
										<TableHead>Status</TableHead>
										<TableHead className="text-right">Actions</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{filteredMargins.map((margin) => (
										<TableRow key={margin.id}>
											<TableCell>
												<div className="flex items-center gap-3">
													<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
														<Store className="h-5 w-5 text-muted-foreground" />
													</div>
													<div>
														<p className="font-medium text-foreground">
															{margin.merchant_name}
														</p>
														<p className="text-xs text-muted-foreground">
															ID: {margin.merchant_id}
														</p>
													</div>
												</div>
											</TableCell>
											<TableCell>
												<div className="flex flex-col gap-1">
													<span className="text-sm font-medium text-foreground">
														{getRuleScope(margin)}
													</span>
													<div className="flex items-center gap-2">
														{margin.brand_name && (
															<Badge variant="secondary" size="sm">
																<Layers className="mr-1 h-3 w-3" />
																Brand
															</Badge>
														)}
														{margin.category_name && (
															<Badge variant="secondary" size="sm">
																<FolderTree className="mr-1 h-3 w-3" />
																Category
															</Badge>
														)}
														{!margin.brand_name && !margin.category_name && (
															<Badge variant="outline" size="sm">
																Default
															</Badge>
														)}
													</div>
												</div>
											</TableCell>
											<TableCell>
												<div className="flex items-center gap-2">
													<span className="text-lg font-bold text-primary">
														{Number(margin.margin_percentage).toFixed(2)}%
													</span>
												</div>
											</TableCell>
											<TableCell>
												<div className="flex flex-col gap-1 text-sm">
													<div className="flex items-center gap-1.5 text-muted-foreground">
														<Calendar className="h-3.5 w-3.5" />
														<span>
															From:{" "}
															{new Date(margin.valid_from).toLocaleDateString()}
														</span>
													</div>
													{margin.valid_to && (
														<div className="flex items-center gap-1.5 text-muted-foreground">
															<Calendar className="h-3.5 w-3.5" />
															<span>
																To:{" "}
																{new Date(margin.valid_to).toLocaleDateString()}
															</span>
														</div>
													)}
													{!margin.valid_to && (
														<span className="text-xs text-success">
															No expiration
														</span>
													)}
												</div>
											</TableCell>
											<TableCell>
												<StatusBadge
													status={margin.is_active ? "success" : "error"}
												>
													{margin.is_active ? "Active" : "Inactive"}
												</StatusBadge>
											</TableCell>
											<TableCell className="text-right">
												<DropdownMenu>
													<DropdownMenuTrigger asChild>
														<Button variant="ghost" size="icon-sm">
															<MoreHorizontal className="h-4 w-4" />
														</Button>
													</DropdownMenuTrigger>
													<DropdownMenuContent align="end">
														<DropdownMenuItem
															onClick={() => handleEdit(margin)}
														>
															<Pencil className="mr-2 h-4 w-4" />
															Edit Rule
														</DropdownMenuItem>
														<DropdownMenuItem
															onClick={() => handleToggleActive(margin)}
														>
															{margin.is_active ? (
																<>
																	<XCircle className="mr-2 h-4 w-4" />
																	Deactivate
																</>
															) : (
																<>
																	<CheckCircle2 className="mr-2 h-4 w-4" />
																	Activate
																</>
															)}
														</DropdownMenuItem>
														<DropdownMenuSeparator />
														<DropdownMenuItem
															onClick={() => handleDelete(margin)}
															className="text-destructive focus:text-destructive"
														>
															<Trash2 className="mr-2 h-4 w-4" />
															Delete
														</DropdownMenuItem>
													</DropdownMenuContent>
												</DropdownMenu>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</div>
					)}
				</Card>
			</Container>

			{/* Create Modal */}
			<CreateMarginModal
				open={createModalOpen}
				onOpenChange={setCreateModalOpen}
				onSuccess={handleCreateSuccess}
				merchants={merchants || []}
				brands={brands || []}
				categories={flatCategories}
			/>

			{/* Edit Modal */}
			{selectedMargin && (
				<EditMarginModal
					open={editModalOpen}
					onOpenChange={setEditModalOpen}
					margin={selectedMargin}
					merchants={merchants || []}
					brands={brands || []}
					categories={flatCategories}
					onSuccess={handleEditSuccess}
				/>
			)}

			{/* Delete Modal */}
			{selectedMargin && (
				<DeleteMarginModal
					open={deleteModalOpen}
					onOpenChange={setDeleteModalOpen}
					margin={selectedMargin}
					onSuccess={handleDeleteSuccess}
				/>
			)}
		</PageWrapper>
	);
}

// Create Margin Modal
function CreateMarginModal({
	open,
	onOpenChange,
	onSuccess,
	merchants,
	brands,
	categories,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSuccess: () => void;
	merchants: Merchant[];
	brands: Brand[];
	categories: Category[];
}) {
	const [merchantId, setMerchantId] = React.useState<string>("");
	const [brandId, setBrandId] = React.useState<string>("none");
	const [categoryId, setCategoryId] = React.useState<string>("none");
	const [marginPercentage, setMarginPercentage] = React.useState<string>("");
	const [validFrom, setValidFrom] = React.useState<string>(
		new Date().toISOString().split("T")[0] ?? "",
	);
	const [validTo, setValidTo] = React.useState<string>("");
	const [isSubmitting, setIsSubmitting] = React.useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!merchantId) {
			toast.error("Please select a merchant");
			return;
		}

		const margin = Number.parseFloat(marginPercentage);
		if (Number.isNaN(margin) || margin < 0 || margin > 100) {
			toast.error("Please enter a valid margin percentage (0-100)");
			return;
		}

		setIsSubmitting(true);
		try {
			const res = await fetch("/api/admin/margins", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					merchant_id: Number(merchantId),
					brand_id: brandId === "none" ? null : Number(brandId),
					category_id: categoryId === "none" ? null : Number(categoryId),
					margin_percentage: margin,
					valid_from: validFrom,
					valid_to: validTo || null,
				}),
			});

			if (!res.ok) {
				const error = await res.json();
				throw new Error(error.error || "Failed to create margin rule");
			}

			// Reset form
			setMerchantId("");
			setBrandId("none");
			setCategoryId("none");
			setMarginPercentage("");
			setValidFrom(new Date().toISOString().split("T")[0] ?? "");
			setValidTo("");
			onSuccess();
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : "Failed to create margin rule",
			);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent size="lg">
				<DialogHeader>
					<DialogTitle>Add New Margin Rule</DialogTitle>
					<DialogDescription>
						Create a margin rule to define profit percentages for specific
						merchant, brand, and category combinations
					</DialogDescription>
				</DialogHeader>
				<form onSubmit={handleSubmit} className="space-y-4">
					<div className="space-y-1.5">
						<label className="text-sm font-medium text-foreground">
							Merchant <span className="text-destructive">*</span>
						</label>
						<Select value={merchantId} onValueChange={setMerchantId}>
							<SelectTrigger>
								<SelectValue placeholder="Select merchant" />
							</SelectTrigger>
							<SelectContent>
								{merchants
									.filter((m) => m.is_active)
									.map((m) => (
										<SelectItem key={m.id} value={m.id.toString()}>
											<span className="flex items-center gap-2">
												<Store className="h-4 w-4" />
												{m.name}
											</span>
										</SelectItem>
									))}
							</SelectContent>
						</Select>
					</div>

					<div className="grid gap-4 sm:grid-cols-2">
						<div className="space-y-1.5">
							<label className="text-sm font-medium text-foreground">
								Brand (Optional)
							</label>
							<Select value={brandId} onValueChange={setBrandId}>
								<SelectTrigger>
									<SelectValue placeholder="All brands" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="none">All Brands</SelectItem>
									{brands
										.filter((b) => b.is_active)
										.map((b) => (
											<SelectItem key={b.id} value={b.id.toString()}>
												<span className="flex items-center gap-2">
													<Layers className="h-4 w-4" />
													{b.name}
												</span>
											</SelectItem>
										))}
								</SelectContent>
							</Select>
							<p className="text-xs text-muted-foreground">
								Leave empty to apply to all brands
							</p>
						</div>

						<div className="space-y-1.5">
							<label className="text-sm font-medium text-foreground">
								Category (Optional)
							</label>
							<Select value={categoryId} onValueChange={setCategoryId}>
								<SelectTrigger>
									<SelectValue placeholder="All categories" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="none">All Categories</SelectItem>
									{categories
										.filter((c) => c.is_active)
										.map((c) => (
											<SelectItem key={c.id} value={c.id.toString()}>
												<span className="flex items-center gap-2">
													<FolderTree className="h-4 w-4" />
													{c.path || c.name}
												</span>
											</SelectItem>
										))}
								</SelectContent>
							</Select>
							<p className="text-xs text-muted-foreground">
								Leave empty to apply to all categories
							</p>
						</div>
					</div>

					<div className="space-y-1.5">
						<label className="text-sm font-medium text-foreground">
							Margin Percentage <span className="text-destructive">*</span>
						</label>
						<div className="relative">
							<Input
								type="number"
								step="0.01"
								min="0"
								max="100"
								placeholder="5.00"
								value={marginPercentage}
								onChange={(e) => setMarginPercentage(e.target.value)}
								className="pr-8"
								required
							/>
							<span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
								%
							</span>
						</div>
						<p className="text-xs text-muted-foreground">
							The percentage added to the merchant&apos;s price as profit
						</p>
					</div>

					<div className="grid gap-4 sm:grid-cols-2">
						<Input
							type="date"
							label="Valid From"
							value={validFrom}
							onChange={(e) => setValidFrom(e.target.value)}
							required
						/>
						<Input
							type="date"
							label="Valid To (Optional)"
							value={validTo}
							onChange={(e) => setValidTo(e.target.value)}
							helperText="Leave empty for no expiration"
						/>
					</div>

					<DialogFooter className="mt-6">
						<Button
							type="button"
							variant="outline"
							onClick={() => onOpenChange(false)}
						>
							Cancel
						</Button>
						<Button type="submit" isLoading={isSubmitting}>
							Create Rule
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}

// Edit Margin Modal
function EditMarginModal({
	open,
	onOpenChange,
	margin,
	merchants,
	brands,
	categories,
	onSuccess,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	margin: MarginRule;
	merchants: Merchant[];
	brands: Brand[];
	categories: Category[];
	onSuccess: () => void;
}) {
	const [merchantId, setMerchantId] = React.useState<string>(
		margin.merchant_id.toString(),
	);
	const [brandId, setBrandId] = React.useState<string>(
		margin.brand_id?.toString() || "none",
	);
	const [categoryId, setCategoryId] = React.useState<string>(
		margin.category_id?.toString() || "none",
	);
	const [marginPercentage, setMarginPercentage] = React.useState<string>(
		Number(margin.margin_percentage).toString(),
	);
	const [validFrom, setValidFrom] = React.useState<string>(
		margin.valid_from?.split("T")[0] ?? "",
	);
	const [validTo, setValidTo] = React.useState<string>(
		margin.valid_to?.split("T")[0] ?? "",
	);
	const [isActive, setIsActive] = React.useState(margin.is_active);
	const [isSubmitting, setIsSubmitting] = React.useState(false);

	React.useEffect(() => {
		setMerchantId(margin.merchant_id.toString());
		setBrandId(margin.brand_id?.toString() || "none");
		setCategoryId(margin.category_id?.toString() || "none");
		setMarginPercentage(Number(margin.margin_percentage).toString());
		setValidFrom(margin.valid_from?.split("T")[0] ?? "");
		setValidTo(margin.valid_to?.split("T")[0] ?? "");
		setIsActive(margin.is_active);
	}, [margin]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!merchantId) {
			toast.error("Please select a merchant");
			return;
		}

		const marginValue = Number.parseFloat(marginPercentage);
		if (Number.isNaN(marginValue) || marginValue < 0 || marginValue > 100) {
			toast.error("Please enter a valid margin percentage (0-100)");
			return;
		}

		setIsSubmitting(true);
		try {
			const res = await fetch(`/api/admin/margins/${margin.id}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					merchant_id: Number(merchantId),
					brand_id: brandId === "none" ? null : Number(brandId),
					category_id: categoryId === "none" ? null : Number(categoryId),
					margin_percentage: marginValue,
					valid_from: validFrom,
					valid_to: validTo || null,
					is_active: isActive,
				}),
			});

			if (!res.ok) {
				const error = await res.json();
				throw new Error(error.error || "Failed to update margin rule");
			}

			onSuccess();
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : "Failed to update margin rule",
			);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent size="lg">
				<DialogHeader>
					<DialogTitle>Edit Margin Rule</DialogTitle>
					<DialogDescription>
						Update margin rule settings and validity period
					</DialogDescription>
				</DialogHeader>
				<form onSubmit={handleSubmit} className="space-y-4">
					<div className="space-y-1.5">
						<label className="text-sm font-medium text-foreground">
							Merchant <span className="text-destructive">*</span>
						</label>
						<Select value={merchantId} onValueChange={setMerchantId}>
							<SelectTrigger>
								<SelectValue placeholder="Select merchant" />
							</SelectTrigger>
							<SelectContent>
								{merchants.map((m) => (
									<SelectItem key={m.id} value={m.id.toString()}>
										<span className="flex items-center gap-2">
											<Store className="h-4 w-4" />
											{m.name}
										</span>
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					<div className="grid gap-4 sm:grid-cols-2">
						<div className="space-y-1.5">
							<label className="text-sm font-medium text-foreground">
								Brand (Optional)
							</label>
							<Select value={brandId} onValueChange={setBrandId}>
								<SelectTrigger>
									<SelectValue placeholder="All brands" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="none">All Brands</SelectItem>
									{brands.map((b) => (
										<SelectItem key={b.id} value={b.id.toString()}>
											<span className="flex items-center gap-2">
												<Layers className="h-4 w-4" />
												{b.name}
											</span>
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-1.5">
							<label className="text-sm font-medium text-foreground">
								Category (Optional)
							</label>
							<Select value={categoryId} onValueChange={setCategoryId}>
								<SelectTrigger>
									<SelectValue placeholder="All categories" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="none">All Categories</SelectItem>
									{categories.map((c) => (
										<SelectItem key={c.id} value={c.id.toString()}>
											<span className="flex items-center gap-2">
												<FolderTree className="h-4 w-4" />
												{c.path || c.name}
											</span>
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</div>

					<div className="space-y-1.5">
						<label className="text-sm font-medium text-foreground">
							Margin Percentage <span className="text-destructive">*</span>
						</label>
						<div className="relative">
							<Input
								type="number"
								step="0.01"
								min="0"
								max="100"
								placeholder="5.00"
								value={marginPercentage}
								onChange={(e) => setMarginPercentage(e.target.value)}
								className="pr-8"
								required
							/>
							<span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
								%
							</span>
						</div>
					</div>

					<div className="grid gap-4 sm:grid-cols-2">
						<Input
							type="date"
							label="Valid From"
							value={validFrom}
							onChange={(e) => setValidFrom(e.target.value)}
							required
						/>
						<Input
							type="date"
							label="Valid To (Optional)"
							value={validTo}
							onChange={(e) => setValidTo(e.target.value)}
							helperText="Leave empty for no expiration"
						/>
					</div>

					<div className="flex items-center justify-between rounded-lg border border-border p-3">
						<div>
							<p className="text-sm font-medium text-foreground">
								Active Status
							</p>
							<p className="text-xs text-muted-foreground">
								Inactive rules won&apos;t be applied to pricing
							</p>
						</div>
						<button
							type="button"
							role="switch"
							aria-checked={isActive}
							onClick={() => setIsActive(!isActive)}
							className={cn(
								"relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
								isActive ? "bg-primary" : "bg-muted",
							)}
						>
							<span
								className={cn(
									"pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
									isActive ? "translate-x-5" : "translate-x-0",
								)}
							/>
						</button>
					</div>

					<DialogFooter className="mt-6">
						<Button
							type="button"
							variant="outline"
							onClick={() => onOpenChange(false)}
						>
							Cancel
						</Button>
						<Button type="submit" isLoading={isSubmitting}>
							Save Changes
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}

// Delete Margin Modal
function DeleteMarginModal({
	open,
	onOpenChange,
	margin,
	onSuccess,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	margin: MarginRule;
	onSuccess: () => void;
}) {
	const [isDeleting, setIsDeleting] = React.useState(false);

	const handleDelete = async () => {
		setIsDeleting(true);
		try {
			const res = await fetch(`/api/admin/margins/${margin.id}`, {
				method: "DELETE",
			});

			if (!res.ok) {
				const error = await res.json();
				throw new Error(error.error || "Failed to delete margin rule");
			}

			onSuccess();
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : "Failed to delete margin rule",
			);
		} finally {
			setIsDeleting(false);
		}
	};

	// Get rule scope description
	const getRuleScope = () => {
		if (margin.brand_name && margin.category_name) {
			return `${margin.brand_name} in ${margin.category_name}`;
		}
		if (margin.brand_name) {
			return `Brand: ${margin.brand_name}`;
		}
		if (margin.category_name) {
			return `Category: ${margin.category_name}`;
		}
		return "All Products";
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent size="sm">
				<DialogHeader>
					<DialogTitle className="text-destructive">
						Delete Margin Rule
					</DialogTitle>
					<DialogDescription>
						This action cannot be undone. Products will use the next applicable
						margin rule.
					</DialogDescription>
				</DialogHeader>
				<div className="space-y-4">
					<div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
						<div className="flex items-start gap-3">
							<Trash2 className="mt-0.5 h-5 w-5 text-destructive" />
							<div className="text-sm">
								<p className="font-medium text-destructive">
									You are about to delete:
								</p>
								<p className="text-foreground">
									{margin.merchant_name} -{" "}
									{Number(margin.margin_percentage).toFixed(2)}%
								</p>
								<p className="text-muted-foreground">Scope: {getRuleScope()}</p>
							</div>
						</div>
					</div>
				</div>
				<DialogFooter className="mt-6">
					<Button
						type="button"
						variant="outline"
						onClick={() => onOpenChange(false)}
					>
						Cancel
					</Button>
					<Button
						variant="destructive"
						onClick={handleDelete}
						isLoading={isDeleting}
					>
						Delete Rule
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
