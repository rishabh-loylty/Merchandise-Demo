"use client";

import { fetcher } from "@/lib/fetcher";
import type { ApiBrand, ApiCategory, ApiProduct } from "@/lib/types";
import {
  Check,
  ChevronDown,
  ClipboardCheck,
  Search,
  Shield,
  X,
} from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import useSWR from "swr";

export default function AdminReviewPage() {
  const { data: pendingProducts, isLoading, mutate } = useSWR<ApiProduct[]>(
    "/api/admin/review",
    fetcher
  );
  const [selectedProduct, setSelectedProduct] = useState<ApiProduct | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);

  const products = pendingProducts ?? [];

  const handleReview = (product: ApiProduct) => {
    setSelectedProduct(product);
    setReviewOpen(true);
  };

  const handleApprove = async (productId: number) => {
    setReviewOpen(false);
    setSelectedProduct(null);
    mutate(); // Refresh from API
  };

  const handleReject = async (productId: number) => {
    setReviewOpen(false);
    setSelectedProduct(null);
    mutate(); // Refresh from API
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
          <Shield className="h-6 w-6 text-primary" />
          Admin Review Dashboard
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Review and approve products before they go live on the marketplace
        </p>
      </div>

      {/* Stats */}
      <div className="mb-6 flex items-center gap-4">
        <div className="flex items-center gap-2 rounded-lg border border-border bg-warning/5 px-4 py-2.5">
          <ClipboardCheck className="h-5 w-5 text-warning" />
          <span className="text-sm font-medium text-foreground">
            {products.length} item{products.length !== 1 ? "s" : ""} pending review
          </span>
        </div>
      </div>

      {/* Review Table */}
      <div className="rounded-xl border border-border bg-card shadow-sm">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Check className="mb-4 h-12 w-12 text-success" />
            <h3 className="mb-2 text-lg font-semibold text-foreground">All caught up!</h3>
            <p className="text-sm text-muted-foreground">No products pending review</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Product</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Vendor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">SKU</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wide text-muted-foreground">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-muted/30">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
                          <Image src={product.image_url} alt={product.title} fill className="object-cover" sizes="40px" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{product.title}</p>
                          <p className="text-xs text-muted-foreground">{product.brand_name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{product.raw_vendor ?? product.merchant_name}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{product.sku}</td>
                    <td className="px-6 py-4 text-sm font-medium text-foreground">INR {product.base_price.toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center rounded-full bg-warning/10 px-2.5 py-0.5 text-xs font-medium text-warning">
                        Pending Review
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleReview(product)}
                        className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                      >
                        Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Review Modal */}
      {reviewOpen && selectedProduct && (
        <ReviewModal
          product={selectedProduct}
          onClose={() => {
            setReviewOpen(false);
            setSelectedProduct(null);
          }}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      )}
    </div>
  );
}

