"use client";

import { useGlobal } from "@/context/global-context";
import { apiClient, apiFetcher } from "@/lib/api";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  RefreshCw,
  ShoppingBag,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import useSWR, { mutate } from "swr";

export default function DashboardPage() {
  const { merchantSession } = useGlobal();
  const [syncing, setSyncing] = useState(false);

  const { data: stats } = useSWR(
    merchantSession ? `/api/merchants/${merchantSession.id}/stats` : null,
    apiFetcher
  );

  const { data: issues } = useSWR(
    merchantSession ? `/api/merchants/${merchantSession.id}/issues` : null,
    apiFetcher
  );

  const handleSync = async () => {
    if (!merchantSession) return;
    setSyncing(true);
    try {
      await apiClient.syncMerchant(merchantSession.id.toString());
      await Promise.all([
        mutate(`/api/merchants/${merchantSession.id}/stats`),
        mutate(`/api/merchants/${merchantSession.id}/issues`),
        mutate(`/api/merchants/${merchantSession.id}/staging`),
      ]);
    } catch (e) {
      console.error(e);
    } finally {
      setSyncing(false);
    }
  };

  const issuesCount = stats?.issues ?? issues?.length ?? 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Overview
          </h1>
          <p className="text-muted-foreground">
            Your catalog health at a glance.
          </p>
        </div>
        <div className="flex gap-3">
          <Link
             href="/merchant/settings"
             className="inline-flex items-center justify-center rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
          >
            Check Configuration
          </Link>
          <button
            onClick={handleSync}
            disabled={syncing}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
            {syncing ? "Syncing..." : "Sync Catalog"}
          </button>
        </div>
      </div>

      {/* Action Required Banner */}
      {issuesCount > 0 && (
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4">
          <div className="flex items-start gap-4">
            <div className="rounded-full bg-destructive/10 p-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-destructive">
                {issuesCount} Products require attention
              </h3>
              <p className="text-sm text-muted-foreground">
                Some imported products were rejected by the operations team.
                Please review them to ensure they go live.
              </p>
            </div>
            <Link
              href="/merchant/products?tab=issues"
              className="group flex items-center gap-1 text-sm font-medium text-destructive hover:underline"
            >
              Fix Issues <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="rounded-lg bg-success/10 p-3">
              <CheckCircle2 className="h-6 w-6 text-success" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Live Products
              </p>
              <h2 className="text-2xl font-bold text-foreground">
                {stats?.liveProducts ?? "--"}
              </h2>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="rounded-lg bg-warning/10 p-3">
              <Clock className="h-6 w-6 text-warning" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Under Review
              </p>
              <h2 className="text-2xl font-bold text-foreground">
                {stats?.underReview ?? "--"}
              </h2>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="rounded-lg bg-primary/10 p-3">
              <ShoppingBag className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Total SKUs
              </p>
              <h2 className="text-2xl font-bold text-foreground">
                {stats?.totalSkus ?? "--"}
              </h2>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity / Steps Guide */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h3 className="mb-4 text-lg font-semibold text-foreground">
          Quick Guide
        </h3>
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
              1
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                Manage in Shopify
              </p>
              <p className="text-sm text-muted-foreground">
                Create products, update prices, and change descriptions directly
                in your Shopify admin panel.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
              2
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                Sync to Marketplace
              </p>
              <p className="text-sm text-muted-foreground">
                Click the &quot;Sync Catalog&quot; button above. We will fetch your changes
                and place them in the &quot;Under Review&quot; queue.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
              3
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                Ops Approval
              </p>
              <p className="text-sm text-muted-foreground">
                Our team reviews images and descriptions. Once approved, items
                go live instantly. If rejected, check the &quot;Needs Attention&quot;
                tab.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}