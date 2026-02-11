"use client";

import * as React from "react";
import Image from "next/image";
import { useSearchParams, useRouter } from "next/navigation";
import { fetcher } from "@/lib/fetcher";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
	X,
	Eye,
	Store,
	RefreshCw,
	Link2,
	Plus,
	Loader2,
	CheckCircle2,
} from "lucide-react";
import useSWR from "swr";

interface ApiBrand {
	id: number;
	name: string;
	slug: string;
	logo_url: string | null;
	is_active: boolean;
}

interface ApiCategory {
	id: number;
	parent_id: number | null;
	name: string;
	slug: string;
	icon: string | null;
	children?: ApiCategory[];
}

interface MasterProduct {
	id: number;
	title: string;
	slug: string;
	image_url: string | null;
	base_price: number;
	brand_id: number | null;
	brand_name: string | null;
	variant_count: number;
	merchant_count: number;
}

interface StagingProduct {
	staging_id: number;
	merchant_id: number;
	title: string;
	vendor: string;
	product_type: string;
	/** API returns jsonb as object; can be string if serialized */
	raw_json_dump: string | Record<string, unknown>;
	match_confidence_score: number;
	suggested_product_id: number | null;
	created_at: string;
	merchant_name: string;
	suggested_title: string | null;
	suggested_image_url: string | null;
}

interface VariantMatchResult {
	staging_variant: {
		id: number;
		external_variant_id: string;
		raw_sku: string | null;
		raw_barcode: string | null;
		raw_price: number | null;
		raw_options: Record<string, string> | null;
	};
	match_type: "gtin_exact" | "gtin_global" | "mpn_brand" | "none";
	matched_variant: {
		id: number;
		internal_sku: string;
		gtin: string | null;
		attributes: Record<string, string>;
		product_id: number;
		product_title: string;
		merchant_count: number;
	} | null;
	confidence: number;
	warning?: string;
}

interface VariantMatchResponse {
	staging_product_id: number;
	suggested_product_id: number | null;
	matched_brand_id: number | null;
	vendor: string | null;
	master_variants: Array<{
		id: number;
		internal_sku: string;
		gtin: string | null;
		attributes: Record<string, string>;
		product_id: number;
		product_title: string;
		merchant_count: number;
	}>;
	variant_matches: VariantMatchResult[];
	summary: {
		total: number;
		matched: number;
		unmatched: number;
		warnings: number;
	};
}

