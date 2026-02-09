"use client";

import { useGlobal } from "@/context/global-context";
import { apiClient, apiFetcher } from "@/lib/api";
import {
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  ExternalLink,
  RefreshCw,
  Search,
  AlertTriangle,
} from "lucide-react";
import Image from "next/image";
import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import useSWR, { mutate } from "swr";
import { toast } from "sonner";

const PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 300;

function useDebouncedValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
}

// -- TYPES --
interface ProductRow {
  id: number; // Could be real product ID or staging ID
  type: "LIVE" | "STAGING" | "ISSUE";
  title: string;
  sku: string | null;
  image_url: string | null;
  price?: number;
  status_label: string;
  rejection_reason?: string | null;
  shopify_id?: string; // Useful for linking back to Shopify
}

export default function ProductsPage() {
  const { merchantSession } = useGlobal();
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get("tab") || "live";

  const [resyncingId, setResyncingId] = useState<number | null>(null);
  const [stagingPage, setStagingPage] = useState(0);
  const [issuesPage, setIssuesPage] = useState(0);
  const [searchInput, setSearchInput] = useState("");
  const [searchPage, setSearchPage] = useState(0);

  const debouncedSearch = useDebouncedValue(searchInput.trim(), SEARCH_DEBOUNCE_MS);
  const isSearchActive = debouncedSearch.length > 0;

  // -- DATA FETCHING (paginated) --
  const liveProductsUrl = merchantSession
    ? `/api/products?merchantId=${merchantSession.id}&status=all`
    : null;
  const { data: liveProducts } = useSWR(liveProductsUrl, apiFetcher);

  const stagingUrl = merchantSession
    ? `/api/merchants/${merchantSession.id}/staging?page=${stagingPage}&size=${PAGE_SIZE}`
    : null;
  const { data: stagingPageData } = useSWR(stagingUrl, apiFetcher);

  const issuesUrl = merchantSession
    ? `/api/merchants/${merchantSession.id}/issues?page=${issuesPage}&size=${PAGE_SIZE}`
    : null;
  const { data: issuesPageData } = useSWR(issuesUrl, apiFetcher);

  const searchUrl =
    merchantSession && debouncedSearch
      ? `/api/merchants/${merchantSession.id}/search?q=${encodeURIComponent(debouncedSearch)}&page=${searchPage}&size=${PAGE_SIZE}`
      : null;
  const { data: searchPageData } = useSWR(searchUrl, apiFetcher);

  const stagingProducts = stagingPageData?.content ?? [];
  const stagingTotal = stagingPageData?.totalElements ?? 0;
  const stagingTotalPages = stagingPageData?.totalPages ?? 0;

  const issues = issuesPageData?.content ?? [];
  const issuesTotal = issuesPageData?.totalElements ?? 0;
  const issuesTotalPages = issuesPageData?.totalPages ?? 0;

  const searchResults = searchPageData?.content ?? [];
  const searchTotal = searchPageData?.totalElements ?? 0;
  const searchTotalPages = searchPageData?.totalPages ?? 0;

  // -- TAB LOGIC --
  const handleTabChange = (tab: string) => {
    router.replace(`/merchant/products?tab=${tab}`);
  };

  const renderContent = () => {
    if (isSearchActive) {
      return (
        <>
          <ProductTable
            data={searchResults}
            type="STAGING"
            emptyMessage="No products match your search."
          />
          {searchTotalPages > 1 && (
            <PaginationBar
              page={searchPage}
              totalPages={searchTotalPages}
              totalElements={searchTotal}
              pageSize={PAGE_SIZE}
              onPageChange={setSearchPage}
            />
          )}
        </>
      );
    }
    if (currentTab === "live") {
      return (
        <ProductTable
          data={liveProducts || []}
          type="LIVE"
          emptyMessage="No live products. Sync your store to get started."
        />
      );
    }
    if (currentTab === "review") {
      return (
        <>
          <ProductTable
            data={stagingProducts}
            type="STAGING"
            emptyMessage="No products currently under review."
          />
          {stagingTotalPages > 1 && (
            <PaginationBar
              page={stagingPage}
              totalPages={stagingTotalPages}
              totalElements={stagingTotal}
              pageSize={PAGE_SIZE}
              onPageChange={setStagingPage}
            />
          )}
        </>
      );
    }
    if (currentTab === "issues") {
      return (
        <>
          <ProductTable
            data={issues}
            type="ISSUE"
            emptyMessage="Great! No products require attention."
            onAction={handleResyncIssue}
            actionLoadingId={resyncingId}
          />
          {issuesTotalPages > 1 && (
            <PaginationBar
              page={issuesPage}
              totalPages={issuesTotalPages}
              totalElements={issuesTotal}
              pageSize={PAGE_SIZE}
              onPageChange={setIssuesPage}
            />
          )}
        </>
      );
    }
  };

  // -- ACTION HANDLERS --
  const handleResyncIssue = async (id: number) => {
    if (!merchantSession) return;
    setResyncingId(id);
    try {
      await apiClient.resyncStagingProduct(merchantSession.id, id);
      await Promise.all([
        mutate(issuesUrl),
        mutate(stagingUrl),
      ]);
      toast.success("Product queued for resync.");
    } catch (e) {
      console.error(e);
      toast.error("Resync failed. Please try again.");
    } finally {
      setResyncingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Catalog</h1>
        
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value);
              setSearchPage(0);
            }}
            placeholder="Search by title, vendor, SKU..."
            className="w-full rounded-lg border border-border bg-card py-2 pl-9 pr-4 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <nav className="-mb-px flex gap-6" aria-label="Tabs">
          <TabButton
            active={currentTab === "live" && !isSearchActive}
            onClick={() => handleTabChange("live")}
            label="Live"
            count={liveProducts?.filter((p: any) => (p.offer_status ?? p.offerStatus) === "LIVE").length ?? 0}
            icon={CheckCircle2}
            colorClass="text-success"
          />
          <TabButton
            active={currentTab === "review" && !isSearchActive}
            onClick={() => handleTabChange("review")}
            label="Under Review"
            count={stagingTotal}
            icon={Clock}
            colorClass="text-warning"
          />
          <TabButton
            active={currentTab === "issues" && !isSearchActive}
            onClick={() => handleTabChange("issues")}
            label="Needs Attention"
            count={issuesTotal}
            icon={AlertTriangle}
            colorClass="text-destructive"
          />
        </nav>
      </div>

      {/* Table Content */}
      <div className="min-h-[400px]">
        {renderContent()}
      </div>
    </div>
  );
}

