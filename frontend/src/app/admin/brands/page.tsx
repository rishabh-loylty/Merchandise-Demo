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
	Layers,
	Plus,
	Search,
	MoreHorizontal,
	Pencil,
	Trash2,
	RefreshCw,
	CheckCircle2,
	XCircle,
	Image as ImageIcon,
	Package,
	Link as LinkIcon,
} from "lucide-react";
import useSWR from "swr";

// Types
interface Brand {
	id: number;
	name: string;
	slug: string;
	logo_url: string | null;
	is_active: boolean;
	created_at?: string;
	product_count?: number;
}

export default function AdminBrandsPage() {
	const {
		data: brands,
		isLoading,
		mutate,
	} = useSWR<Brand[]>("/api/admin/brands", fetcher);

	const [searchQuery, setSearchQuery] = React.useState("");
	const [filterStatus, setFilterStatus] = React.useState<string>("all");
	const [createModalOpen, setCreateModalOpen] = React.useState(false);
	const [editModalOpen, setEditModalOpen] = React.useState(false);
	const [deleteModalOpen, setDeleteModalOpen] = React.useState(false);
	const [selectedBrand, setSelectedBrand] = React.useState<Brand | null>(null);

	// Filter brands
	const filteredBrands = React.useMemo(() => {
		if (!brands) return [];
		return brands.filter((b) => {
			const matchesSearch =
				b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
				b.slug.toLowerCase().includes(searchQuery.toLowerCase());
			const matchesStatus =
				filterStatus === "all" ||
				(filterStatus === "active" && b.is_active) ||
				(filterStatus === "inactive" && !b.is_active);
			return matchesSearch && matchesStatus;
		});
	}, [brands, searchQuery, filterStatus]);

	const handleEdit = (brand: Brand) => {
		setSelectedBrand(brand);
		setEditModalOpen(true);
	};

	const handleDelete = (brand: Brand) => {
		setSelectedBrand(brand);
		setDeleteModalOpen(true);
	};

	const handleCreateSuccess = () => {
		setCreateModalOpen(false);
		mutate();
		toast.success("Brand created successfully");
	};

	const handleEditSuccess = () => {
		setEditModalOpen(false);
		setSelectedBrand(null);
		mutate();
		toast.success("Brand updated successfully");
	};

	const handleDeleteSuccess = () => {
		setDeleteModalOpen(false);
		setSelectedBrand(null);
		mutate();
		toast.success("Brand deleted successfully");
	};

	const handleToggleActive = async (brand: Brand) => {
		try {
			const res = await fetch(`/api/admin/brands/${brand.id}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ is_active: !brand.is_active }),
			});
			if (!res.ok) {
				const error = await res.json();
				throw new Error(error.error || "Failed to update brand");
			}
			mutate();
			toast.success(brand.is_active ? "Brand deactivated" : "Brand activated");
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : "Failed to update brand",
			);
		}
	};

	// Stats
	const stats = React.useMemo(() => {
		if (!brands) return { total: 0, active: 0, withLogo: 0 };
		return {
			total: brands.length,
			active: brands.filter((b) => b.is_active).length,
			withLogo: brands.filter((b) => b.logo_url).length,
		};
	}, [brands]);

	return (
		<PageWrapper>
			<Container>
				<PageHeader
					title="Brands"
					description="Manage product brands and their information"
					icon={Layers}
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
								Add Brand
							</Button>
						</div>
					}
				/>

				{/* Stats Cards */}
				<div className="mt-6 grid gap-4 sm:grid-cols-3">
					<Card padding="default">
						<div className="flex items-center gap-3">
							<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
								<Layers className="h-5 w-5" />
							</div>
							<div>
								<p className="text-2xl font-bold text-foreground">
									{stats.total}
								</p>
								<p className="text-sm text-muted-foreground">Total Brands</p>
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
								<p className="text-sm text-muted-foreground">Active Brands</p>
							</div>
						</div>
					</Card>
					<Card padding="default">
						<div className="flex items-center gap-3">
							<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10 text-warning">
								<ImageIcon className="h-5 w-5" />
							</div>
							<div>
								<p className="text-2xl font-bold text-foreground">
									{stats.withLogo}
								</p>
								<p className="text-sm text-muted-foreground">With Logo</p>
							</div>
						</div>
					</Card>
				</div>

				{/* Filters */}
				<Card className="mt-6" padding="default">
					<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
						<div className="relative flex-1 max-w-sm">
							<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
							<Input
								placeholder="Search brands..."
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="pl-9"
							/>
						</div>
						<div className="flex items-center gap-2">
							<Select value={filterStatus} onValueChange={setFilterStatus}>
								<SelectTrigger className="w-[160px]">
									<SelectValue placeholder="Filter by status" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">All Brands</SelectItem>
									<SelectItem value="active">Active Only</SelectItem>
									<SelectItem value="inactive">Inactive Only</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>
				</Card>

				{/* Brands Table */}
				<Card className="mt-6" padding="none">
					{isLoading ? (
						<div className="flex items-center justify-center py-12">
							<div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
						</div>
					) : filteredBrands.length === 0 ? (
						<TableEmpty
							icon={<Layers className="h-12 w-12" />}
							title="No brands found"
							description={
								searchQuery || filterStatus !== "all"
									? "Try adjusting your search or filters"
									: "Get started by adding your first brand"
							}
							action={
								!searchQuery &&
								filterStatus === "all" && (
									<Button
										size="sm"
										onClick={() => setCreateModalOpen(true)}
										leftIcon={<Plus className="h-4 w-4" />}
									>
										Add Brand
									</Button>
								)
							}
						/>
					) : (
						<div className="overflow-x-auto">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Brand</TableHead>
										<TableHead>Slug</TableHead>
										<TableHead>Logo</TableHead>
										<TableHead>Status</TableHead>
										<TableHead>Products</TableHead>
										<TableHead className="text-right">Actions</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{filteredBrands.map((brand) => (
										<TableRow key={brand.id}>
											<TableCell>
												<div className="flex items-center gap-3">
													<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted overflow-hidden">
														{brand.logo_url ? (
															<img
																src={brand.logo_url}
																alt={brand.name}
																className="h-full w-full object-contain"
															/>
														) : (
															<Layers className="h-5 w-5 text-muted-foreground" />
														)}
													</div>
													<div>
														<p className="font-medium text-foreground">
															{brand.name}
														</p>
														<p className="text-xs text-muted-foreground">
															ID: {brand.id}
														</p>
													</div>
												</div>
											</TableCell>
											<TableCell>
												<div className="flex items-center gap-2">
													<LinkIcon className="h-4 w-4 text-muted-foreground" />
													<code className="text-sm text-muted-foreground">
														{brand.slug}
													</code>
												</div>
											</TableCell>
											<TableCell>
												{brand.logo_url ? (
													<div className="flex items-center gap-1.5 text-success">
														<CheckCircle2 className="h-4 w-4" />
														<span className="text-sm">Has Logo</span>
													</div>
												) : (
													<div className="flex items-center gap-1.5 text-muted-foreground">
														<XCircle className="h-4 w-4" />
														<span className="text-sm">No Logo</span>
													</div>
												)}
											</TableCell>
											<TableCell>
												<StatusBadge
													status={brand.is_active ? "success" : "error"}
												>
													{brand.is_active ? "Active" : "Inactive"}
												</StatusBadge>
											</TableCell>
											<TableCell>
												<div className="flex items-center gap-1.5 text-sm text-muted-foreground">
													<Package className="h-4 w-4" />
													{brand.product_count ?? 0}
												</div>
											</TableCell>
											<TableCell className="text-right">
												<DropdownMenu>
													<DropdownMenuTrigger asChild>
														<Button variant="ghost" size="icon-sm">
															<MoreHorizontal className="h-4 w-4" />
														</Button>
													</DropdownMenuTrigger>
													<DropdownMenuContent align="end">
														<DropdownMenuItem onClick={() => handleEdit(brand)}>
															<Pencil className="mr-2 h-4 w-4" />
															Edit Brand
														</DropdownMenuItem>
														<DropdownMenuItem
															onClick={() => handleToggleActive(brand)}
														>
															{brand.is_active ? (
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
															onClick={() => handleDelete(brand)}
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
			<CreateBrandModal
				open={createModalOpen}
				onOpenChange={setCreateModalOpen}
				onSuccess={handleCreateSuccess}
			/>

			{/* Edit Modal */}
			{selectedBrand && (
				<EditBrandModal
					open={editModalOpen}
					onOpenChange={setEditModalOpen}
					brand={selectedBrand}
					onSuccess={handleEditSuccess}
				/>
			)}

			{/* Delete Modal */}
			{selectedBrand && (
				<DeleteBrandModal
					open={deleteModalOpen}
					onOpenChange={setDeleteModalOpen}
					brand={selectedBrand}
					onSuccess={handleDeleteSuccess}
				/>
			)}
		</PageWrapper>
	);
}

// Helper function to generate slug
function generateSlug(name: string): string {
	return name
		.toLowerCase()
		.trim()
		.replace(/[^\w\s-]/g, "")
		.replace(/[\s_-]+/g, "-")
		.replace(/^-+|-+$/g, "");
}

// Create Brand Modal
function CreateBrandModal({
	open,
	onOpenChange,
	onSuccess,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSuccess: () => void;
}) {
	const [name, setName] = React.useState("");
	const [slug, setSlug] = React.useState("");
	const [logoUrl, setLogoUrl] = React.useState("");
	const [autoSlug, setAutoSlug] = React.useState(true);
	const [isSubmitting, setIsSubmitting] = React.useState(false);

	// Auto-generate slug from name
	React.useEffect(() => {
		if (autoSlug && name) {
			setSlug(generateSlug(name));
		}
	}, [name, autoSlug]);

	const handleSlugChange = (value: string) => {
		setAutoSlug(false);
		setSlug(value);
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!name.trim()) {
			toast.error("Brand name is required");
			return;
		}

		if (!slug.trim()) {
			toast.error("Slug is required");
			return;
		}

		setIsSubmitting(true);
		try {
			const res = await fetch("/api/admin/brands", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					name: name.trim(),
					slug: slug.trim(),
					logo_url: logoUrl.trim() || null,
				}),
			});

			if (!res.ok) {
				const error = await res.json();
				throw new Error(error.error || "Failed to create brand");
			}

			setName("");
			setSlug("");
			setLogoUrl("");
			setAutoSlug(true);
			onSuccess();
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : "Failed to create brand",
			);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent size="default">
				<DialogHeader>
					<DialogTitle>Add New Brand</DialogTitle>
					<DialogDescription>
						Create a new brand for products in your catalog
					</DialogDescription>
				</DialogHeader>
				<form onSubmit={handleSubmit} className="space-y-4">
					<Input
						label="Brand Name"
						placeholder="Enter brand name"
						value={name}
						onChange={(e) => setName(e.target.value)}
						required
					/>
					<div className="space-y-1.5">
						<Input
							label="Slug"
							placeholder="brand-slug"
							value={slug}
							onChange={(e) => handleSlugChange(e.target.value)}
							helperText="URL-friendly identifier (auto-generated from name)"
							required
						/>
					</div>
					<Input
						label="Logo URL"
						placeholder="https://example.com/logo.png"
						value={logoUrl}
						onChange={(e) => setLogoUrl(e.target.value)}
						helperText="Optional: URL to the brand's logo image"
					/>
					{logoUrl && (
						<div className="flex items-center gap-3 rounded-lg border border-border p-3">
							<div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted overflow-hidden">
								<img
									src={logoUrl}
									alt="Logo preview"
									className="h-full w-full object-contain"
									onError={(e) => {
										e.currentTarget.style.display = "none";
									}}
								/>
							</div>
							<p className="text-sm text-muted-foreground">Logo Preview</p>
						</div>
					)}
					<DialogFooter className="mt-6">
						<Button
							type="button"
							variant="outline"
							onClick={() => onOpenChange(false)}
						>
							Cancel
						</Button>
						<Button type="submit" isLoading={isSubmitting}>
							Create Brand
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}

// Edit Brand Modal
function EditBrandModal({
	open,
	onOpenChange,
	brand,
	onSuccess,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	brand: Brand;
	onSuccess: () => void;
}) {
	const [name, setName] = React.useState(brand.name);
	const [slug, setSlug] = React.useState(brand.slug);
	const [logoUrl, setLogoUrl] = React.useState(brand.logo_url || "");
	const [isActive, setIsActive] = React.useState(brand.is_active);
	const [isSubmitting, setIsSubmitting] = React.useState(false);

	React.useEffect(() => {
		setName(brand.name);
		setSlug(brand.slug);
		setLogoUrl(brand.logo_url || "");
		setIsActive(brand.is_active);
	}, [brand]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!name.trim()) {
			toast.error("Brand name is required");
			return;
		}

		if (!slug.trim()) {
			toast.error("Slug is required");
			return;
		}

		setIsSubmitting(true);
		try {
			const res = await fetch(`/api/admin/brands/${brand.id}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					name: name.trim(),
					slug: slug.trim(),
					logo_url: logoUrl.trim() || null,
					is_active: isActive,
				}),
			});

			if (!res.ok) {
				const error = await res.json();
				throw new Error(error.error || "Failed to update brand");
			}

			onSuccess();
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : "Failed to update brand",
			);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent size="default">
				<DialogHeader>
					<DialogTitle>Edit Brand</DialogTitle>
					<DialogDescription>
						Update brand details and settings
					</DialogDescription>
				</DialogHeader>
				<form onSubmit={handleSubmit} className="space-y-4">
					<Input
						label="Brand Name"
						placeholder="Enter brand name"
						value={name}
						onChange={(e) => setName(e.target.value)}
						required
					/>
					<Input
						label="Slug"
						placeholder="brand-slug"
						value={slug}
						onChange={(e) => setSlug(e.target.value)}
						helperText="URL-friendly identifier"
						required
					/>
					<Input
						label="Logo URL"
						placeholder="https://example.com/logo.png"
						value={logoUrl}
						onChange={(e) => setLogoUrl(e.target.value)}
						helperText="Optional: URL to the brand's logo image"
					/>
					{logoUrl && (
						<div className="flex items-center gap-3 rounded-lg border border-border p-3">
							<div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted overflow-hidden">
								<img
									src={logoUrl}
									alt="Logo preview"
									className="h-full w-full object-contain"
									onError={(e) => {
										e.currentTarget.style.display = "none";
									}}
								/>
							</div>
							<p className="text-sm text-muted-foreground">Logo Preview</p>
						</div>
					)}
					<div className="flex items-center justify-between rounded-lg border border-border p-3">
						<div>
							<p className="text-sm font-medium text-foreground">
								Active Status
							</p>
							<p className="text-xs text-muted-foreground">
								Inactive brands won&apos;t appear in the storefront
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