/** Safely get display text for a master variant */
function getVariantLabel(mv: { attributes: Record<string, string> | string | null; internal_sku: string; gtin: string | null }): string {
	const attrs = typeof mv.attributes === "string"
		? (() => { try { return JSON.parse(mv.attributes); } catch { return {}; } })()
		: (mv.attributes ?? {});
	const values = Object.values(attrs).filter(Boolean);
	if (values.length > 0) return values.join(" / ");
	if (mv.gtin) return `GTIN: ${mv.gtin}`;
	return mv.internal_sku;
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

export default function ProductsPage() {
	return (
	  <React.Suspense fallback={<div className="py-20 text-center">Loading catalog...</div>}>
		<AdminReviewPage />
	  </React.Suspense>
	);
  }

export  function AdminReviewPage() {
	const searchParams = useSearchParams();
	const router = useRouter();
	const stagingIdFromUrl = searchParams.get("stagingId");

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

	// Review decision state
	const [decisionMode, setDecisionMode] = React.useState<"match" | "new">("new");
	const [selectedMasterProductId, setSelectedMasterProductId] = React.useState<number | null>(null);
	const [selectedMasterProduct, setSelectedMasterProduct] = React.useState<MasterProduct | null>(null);
	const [selectedBrandId, setSelectedBrandId] = React.useState<number | null>(null);
	const [selectedCategoryId, setSelectedCategoryId] = React.useState<number | null>(null);
	const [productSearchQuery, setProductSearchQuery] = React.useState("");
	const [productSearchResults, setProductSearchResults] = React.useState<MasterProduct[]>([]);
	const [isSearching, setIsSearching] = React.useState(false);

	// Variant matching state
	const [variantMatches, setVariantMatches] = React.useState<VariantMatchResponse | null>(null);
	const [isLoadingVariants, setIsLoadingVariants] = React.useState(false);
	const [variantMappings, setVariantMappings] = React.useState<Record<string, number | null>>({});

	// Fetch variant matches for a staging product against a specific master product
	const fetchVariantMatches = React.useCallback(async (stagingId: number, targetProductId?: number | null) => {
		setIsLoadingVariants(true);
		try {
			const url = targetProductId
				? `/api/admin/review/${stagingId}/variants?targetProductId=${targetProductId}`
				: `/api/admin/review/${stagingId}/variants`;
			const res = await fetch(url);
			if (res.ok) {
				const data = await res.json();
				setVariantMatches(data);
				// Pre-populate mappings based on auto-matches
				const mappings: Record<string, number | null> = {};
				for (const vm of data.variant_matches) {
					if (vm.matched_variant) {
						mappings[String(vm.staging_variant.id)] = vm.matched_variant.id;
					}
				}
				setVariantMappings(mappings);
			}
		} catch {
			console.error("Failed to fetch variant matches");
		} finally {
			setIsLoadingVariants(false);
		}
	}, []);

	// Reset decision state when modal opens with a new product
	const openReviewModal = React.useCallback((product: StagingProduct) => {
		setSelectedProduct(product);
		setReviewModalOpen(true);
		// Pre-select match mode if there's a suggested match
		if (product.suggested_product_id) {
			setDecisionMode("match");
			setSelectedMasterProductId(product.suggested_product_id);
			setSelectedMasterProduct({
				id: product.suggested_product_id,
				title: product.suggested_title ?? "",
				slug: "",
				image_url: product.suggested_image_url,
				base_price: 0,
				brand_id: null,
				brand_name: null,
				variant_count: 0,
				merchant_count: 0,
			});
			// Fetch variant matches against the suggested product
			fetchVariantMatches(product.staging_id, product.suggested_product_id);
		} else {
			setDecisionMode("new");
			setSelectedMasterProductId(null);
			setSelectedMasterProduct(null);
		}
		setSelectedBrandId(null);
		setSelectedCategoryId(null);
		setProductSearchQuery("");
		setProductSearchResults([]);
		setAdminNotes("");
		setVariantMatches(null);
		setVariantMappings({});
	}, [fetchVariantMatches]);

	// Open review modal when ?stagingId= is in URL (e.g. from admin dashboard "Review" link)
	React.useEffect(() => {
		if (stagingIdFromUrl && stagingProducts?.length) {
			const id = Number(stagingIdFromUrl);
			if (Number.isNaN(id)) return;
			const found = stagingProducts.find((p) => p.staging_id === id);
			if (found) {
				openReviewModal(found);
			}
		}
	}, [stagingIdFromUrl, stagingProducts, openReviewModal]);

	// Search for master products when query changes
	React.useEffect(() => {
		if (productSearchQuery.length < 2) {
			setProductSearchResults([]);
			return;
		}
		const controller = new AbortController();
		const search = async () => {
			setIsSearching(true);
			try {
				const res = await fetch(`/api/admin/products/search?q=${encodeURIComponent(productSearchQuery)}`, {
					signal: controller.signal,
				});
				if (res.ok) {
					const data = await res.json();
					setProductSearchResults(data);
				}
			} catch {
				// Ignore abort errors
			} finally {
				setIsSearching(false);
			}
		};
		const timeout = setTimeout(search, 300);
		return () => {
			clearTimeout(timeout);
			controller.abort();
		};
	}, [productSearchQuery]);

	const merchants = React.useMemo(() => {
		if (!stagingProducts) return [];
		const unique = new Map<number, string>();
		for (const p of stagingProducts) unique.set(p.merchant_id, p.merchant_name);
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

	const handleAction = async (action: "approve_new" | "approve_match" | "reject") => {
		if (!selectedProduct) return;

		// Validate match mode has a selected product
		if (action === "approve_match" && !selectedMasterProductId) {
			toast.error("Please select a master product to match with");
			return;
		}

		setIsSubmitting(true);
		try {
			const res = await fetch(`/api/admin/review/${selectedProduct.staging_id}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					action,
					rejection_reason: action === "reject" ? rejectionReason : undefined,
					admin_notes: adminNotes,
					suggested_product_id: selectedMasterProductId,
					brand_id: action === "approve_new" ? selectedBrandId : undefined,
					category_id: action === "approve_new" ? selectedCategoryId : undefined,
					variant_mappings: action === "approve_match" ? variantMappings : undefined,
				}),
			});
			if (!res.ok) throw new Error("Action failed");
			toast.success(action === "reject" ? "Product rejected" : "Product approved");
			setReviewModalOpen(false);
			setRejectModalOpen(false);
			setSelectedProduct(null);
			setRejectionReason("");
			setAdminNotes("");
			setSelectedMasterProductId(null);
			setSelectedMasterProduct(null);
			setSelectedBrandId(null);
			setSelectedCategoryId(null);
			setVariantMatches(null);
			setVariantMappings({});
			mutate();
		} catch {
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
												<Button size="sm" variant="outline" onClick={() => openReviewModal(p)}><Eye className="h-4 w-4 mr-2" /> Review</Button>
											</div>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					)}
				</Card>

				{/* Review Modal - Full Product Details */}
				<Dialog
					open={reviewModalOpen}
					onOpenChange={(open) => {
						setReviewModalOpen(open);
						if (!open && stagingIdFromUrl) router.replace("/admin/review");
					}}
				>
					<DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
						<DialogHeader>
							<DialogTitle className="text-xl">Review Marketplace Submission</DialogTitle>
						</DialogHeader>
						{selectedProduct && (() => {
							const dump = selectedProduct.raw_json_dump;
							const raw = dump
								? typeof dump === "string"
									? (JSON.parse(dump) as Record<string, unknown>)
									: (dump as Record<string, unknown>)
								: {};
							const images = (raw?.images as { id?: number; src?: string; alt?: string | null; position?: number }[]) ?? [];
							const variants = (raw?.variants as {
								id?: number;
								title?: string;
								sku?: string | null;
								barcode?: string | null;
								price?: string;
								compare_at_price?: string | null;
								inventory_quantity?: number;
								option1?: string | null;
								option2?: string | null;
								option3?: string | null;
							}[]) ?? [];
							const options = (raw?.options as { id?: number; name?: string; values?: string[] }[]) ?? [];
							const bodyHtml = (raw?.body_html as string) ?? "";
							const tags = (raw?.tags as string) ?? "";
							const handle = (raw?.handle as string) ?? "";
							const shopifyId = raw?.id as number | undefined;
							const shopifyStatus = (raw?.status as string) ?? "";
							const createdAt = (raw?.created_at as string) ?? "";
							const updatedAt = (raw?.updated_at as string) ?? "";

							return (
								<div className="space-y-6 py-4">
									{/* Header with title and basic info */}
									<div className="flex items-start justify-between gap-4">
										<div>
											<h2 className="text-2xl font-bold text-foreground">{selectedProduct.title}</h2>
											<div className="mt-2 flex flex-wrap gap-2 text-sm text-muted-foreground">
												<span className="flex items-center gap-1"><Store className="h-4 w-4" /> {selectedProduct.vendor || "—"}</span>
												<span>•</span>
												<span>{selectedProduct.product_type || "No type"}</span>
												<span>•</span>
												<span>Merchant: <strong>{selectedProduct.merchant_name}</strong></span>
											</div>
										</div>
										<Badge variant={shopifyStatus === "active" ? "success" : "outline"}>{shopifyStatus || "unknown"}</Badge>
									</div>

									{/* Images Gallery */}
									{images.length > 0 && (
										<div>
											<h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Product Images ({images.length})</h3>
											<div className="flex flex-wrap gap-3">
												{images.map((img, idx) => (
													<div key={img.id ?? idx} className="relative h-32 w-32 shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
														<Image src={img.src ?? ""} alt={img.alt ?? ""} fill className="object-cover" />
														<span className="absolute bottom-1 right-1 rounded bg-black/60 px-1.5 py-0.5 text-xs text-white">{idx + 1}</span>
													</div>
												))}
											</div>
										</div>
									)}

									{/* Description */}
									{bodyHtml && (
										<div>
											<h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">Description</h3>
											<div
												className="prose prose-sm max-w-none rounded-lg border border-border bg-muted/50 p-4"
												// biome-ignore lint/security/noDangerouslySetInnerHtml: Product description HTML from Shopify
												dangerouslySetInnerHTML={{ __html: bodyHtml }}
											/>
										</div>
									)}

									{/* Options */}
									{options.length > 0 && (
										<div>
											<h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">Product Options</h3>
											<div className="flex flex-wrap gap-4">
												{options.map((opt) => (
													<div key={opt.id ?? opt.name} className="rounded-lg border border-border bg-muted/50 p-3">
														<p className="text-xs font-medium text-muted-foreground">{opt.name}</p>
														<div className="mt-1 flex flex-wrap gap-1">
															{opt.values?.map((v) => (
																<Badge key={v} variant="outline" size="sm">{v}</Badge>
															))}
														</div>
													</div>
												))}
											</div>
										</div>
									)}

									{/* Variants Table */}
									{variants.length > 0 && (
										<div>
											<h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">Variants ({variants.length})</h3>
											<div className="overflow-x-auto rounded-lg border border-border">
												<table className="w-full text-sm">
													<thead className="bg-muted/50">
														<tr>
															<th className="px-3 py-2 text-left font-medium">Variant</th>
															<th className="px-3 py-2 text-left font-medium">SKU</th>
															<th className="px-3 py-2 text-left font-medium">Barcode</th>
															<th className="px-3 py-2 text-right font-medium">Price</th>
															<th className="px-3 py-2 text-right font-medium">Stock</th>
														</tr>
													</thead>
													<tbody className="divide-y divide-border">
														{variants.map((v) => (
															<tr key={v.id} className="hover:bg-muted/30">
																<td className="px-3 py-2 font-medium">{v.title ?? ([v.option1, v.option2, v.option3].filter(Boolean).join(" / ") || "Default")}</td>
																<td className="px-3 py-2 text-muted-foreground">{v.sku || "—"}</td>
																<td className="px-3 py-2 text-muted-foreground font-mono text-xs">{v.barcode || "—"}</td>
																<td className="px-3 py-2 text-right">₹{Number(v.price ?? 0).toLocaleString()}</td>
																<td className="px-3 py-2 text-right">{v.inventory_quantity ?? 0}</td>
															</tr>
														))}
													</tbody>
												</table>
											</div>
										</div>
									)}

									{/* Tags */}
									{tags && (
										<div>
											<h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">Tags</h3>
											<div className="flex flex-wrap gap-1">
												{tags.split(",").map((t) => t.trim()).filter(Boolean).map((tag) => (
													<Badge key={tag} variant="secondary" size="sm">{tag}</Badge>
												))}
											</div>
										</div>
									)}

									{/* Metadata */}
									<div>
										<h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">Metadata</h3>
										<div className="grid grid-cols-2 gap-4 rounded-lg border border-border bg-muted/50 p-4 text-sm md:grid-cols-4">
											<div>
												<p className="text-xs text-muted-foreground">Shopify ID</p>
												<p className="font-mono">{shopifyId ?? "—"}</p>
											</div>
											<div>
												<p className="text-xs text-muted-foreground">Handle</p>
												<p className="font-mono">{handle || "—"}</p>
											</div>
											<div>
												<p className="text-xs text-muted-foreground">Created</p>
												<p>{createdAt ? new Date(createdAt).toLocaleString() : "—"}</p>
											</div>
											<div>
												<p className="text-xs text-muted-foreground">Updated</p>
												<p>{updatedAt ? new Date(updatedAt).toLocaleString() : "—"}</p>
											</div>
											<div>
												<p className="text-xs text-muted-foreground">Staging ID</p>
												<p className="font-mono">{selectedProduct.staging_id}</p>
											</div>
											<div>
												<p className="text-xs text-muted-foreground">Merchant ID</p>
												<p className="font-mono">{selectedProduct.merchant_id}</p>
											</div>
											<div>
												<p className="text-xs text-muted-foreground">Match Confidence</p>
												<p>{selectedProduct.match_confidence_score}%</p>
											</div>
											<div>
												<p className="text-xs text-muted-foreground">Submitted</p>
												<p>{selectedProduct.created_at ? new Date(selectedProduct.created_at).toLocaleString() : "—"}</p>
											</div>
										</div>
									</div>

									{/* Admin Notes */}
									<div>
										<h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">Admin Notes</h3>
										<Textarea
											placeholder="Add internal notes about this product (not visible to merchant)..."
											value={adminNotes}
											onChange={(e) => setAdminNotes(e.target.value)}
											rows={3}
										/>
									</div>

									{/* Decision Section */}
									<div className="rounded-lg border-2 border-primary/20 bg-primary/5 p-6">
										<h3 className="text-lg font-semibold text-foreground mb-4">Review Decision</h3>

										{/* Auto-match suggestion banner */}
										{selectedProduct.suggested_product_id && (
											<div className="mb-4 rounded-lg border border-success/30 bg-success/10 p-4">
												<p className="text-sm font-semibold text-success mb-2 flex items-center gap-2">
													<CheckCircle2 className="h-4 w-4" />
													Auto-Match Found ({selectedProduct.match_confidence_score}% confidence)
												</p>
												<div className="flex items-center gap-3">
													{selectedProduct.suggested_image_url && (
														<div className="relative h-12 w-12 shrink-0 overflow-hidden rounded">
															<Image src={selectedProduct.suggested_image_url} alt="Master" fill className="object-cover" />
														</div>
													)}
													<div>
														<p className="font-medium text-sm">{selectedProduct.suggested_title}</p>
														<p className="text-xs text-muted-foreground">Master ID: {selectedProduct.suggested_product_id}</p>
													</div>
												</div>
											</div>
										)}

										{/* Decision mode toggle */}
										<div className="mb-4">
											<p className="text-sm font-medium text-muted-foreground mb-2">What would you like to do?</p>
											<div className="flex gap-2">
												<Button
													type="button"
													variant={decisionMode === "match" ? "default" : "outline"}
													size="sm"
													onClick={() => setDecisionMode("match")}
												>
													<Link2 className="mr-2 h-4 w-4" />
													Link to Existing Product
												</Button>
												<Button
													type="button"
													variant={decisionMode === "new" ? "default" : "outline"}
													size="sm"
													onClick={() => {
														setDecisionMode("new");
														setSelectedMasterProductId(null);
														setSelectedMasterProduct(null);
														setVariantMatches(null);
														setVariantMappings({});
													}}
												>
													<Plus className="mr-2 h-4 w-4" />
													Create New Product
												</Button>
											</div>
										</div>

										{/* Match mode: Product search */}
										{decisionMode === "match" && (
											<div className="mb-4 space-y-3 rounded-lg border border-border bg-background p-4">
												<div>
													<label htmlFor="product-search" className="text-sm font-medium">Search Master Catalog</label>
													<div className="relative mt-1">
														<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
														<Input
															id="product-search"
															placeholder="Search by title, brand, or barcode..."
															value={productSearchQuery}
															onChange={(e) => setProductSearchQuery(e.target.value)}
															className="pl-9"
														/>
														{isSearching && (
															<Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
														)}
													</div>
												</div>

												{/* Search results */}
												{productSearchResults.length > 0 && (
													<div className="max-h-48 overflow-y-auto rounded border border-border divide-y divide-border">
														{productSearchResults.map((product) => (
															<button
																type="button"
																key={product.id}
																onClick={() => {
																	setSelectedMasterProductId(product.id);
																	setSelectedMasterProduct(product);
																	setProductSearchQuery("");
																	setProductSearchResults([]);
																	// Fetch variant matches against this newly selected product
																	if (selectedProduct) {
																		fetchVariantMatches(selectedProduct.staging_id, product.id);
																	}
																}}
																className="flex w-full items-center gap-3 p-2 text-left hover:bg-muted/50 transition-colors"
															>
																{product.image_url ? (
																	<div className="relative h-10 w-10 shrink-0 overflow-hidden rounded">
																		<Image src={product.image_url} alt="" fill className="object-cover" />
																	</div>
																) : (
																	<div className="h-10 w-10 shrink-0 rounded bg-muted flex items-center justify-center text-xs text-muted-foreground">N/A</div>
																)}
																<div className="flex-1 min-w-0">
																	<p className="text-sm font-medium truncate">{product.title}</p>
																	<p className="text-xs text-muted-foreground">
																		{product.brand_name && <span>{product.brand_name} · </span>}
																		{product.variant_count} variant{product.variant_count !== 1 ? "s" : ""} · 
																		{product.merchant_count} merchant{product.merchant_count !== 1 ? "s" : ""} selling
																	</p>
																</div>
															</button>
														))}
													</div>
												)}

												{/* Selected product */}
												{selectedMasterProduct && (
													<div className="flex items-center gap-3 rounded-lg border-2 border-primary bg-primary/5 p-3">
														{selectedMasterProduct.image_url ? (
															<div className="relative h-12 w-12 shrink-0 overflow-hidden rounded">
																<Image src={selectedMasterProduct.image_url} alt="" fill className="object-cover" />
															</div>
														) : (
															<div className="h-12 w-12 shrink-0 rounded bg-muted flex items-center justify-center text-xs text-muted-foreground">N/A</div>
														)}
														<div className="flex-1">
															<p className="font-medium">{selectedMasterProduct.title}</p>
															<p className="text-xs text-muted-foreground">
																Master Product ID: {selectedMasterProduct.id}
																{selectedMasterProduct.brand_name && ` · ${selectedMasterProduct.brand_name}`}
															</p>
														</div>
														<Button
															type="button"
															variant="ghost"
															size="sm"
															onClick={() => {
																setSelectedMasterProductId(null);
																setSelectedMasterProduct(null);
																setVariantMatches(null);
																setVariantMappings({});
															}}
														>
															<X className="h-4 w-4" />
														</Button>
													</div>
												)}

												{!selectedMasterProduct && productSearchQuery.length < 2 && (
													<p className="text-sm text-muted-foreground text-center py-2">
														Type at least 2 characters to search for existing products
													</p>
												)}

												{/* Variant matching summary */}
												{selectedMasterProduct && isLoadingVariants && !variantMatches && (
													<div className="mt-4 border-t border-border pt-4 flex items-center gap-2 text-sm text-muted-foreground">
														<Loader2 className="h-4 w-4 animate-spin" />
														Loading variant matches...
													</div>
												)}
												{selectedMasterProduct && variantMatches && (
													<div className="mt-4 border-t border-border pt-4">
														<div className="flex items-center justify-between mb-3">
															<h4 className="text-sm font-semibold">Variant Matching</h4>
															{isLoadingVariants ? (
																<Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
															) : (
																<div className="flex gap-2 text-xs">
																	<span className="text-success">{variantMatches.summary.matched} matched</span>
																	<span className="text-warning">{variantMatches.summary.unmatched} new</span>
																	{variantMatches.summary.warnings > 0 && (
																		<span className="text-destructive">{variantMatches.summary.warnings} warnings</span>
																	)}
																</div>
															)}
														</div>
														<div className="space-y-2 max-h-48 overflow-y-auto">
															{variantMatches.variant_matches.map((vm) => (
																<div
																	key={vm.staging_variant.id}
																	className={`flex items-center justify-between rounded border p-2 text-sm ${
																		vm.warning ? "border-warning bg-warning/5" : 
																		vm.match_type !== "none" ? "border-success/30 bg-success/5" : 
																		"border-border bg-muted/30"
																	}`}
																>
																	<div className="flex-1 min-w-0">
																		<p className="font-medium truncate">
																			{vm.staging_variant.raw_options 
																				? Object.values(vm.staging_variant.raw_options).join(" / ")
																				: `Variant ${vm.staging_variant.id}`
																			}
																		</p>
																		<p className="text-xs text-muted-foreground">
																			{vm.staging_variant.raw_barcode && <span>GTIN: {vm.staging_variant.raw_barcode} · </span>}
																			{vm.staging_variant.raw_sku && <span>SKU: {vm.staging_variant.raw_sku} · </span>}
																			₹{(vm.staging_variant.raw_price ?? 0).toLocaleString()}
																		</p>
																		{vm.warning && (
																			<p className="text-xs text-warning mt-1">{vm.warning}</p>
																		)}
																	</div>
																	<div className="ml-3 shrink-0">
																		{vm.match_type !== "none" ? (
																			<Select
																				value={String(variantMappings[String(vm.staging_variant.id)] ?? vm.matched_variant?.id ?? "new")}
																				onValueChange={(v) => {
																					setVariantMappings(prev => ({
																						...prev,
																						[String(vm.staging_variant.id)]: v === "new" ? null : Number(v)
																					}));
																				}}
																			>
																				<SelectTrigger className="w-36 h-8 text-xs" aria-label="Select variant mapping">
																					<SelectValue />
																				</SelectTrigger>
																				<SelectContent>
																					<SelectItem value={String(vm.matched_variant?.id)}>
																						Link ({vm.match_type.replace("_", " ")})
																					</SelectItem>
																					<SelectItem value="new">Create new</SelectItem>
																					{variantMatches.master_variants
																						.filter(mv => mv.id !== vm.matched_variant?.id)
																						.map(mv => (
																							<SelectItem key={mv.id} value={String(mv.id)}>
																								{getVariantLabel(mv)}
																							</SelectItem>
																						))
																					}
																				</SelectContent>
																			</Select>
																		) : (
																			<Select
																				value={String(variantMappings[String(vm.staging_variant.id)] ?? "new")}
																				onValueChange={(v) => {
																					setVariantMappings(prev => ({
																						...prev,
																						[String(vm.staging_variant.id)]: v === "new" ? null : Number(v)
																					}));
																				}}
																			>
																				<SelectTrigger className="w-36 h-8 text-xs" aria-label="Select variant mapping">
																					<SelectValue />
																				</SelectTrigger>
																				<SelectContent>
																					<SelectItem value="new">Create new variant</SelectItem>
																					{variantMatches.master_variants.map(mv => (
																						<SelectItem key={mv.id} value={String(mv.id)}>
																							{getVariantLabel(mv)}
																						</SelectItem>
																					))}
																				</SelectContent>
																			</Select>
																		)}
																	</div>
																</div>
															))}
														</div>
													</div>
												)}
											</div>
										)}

										{/* New product mode: Brand & Category selection */}
										{decisionMode === "new" && (
											<div className="mb-4 space-y-3 rounded-lg border border-border bg-background p-4">
												<div className="grid gap-4 sm:grid-cols-2">
													<div>
														<span className="text-sm font-medium">Brand (optional)</span>
														<Select
															value={selectedBrandId?.toString() ?? "none"}
															onValueChange={(v) => setSelectedBrandId(v === "none" ? null : Number(v))}
														>
															<SelectTrigger className="mt-1" aria-label="Select brand">
																<SelectValue placeholder="Select brand..." />
															</SelectTrigger>
															<SelectContent>
																<SelectItem value="none">No brand</SelectItem>
																{brands?.map((brand) => (
																	<SelectItem key={brand.id} value={brand.id.toString()}>
																		{brand.name}
																	</SelectItem>
																))}
															</SelectContent>
														</Select>
													</div>
													<div>
														<span className="text-sm font-medium">Category</span>
														<Select
															value={selectedCategoryId?.toString() ?? "none"}
															onValueChange={(v) => setSelectedCategoryId(v === "none" ? null : Number(v))}
														>
															<SelectTrigger className="mt-1" aria-label="Select category">
																<SelectValue placeholder="Select category..." />
															</SelectTrigger>
															<SelectContent>
																<SelectItem value="none">No category</SelectItem>
																{categories?.map((cat) => (
																	<React.Fragment key={cat.id}>
																		<SelectItem value={cat.id.toString()}>
																			{cat.name}
																		</SelectItem>
																		{cat.children?.map((child) => (
																			<SelectItem key={child.id} value={child.id.toString()}>
																				↳ {child.name}
																			</SelectItem>
																		))}
																	</React.Fragment>
																))}
															</SelectContent>
														</Select>
													</div>
												</div>
												<p className="text-xs text-muted-foreground">
													A new master product will be created in the catalog. Other merchants selling the same product can be linked to it later.
												</p>
											</div>
										)}

										{/* Action buttons */}
										<div className="flex flex-wrap gap-3 pt-2">
											{decisionMode === "match" ? (
												<Button
													variant="success"
													onClick={() => handleAction("approve_match")}
													disabled={isSubmitting || !selectedMasterProductId}
												>
													{isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Link2 className="mr-2 h-4 w-4" />}
													Link to Master Product
												</Button>
											) : (
												<Button
													onClick={() => handleAction("approve_new")}
													disabled={isSubmitting}
												>
													{isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
													Create New Product
												</Button>
											)}
											<Button
												variant="destructive"
												onClick={() => setRejectModalOpen(true)}
												disabled={isSubmitting}
											>
												<X className="mr-2 h-4 w-4" />
												Reject
											</Button>
										</div>
									</div>
								</div>
							);
						})()}
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
