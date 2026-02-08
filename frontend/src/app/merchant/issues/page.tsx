"use client";

import { useGlobal } from "@/context/global-context";
import { fetcher } from "@/lib/fetcher";
import { AlertTriangle, ArrowLeft, RefreshCw, Wrench } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import useSWR from "swr";

interface IssueItem {
  id: number;
  title: string;
  rejection_reason: string | null;
  rejected_at: string;
  vendor?: string;
}

export default function MerchantIssuesPage() {
  const { merchantSession } = useGlobal();
  const router = useRouter();
  const [resyncingId, setResyncingId] = useState<number | null>(null);

  const { data: issues, mutate } = useSWR<IssueItem[]>(
    merchantSession ? `/api/merchants/${merchantSession.id}/issues` : null,
    fetcher
  );

  useEffect(() => {
    if (!merchantSession) {
      router.push("/merchant");
      return;
    }
    if (!merchantSession.shopify_configured) {
      router.push("/merchant/onboarding");
    }
  }, [merchantSession, router]);

  const handleResync = async (issueId: number) => {
    if (!merchantSession) return;
    setResyncingId(issueId);
    try {
      const res = await fetch(
        `/api/merchants/${merchantSession.id}/products/${issueId}/resync`,
        { method: "POST" }
      );
      if (res.ok) mutate();
    } finally {
      setResyncingId(null);
    }
  };

  if (!merchantSession) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const issueList = issues ?? [];

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/merchant/dashboard"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-background text-foreground hover:bg-muted"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
              <AlertTriangle className="h-6 w-6 text-destructive" />
              Listing Issues
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Products that were rejected during review. Fix them in Shopify and resubmit.
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-sm">
        {issueList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Wrench className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-semibold text-foreground">No issues</h3>
            <p className="mb-4 text-sm text-muted-foreground">
              You have no rejected listings. Sync products to send them for review.
            </p>
            <Link
              href="/merchant/dashboard"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Back to Dashboard
            </Link>
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
                    Rejection reason
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Rejected at
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {issueList.map((issue) => (
                  <tr key={issue.id} className="hover:bg-muted/30">
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-foreground">{issue.title}</p>
                      {issue.vendor && (
                        <p className="text-xs text-muted-foreground">{issue.vendor}</p>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-destructive">
                      {issue.rejection_reason ?? "Not specified"}
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {issue.rejected_at
                        ? new Date(issue.rejected_at).toLocaleDateString(undefined, {
                            dateStyle: "medium",
                          })
                        : "—"}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleResync(issue.id)}
                        disabled={resyncingId === issue.id}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                      >
                        {resyncingId === issue.id ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          <RefreshCw className="h-4 w-4" />
                        )}
                        I fixed it on Shopify
                      </button>
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