// Delete Brand Modal
function DeleteBrandModal({
	open,
	onOpenChange,
	brand,
	onSuccess,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	brand: Brand;
	onSuccess: () => void;
}) {
	const [isDeleting, setIsDeleting] = React.useState(false);
	const [confirmText, setConfirmText] = React.useState("");

	const handleDelete = async () => {
		if (confirmText !== brand.name) {
			toast.error("Please type the brand name to confirm");
			return;
		}

		setIsDeleting(true);
		try {
			const res = await fetch(`/api/admin/brands/${brand.id}`, {
				method: "DELETE",
			});

			if (!res.ok) {
				const error = await res.json();
				throw new Error(error.error || "Failed to delete brand");
			}

			setConfirmText("");
			onSuccess();
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : "Failed to delete brand",
			);
		} finally {
			setIsDeleting(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent size="sm">
				<DialogHeader>
					<DialogTitle className="text-destructive">Delete Brand</DialogTitle>
					<DialogDescription>
						This action cannot be undone. Products using this brand will need to
						be reassigned.
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
								<p className="text-foreground">{brand.name}</p>
								<p className="text-muted-foreground">Slug: {brand.slug}</p>
							</div>
						</div>
					</div>
					<Input
						label={`Type "${brand.name}" to confirm`}
						placeholder="Type brand name"
						value={confirmText}
						onChange={(e) => setConfirmText(e.target.value)}
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
					<Button
						variant="destructive"
						onClick={handleDelete}
						isLoading={isDeleting}
						disabled={confirmText !== brand.name}
					>
						Delete Brand
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
