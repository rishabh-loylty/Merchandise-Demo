"use client";

import { useGlobal } from "@/context/global-context";
import { apiFetcher } from "@/lib/api";
import {
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Search,
  AlertTriangle,
} from "lucide-react";
import Image from "next/image";
import { useSearchParams, useRouter } from "next/navigation";
import { useState, useMemo } from "react";
import useSWR from "swr";

const PAGE_SIZE = 20;

export default function ProductsPage() {
  const { merchantSession } = useGlobal();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Tabs: approved | review | issues
  const currentTab = searchParams.get("tab") || "approved";
  const [page, setPage] = useState(0);
  const [searchInput, setSearchInput] = useState("");

  // -- DATA FETCHING --
  // Fetching from the single staging endpoint
  const stagingUrl = merchantSession
    ? `/api/merchants/${merchantSession.id}/staging?page=${page}&size=${PAGE_SIZE}`
    : null;

  const { data, isLoading } = useSWR(stagingUrl, apiFetcher);

  // -- CLIENT SIDE FILTERING & LOGIC --
  const allProducts = data?.content ?? [];

  const filteredData = useMemo(() => {
    // 1. First apply Search if active
    let list = allProducts;
    if (searchInput.trim()) {
      const q = searchInput.toLowerCase();
      list = list.filter((p: any) => 
        p.title?.toLowerCase().includes(q) || 
        p.vendor?.toLowerCase().includes(q) ||
        p.sku?.toLowerCase().includes(q)
      );
      return list;
    }

    // 2. Otherwise filter by Tab
    switch (currentTab) {
      case "approved":
        return list.filter((p: any) => p.status === "APPROVED");
      case "review":
        return list.filter((p: any) => p.status === "PENDING");
      case "issues":
        return list.filter((p: any) => p.status !== "APPROVED" && p.status !== "PENDING");
      default:
        return list;
    }
  }, [allProducts, currentTab, searchInput]);

  // Dynamic counts for the tab badges based on current page data
  const counts = {
    approved: allProducts.filter((p: any) => p.status === "APPROVED").length,
    review: allProducts.filter((p: any) => p.status === "PENDING").length,
    issues: allProducts.filter((p: any) => p.status !== "APPROVED" && p.status !== "PENDING").length,
  };

  const handleTabChange = (tab: string) => {
    setSearchInput(""); // Clear search when changing tabs
    router.replace(`/merchant/products?tab=${tab}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Catalog</h1>
        
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search this page..."
            className="w-full rounded-lg border border-border bg-card py-2 pl-9 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <nav className="-mb-px flex gap-6">
          <TabButton
            active={currentTab === "approved" && !searchInput}
            onClick={() => handleTabChange("approved")}
            label="Approved"
            count={counts.approved}
            icon={CheckCircle2}
            colorClass="text-success"
          />
          <TabButton
            active={currentTab === "review" && !searchInput}
            onClick={() => handleTabChange("review")}
            label="Under Review"
            count={counts.review}
            icon={Clock}
            colorClass="text-warning"
          />
          <TabButton
            active={currentTab === "issues" && !searchInput}
            onClick={() => handleTabChange("issues")}
            label="Needs Attention"
            count={counts.issues}
            icon={AlertTriangle}
            colorClass="text-destructive"
          />
        </nav>
      </div>

      {/* Table Content */}
      <div className="min-h-[400px]">
        {isLoading ? (
          <div className="py-20 text-center text-muted-foreground">Loading catalog...</div>
        ) : (
          <>
            <ProductTable 
              data={filteredData} 
              type={searchInput ? "SEARCH" : currentTab.toUpperCase()} 
            />
            
            {/* Standard Pagination (from API) */}
            {data?.totalPages > 1 && (
              <PaginationBar
                page={page}
                totalPages={data.totalPages}
                totalElements={data.totalElements}
                pageSize={PAGE_SIZE}
                onPageChange={setPage}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

// -- SUB COMPONENTS --

function ProductTable({ data, type }: any) {
  if (data.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 text-center">
        <p className="text-muted-foreground text-sm">No products found here.</p>
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
              <th className="px-6 py-3 font-medium">Vendor</th>
              <th className="px-6 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {data.map((item: any) => (
              <tr key={item.id} className="group hover:bg-muted/30">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-4">
                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md border border-border bg-muted">
                      {item.imageUrl ? (
                        <Image src={item.imageUrl} alt="" fill className="object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-[10px] text-muted-foreground">NO IMG</div>
                      )}
                    </div>
                    <div className="text-sm font-medium text-foreground">{item.title}</div>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-muted-foreground">
                  {item.vendor || "—"}
                </td>
                <td className="px-6 py-4">
                   <StatusBadge status={item.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "APPROVED":
      return <span className="inline-flex items-center rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-medium text-success">Approved</span>;
    case "PENDING":
      return <span className="inline-flex items-center rounded-full bg-warning/10 px-2.5 py-0.5 text-xs font-medium text-warning">Under Review</span>;
    default:
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2.5 py-0.5 text-xs font-medium text-destructive">
          <AlertCircle className="h-3 w-3" /> Issue
        </span>
      );
  }
}

function TabButton({ active, onClick, label, count, icon: Icon, colorClass }: any) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 border-b-2 py-4 text-sm font-medium transition-colors ${
        active ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
      }`}
    >
      <Icon className={`h-4 w-4 ${active ? colorClass : ""}`} />
      {label}
      <span className={`ml-1 rounded-full px-2 py-0.5 text-xs ${active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
        {count}
      </span>
    </button>
  );
}

function PaginationBar({ page, totalPages, totalElements, pageSize, onPageChange }: any) {
  const from = page * pageSize + 1;
  const to = Math.min((page + 1) * pageSize, totalElements);
  return (
    <div className="mt-4 flex items-center justify-between px-2">
      <p className="text-sm text-muted-foreground">Showing {from}-{to} of {totalElements}</p>
      <div className="flex gap-2">
        <button disabled={page === 0} onClick={() => onPageChange(page - 1)} className="rounded border p-1 disabled:opacity-30"><ChevronLeft className="h-4 w-4"/></button>
        <span className="text-sm self-center font-medium">Page {page + 1} of {totalPages}</span>
        <button disabled={page >= totalPages - 1} onClick={() => onPageChange(page + 1)} className="rounded border p-1 disabled:opacity-30"><ChevronRight className="h-4 w-4"/></button>
      </div>
    </div>
  );
}