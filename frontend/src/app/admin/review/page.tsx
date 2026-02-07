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
} from "@/components/ui/table";
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
	Eye,
	RefreshCw,
	ArrowRight,
	Store,
	Tag,
	AlertTriangle,
	CheckCircle2,
	Package,
} from "lucide-react";
import useSWR from "swr";
import type { ApiBrand, ApiCategory } from "@/lib/types";

interface StagingProduct {
	staging_id: number;
	merchant_id: number;
	title: string;
	vendor: string;
	product_type: string;
	raw_json_dump: string;
	match_confidence_score: number;
	suggested_product_id: number | null;
	created_at: string;
	merchant_name: string;
	suggested_title: string | null;
	suggested_image_url: string | null;
}

const REJECTION_REASONS = [
	{ value: "pricing", label: "Invalid or unrealistic pricing" },
	{ value: "images", label: "Poor quality or inappropriate images" },
	{ value: "description", label: "Incomplete or misleading description" },
	{ value: "category", label: "Incorrect category assignment" },
	{ value: "brand", label: "Brand verification failed" },
	{ value: "duplicate", label: "Duplicate product listing" },
	{ value: "other", label: "Other (specify below)" },
];

export default function AdminReviewPage() {
	const {
		data: stagingProducts,
		isLoading,
		mutate,
	} = useSWR<StagingProduct[]>("/api/admin/review", fetcher);
	const { data: brands } = useSWR<ApiBrand[]>("/api/brands", fetcher);
	const { data: categories } = useSWR<ApiCategory[]>("/api/categories", fetcher);

	const [selectedProduct, setSelectedProduct] = React.useState<StagingProduct | null>(null);
	const [reviewModalOpen, setReviewModalOpen] = React.useState(false);
	const [rejectModalOpen, setRejectModalOpen] = React.useState(false);
	const [searchQuery, setSearchQuery] = React.useState("");
	const [filterMerchant, setFilterMerchant] = React.useState<string>("all");
	const [rejectionReason, setRejectionReason] = React.useState("");
	const [adminNotes, setAdminNotes] = React.useState("");
	const [isSubmitting, setIsSubmitting] = React.useState(false);

	const merchants = React.useMemo(() => {
		if (!stagingProducts) return [];
		const unique = new Map<number, string>();
		stagingProducts.forEach((p) => unique.set(p.merchant_id, p.merchant_name));
		return Array.from(unique.entries()).map(([id, name]) => ({ id, name }));
	}, [stagingProducts]);

	const filteredProducts = React.useMemo(() => {
		if (!stagingProducts) return [];
		return stagingProducts.filter((p) => {
			const matchesSearch = !searchQuery || 
				p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
				p.vendor?.toLowerCase().includes(searchQuery.toLowerCase()) ||
				p.merchant_name?.toLowerCase().includes(searchQuery.toLowerCase());
			const matchesMerchant = filterMerchant === "all" || String(p.merchant_id) === filterMerchant;
			return matchesSearch && matchesMerchant;
		});
	}, [stagingProducts, searchQuery, filterMerchant]);

	const handleAction = async (action: 'approve_new' | 'approve_match' | 'reject') => {
		if (!selectedProduct) return;
		setIsSubmitting(true);
		try {
			const res = await fetch(`/api/admin/review/${selectedProduct.staging_id}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					action,
					rejection_reason: action === 'reject' ? rejectionReason : undefined,
					admin_notes: adminNotes,
					suggested_product_id: selectedProduct.suggested_product_id
				}),
			});
			if (!res.ok) throw new Error("Action failed");
			toast.success(action === 'reject' ? "Product rejected" : "Product approved");
			setReviewModalOpen(false);
			setRejectModalOpen(false);
			setSelectedProduct(null);
			setRejectionReason("");
			setAdminNotes("");
			mutate();
		} catch (error) {
			toast.error("Operation failed");
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<PageWrapper>
			<Container>
				<PageHeader
					title="Product Review Queue"
					description="Process incoming merchant products: match them to existing catalog or create new entries"
					icon={ClipboardCheck}
					badge={stagingProducts?.length ? <Badge variant="warning" size="lg">{stagingProducts.length} Pending</Badge> : null}
					actions={<Button variant="outline" size="sm" onClick={() => mutate()} leftIcon={<RefreshCw className="h-4 w-4" />}>Refresh</Button>}
				/>

				<Card className="mt-6" padding="sm">
					<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
						<div className="flex flex-1 items-center gap-3">
							<div className="relative flex-1 max-w-md">
								<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
								<Input placeholder="Search staging products..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
							</div>
							<Select value={filterMerchant} onValueChange={setFilterMerchant}>
								<SelectTrigger className="w-[200px]"><SelectValue placeholder="Filter Merchant" /></SelectTrigger>
								<SelectContent>
									<SelectItem value="all">All Merchants</SelectItem>
									{merchants.map(m => <SelectItem key={m.id} value={String(m.id)}>{m.name}</SelectItem>)}
								</SelectContent>
							</Select>
						</div>
					</div>
				</Card>

				<Card className="mt-6" padding="none">
					{isLoading ? (
						<div className="flex items-center justify-center py-20"><RefreshCw className="h-8 w-8 animate-spin text-primary" /></div>
					) : filteredProducts.length === 0 ? (
						<div className="flex flex-col items-center justify-center py-20 text-center">
							<CheckCircle2 className="h-12 w-12 text-success mb-4" />
							<h3 className="text-lg font-semibold">Queue Clear</h3>
							<p className="text-muted-foreground">No products waiting for review.</p>
						</div>
					) : (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Staging Product</TableHead>
									<TableHead>Match Status</TableHead>
									<TableHead>Merchant</TableHead>
									<TableHead className="text-right">Actions</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{filteredProducts.map((p) => (
									<TableRow key={p.staging_id}>
										<TableCell>
											<div>
												<p className="font-medium">{p.title}</p>
												<p className="text-xs text-muted-foreground">{p.vendor} • {p.product_type}</p>
											</div>
										</TableCell>
										<TableCell>
											{p.suggested_product_id ? (
												<div className="flex items-center gap-2 text-success">
													<CheckCircle2 className="h-4 w-4" />
													<span className="text-sm font-medium">{p.match_confidence_score}% Match</span>
												</div>
											) : (
												<Badge variant="outline">No Match Found</Badge>
											)}
										</TableCell>
										<TableCell>
											<div className="flex items-center gap-2 text-sm">
												<Store className="h-4 w-4 text-muted-foreground" />
												{p.merchant_name}
											</div>
										</TableCell>
										<TableCell className="text-right">
											<div className="flex justify-end gap-2">
												<Button size="sm" variant="outline" onClick={() => { setSelectedProduct(p); setReviewModalOpen(true); }}><Eye className="h-4 w-4 mr-2" /> Review</Button>
											</div>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					)}
				</Card>

				{/* Review Modal */}
				<Dialog open={reviewModalOpen} onOpenChange={setReviewModalOpen}>
					<DialogContent className="max-w-4xl">
						<DialogHeader>
							<DialogTitle>Review Marketplace Submission</DialogTitle>
						</DialogHeader>
						{selectedProduct && (
							<div className="grid grid-cols-2 gap-8 py-4">
								<div className="space-y-4">
									<h4 className="font-semibold text-primary flex items-center gap-2"><Package className="h-4 w-4" /> Staging Data</h4>
									<div className="bg-muted p-4 rounded-lg space-y-2">
										<p className="text-sm font-bold">{selectedProduct.title}</p>
										<p className="text-sm text-muted-foreground">Vendor: {selectedProduct.vendor}</p>
										<p className="text-sm text-muted-foreground">Type: {selectedProduct.product_type}</p>
									</div>
									<Textarea placeholder="Admin internal notes..." value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} />
								</div>
								<div className="space-y-4">
									<h4 className="font-semibold text-primary flex items-center gap-2"><ArrowRight className="h-4 w-4" /> Decision Support</h4>
									{selectedProduct.suggested_product_id ? (
										<div className="border-2 border-success/20 bg-success/5 p-4 rounded-lg">
											<p className="text-sm font-semibold text-success mb-2 flex items-center gap-1"><Check className="h-4 w-4" /> Suggested Match ({selectedProduct.match_confidence_score}%)</p>
											<div className="flex gap-3">
												{selectedProduct.suggested_image_url && (
													<div className="relative h-16 w-16 rounded overflow-hidden">
														<Image src={selectedProduct.suggested_image_url} alt="Master" fill className="object-cover" />
													</div>
												)}
												<p className="text-sm font-medium">{selectedProduct.suggested_title}</p>
											</div>
											<Button className="w-full mt-4" variant="success" onClick={() => handleAction('approve_match')} disabled={isSubmitting}>Confirm & Link to Master</Button>
										</div>
									) : (
										<div className="border-2 border-dashed p-8 rounded-lg text-center">
											<AlertTriangle className="h-8 w-8 text-warning mx-auto mb-2" />
											<p className="text-sm font-medium">No Auto-Match Found</p>
											<p className="text-xs text-muted-foreground mb-4">You can create this as a new catalog entry</p>
											<Button className="w-full" onClick={() => handleAction('approve_new')} disabled={isSubmitting}>Approve as New Product</Button>
										</div>
									)}
									<Button variant="destructive" className="w-full" onClick={() => setRejectModalOpen(true)} disabled={isSubmitting}>Reject Submission</Button>
								</div>
							</div>
						)}
					</DialogContent>
				</Dialog>

				{/* Reject Modal */}
				<Dialog open={rejectModalOpen} onOpenChange={setRejectModalOpen}>
					<DialogContent>
						<DialogHeader><DialogTitle>Reject Submission</DialogTitle></DialogHeader>
						<div className="space-y-4 py-4">
							<Select value={rejectionReason} onValueChange={setRejectionReason}>
								<SelectTrigger><SelectValue placeholder="Select rejection reason" /></SelectTrigger>
								<SelectContent>{REJECTION_REASONS.map(r => <SelectItem key={r.value} value={r.label}>{r.label}</SelectItem>)}</SelectContent>
							</Select>
							<Textarea placeholder="Additional details for the merchant..." value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} />
						</div>
						<DialogFooter>
							<Button variant="ghost" onClick={() => setRejectModalOpen(false)}>Cancel</Button>
							<Button variant="destructive" onClick={() => handleAction('reject')} disabled={!rejectionReason || isSubmitting}>Confirm Rejection</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			</Container>
		</PageWrapper>
	);
}