function ReviewModal({
  product,
  onClose,
  onApprove,
  onReject,
}: {
  product: ApiProduct;
  onClose: () => void;
  onApprove: (id: number) => void;
  onReject: (id: number) => void;
}) {
  const [editTitle, setEditTitle] = useState(product.title);
  const [selectedBrandId, setSelectedBrandId] = useState(product.brand_id ?? 0);
  const [selectedBrandName, setSelectedBrandName] = useState(product.brand_name);
  const [selectedCategorySlug, setSelectedCategorySlug] = useState(product.category_slug ?? "");
  const [selectedSubCategoryId, setSelectedSubCategoryId] = useState<number | null>(null);
  const [brandSearchOpen, setBrandSearchOpen] = useState(false);
  const [brandSearch, setBrandSearch] = useState("");
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);

  const { data: brands } = useSWR<ApiBrand[]>("/api/brands", fetcher);
  const { data: categories } = useSWR<ApiCategory[]>("/api/categories", fetcher);

  const topCategories = categories?.filter((c) => c.parent_id === null) ?? [];
  const allBrands = brands ?? [];

  const filteredBrands = allBrands.filter((b) =>
    b.name.toLowerCase().includes(brandSearch.toLowerCase())
  );

  const selectedCategoryObj = topCategories.find((c) => c.slug === selectedCategorySlug);

  const handleApprove = async () => {
    setApproving(true);
    try {
      await fetch(`/api/admin/review/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "approve",
          title: editTitle,
          brand_id: selectedBrandId,
          category_id: selectedSubCategoryId ?? selectedCategoryObj?.id,
        }),
      });
      onApprove(product.id);
    } catch {
      // handle error
    }
    setApproving(false);
  };

  const handleReject = async () => {
    setRejecting(true);
    try {
      await fetch(`/api/admin/review/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reject" }),
      });
      onReject(product.id);
    } catch {
      // handle error
    }
    setRejecting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end bg-foreground/40 backdrop-blur-sm">
      <div className="flex h-full w-full max-w-2xl flex-col bg-card shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-lg font-bold text-foreground">Review Product</h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Product Preview */}
          <div className="mb-6 flex items-start gap-4">
            <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
              <Image src={product.image_url} alt={product.title} fill className="object-cover" sizes="80px" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">{product.title}</p>
              <p className="text-xs text-muted-foreground">SKU: {product.sku}</p>
              <p className="text-xs text-muted-foreground">INR {product.base_price.toLocaleString()}</p>
            </div>
          </div>

          {/* Original Data (Read-only) */}
          <div className="mb-6">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
              <span className="flex h-5 w-5 items-center justify-center rounded bg-muted text-xs font-bold text-muted-foreground">1</span>
              Original Data from Shopify
            </h3>
            <div className="rounded-lg border border-border bg-muted/50 p-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Title</p>
                  <p className="mt-1 text-sm text-foreground">{product.raw_title ?? product.title}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Vendor</p>
                  <p className="mt-1 text-sm text-foreground">{product.raw_vendor ?? product.merchant_name}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Brand</p>
                  <p className="mt-1 text-sm text-foreground">{product.brand_name}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Category</p>
                  <p className="mt-1 text-sm capitalize text-foreground">{product.raw_product_type ?? product.category_name}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Master Catalog Data (Editable) */}
          <div>
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
              <span className="flex h-5 w-5 items-center justify-center rounded bg-primary text-xs font-bold text-primary-foreground">2</span>
              Master Catalog Data
            </h3>
            <div className="flex flex-col gap-4 rounded-lg border border-primary/20 bg-accent/30 p-4">
              {/* Title */}
              <div>
                <label htmlFor="edit-title" className="mb-1.5 block text-xs font-medium text-foreground">Title</label>
                <input
                  id="edit-title"
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              {/* Brand Selector */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-foreground">Brand Mapping</label>
                <div className="relative">
                  <button
                    onClick={() => setBrandSearchOpen(!brandSearchOpen)}
                    className="flex w-full items-center justify-between rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground hover:bg-muted"
                  >
                    <span>{selectedBrandName || "Select brand..."}</span>
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </button>
                  {brandSearchOpen && (
                    <div className="absolute left-0 top-full z-10 mt-1 w-full rounded-lg border border-border bg-card shadow-lg">
                      <div className="border-b border-border p-2">
                        <div className="relative">
                          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                          <input
                            type="text"
                            value={brandSearch}
                            onChange={(e) => setBrandSearch(e.target.value)}
                            placeholder="Search brands..."
                            className="w-full rounded-md border border-border bg-muted py-1.5 pl-8 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                            autoFocus
                          />
                        </div>
                      </div>
                      <div className="max-h-48 overflow-y-auto p-1">
                        {filteredBrands.map((brand) => (
                          <button
                            key={brand.id}
                            onClick={() => {
                              setSelectedBrandId(brand.id);
                              setSelectedBrandName(brand.name);
                              setBrandSearchOpen(false);
                              setBrandSearch("");
                            }}
                            className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-sm transition-colors hover:bg-muted ${
                              selectedBrandId === brand.id ? "bg-accent font-medium text-accent-foreground" : "text-foreground"
                            }`}
                          >
                            {brand.name}
                            {selectedBrandId === brand.id && <Check className="h-4 w-4 text-primary" />}
                          </button>
                        ))}
                        {filteredBrands.length === 0 && (
                          <p className="px-3 py-2 text-sm text-muted-foreground">No brands found</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                {product.raw_vendor && product.raw_vendor !== selectedBrandName && (
                  <p className="mt-1 text-xs text-primary">
                    Mapping &quot;{product.raw_vendor}&quot; to &quot;{selectedBrandName}&quot;
                  </p>
                )}
              </div>

              {/* Category Selector */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-foreground">Category</label>
                <div className="flex flex-col gap-2">
                  <select
                    value={selectedCategorySlug}
                    onChange={(e) => {
                      setSelectedCategorySlug(e.target.value);
                      setSelectedSubCategoryId(null);
                    }}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="">Select category...</option>
                    {topCategories.map((cat) => (
                      <option key={cat.id} value={cat.slug}>{cat.name}</option>
                    ))}
                  </select>

                  {selectedCategoryObj?.children && selectedCategoryObj.children.length > 0 && (
                    <div className="ml-4">
                      <label className="mb-1 block text-xs text-muted-foreground">Sub-category</label>
                      <select
                        value={selectedSubCategoryId ?? ""}
                        onChange={(e) => setSelectedSubCategoryId(e.target.value ? Number(e.target.value) : null)}
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      >
                        <option value="">Select sub-category...</option>
                        {selectedCategoryObj.children.map((sub) => (
                          <option key={sub.id} value={sub.id}>{sub.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 border-t border-border px-6 py-4">
          <button
            onClick={handleReject}
            disabled={rejecting || approving}
            className="flex items-center gap-2 rounded-lg bg-destructive px-4 py-2.5 text-sm font-semibold text-destructive-foreground transition-colors hover:bg-destructive/90 disabled:opacity-50"
          >
            {rejecting ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-destructive-foreground border-t-transparent" />
            ) : (
              <X className="h-4 w-4" />
            )}
            Reject
          </button>
          <button
            onClick={handleApprove}
            disabled={approving || rejecting}
            className="flex items-center gap-2 rounded-lg bg-success px-4 py-2.5 text-sm font-semibold text-success-foreground transition-colors hover:bg-success/90 disabled:opacity-50"
          >
            {approving ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-success-foreground border-t-transparent" />
            ) : (
              <Check className="h-4 w-4" />
            )}
            Approve
          </button>
        </div>
      </div>
    </div>
  );
}