// -- SUB COMPONENTS --

function PaginationBar({
  page,
  totalPages,
  totalElements,
  pageSize,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  totalElements: number;
  pageSize: number;
  onPageChange: (p: number) => void;
}) {
  const from = page * pageSize + 1;
  const to = Math.min((page + 1) * pageSize, totalElements);
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border px-4 py-3">
      <p className="text-sm text-muted-foreground">
        Showing {totalElements === 0 ? 0 : from}-{to} of {totalElements}
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 0}
          className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-3 py-1.5 text-sm font-medium disabled:opacity-50 hover:bg-muted"
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </button>
        <span className="text-sm text-muted-foreground">
          Page {page + 1} of {totalPages || 1}
        </span>
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages - 1}
          className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-3 py-1.5 text-sm font-medium disabled:opacity-50 hover:bg-muted"
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function TabButton({ active, onClick, label, count, icon: Icon, colorClass }: any) {
  return (
    <button
      onClick={onClick}
      className={`group flex items-center gap-2 border-b-2 py-4 text-sm font-medium transition-colors ${
        active
          ? "border-primary text-primary"
          : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"
      }`}
    >
      <Icon className={`h-4 w-4 ${active ? colorClass : "text-muted-foreground group-hover:text-foreground"}`} />
      {label}
      {count !== undefined && (
        <span className={`ml-1 rounded-full px-2 py-0.5 text-xs ${
            active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
        }`}>
          {count}
        </span>
      )}
    </button>
  );
}

