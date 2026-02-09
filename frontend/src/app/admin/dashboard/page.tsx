"use client";

import * as React from "react";
import Link from "next/link";
import { apiClient, apiFetcher } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/card";
import {
  PageHeader,
  Container,
  PageWrapper,
} from "@/components/layout/page-header";
import {
  LayoutDashboard,
  ClipboardCheck,
  Store,
  Package,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
  RefreshCw,
  Layers,
  Building2,
  Activity,
} from "lucide-react";
import useSWR from "swr";

export default function AdminDashboardPage() {
  const { data: stats, isLoading, mutate } = useSWR(
    "/api/admin/stats",
    apiFetcher
  );

  const handleRefresh = () => mutate();

  const quickActions = [
    {
      label: "Start Review Queue",
      description:
        stats?.pending_reviews != null
          ? `${stats.pending_reviews} items pending`
          : "View pending items",
      href: "/admin/queue",
      icon: ClipboardCheck,
      variant: (stats?.pending_reviews ?? 0) > 0 ? "warning" : "default",
    },
    {
      label: "Review (Legacy)",
      description: "Review products",
      href: "/admin/review",
      icon: ClipboardCheck,
      variant: "default" as const,
    },
    {
      label: "Manage Merchants",
      description: "Merchants & stores",
      href: "/admin/merchants",
      icon: Store,
      variant: "default" as const,
    },
    {
      label: "Master Catalog",
      description: "Edit master products",
      href: "/admin/catalog",
      icon: Package,
      variant: "default" as const,
    },
    {
      label: "Manage Brands",
      description: "Brands",
      href: "/admin/brands",
      icon: Layers,
      variant: "default" as const,
    },
    {
      label: "Partners",
      description: "Loyalty partners & rates",
      href: "/admin/partners",
      icon: Building2,
      variant: "default" as const,
    },
    {
      label: "Store Config",
      description: "Appearance & config",
      href: "/admin/store-config",
      icon: Activity,
      variant: "default" as const,
    },
  ];

  return (
    <PageWrapper>
      <Container>
        <PageHeader
          title="Admin Dashboard"
          description="Operations overview and quick actions"
          icon={LayoutDashboard}
          actions={
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          }
        />

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard
            title="Pending Reviews"
            value={isLoading ? "—" : stats?.pending_reviews ?? "—"}
            icon={<Clock className="h-5 w-5" />}
            description={
              (stats?.pending_reviews ?? 0) > 0
                ? "Requires attention"
                : "All caught up"
            }
          />
          <StatCard
            title="Total Master Products"
            value={isLoading ? "—" : stats?.total_master_products ?? "—"}
            icon={<Package className="h-5 w-5" />}
            description="Canonical catalog"
          />
          <StatCard
            title="Rejected This Week"
            value={isLoading ? "—" : stats?.rejected_this_week ?? "—"}
            icon={<AlertTriangle className="h-5 w-5" />}
            description="Last 7 days"
          />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <Card padding="none">
              <div className="border-b border-border px-6 py-4">
                <h2 className="text-lg font-semibold text-foreground">
                  Quick Actions
                </h2>
              </div>
              <div className="divide-y divide-border">
                {quickActions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <Link
                      key={action.href}
                      href={action.href}
                      className="flex items-center gap-4 px-6 py-4 transition-colors hover:bg-muted/50"
                    >
                      <div
                        className={cn(
                          "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                          action.variant === "warning"
                            ? "bg-warning/10 text-warning"
                            : "bg-primary/10 text-primary"
                        )}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {action.label}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {action.description}
                        </p>
                      </div>
                      <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                    </Link>
                  );
                })}
              </div>
            </Card>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <Card padding="default">
              <h2 className="text-lg font-semibold text-foreground mb-4">
                Recent Activity
              </h2>
              <div className="space-y-4">
                {[
                  {
                    action: "Review queue ready",
                    description: "Open the queue to process pending items.",
                    time: "Now",
                    type: "info",
                  },
                  {
                    action: "Product approved",
                    description: "Items go live after approval.",
                    time: "—",
                    type: "success",
                  },
                  {
                    action: "Product rejected",
                    description: "Merchants can fix and resync.",
                    time: "—",
                    type: "warning",
                  },
                ].map((activity, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div
                      className={cn(
                        "mt-1.5 h-2 w-2 shrink-0 rounded-full",
                        activity.type === "success" && "bg-success",
                        activity.type === "warning" && "bg-warning",
                        activity.type === "info" && "bg-primary"
                      )}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">
                        {activity.action}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {activity.description}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {activity.time}
                    </span>
                  </div>
                ))}
              </div>
            </Card>

            <Card padding="default">
              <h2 className="text-lg font-semibold text-foreground mb-4">
                Platform Health
              </h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-foreground">API</span>
                  <Badge variant="success" size="sm">
                    Connected
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-foreground">Review queue</span>
                  <Badge
                    variant={(stats?.pending_reviews ?? 0) > 10 ? "warning" : "success"}
                    size="sm"
                  >
                    {(stats?.pending_reviews ?? 0) > 10 ? "High" : "Normal"}
                  </Badge>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </Container>
    </PageWrapper>
  );
}
