"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { apiClient, apiFetcher } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Package, Pencil, ChevronLeft, ChevronRight } from "lucide-react";
import useSWR from "swr";
import { toast } from "sonner";

const PAGE_SIZE = 20;

export default function AdminCatalogPage() {
  const [page, setPage] = React.useState(0);
  const [searchInput, setSearchInput] = React.useState("");
  const [editId, setEditId] = React.useState<number | null>(null);
  const [editTitle, setEditTitle] = React.useState("");
  const [editDescription, setEditDescription] = React.useState("");
  const [editImageUrl, setEditImageUrl] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  const listKey = `/api/admin/products?page=${page}&size=${PAGE_SIZE}`;
  const { data: listData, isLoading, mutate } = useSWR(listKey, apiFetcher);

  const content = listData?.content ?? [];
  const totalElements = listData?.totalElements ?? 0;
  const totalPages = Math.max(1, listData?.totalPages ?? 0);

  const openEdit = (item: { id: number; title: string; image_url?: string | null }) => {
    setEditId(item.id);
    setEditTitle(item.title);
    setEditImageUrl(item.image_url || "");
    setEditDescription("");
  };

  const handleSaveEdit = async () => {
    if (editId == null) return;
    setSaving(true);
    try {
      await apiClient.updateMasterProduct(editId, {
        title: editTitle.trim() || undefined,
        description: editDescription.trim() || undefined,
        image_url: editImageUrl.trim() || undefined,
      });
      toast.success("Product updated");
      setEditId(null);
      mutate();
    } catch (e: any) {
      toast.error(e?.message || "Update failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageWrapper>
      <Container>
        <PageHeader
          title="Master Catalog"
          description="Edit canonical (master) products"
          icon={Package}
          breadcrumbs={[
            { label: "Admin", href: "/admin" },
            { label: "Dashboard", href: "/admin/dashboard" },
            { label: "Catalog", href: "/admin/catalog" },
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

        <Card className="mt-6" padding="none">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : content.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Package className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-foreground">
                No master products
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Products are created when you approve staging items.
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Brand</TableHead>
                      <TableHead>Variants</TableHead>
                      <TableHead className="w-[100px]">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {content.map((row: any) => (
                      <TableRow key={row.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {row.image_url ? (
                              <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md bg-muted">
                                <Image
                                  src={row.image_url}
                                  alt=""
                                  fill
                                  className="object-cover"
                                />
                              </div>
                            ) : (
                              <div className="h-10 w-10 shrink-0 rounded-md bg-muted flex items-center justify-center">
                                <Package className="h-5 w-5 text-muted-foreground" />
                              </div>
                            )}
                            <span className="font-medium text-foreground line-clamp-1">
                              {row.title}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {row.brand || "—"}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {row.variant_count ?? 0}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEdit(row)}
                          >
                            <Pencil className="h-4 w-4 mr-1" />
                            Edit
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

        <Dialog open={editId != null} onOpenChange={(open) => !open && setEditId(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit master product</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <label className="text-sm font-medium text-foreground">Title</label>
                <Input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Description</label>
                <Textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="mt-1"
                  rows={3}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Image URL</label>
                <Input
                  value={editImageUrl}
                  onChange={(e) => setEditImageUrl(e.target.value)}
                  placeholder="https://..."
                  className="mt-1"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditId(null)}>
                Cancel
              </Button>
              <Button onClick={handleSaveEdit} disabled={saving}>
                {saving ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </Container>
    </PageWrapper>
  );
}