function ProductTable({ data, type, emptyMessage, onAction, actionLoadingId }: any) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 text-center">
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-6 py-3 font-medium">Product</th>
              {type !== "ISSUE" && <th className="px-6 py-3 font-medium">Details</th>}
              {type === "ISSUE" && <th className="px-6 py-3 font-medium">Rejection Reason</th>}
              <th className="px-6 py-3 font-medium">Status</th>
              {type === "ISSUE" && <th className="px-6 py-3 text-right font-medium">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {data.map((item: any) => {
              const imageUrl = item.image_url ?? item.imageUrl ?? null;
              const rejectionReason = item.rejection_reason ?? item.rejectionReason ?? null;
              const vendor = item.vendor ?? "";
              const basePrice = item.base_price ?? item.basePrice;
              const sku = item.sku ?? "";
              return (
              <tr key={item.id} className="group hover:bg-muted/30">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-4">
                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md border border-border bg-muted">
                      {imageUrl ? (
                        <Image src={imageUrl} alt="" fill className="object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-muted-foreground text-xs">No Img</div>
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-foreground">{item.title}</div>
                      <div className="text-xs text-muted-foreground">{sku || "No SKU"}</div>
                    </div>
                  </div>
                </td>

                {type !== "ISSUE" && (
                  <td className="px-6 py-4">
                     <div className="text-sm">
                        {basePrice != null ? `INR ${basePrice}` : "—"}
                     </div>
                     <div className="text-xs text-muted-foreground">{vendor}</div>
                  </td>
                )}

                {type === "ISSUE" && (
                  <td className="px-6 py-4">
                     <div className="flex items-start gap-2 rounded-md bg-destructive/10 p-2 text-sm text-destructive">
                       <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                       <span>{rejectionReason || "Check Shopify for details."}</span>
                     </div>
                  </td>
                )}

                <td className="px-6 py-4">
                  {type === "LIVE" && (item.offer_status ?? item.offerStatus) === "LIVE" && (
                    <span className="inline-flex items-center rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-medium text-success">
                      Active
                    </span>
                  )}
                  {type === "LIVE" && (item.offer_status ?? item.offerStatus) !== "LIVE" && (
                    <span className="inline-flex items-center rounded-full bg-warning/10 px-2.5 py-0.5 text-xs font-medium text-warning">
                      Pending
                    </span>
                  )}
                  {type === "STAGING" && (
                    <span className="inline-flex items-center rounded-full bg-warning/10 px-2.5 py-0.5 text-xs font-medium text-warning">
                      Pending Review
                    </span>
                  )}
                   {type === "ISSUE" && (
                    <span className="inline-flex items-center rounded-full bg-destructive/10 px-2.5 py-0.5 text-xs font-medium text-destructive">
                      Rejected
                    </span>
                  )}
                </td>

                {type === "ISSUE" && (
                   <td className="px-6 py-4 text-right">
                     <div className="flex flex-col items-end gap-2">
                        {/* Fake link to shopify - in real app construct the URL */}
                        <a 
                          href="#" 
                          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary hover:underline"
                        >
                          Edit in Shopify <ExternalLink className="h-3 w-3"/>
                        </a>
                        <button
                          onClick={() => onAction(item.id)}
                          disabled={actionLoadingId === item.id}
                          className="flex items-center gap-2 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                        >
                          {actionLoadingId === item.id ? (
                            <RefreshCw className="h-3 w-3 animate-spin" />
                          ) : (
                            <RefreshCw className="h-3 w-3" />
                          )}
                          I fixed it, Resync
                        </button>
                    </div>
                     </td>
                )}
              </tr>
            );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}