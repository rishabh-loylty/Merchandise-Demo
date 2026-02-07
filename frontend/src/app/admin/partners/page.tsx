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
	PageSection,
} from "@/components/layout/page-header";
import { toast } from "@/components/providers";
import {
	Building2,
	Plus,
	Search,
	MoreHorizontal,
	Pencil,
	Trash2,
	RefreshCw,
	CreditCard,
	Percent,
	CheckCircle2,
	XCircle,
	ArrowUpDown,
	Settings,
} from "lucide-react";
import useSWR from "swr";

// Types
interface LoyaltyPartner {
	id: number;
	name: string;
	is_active: boolean;
	configuration: Record<string, unknown> | null;
	points_to_currency_rate: number | null;
	currency_code: string | null;
	created_at?: string;
}

interface ConversionRule {
	id: number;
	partner_id: number;
	currency_code: string;
	points_to_currency_rate: number;
	valid_from: string;
	valid_to: string | null;
	is_active: boolean;
}

export default function AdminPartnersPage() {
	const {
		data: partners,
		isLoading,
		mutate,
	} = useSWR<LoyaltyPartner[]>("/api/partners", fetcher);

	const [searchQuery, setSearchQuery] = React.useState("");
	const [createModalOpen, setCreateModalOpen] = React.useState(false);
	const [editModalOpen, setEditModalOpen] = React.useState(false);
	const [rateModalOpen, setRateModalOpen] = React.useState(false);
	const [deleteModalOpen, setDeleteModalOpen] = React.useState(false);
	const [selectedPartner, setSelectedPartner] =
		React.useState<LoyaltyPartner | null>(null);

	// Filter partners
	const filteredPartners = React.useMemo(() => {
		if (!partners) return [];
		return partners.filter((p) =>
			p.name.toLowerCase().includes(searchQuery.toLowerCase()),
		);
	}, [partners, searchQuery]);

	const handleEdit = (partner: LoyaltyPartner) => {
		setSelectedPartner(partner);
		setEditModalOpen(true);
	};

	const handleEditRate = (partner: LoyaltyPartner) => {
		setSelectedPartner(partner);
		setRateModalOpen(true);
	};

	const handleDelete = (partner: LoyaltyPartner) => {
		setSelectedPartner(partner);
		setDeleteModalOpen(true);
	};

	const handleCreateSuccess = () => {
		setCreateModalOpen(false);
		mutate();
		toast.success("Partner created successfully");
	};

	const handleEditSuccess = () => {
		setEditModalOpen(false);
		setSelectedPartner(null);
		mutate();
		toast.success("Partner updated successfully");
	};

	const handleRateSuccess = () => {
		setRateModalOpen(false);
		setSelectedPartner(null);
		mutate();
		toast.success("Conversion rate updated successfully");
	};

	const handleDeleteSuccess = () => {
		setDeleteModalOpen(false);
		setSelectedPartner(null);
		mutate();
		toast.success("Partner deleted successfully");
	};

	return (
		<PageWrapper>
			<Container>
				<PageHeader
					title="Loyalty Partners"
					description="Manage bank and loyalty program partnerships"
					icon={Building2}
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
								Add Partner
							</Button>
						</div>
					}
				/>

				{/* Stats */}
				<div className="mt-6 grid gap-4 sm:grid-cols-3">
					<Card padding="default">
						<div className="flex items-center gap-3">
							<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-primary">
								<Building2 className="h-5 w-5" />
							</div>
							<div>
								<p className="text-sm text-muted-foreground">Total Partners</p>
								<p className="text-2xl font-bold text-foreground">
									{partners?.length ?? 0}
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
								<p className="text-sm text-muted-foreground">Active Partners</p>
								<p className="text-2xl font-bold text-foreground">
									{partners?.filter((p) => p.is_active).length ?? 0}
								</p>
							</div>
						</div>
					</Card>
					<Card padding="default">
						<div className="flex items-center gap-3">
							<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10 text-warning">
								<Percent className="h-5 w-5" />
							</div>
							<div>
								<p className="text-sm text-muted-foreground">Avg. Rate</p>
								<p className="text-2xl font-bold text-foreground">
									₹
									{partners && partners.length > 0
										? (
												partners.reduce(
													(sum, p) => sum + (p.points_to_currency_rate ?? 0),
													0,
												) / partners.length
											).toFixed(2)
										: "0"}
									/pt
								</p>
							</div>
						</div>
					</Card>
				</div>

				{/* Filters */}
				<Card className="mt-6" padding="sm">
					<div className="flex items-center gap-3">
						<div className="relative flex-1 max-w-md">
							<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
							<Input
								placeholder="Search partners..."
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="pl-10"
								inputSize="sm"
							/>
						</div>
					</div>
				</Card>

				{/* Partners Table */}
				<Card className="mt-6" padding="none">
					{isLoading ? (
						<div className="flex items-center justify-center py-20">
							<div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
						</div>
					) : filteredPartners.length === 0 ? (
						<div className="flex flex-col items-center justify-center py-20 text-center">
							<Building2 className="mb-4 h-16 w-16 text-muted-foreground" />
							<h3 className="mb-2 text-xl font-semibold text-foreground">
								No partners found
							</h3>
							<p className="text-muted-foreground">
								{searchQuery
									? "Try adjusting your search criteria."
									: "Add your first loyalty partner to get started."}
							</p>
							{!searchQuery && (
								<Button
									className="mt-4"
									onClick={() => setCreateModalOpen(true)}
									leftIcon={<Plus className="h-4 w-4" />}
								>
									Add Partner
								</Button>
							)}
						</div>
					) : (
						<div className="overflow-x-auto">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead className="w-[300px]">Partner</TableHead>
										<TableHead>Conversion Rate</TableHead>
										<TableHead>Currency</TableHead>
										<TableHead>Status</TableHead>
										<TableHead className="text-right">Actions</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{filteredPartners.map((partner) => (
										<TableRow key={partner.id}>
											<TableCell>
												<div className="flex items-center gap-3">
													<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent">
														<CreditCard className="h-5 w-5 text-primary" />
													</div>
													<div>
														<p className="font-medium text-foreground">
															{partner.name}
														</p>
														<p className="text-xs text-muted-foreground">
															ID: {partner.id}
														</p>
													</div>
												</div>
											</TableCell>
											<TableCell>
												<div className="flex items-center gap-2">
													<span className="font-mono text-lg font-semibold text-foreground">
														₹{partner.points_to_currency_rate ?? 0}
													</span>
													<span className="text-sm text-muted-foreground">
														per point
													</span>
												</div>
											</TableCell>
											<TableCell>
												<Badge variant="outline">
													{partner.currency_code ?? "INR"}
												</Badge>
											</TableCell>
											<TableCell>
												<StatusBadge
													status={partner.is_active ? "active" : "inactive"}
												/>
											</TableCell>
											<TableCell className="text-right">
												<DropdownMenu>
													<DropdownMenuTrigger asChild>
														<Button variant="ghost" size="icon-sm">
															<MoreHorizontal className="h-4 w-4" />
														</Button>
													</DropdownMenuTrigger>
													<DropdownMenuContent align="end">
														<DropdownMenuItem onClick={() => handleEdit(partner)}>
															<Pencil className="mr-2 h-4 w-4" />
															Edit Partner
														</DropdownMenuItem>
														<DropdownMenuItem
															onClick={() => handleEditRate(partner)}
														>
															<Percent className="mr-2 h-4 w-4" />
															Update Rate
														</DropdownMenuItem>
														<DropdownMenuSeparator />
														<DropdownMenuItem
															onClick={() => handleDelete(partner)}
															className="text-destructive"
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

				{/* Create Partner Modal */}
				<CreatePartnerModal
					open={createModalOpen}
					onOpenChange={setCreateModalOpen}
					onSuccess={handleCreateSuccess}
				/>

				{/* Edit Partner Modal */}
				{selectedPartner && (
					<EditPartnerModal
						open={editModalOpen}
						onOpenChange={setEditModalOpen}
						partner={selectedPartner}
						onSuccess={handleEditSuccess}
					/>
				)}

				{/* Update Rate Modal */}
				{selectedPartner && (
					<UpdateRateModal
						open={rateModalOpen}
						onOpenChange={setRateModalOpen}
						partner={selectedPartner}
						onSuccess={handleRateSuccess}
					/>
				)}

				{/* Delete Confirmation Modal */}
				{selectedPartner && (
					<DeletePartnerModal
						open={deleteModalOpen}
						onOpenChange={setDeleteModalOpen}
						partner={selectedPartner}
						onSuccess={handleDeleteSuccess}
					/>
				)}
			</Container>
		</PageWrapper>
	);
}

// Create Partner Modal
function CreatePartnerModal({
	open,
	onOpenChange,
	onSuccess,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSuccess: () => void;
}) {
	const [name, setName] = React.useState("");
	const [rate, setRate] = React.useState("0.25");
	const [currency, setCurrency] = React.useState("INR");
	const [isActive, setIsActive] = React.useState(true);
	const [isSubmitting, setIsSubmitting] = React.useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!name.trim()) {
			toast.error("Partner name is required");
			return;
		}

		setIsSubmitting(true);
		try {
			const res = await fetch("/api/partners", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					name: name.trim(),
					points_to_currency_rate: parseFloat(rate) || 0.25,
					currency_code: currency,
					is_active: isActive,
				}),
			});

			if (!res.ok) {
				const error = await res.json();
				throw new Error(error.error || "Failed to create partner");
			}

			// Reset form
			setName("");
			setRate("0.25");
			setCurrency("INR");
			setIsActive(true);
			onSuccess();
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : "Failed to create partner",
			);
		}
		setIsSubmitting(false);
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Add New Partner</DialogTitle>
					<DialogDescription>
						Create a new loyalty partner with conversion rate configuration.
					</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSubmit} className="mt-4 space-y-4">
					<div>
						<label className="mb-1.5 block text-sm font-medium text-foreground">
							Partner Name <span className="text-destructive">*</span>
						</label>
						<Input
							value={name}
							onChange={(e) => setName(e.target.value)}
							placeholder="e.g., HDFC Bank, SBI Card"
						/>
					</div>

					<div className="grid gap-4 sm:grid-cols-2">
						<div>
							<label className="mb-1.5 block text-sm font-medium text-foreground">
								Points to Currency Rate
							</label>
							<Input
								type="number"
								step="0.01"
								min="0"
								value={rate}
								onChange={(e) => setRate(e.target.value)}
								placeholder="0.25"
							/>
							<p className="mt-1 text-xs text-muted-foreground">
								1 point = ₹{rate || "0"}
							</p>
						</div>

						<div>
							<label className="mb-1.5 block text-sm font-medium text-foreground">
								Currency
							</label>
							<Select value={currency} onValueChange={setCurrency}>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="INR">INR (₹)</SelectItem>
									<SelectItem value="USD">USD ($)</SelectItem>
									<SelectItem value="EUR">EUR (€)</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>

					<div className="flex items-center gap-2">
						<input
							type="checkbox"
							id="is-active"
							checked={isActive}
							onChange={(e) => setIsActive(e.target.checked)}
							className="h-4 w-4 rounded border-border accent-primary"
						/>
						<label htmlFor="is-active" className="text-sm text-foreground">
							Partner is active
						</label>
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
							Create Partner
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}

