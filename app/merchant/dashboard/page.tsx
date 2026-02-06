"use client";

import { useGlobal } from "@/context/global-context";
import { fetcher } from "@/lib/fetcher";
import type { ApiProduct } from "@/lib/types";
import {
  Box,
  CheckCircle2,
  Clock,
  LayoutDashboard,
  Package,
  RefreshCw,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import useSWR from "swr";

export default function MerchantDashboardPage() {
  const { merchantSession } = useGlobal();
  const router = useRouter();
  const [syncing, setSyncing] = useState(false);

  const apiUrl = merchantSession
    ? `/api/products?status=all&merchantId=${merchantSession.id}`
    : null;

  const { data: products, isLoading, mutate } = useSWR<ApiProduct[]>(apiUrl, fetcher);

  useEffect(() => {
    if (!merchantSession) {
      router.push("/merchant");
      return;
    }
    if (!merchantSession.shopify_configured) {
      router.push("/merchant/onboarding");
    }
  }, [merchantSession, router]);

  const handleSync = async () => {
    if (!merchantSession) return;
    setSyncing(true);
    try {
      await fetch(`/api/merchants/${merchantSession.id}/sync`, { method: "POST" });
      mutate(); // Refresh products list from API
    } catch {
      // handle error silently
    }
    setSyncing(false);
  };

  if (!merchantSession) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const productList = products ?? [];
  const liveCount = productList.filter((p) => p.offer_status === "LIVE").length;
  const pendingCount = productList.filter((p) => p.offer_status === "PENDING_REVIEW").length;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
            <LayoutDashboard className="h-6 w-6 text-primary" />
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">Welcome back, {merchantSession.name}</p>
        </div>
        <button
          onClick={handleSync}
          disabled={syncing}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
          {syncing ? "Syncing..." : "Sync Products"}
        </button>
      </div>

      {/* Stats */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent">
              <Package className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Products</p>
              <p className="text-2xl font-bold text-foreground">{productList.length}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
              <CheckCircle2 className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Live</p>
              <p className="text-2xl font-bold text-foreground">{liveCount}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10">
              <Clock className="h-5 w-5 text-warning" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pending Review</p>
              <p className="text-2xl font-bold text-foreground">{pendingCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Product Table */}
      <div className="rounded-xl border border-border bg-card shadow-sm">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-lg font-semibold text-foreground">Your Products</h2>
          <Link href="/merchant/products" className="text-sm font-medium text-primary hover:underline">
            View All
          </Link>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : productList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Box className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-semibold text-foreground">No products yet</h3>
            <p className="mb-4 text-sm text-muted-foreground">Sync your Shopify store to import products</p>
            <button
              onClick={handleSync}
              disabled={syncing}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
            >
              <RefreshCw className="h-4 w-4" />
              Sync Now
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Product</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">SKU</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {productList.slice(0, 10).map((product) => (
                  <tr key={product.id} className="hover:bg-muted/30">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
                          <Image src={product.image_url} alt={product.title} fill className="object-cover" sizes="40px" />
                        </div>
                        <span className="text-sm font-medium text-foreground">{product.title}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{product.sku}</td>
                    <td className="px-6 py-4 text-sm font-medium text-foreground">INR {product.base_price.toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          product.offer_status === "LIVE" ? "bg-success/10 text-success" : "bg-warning/10 text-warning"
                        }`}
                      >
                        {product.offer_status === "LIVE" ? "Live" : "Pending Review"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
