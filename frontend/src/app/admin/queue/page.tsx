"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiClient, apiFetcher } from "@/lib/api";
import type { ReviewQueueItem } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  PageHeader,
  Container,
  PageWrapper,
} from "@/components/layout/page-header";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { ClipboardCheck, ChevronLeft, ChevronRight } from "lucide-react";
import useSWR from "swr";
import { toast } from "sonner";

const PAGE_SIZE = 20;

function confidenceLabel(score: number): string {
  if (score >= 80) return "High";
  if (score >= 50) return "Med";
  return "Low";
}

function confidenceClass(score: number): string {
  if (score >= 80) return "bg-success/10 text-success";
  if (score >= 50) return "bg-warning/10 text-warning";
  return "bg-muted text-muted-foreground";
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, {
      dateStyle: "short",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

export default function AdminQueuePage() {
  const router = useRouter();
  const [status, setStatus] = React.useState<string>("");
  const [page, setPage] = React.useState(0);

  const params = new URLSearchParams({ page: String(page), size: String(PAGE_SIZE) });
  if (status) params.set("status", status);
  const key = `/api/admin/queue?${params}`;
  const { data, isLoading, error, mutate } = useSWR(key, apiFetcher);

  const content: ReviewQueueItem[] = data?.content ?? [];
  const totalElements = data?.total_elements ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalElements / PAGE_SIZE));

  const handleRowClick = (stagingId: number) => {
    router.push(`/admin/review/${stagingId}`);
  };

  return (
    <PageWrapper>
      <Container>
        <PageHeader
          title="Review Queue"
          description="Staging products awaiting review (PENDING or NEEDS_REVIEW)"
          icon={ClipboardCheck}
          breadcrumbs={[
            { label: "Admin", href: "/admin" },
            { label: "Dashboard", href: "/admin/dashboard" },
            { label: "Queue", href: "/admin/queue" },
          ]}
          actions={
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin/dashboard">
                <ChevronLeft className="h-4 w-4 mr-1" />
                Dashboard
              </Link>
            </Button>
          }
        />

        <div className="mt-6 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground">Status</span>
            <Select
              value={status || "all"}
              onValueChange={(v) => {
                setStatus(v === "all" ? "" : v);
                setPage(0);
              }}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All pending</SelectItem>
                <SelectItem value="PENDING">PENDING</SelectItem>
                <SelectItem value="NEEDS_REVIEW">NEEDS_REVIEW</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Card className="mt-4" padding="none">
          {error && (
            <div className="p-4 bg-destructive/10 text-destructive text-sm rounded-t-xl">
              Failed to load queue. {error.message}
            </div>
          )}
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : content.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <ClipboardCheck className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-foreground">
                Queue is empty
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                No products currently pending or needing review.
              </p>
              <Button variant="outline" className="mt-4" asChild>
                <Link href="/admin/dashboard">Back to Dashboard</Link>
              </Button>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Merchant</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead>Match confidence</TableHead>
                      <TableHead className="w-[100px]">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {content.map((row) => (
                      <TableRow
                        key={row.staging_id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleRowClick(row.staging_id)}
                      >
                        <TableCell>
                          <div>
                            <p className="font-medium text-foreground line-clamp-1">
                              {row.raw_title || "—"}
                            </p>
                            {row.suggested_master_id != null && (
                              <p className="text-xs text-muted-foreground">
                                Suggested master #{row.suggested_master_id}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {row.merchant_name || "—"}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {row.created_at ? formatDate(row.created_at) : "—"}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${confidenceClass(
                              row.match_confidence ?? 0
                            )}`}
                          >
                            {confidenceLabel(row.match_confidence ?? 0)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRowClick(row.staging_id);
                            }}
                          >
                            Review
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-border px-4 py-3">
                  <p className="text-sm text-muted-foreground">
                    Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, totalElements)} of{" "}
                    {totalElements}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page <= 0}
                      onClick={() => setPage((p) => p - 1)}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Page {page + 1} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= totalPages - 1}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </Card>
      </Container>
    </PageWrapper>
  );
}
