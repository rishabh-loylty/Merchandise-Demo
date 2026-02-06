"use client";

import { useGlobal } from "@/context/global-context";
import {
  fetchMerchantProducts,
  syncShopifyProducts,
  type Product,
} from "@/lib/mock-data";
import { Box, Package, RefreshCw } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

export default function MerchantProductsPage() {
  const { merchantSession, addProducts, products: contextProducts } =
    useGlobal();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<
    "all" | "LIVE" | "PENDING_REVIEW"
  >("all");

  const loadProducts = useCallback(async () => {
    if (!merchantSession) return;
    setLoading(true);
    const fetched = await fetchMerchantProducts(merchantSession.id);
    const contextMerchantProducts = contextProducts.filter(
      (p) => p.merchantId === merchantSession.id
    );
    const allProducts = [...fetched, ...contextMerchantProducts];
    const uniqueProducts = allProducts.filter(
      (p, i, arr) => arr.findIndex((x) => x.id === p.id) === i
    );
    setProducts(uniqueProducts);
    setLoading(false);
  }, [merchantSession, contextProducts]);

  useEffect(() => {
    if (!merchantSession) {
      router.push("/merchant");
      return;
    }
    if (!merchantSession.shopifyConfigured) {
      router.push("/merchant/onboarding");
      return;
    }
    loadProducts();
  }, [merchantSession, router, loadProducts]);

  const handleSync = async () => {
    if (!merchantSession) return;
    setSyncing(true);
    const newProducts = await syncShopifyProducts(merchantSession.id);
    addProducts(newProducts);
    setProducts((prev) => [...prev, ...newProducts]);
    setSyncing(false);
  };

  if (!merchantSession) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const filteredProducts =
    filterStatus === "all"
      ? products
      : products.filter((p) => p.status === filterStatus);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
            <Package className="h-6 w-6 text-primary" />
            Products
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your product catalog
          </p>
        </div>
        <button
          onClick={handleSync}
          disabled={syncing}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
        >
          <RefreshCw
            className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`}
          />
          {syncing ? "Syncing..." : "Sync Products"}
        </button>
      </div>

      {/* Filter tabs */}
      <div className="mb-6 flex gap-2">
        {(["all", "LIVE", "PENDING_REVIEW"] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              filterStatus === status
                ? "bg-primary text-primary-foreground"
                : "border border-border bg-card text-foreground hover:bg-muted"
            }`}
          >
            {status === "all"
              ? "All"
              : status === "LIVE"
                ? "Live"
                : "Pending Review"}
            <span className="ml-1.5 text-xs opacity-80">
              (
              {status === "all"
                ? products.length
                : products.filter((p) => p.status === status).length}
              )
            </span>
          </button>
        ))}
      </div>

      {/* Products Table */}
      <div className="rounded-xl border border-border bg-card shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Box className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-semibold text-foreground">
              No products found
            </h3>
            <p className="text-sm text-muted-foreground">
              {filterStatus === "all"
                ? "Sync your Shopify store to import products"
                : "No products with this status"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    SKU
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Brand
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-muted/30">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
                          <Image
                            src={product.image}
                            alt={product.title}
                            fill
                            className="object-cover"
                            sizes="40px"
                          />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {product.title}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {product.vendor}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {product.sku}
                    </td>
                    <td className="px-6 py-4 text-sm text-foreground">
                      {product.brand}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-foreground">
                      INR {product.basePrice.toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          product.status === "LIVE"
                            ? "bg-success/10 text-success"
                            : "bg-warning/10 text-warning"
                        }`}
                      >
                        {product.status === "LIVE"
                          ? "Live"
                          : "Pending Review"}
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
