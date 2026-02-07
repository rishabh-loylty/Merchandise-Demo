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
	Store,
	Plus,
	Search,
	MoreHorizontal,
	Pencil,
	Trash2,
	RefreshCw,
	CheckCircle2,
	XCircle,
	Settings,
	ExternalLink,
	Package,
	Mail,
	Calendar,
	ShoppingBag,
} from "lucide-react";
import useSWR from "swr";

// Types
interface Merchant {
	id: number;
	name: string;
	email: string;
	source_type: string;
	shopify_configured: boolean;
	is_active: boolean;
	created_at: string;
	product_count?: number;
	pending_count?: number;
}

const SOURCE_TYPES = [
	{ value: "SHOPIFY", label: "Shopify" },
	{ value: "WOOCOMMERCE", label: "WooCommerce" },
	{ value: "MAGENTO", label: "Magento" },
	{ value: "MANUAL", label: "Manual" },
];

export default function AdminMerchantsPage() {
	const {
		data: merchants,
		isLoading,
		mutate,
	} = useSWR<Merchant[]>("/api/admin/merchants", fetcher);

	const [searchQuery, setSearchQuery] = React.useState("");
	const [filterStatus, setFilterStatus] = React.useState<string>("all");
	const [createModalOpen, setCreateModalOpen] = React.useState(false);
	const [editModalOpen, setEditModalOpen] = React.useState(false);
	const [deleteModalOpen, setDeleteModalOpen] = React.useState(false);
	const [configureModalOpen, setConfigureModalOpen] = React.useState(false);
	const [selectedMerchant, setSelectedMerchant] =
		React.useState<Merchant | null>(null);

	// Filter merchants
	const filteredMerchants = React.useMemo(() => {
		if (!merchants) return [];
		return merchants.filter((m) => {
			const matchesSearch =
				m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
				m.email.toLowerCase().includes(searchQuery.toLowerCase());
			const matchesStatus =
				filterStatus === "all" ||
				(filterStatus === "active" && m.is_active) ||
				(filterStatus === "inactive" && !m.is_active) ||
				(filterStatus === "configured" && m.shopify_configured) ||
				(filterStatus === "unconfigured" && !m.shopify_configured);
			return matchesSearch && matchesStatus;
		});
	}, [merchants, searchQuery, filterStatus]);

	const handleEdit = (merchant: Merchant) => {
		setSelectedMerchant(merchant);
		setEditModalOpen(true);
	};

	const handleConfigure = (merchant: Merchant) => {
		setSelectedMerchant(merchant);
		setConfigureModalOpen(true);
	};

	const handleDelete = (merchant: Merchant) => {
		setSelectedMerchant(merchant);
		setDeleteModalOpen(true);
	};

	const handleCreateSuccess = () => {
		setCreateModalOpen(false);
		mutate();
		toast.success("Merchant created successfully");
	};

	const handleEditSuccess = () => {
		setEditModalOpen(false);
		setSelectedMerchant(null);
		mutate();
		toast.success("Merchant updated successfully");
	};

	const handleConfigureSuccess = () => {
		setConfigureModalOpen(false);
		setSelectedMerchant(null);
		mutate();
		toast.success("Shopify configuration saved successfully");
	};

	const handleDeleteSuccess = () => {
		setDeleteModalOpen(false);
		setSelectedMerchant(null);
		mutate();
		toast.success("Merchant deleted successfully");
	};

	const handleToggleActive = async (merchant: Merchant) => {
		try {
			const res = await fetch(`/api/admin/merchants/${merchant.id}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ is_active: !merchant.is_active }),
			});
			if (!res.ok) {
				const error = await res.json();
				throw new Error(error.error || "Failed to update merchant");
			}
			mutate();
			toast.success(
				merchant.is_active ? "Merchant deactivated" : "Merchant activated",
			);
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : "Failed to update merchant",
			);
		}
	};

	// Stats
	const stats = React.useMemo(() => {
		if (!merchants) return { total: 0, active: 0, configured: 0 };
		return {
			total: merchants.length,
			active: merchants.filter((m) => m.is_active).length,
			configured: merchants.filter((m) => m.shopify_configured).length,
		};
	}, [merchants]);

	return (
		<PageWrapper>
			<Container>
				<PageHeader
					title="Merchants"
					description="Manage merchant accounts and integrations"
					icon={Store}
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
								Add Merchant
							</Button>
						</div>
					}
				/>

				{/* Stats Cards */}
				<div className="mt-6 grid gap-4 sm:grid-cols-3">
					<Card padding="default">
						<div className="flex items-center gap-3">
							<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
								<Store className="h-5 w-5" />
							</div>
							<div>
								<p className="text-2xl font-bold text-foreground">
									{stats.total}
								</p>
								<p className="text-sm text-muted-foreground">Total Merchants</p>
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
									Active Merchants
								</p>
							</div>
						</div>
					</Card>
					<Card padding="default">
						<div className="flex items-center gap-3">
							<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10 text-warning">
								<Settings className="h-5 w-5" />
							</div>
							<div>
								<p className="text-2xl font-bold text-foreground">
									{stats.configured}
								</p>
								<p className="text-sm text-muted-foreground">
									Shopify Configured
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
								placeholder="Search merchants..."
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
									<SelectItem value="all">All Merchants</SelectItem>
									<SelectItem value="active">Active Only</SelectItem>
									<SelectItem value="inactive">Inactive Only</SelectItem>
									<SelectItem value="configured">Shopify Configured</SelectItem>
									<SelectItem value="unconfigured">Not Configured</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>
				</Card>

				{/* Merchants Table */}
				<Card className="mt-6" padding="none">
					{isLoading ? (
						<div className="flex items-center justify-center py-12">
							<div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
						</div>
					) : filteredMerchants.length === 0 ? (
						<TableEmpty
							icon={<Store className="h-12 w-12" />}
							title="No merchants found"
							description={
								searchQuery || filterStatus !== "all"
									? "Try adjusting your search or filters"
									: "Get started by adding your first merchant"
							}
							action={
								!searchQuery &&
								filterStatus === "all" && (
									<Button
										size="sm"
										onClick={() => setCreateModalOpen(true)}
										leftIcon={<Plus className="h-4 w-4" />}
									>
										Add Merchant
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
										<TableHead>Email</TableHead>
										<TableHead>Source</TableHead>
										<TableHead>Status</TableHead>
										<TableHead>Shopify</TableHead>
										<TableHead>Created</TableHead>
										<TableHead className="text-right">Actions</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{filteredMerchants.map((merchant) => (
										<TableRow key={merchant.id}>
											<TableCell>
												<div className="flex items-center gap-3">
													<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
														<Store className="h-5 w-5 text-muted-foreground" />
													</div>
													<div>
														<p className="font-medium text-foreground">
															{merchant.name}
														</p>
														<p className="text-xs text-muted-foreground">
															ID: {merchant.id}
														</p>
													</div>
												</div>
											</TableCell>
											<TableCell>
												<div className="flex items-center gap-2">
													<Mail className="h-4 w-4 text-muted-foreground" />
													<span className="text-sm">{merchant.email}</span>
												</div>
											</TableCell>
											<TableCell>
												<Badge variant="secondary" size="sm">
													{merchant.source_type}
												</Badge>
											</TableCell>
											<TableCell>
												<StatusBadge
													status={merchant.is_active ? "success" : "error"}
												>
													{merchant.is_active ? "Active" : "Inactive"}
												</StatusBadge>
											</TableCell>
											<TableCell>
												{merchant.shopify_configured ? (
													<div className="flex items-center gap-1.5 text-success">
														<CheckCircle2 className="h-4 w-4" />
														<span className="text-sm">Connected</span>
													</div>
												) : (
													<div className="flex items-center gap-1.5 text-muted-foreground">
														<XCircle className="h-4 w-4" />
														<span className="text-sm">Not Connected</span>
													</div>
												)}
											</TableCell>
											<TableCell>
												<div className="flex items-center gap-1.5 text-sm text-muted-foreground">
													<Calendar className="h-4 w-4" />
													{new Date(merchant.created_at).toLocaleDateString()}
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
															onClick={() => handleEdit(merchant)}
														>
															<Pencil className="mr-2 h-4 w-4" />
															Edit Details
														</DropdownMenuItem>
														<DropdownMenuItem
															onClick={() => handleConfigure(merchant)}
														>
															<Settings className="mr-2 h-4 w-4" />
															Configure Shopify
														</DropdownMenuItem>
														<DropdownMenuItem
															onClick={() => handleToggleActive(merchant)}
														>
															{merchant.is_active ? (
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
															onClick={() => handleDelete(merchant)}
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
			<CreateMerchantModal
				open={createModalOpen}
				onOpenChange={setCreateModalOpen}
				onSuccess={handleCreateSuccess}
			/>

			{/* Edit Modal */}
			{selectedMerchant && (
				<EditMerchantModal
					open={editModalOpen}
					onOpenChange={setEditModalOpen}
					merchant={selectedMerchant}
					onSuccess={handleEditSuccess}
				/>
			)}

			{/* Configure Shopify Modal */}
			{selectedMerchant && (
				<ConfigureShopifyModal
					open={configureModalOpen}
					onOpenChange={setConfigureModalOpen}
					merchant={selectedMerchant}
					onSuccess={handleConfigureSuccess}
				/>
			)}

			{/* Delete Modal */}
			{selectedMerchant && (
				<DeleteMerchantModal
					open={deleteModalOpen}
					onOpenChange={setDeleteModalOpen}
					merchant={selectedMerchant}
					onSuccess={handleDeleteSuccess}
				/>
			)}
		</PageWrapper>
	);
}

// Create Merchant Modal
function CreateMerchantModal({
	open,
	onOpenChange,
	onSuccess,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSuccess: () => void;
}) {
	const [name, setName] = React.useState("");
	const [email, setEmail] = React.useState("");
	const [sourceType, setSourceType] = React.useState("SHOPIFY");
	const [isSubmitting, setIsSubmitting] = React.useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!name.trim() || !email.trim()) {
			toast.error("Name and email are required");
			return;
		}

		setIsSubmitting(true);
		try {
			const res = await fetch("/api/admin/merchants", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					name: name.trim(),
					email: email.trim(),
					source_type: sourceType,
				}),
			});

			if (!res.ok) {
				const error = await res.json();
				throw new Error(error.error || "Failed to create merchant");
			}

			setName("");
			setEmail("");
			setSourceType("SHOPIFY");
			onSuccess();
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : "Failed to create merchant",
			);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent size="default">
				<DialogHeader>
					<DialogTitle>Add New Merchant</DialogTitle>
					<DialogDescription>
						Create a new merchant account to start selling products
					</DialogDescription>
				</DialogHeader>
				<form onSubmit={handleSubmit} className="space-y-4">
					<Input
						label="Merchant Name"
						placeholder="Enter merchant name"
						value={name}
						onChange={(e) => setName(e.target.value)}
						required
					/>
					<Input
						label="Email Address"
						type="email"
						placeholder="merchant@example.com"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						required
					/>
					<div className="space-y-1.5">
						<label className="text-sm font-medium text-foreground">
							Source Type
						</label>
						<Select value={sourceType} onValueChange={setSourceType}>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{SOURCE_TYPES.map((type) => (
									<SelectItem key={type.value} value={type.value}>
										{type.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
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
							Create Merchant
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}

// Edit Merchant Modal
function EditMerchantModal({
	open,
	onOpenChange,
	merchant,
	onSuccess,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	merchant: Merchant;
	onSuccess: () => void;
}) {
	const [name, setName] = React.useState(merchant.name);
	const [email, setEmail] = React.useState(merchant.email);
	const [sourceType, setSourceType] = React.useState(merchant.source_type);
	const [isActive, setIsActive] = React.useState(merchant.is_active);
	const [isSubmitting, setIsSubmitting] = React.useState(false);

	React.useEffect(() => {
		setName(merchant.name);
		setEmail(merchant.email);
		setSourceType(merchant.source_type);
		setIsActive(merchant.is_active);
	}, [merchant]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!name.trim() || !email.trim()) {
			toast.error("Name and email are required");
			return;
		}

		setIsSubmitting(true);
		try {
			const res = await fetch(`/api/admin/merchants/${merchant.id}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					name: name.trim(),
					email: email.trim(),
					source_type: sourceType,
					is_active: isActive,
				}),
			});

			if (!res.ok) {
				const error = await res.json();
				throw new Error(error.error || "Failed to update merchant");
			}

			onSuccess();
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : "Failed to update merchant",
			);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent size="default">
				<DialogHeader>
					<DialogTitle>Edit Merchant</DialogTitle>
					<DialogDescription>
						Update merchant details and settings
					</DialogDescription>
				</DialogHeader>
				<form onSubmit={handleSubmit} className="space-y-4">
					<Input
						label="Merchant Name"
						placeholder="Enter merchant name"
						value={name}
						onChange={(e) => setName(e.target.value)}
						required
					/>
					<Input
						label="Email Address"
						type="email"
						placeholder="merchant@example.com"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						required
					/>
					<div className="space-y-1.5">
						<label className="text-sm font-medium text-foreground">
							Source Type
						</label>
						<Select value={sourceType} onValueChange={setSourceType}>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{SOURCE_TYPES.map((type) => (
									<SelectItem key={type.value} value={type.value}>
										{type.label}
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
								Inactive merchants cannot sync or sell products
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

// Configure Shopify Modal
function ConfigureShopifyModal({
	open,
	onOpenChange,
	merchant,
	onSuccess,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	merchant: Merchant;
	onSuccess: () => void;
}) {
	const [storeUrl, setStoreUrl] = React.useState("");
	const [accessToken, setAccessToken] = React.useState("");
	const [isSubmitting, setIsSubmitting] = React.useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!storeUrl.trim() || !accessToken.trim()) {
			toast.error("Store URL and access token are required");
			return;
		}

		setIsSubmitting(true);
		try {
			const res = await fetch(`/api/admin/merchants/${merchant.id}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					shopify_configured: true,
					source_config: {
						store_url: storeUrl.trim(),
						access_token: accessToken.trim(),
					},
				}),
			});

			if (!res.ok) {
				const error = await res.json();
				throw new Error(error.error || "Failed to configure Shopify");
			}

			setStoreUrl("");
			setAccessToken("");
			onSuccess();
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : "Failed to configure Shopify",
			);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent size="default">
				<DialogHeader>
					<DialogTitle>Configure Shopify Integration</DialogTitle>
					<DialogDescription>
						Connect {merchant.name}&apos;s Shopify store to sync products
					</DialogDescription>
				</DialogHeader>
				<form onSubmit={handleSubmit} className="space-y-4">
					<div className="rounded-lg bg-muted/50 p-4">
						<div className="flex items-start gap-3">
							<ShoppingBag className="mt-0.5 h-5 w-5 text-primary" />
							<div className="text-sm">
								<p className="font-medium text-foreground">
									Shopify API Credentials
								</p>
								<p className="text-muted-foreground">
									You&apos;ll need to create a private app in your Shopify admin
									to get these credentials.
								</p>
							</div>
						</div>
					</div>
					<Input
						label="Store URL"
						placeholder="your-store.myshopify.com"
						value={storeUrl}
						onChange={(e) => setStoreUrl(e.target.value)}
						helperText="Your Shopify store domain (without https://)"
						required
					/>
					<Input
						label="Access Token"
						type="password"
						placeholder="shpat_xxxxxxxxxxxx"
						value={accessToken}
						onChange={(e) => setAccessToken(e.target.value)}
						helperText="Admin API access token from your Shopify private app"
						required
					/>
					<DialogFooter className="mt-6">
						<Button
							type="button"
							variant="outline"
							onClick={() => onOpenChange(false)}
						>
							Cancel
						</Button>
						<Button type="submit" isLoading={isSubmitting}>
							Save Configuration
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}

// Delete Merchant Modal
function DeleteMerchantModal({
	open,
	onOpenChange,
	merchant,
	onSuccess,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	merchant: Merchant;
	onSuccess: () => void;
}) {
	const [isDeleting, setIsDeleting] = React.useState(false);
	const [confirmText, setConfirmText] = React.useState("");

	const handleDelete = async () => {
		if (confirmText !== merchant.name) {
			toast.error("Please type the merchant name to confirm");
			return;
		}

		setIsDeleting(true);
		try {
			const res = await fetch(`/api/admin/merchants/${merchant.id}`, {
				method: "DELETE",
			});

			if (!res.ok) {
				const error = await res.json();
				throw new Error(error.error || "Failed to delete merchant");
			}

			setConfirmText("");
			onSuccess();
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : "Failed to delete merchant",
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
						Delete Merchant
					</DialogTitle>
					<DialogDescription>
						This action cannot be undone. This will permanently delete the
						merchant account and all associated data.
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
								<p className="text-foreground">{merchant.name}</p>
								<p className="text-muted-foreground">{merchant.email}</p>
							</div>
						</div>
					</div>
					<Input
						label={`Type "${merchant.name}" to confirm`}
						placeholder="Type merchant name"
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
						disabled={confirmText !== merchant.name}
					>
						Delete Merchant
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