// Edit Partner Modal
function EditPartnerModal({
	open,
	onOpenChange,
	partner,
	onSuccess,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	partner: LoyaltyPartner;
	onSuccess: () => void;
}) {
	const [name, setName] = React.useState(partner.name);
	const [isActive, setIsActive] = React.useState(partner.is_active);
	const [isSubmitting, setIsSubmitting] = React.useState(false);

	React.useEffect(() => {
		setName(partner.name);
		setIsActive(partner.is_active);
	}, [partner]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!name.trim()) {
			toast.error("Partner name is required");
			return;
		}

		setIsSubmitting(true);
		try {
			const res = await fetch(`/api/partners/${partner.id}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					name: name.trim(),
					is_active: isActive,
				}),
			});

			if (!res.ok) {
				const error = await res.json();
				throw new Error(error.error || "Failed to update partner");
			}

			onSuccess();
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : "Failed to update partner",
			);
		}
		setIsSubmitting(false);
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Edit Partner</DialogTitle>
					<DialogDescription>Update partner information.</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSubmit} className="mt-4 space-y-4">
					<div>
						<label className="mb-1.5 block text-sm font-medium text-foreground">
							Partner Name <span className="text-destructive">*</span>
						</label>
						<Input
							value={name}
							onChange={(e) => setName(e.target.value)}
							placeholder="e.g., HDFC Bank, SBI Card"
						/>
					</div>

					<div className="flex items-center gap-2">
						<input
							type="checkbox"
							id="edit-is-active"
							checked={isActive}
							onChange={(e) => setIsActive(e.target.checked)}
							className="h-4 w-4 rounded border-border accent-primary"
						/>
						<label htmlFor="edit-is-active" className="text-sm text-foreground">
							Partner is active
						</label>
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

// Update Rate Modal
function UpdateRateModal({
	open,
	onOpenChange,
	partner,
	onSuccess,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	partner: LoyaltyPartner;
	onSuccess: () => void;
}) {
	const [rate, setRate] = React.useState(
		String(partner.points_to_currency_rate ?? 0.25),
	);
	const [currency, setCurrency] = React.useState(
		partner.currency_code ?? "INR",
	);
	const [isSubmitting, setIsSubmitting] = React.useState(false);

	React.useEffect(() => {
		setRate(String(partner.points_to_currency_rate ?? 0.25));
		setCurrency(partner.currency_code ?? "INR");
	}, [partner]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		const rateNum = parseFloat(rate);
		if (isNaN(rateNum) || rateNum <= 0) {
			toast.error("Please enter a valid conversion rate");
			return;
		}

		setIsSubmitting(true);
		try {
			const res = await fetch(`/api/partners/${partner.id}/rate`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					points_to_currency_rate: rateNum,
					currency_code: currency,
				}),
			});

			if (!res.ok) {
				const error = await res.json();
				throw new Error(error.error || "Failed to update rate");
			}

			onSuccess();
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : "Failed to update rate",
			);
		}
		setIsSubmitting(false);
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Update Conversion Rate</DialogTitle>
					<DialogDescription>
						Change the points-to-currency conversion rate for {partner.name}.
					</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSubmit} className="mt-4 space-y-4">
					<div className="rounded-lg border border-border bg-muted/30 p-4">
						<div className="flex items-center gap-3">
							<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent">
								<CreditCard className="h-5 w-5 text-primary" />
							</div>
							<div>
								<p className="font-medium text-foreground">{partner.name}</p>
								<p className="text-xs text-muted-foreground">
									Current rate: ₹{partner.points_to_currency_rate ?? 0} per point
								</p>
							</div>
						</div>
					</div>

					<div className="grid gap-4 sm:grid-cols-2">
						<div>
							<label className="mb-1.5 block text-sm font-medium text-foreground">
								New Conversion Rate <span className="text-destructive">*</span>
							</label>
							<Input
								type="number"
								step="0.01"
								min="0.01"
								value={rate}
								onChange={(e) => setRate(e.target.value)}
								placeholder="0.25"
							/>
						</div>

						<div>
							<label className="mb-1.5 block text-sm font-medium text-foreground">
								Currency
							</label>
							<Select value={currency} onValueChange={setCurrency}>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="INR">INR (₹)</SelectItem>
									<SelectItem value="USD">USD ($)</SelectItem>
									<SelectItem value="EUR">EUR (€)</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>

					<div className="rounded-lg border border-primary/20 bg-accent/50 p-3">
						<p className="text-sm text-foreground">
							<strong>Preview:</strong> 1 point ={" "}
							<span className="font-mono text-primary">
								{currency === "INR" ? "₹" : currency === "USD" ? "$" : "€"}
								{rate || "0"}
							</span>
						</p>
						<p className="mt-1 text-xs text-muted-foreground">
							100 points ={" "}
							{currency === "INR" ? "₹" : currency === "USD" ? "$" : "€"}
							{(parseFloat(rate) * 100 || 0).toFixed(2)}
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
							Update Rate
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}

// Delete Partner Modal
function DeletePartnerModal({
	open,
	onOpenChange,
	partner,
	onSuccess,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	partner: LoyaltyPartner;
	onSuccess: () => void;
}) {
	const [isDeleting, setIsDeleting] = React.useState(false);

	const handleDelete = async () => {
		setIsDeleting(true);
		try {
			const res = await fetch(`/api/partners/${partner.id}`, {
				method: "DELETE",
			});

			if (!res.ok) {
				const error = await res.json();
				throw new Error(error.error || "Failed to delete partner");
			}

			onSuccess();
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : "Failed to delete partner",
			);
		}
		setIsDeleting(false);
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent size="sm">
				<DialogHeader>
					<DialogTitle className="text-destructive">Delete Partner</DialogTitle>
					<DialogDescription>
						Are you sure you want to delete {partner.name}? This action cannot
						be undone and will remove all associated conversion rules.
					</DialogDescription>
				</DialogHeader>

				<DialogFooter className="mt-6">
					<Button variant="outline" onClick={() => onOpenChange(false)}>
						Cancel
					</Button>
					<Button
						variant="destructive"
						onClick={handleDelete}
						isLoading={isDeleting}
					>
						Delete Partner
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
