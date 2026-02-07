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
	Package,
	Plus,
	Search,
	MoreHorizontal,
	Pencil,
	Trash2,
	RefreshCw,
	CheckCircle2,
	XCircle,
	FolderTree,
	ChevronRight,
	Link as LinkIcon,
	Folder,
	FolderOpen,
} from "lucide-react";
import useSWR from "swr";

// Types
interface Category {
	id: number;
	parent_id: number | null;
	name: string;
	slug: string;
	icon: string | null;
	path: string | null;
	is_active: boolean;
	created_at?: string;
	product_count?: number;
	children?: Category[];
}

export default function AdminCategoriesPage() {
	const {
		data: categories,
		isLoading,
		mutate,
	} = useSWR<Category[]>("/api/admin/categories", fetcher);

	const [searchQuery, setSearchQuery] = React.useState("");
	const [filterStatus, setFilterStatus] = React.useState<string>("all");
	const [filterLevel, setFilterLevel] = React.useState<string>("all");
	const [createModalOpen, setCreateModalOpen] = React.useState(false);
	const [editModalOpen, setEditModalOpen] = React.useState(false);
	const [deleteModalOpen, setDeleteModalOpen] = React.useState(false);
	const [selectedCategory, setSelectedCategory] =
		React.useState<Category | null>(null);
	const [expandedCategories, setExpandedCategories] = React.useState<
		Set<number>
	>(new Set());

	// Flatten categories for easier filtering and display
	const flatCategories = React.useMemo(() => {
		if (!categories) return [];
		const flat: Category[] = [];
		const flatten = (cats: Category[], level = 0) => {
			for (const cat of cats) {
				flat.push({ ...cat, path: cat.path || cat.name });
				if (cat.children && cat.children.length > 0) {
					flatten(cat.children, level + 1);
				}
			}
		};
		flatten(categories);
		return flat;
	}, [categories]);

	// Top-level categories for parent selection
	const topLevelCategories = React.useMemo(() => {
		return flatCategories.filter((c) => c.parent_id === null);
	}, [flatCategories]);

	// Filter categories
	const filteredCategories = React.useMemo(() => {
		return flatCategories.filter((c) => {
			const matchesSearch =
				c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
				c.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
				(c.path && c.path.toLowerCase().includes(searchQuery.toLowerCase()));
			const matchesStatus =
				filterStatus === "all" ||
				(filterStatus === "active" && c.is_active) ||
				(filterStatus === "inactive" && !c.is_active);
			const matchesLevel =
				filterLevel === "all" ||
				(filterLevel === "top" && c.parent_id === null) ||
				(filterLevel === "sub" && c.parent_id !== null);
			return matchesSearch && matchesStatus && matchesLevel;
		});
	}, [flatCategories, searchQuery, filterStatus, filterLevel]);

	const handleEdit = (category: Category) => {
		setSelectedCategory(category);
		setEditModalOpen(true);
	};

	const handleDelete = (category: Category) => {
		setSelectedCategory(category);
		setDeleteModalOpen(true);
	};

	const handleCreateSuccess = () => {
		setCreateModalOpen(false);
		mutate();
		toast.success("Category created successfully");
	};

	const handleEditSuccess = () => {
		setEditModalOpen(false);
		setSelectedCategory(null);
		mutate();
		toast.success("Category updated successfully");
	};

	const handleDeleteSuccess = () => {
		setDeleteModalOpen(false);
		setSelectedCategory(null);
		mutate();
		toast.success("Category deleted successfully");
	};

	const handleToggleActive = async (category: Category) => {
		try {
			const res = await fetch(`/api/admin/categories/${category.id}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ is_active: !category.is_active }),
			});
			if (!res.ok) {
				const error = await res.json();
				throw new Error(error.error || "Failed to update category");
			}
			mutate();
			toast.success(
				category.is_active ? "Category deactivated" : "Category activated",
			);
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : "Failed to update category",
			);
		}
	};

	const toggleExpanded = (categoryId: number) => {
		setExpandedCategories((prev) => {
			const next = new Set(prev);
			if (next.has(categoryId)) {
				next.delete(categoryId);
			} else {
				next.add(categoryId);
			}
			return next;
		});
	};

	// Stats
	const stats = React.useMemo(() => {
		if (!flatCategories) return { total: 0, active: 0, topLevel: 0 };
		return {
			total: flatCategories.length,
			active: flatCategories.filter((c) => c.is_active).length,
			topLevel: flatCategories.filter((c) => c.parent_id === null).length,
		};
	}, [flatCategories]);

	// Get parent category name
	const getParentName = (parentId: number | null) => {
		if (!parentId) return null;
		const parent = flatCategories.find((c) => c.id === parentId);
		return parent?.name || "Unknown";
	};

	return (
		<PageWrapper>
			<Container>
				<PageHeader
					title="Categories"
					description="Manage product categories and hierarchy"
					icon={FolderTree}
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
								Add Category
							</Button>
						</div>
					}
				/>

				{/* Stats Cards */}
				<div className="mt-6 grid gap-4 sm:grid-cols-3">
					<Card padding="default">
						<div className="flex items-center gap-3">
							<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
								<FolderTree className="h-5 w-5" />
							</div>
							<div>
								<p className="text-2xl font-bold text-foreground">
									{stats.total}
								</p>
								<p className="text-sm text-muted-foreground">
									Total Categories
								</p>
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
								<p className="text-sm text-muted-foreground">
									Active Categories
								</p>
							</div>
						</div>
					</Card>
					<Card padding="default">
						<div className="flex items-center gap-3">
							<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10 text-warning">
								<Folder className="h-5 w-5" />
							</div>
							<div>
								<p className="text-2xl font-bold text-foreground">
									{stats.topLevel}
								</p>
								<p className="text-sm text-muted-foreground">
									Top-Level Categories
								</p>
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
								placeholder="Search categories..."
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="pl-9"
							/>
						</div>
						<div className="flex items-center gap-2">
							<Select value={filterLevel} onValueChange={setFilterLevel}>
								<SelectTrigger className="w-[140px]">
									<SelectValue placeholder="Level" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">All Levels</SelectItem>
									<SelectItem value="top">Top Level</SelectItem>
									<SelectItem value="sub">Subcategories</SelectItem>
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

				{/* Categories Table */}
				<Card className="mt-6" padding="none">
					{isLoading ? (
						<div className="flex items-center justify-center py-12">
							<div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
						</div>
					) : filteredCategories.length === 0 ? (
						<TableEmpty
							icon={<FolderTree className="h-12 w-12" />}
							title="No categories found"
							description={
								searchQuery || filterStatus !== "all" || filterLevel !== "all"
									? "Try adjusting your search or filters"
									: "Get started by adding your first category"
							}
							action={
								!searchQuery &&
								filterStatus === "all" &&
								filterLevel === "all" && (
									<Button
										size="sm"
										onClick={() => setCreateModalOpen(true)}
										leftIcon={<Plus className="h-4 w-4" />}
									>
										Add Category
									</Button>
								)
							}
						/>
					) : (
						<div className="overflow-x-auto">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Category</TableHead>
										<TableHead>Slug</TableHead>
										<TableHead>Parent</TableHead>
										<TableHead>Status</TableHead>
										<TableHead>Products</TableHead>
										<TableHead className="text-right">Actions</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{filteredCategories.map((category) => (
										<TableRow key={category.id}>
											<TableCell>
												<div className="flex items-center gap-3">
													<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
														{category.parent_id ? (
															<Folder className="h-5 w-5 text-muted-foreground" />
														) : (
															<FolderOpen className="h-5 w-5 text-primary" />
														)}
													</div>
													<div>
														<p className="font-medium text-foreground">
															{category.name}
														</p>
														{category.path &&
															category.path !== category.name && (
																<p className="text-xs text-muted-foreground flex items-center gap-1">
																	<ChevronRight className="h-3 w-3" />
																	{category.path}
																</p>
															)}
													</div>
												</div>
											</TableCell>
											<TableCell>
												<div className="flex items-center gap-2">
													<LinkIcon className="h-4 w-4 text-muted-foreground" />
													<code className="text-sm text-muted-foreground">
														{category.slug}
													</code>
												</div>
											</TableCell>
											<TableCell>
												{category.parent_id ? (
													<Badge variant="secondary" size="sm">
														{getParentName(category.parent_id)}
													</Badge>
												) : (
													<span className="text-sm text-muted-foreground">
														—
													</span>
												)}
											</TableCell>
											<TableCell>
												<StatusBadge
													status={category.is_active ? "success" : "error"}
												>
													{category.is_active ? "Active" : "Inactive"}
												</StatusBadge>
											</TableCell>
											<TableCell>
												<div className="flex items-center gap-1.5 text-sm text-muted-foreground">
													<Package className="h-4 w-4" />
													{category.product_count ?? 0}
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
														<DropdownMenuItem
															onClick={() => handleEdit(category)}
														>
															<Pencil className="mr-2 h-4 w-4" />
															Edit Category
														</DropdownMenuItem>
														<DropdownMenuItem
															onClick={() => handleToggleActive(category)}
														>
															{category.is_active ? (
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
															onClick={() => handleDelete(category)}
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
			<CreateCategoryModal
				open={createModalOpen}
				onOpenChange={setCreateModalOpen}
				onSuccess={handleCreateSuccess}
				categories={flatCategories}
			/>

			{/* Edit Modal */}
			{selectedCategory && (
				<EditCategoryModal
					open={editModalOpen}
					onOpenChange={setEditModalOpen}
					category={selectedCategory}
					categories={flatCategories}
					onSuccess={handleEditSuccess}
				/>
			)}

			{/* Delete Modal */}
			{selectedCategory && (
				<DeleteCategoryModal
					open={deleteModalOpen}
					onOpenChange={setDeleteModalOpen}
					category={selectedCategory}
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

// Create Category Modal
function CreateCategoryModal({
	open,
	onOpenChange,
	onSuccess,
	categories,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSuccess: () => void;
	categories: Category[];
}) {
	const [name, setName] = React.useState("");
	const [slug, setSlug] = React.useState("");
	const [parentId, setParentId] = React.useState<string>("none");
	const [autoSlug, setAutoSlug] = React.useState(true);
	const [isSubmitting, setIsSubmitting] = React.useState(false);

	// Only top-level categories can be parents
	const topLevelCategories = categories.filter((c) => c.parent_id === null);

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
			toast.error("Category name is required");
			return;
		}

		if (!slug.trim()) {
			toast.error("Slug is required");
			return;
		}

		setIsSubmitting(true);
		try {
			const res = await fetch("/api/admin/categories", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					name: name.trim(),
					slug: slug.trim(),
					parent_id: parentId === "none" ? null : Number(parentId),
				}),
			});

			if (!res.ok) {
				const error = await res.json();
				throw new Error(error.error || "Failed to create category");
			}

			setName("");
			setSlug("");
			setParentId("none");
			setAutoSlug(true);
			onSuccess();
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : "Failed to create category",
			);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent size="default">
				<DialogHeader>
					<DialogTitle>Add New Category</DialogTitle>
					<DialogDescription>
						Create a new category to organize products
					</DialogDescription>
				</DialogHeader>
				<form onSubmit={handleSubmit} className="space-y-4">
					<Input
						label="Category Name"
						placeholder="Enter category name"
						value={name}
						onChange={(e) => setName(e.target.value)}
						required
					/>
					<Input
						label="Slug"
						placeholder="category-slug"
						value={slug}
						onChange={(e) => handleSlugChange(e.target.value)}
						helperText="URL-friendly identifier (auto-generated from name)"
						required
					/>
					<div className="space-y-1.5">
						<label className="text-sm font-medium text-foreground">
							Parent Category
						</label>
						<Select value={parentId} onValueChange={setParentId}>
							<SelectTrigger>
								<SelectValue placeholder="Select parent (optional)" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="none">
									<span className="flex items-center gap-2">
										<FolderOpen className="h-4 w-4" />
										No Parent (Top Level)
									</span>
								</SelectItem>
								{topLevelCategories.map((cat) => (
									<SelectItem key={cat.id} value={cat.id.toString()}>
										<span className="flex items-center gap-2">
											<Folder className="h-4 w-4" />
											{cat.name}
										</span>
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						<p className="text-xs text-muted-foreground">
							Leave empty to create a top-level category
						</p>
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
							Create Category
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}

// Edit Category Modal
function EditCategoryModal({
	open,
	onOpenChange,
	category,
	categories,
	onSuccess,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	category: Category;
	categories: Category[];
	onSuccess: () => void;
}) {
	const [name, setName] = React.useState(category.name);
	const [slug, setSlug] = React.useState(category.slug);
	const [parentId, setParentId] = React.useState<string>(
		category.parent_id?.toString() || "none",
	);
	const [isActive, setIsActive] = React.useState(category.is_active);
	const [isSubmitting, setIsSubmitting] = React.useState(false);

	// Only top-level categories can be parents (excluding current category)
	const topLevelCategories = categories.filter(
		(c) => c.parent_id === null && c.id !== category.id,
	);

	React.useEffect(() => {
		setName(category.name);
		setSlug(category.slug);
		setParentId(category.parent_id?.toString() || "none");
		setIsActive(category.is_active);
	}, [category]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!name.trim()) {
			toast.error("Category name is required");
			return;
		}

		if (!slug.trim()) {
			toast.error("Slug is required");
			return;
		}

		setIsSubmitting(true);
		try {
			const res = await fetch(`/api/admin/categories/${category.id}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					name: name.trim(),
					slug: slug.trim(),
					parent_id: parentId === "none" ? null : Number(parentId),
					is_active: isActive,
				}),
			});

			if (!res.ok) {
				const error = await res.json();
				throw new Error(error.error || "Failed to update category");
			}

			onSuccess();
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : "Failed to update category",
			);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent size="default">
				<DialogHeader>
					<DialogTitle>Edit Category</DialogTitle>
					<DialogDescription>
						Update category details and hierarchy
					</DialogDescription>
				</DialogHeader>
				<form onSubmit={handleSubmit} className="space-y-4">
					<Input
						label="Category Name"
						placeholder="Enter category name"
						value={name}
						onChange={(e) => setName(e.target.value)}
						required
					/>
					<Input
						label="Slug"
						placeholder="category-slug"
						value={slug}
						onChange={(e) => setSlug(e.target.value)}
						helperText="URL-friendly identifier"
						required
					/>
					<div className="space-y-1.5">
						<label className="text-sm font-medium text-foreground">
							Parent Category
						</label>
						<Select value={parentId} onValueChange={setParentId}>
							<SelectTrigger>
								<SelectValue placeholder="Select parent (optional)" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="none">
									<span className="flex items-center gap-2">
										<FolderOpen className="h-4 w-4" />
										No Parent (Top Level)
									</span>
								</SelectItem>
								{topLevelCategories.map((cat) => (
									<SelectItem key={cat.id} value={cat.id.toString()}>
										<span className="flex items-center gap-2">
											<Folder className="h-4 w-4" />
											{cat.name}
										</span>
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					<div className="flex items-center justify-between rounded-lg border border-border p-3">
						<div>
							<p className="text-sm font-medium text-foreground">
								Active Status
							</p>
							<p className="text-xs text-muted-foreground">
								Inactive categories won&apos;t appear in the storefront
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

// Delete Category Modal
function DeleteCategoryModal({
	open,
	onOpenChange,
	category,
	onSuccess,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	category: Category;
	onSuccess: () => void;
}) {
	const [isDeleting, setIsDeleting] = React.useState(false);
	const [confirmText, setConfirmText] = React.useState("");

	const handleDelete = async () => {
		if (confirmText !== category.name) {
			toast.error("Please type the category name to confirm");
			return;
		}

		setIsDeleting(true);
		try {
			const res = await fetch(`/api/admin/categories/${category.id}`, {
				method: "DELETE",
			});

			if (!res.ok) {
				const error = await res.json();
				throw new Error(error.error || "Failed to delete category");
			}

			setConfirmText("");
			onSuccess();
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : "Failed to delete category",
			);
		} finally {
			setIsDeleting(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent size="sm">
				<DialogHeader>
					<DialogTitle className="text-destructive">
						Delete Category
					</DialogTitle>
					<DialogDescription>
						This action cannot be undone. Subcategories will become top-level
						categories.
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
								<p className="text-foreground">{category.name}</p>
								<p className="text-muted-foreground">Slug: {category.slug}</p>
								{category.path && category.path !== category.name && (
									<p className="text-muted-foreground">Path: {category.path}</p>
								)}
							</div>
						</div>
					</div>
					<Input
						label={`Type "${category.name}" to confirm`}
						placeholder="Type category name"
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
						disabled={confirmText !== category.name}
					>
						Delete Category
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
