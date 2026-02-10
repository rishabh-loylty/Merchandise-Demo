"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
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
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { ArrowLeft, Loader2, Search, CheckCircle2, XCircle, Plus } from "lucide-react";
import useSWR from "swr";
import { toast } from "sonner";

type Flow = "match" | "create" | "reject";

export default function AdminReviewDetailPage() {
  const params = useParams();
  const router = useRouter();
  const stagingId = Number(params.stagingId);

  const { data: detail, isLoading, error, mutate } = useSWR(
    stagingId ? `/api/admin/review/${stagingId}` : null,
    apiFetcher
  );

  const [flow, setFlow] = React.useState<Flow | null>(null);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [searchResults, setSearchResults] = React.useState<any[]>([]);
  const [searching, setSearching] = React.useState(false);
  const [selectedMasterId, setSelectedMasterId] = React.useState<number | null>(null);
  const [variantMatch, setVariantMatch] = React.useState<any>(null);
  const [createTitle, setCreateTitle] = React.useState("");
  const [createDescription, setCreateDescription] = React.useState("");
  const [createBrandId, setCreateBrandId] = React.useState<string>("");
  const [createCategoryIds, setCreateCategoryIds] = React.useState<number[]>([]);
  const [selectedMediaIds, setSelectedMediaIds] = React.useState<number[]>([]);
  const [rejectReason, setRejectReason] = React.useState("");
  const [rejectNotes, setRejectNotes] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  const { data: brands } = useSWR(
    flow === "create" ? "/api/admin/brands" : null,
    apiFetcher
  );
  const { data: categories } = useSWR(
    flow === "create" ? "/api/admin/categories" : null,
    apiFetcher
  );

  const [masterVariants, setMasterVariants] = React.useState<Array<{ id: number; internal_sku: string; gtin: string | null; options: Record<string, string> }>>([]);
  type VariantRowChoice = { type: "link"; masterVariantId: number | null } | { type: "add_new"; attributes: Record<string, string> };
  const [variantChoices, setVariantChoices] = React.useState<Record<number, VariantRowChoice>>({});

  React.useEffect(() => {
    if (detail?.raw_title) setCreateTitle(detail.raw_title);
  }, [detail?.raw_title]);

  const handleSearchMaster = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const list = await apiClient.searchMasterProducts(searchQuery.trim());
      setSearchResults(list);
    } catch (e) {
      toast.error("Search failed");
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleSelectMaster = async (masterId: number) => {
    setSelectedMasterId(masterId);
    setVariantMatch(null);
    setMasterVariants([]);
    setVariantChoices({});
    try {
      const [match, variants] = await Promise.all([
        apiClient.getVariantMatch(stagingId, masterId),
        apiClient.getProductVariants(masterId),
      ]);
      setVariantMatch(match);
      setMasterVariants(variants);
      const initial: Record<number, VariantRowChoice> = {};
      match.matches.forEach((m: { staging_variant_id: number; suggested_master_variant_id: number | null; staging_options: Record<string, string> }) => {
        if (m.suggested_master_variant_id != null) {
          initial[m.staging_variant_id] = { type: "link", masterVariantId: m.suggested_master_variant_id };
        } else {
          initial[m.staging_variant_id] = { type: "add_new", attributes: m.staging_options || {} };
        }
      });
      setVariantChoices(initial);
    } catch (e) {
      toast.error("Failed to load variant match or master variants");
      setVariantMatch(null);
      setMasterVariants([]);
    }
  };

  const handleSubmitReject = async () => {
    if (!rejectReason.trim()) {
      toast.error("Rejection reason is required");
      return;
    }
    setSubmitting(true);
    try {
      await apiClient.submitReviewDecision(stagingId, {
        action: "REJECT",
        rejection_reason: rejectReason.trim(),
        admin_notes: rejectNotes.trim() || undefined,
      });
      toast.success("Product rejected");
      router.push("/admin/queue");
    } catch (e: any) {
      toast.error(e?.message || "Reject failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitCreateNew = async () => {
    if (!createTitle.trim()) {
      toast.error("Title is required");
      return;
    }
    setSubmitting(true);
    try {
      await apiClient.submitReviewDecision(stagingId, {
        action: "CREATE_NEW",
        clean_data: {
          title: createTitle.trim(),
          description: createDescription.trim() || undefined,
          brand_id: createBrandId ? Number(createBrandId) : undefined,
          category_ids: createCategoryIds.length ? createCategoryIds : undefined,
          selected_media_ids: selectedMediaIds.length ? selectedMediaIds : undefined,
        },
      });
      toast.success("Master product created and approved");
      router.push("/admin/queue");
    } catch (e: any) {
      toast.error(e?.message || "Create failed");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleMediaSelection = (id: number) => {
    setSelectedMediaIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleCategory = (id: number) => {
    setCreateCategoryIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSubmitLinkExisting = async () => {
    if (selectedMasterId == null || !variantMatch?.matches?.length) {
      toast.error("Select a master product and ensure variant match is loaded");
      return;
    }
    const stagingIds = variantMatch.matches.map((m: any) => m.staging_variant_id);
    const missing = stagingIds.filter((id: number) => {
      const c = variantChoices[id];
      if (!c) return true;
      if (c.type === "link" && c.masterVariantId == null) return true;
      return false;
    });
    if (missing.length > 0) {
      toast.error("Choose link (select a master variant) or add new for every staging variant");
      return;
    }
    const variant_mapping = stagingIds.map((stagingVariantId: number) => {
      const choice = variantChoices[stagingVariantId];
      if (choice.type === "link" && choice.masterVariantId != null) {
        return { staging_variant_id: stagingVariantId, master_variant_id: choice.masterVariantId };
      }
      return {
        staging_variant_id: stagingVariantId,
        new_variant_attributes: choice.type === "add_new" ? choice.attributes : {},
      };
    });
    setSubmitting(true);
    try {
      await apiClient.submitReviewDecision(stagingId, {
        action: "LINK_EXISTING",
        master_product_id: selectedMasterId,
        variant_mapping,
      });
      toast.success("Linked to master product and approved");
      router.push("/admin/queue");
    } catch (e: any) {
      toast.error(e?.message || "Link failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (error || (stagingId && !Number.isInteger(stagingId))) {
    return (
      <PageWrapper>
        <Container>
          <div className="py-12 text-center">
            <p className="text-destructive">Staging product not found.</p>
            <Button variant="outline" className="mt-4" asChild>
              <Link href="/admin/queue">Back to Queue</Link>
            </Button>
          </div>
        </Container>
      </PageWrapper>
    );
  }

  if (isLoading || !detail) {
    return (
      <PageWrapper>
        <Container>
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </Container>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <Container>
        <PageHeader
          title="Review"
          description={`Staging #${detail.staging_id} · ${detail.merchant_name}`}
          breadcrumbs={[
            { label: "Admin", href: "/admin" },
            { label: "Dashboard", href: "/admin/dashboard" },
            { label: "Queue", href: "/admin/queue" },
            { label: `#${detail.staging_id}`, href: `/admin/review/${stagingId}` },
          ]}
          backHref="/admin/queue"
          backLabel="Back to Queue"
        />

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <Card padding="default">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Staging (dirty) data
            </h3>
            <div className="flex gap-4">
              {detail.image_url && (
                <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-muted">
                  <Image src={detail.image_url} alt="" fill className="object-cover" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="font-medium text-foreground">{detail.raw_title}</p>
                <p className="text-sm text-muted-foreground">{detail.raw_vendor} · {detail.raw_product_type}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {detail.variants?.length ?? 0} variant(s)
                </p>
              </div>
            </div>
          </Card>

          <Card padding="default">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Decision
            </h3>
            {flow === null ? (
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  onClick={() => setFlow("match")}
                  className="gap-2"
                >
                  <Search className="h-4 w-4" />
                  Link to existing master
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setFlow("create")}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Create new master
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setFlow("reject")}
                  className="gap-2 text-destructive hover:text-destructive"
                >
                  <XCircle className="h-4 w-4" />
                  Reject
                </Button>
              </div>
            ) : (
              <Button variant="ghost" size="sm" onClick={() => setFlow(null)}>
                ← Change decision
              </Button>
            )}
          </Card>
        </div>

        {flow === "match" && (
          <Card className="mt-6" padding="default">
            <h3 className="font-semibold text-foreground mb-4">Link to existing master product</h3>
            <div className="flex gap-2 mb-4">
              <Input
                placeholder="Search by title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearchMaster()}
              />
              <Button onClick={handleSearchMaster} disabled={searching}>
                {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                Search
              </Button>
            </div>
            {searchResults.length > 0 && (
              <ul className="space-y-2 mb-4">
                {searchResults.map((p) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => handleSelectMaster(p.id)}
                      className={`w-full text-left rounded-lg border px-4 py-2 transition-colors ${
                        selectedMasterId === p.id
                          ? "border-primary bg-primary/5"
                          : "border-border hover:bg-muted/50"
                      }`}
                    >
                      <span className="font-medium">{p.title}</span>
                      <span className="text-muted-foreground text-sm ml-2">{p.brand}</span>
                      <span className="text-muted-foreground text-xs ml-2">({p.variant_count} variants)</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {variantMatch && (
              <div className="border-t border-border pt-4">
                <p className="text-sm font-medium text-foreground mb-2">Map each staging variant: link to existing or add new</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-2 pr-2">Staging (SKU / options)</th>
                        <th className="text-left py-2 pr-2">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {variantMatch.matches.map((m: any) => {
                        const choice = variantChoices[m.staging_variant_id];
                        return (
                          <tr key={m.staging_variant_id} className="border-b border-border">
                            <td className="py-2 pr-2 align-top">
                              <span className="font-mono text-xs">{m.staging_options?.SKU ?? m.staging_variant_id}</span>
                              {m.staging_options && Object.keys(m.staging_options).filter((k) => k !== "SKU").length > 0 && (
                                <span className="text-muted-foreground ml-1">
                                  {JSON.stringify(m.staging_options)}
                                </span>
                              )}
                            </td>
                            <td className="py-2">
                              <div className="flex flex-wrap gap-2 items-start">
                                <Select
                                  value={choice?.type === "link" && choice.masterVariantId != null ? String(choice.masterVariantId) : "add_new"}
                                  onValueChange={(v) => {
                                    if (v === "add_new") {
                                      setVariantChoices((prev) => ({ ...prev, [m.staging_variant_id]: { type: "add_new", attributes: m.staging_options || {} } }));
                                    } else {
                                      setVariantChoices((prev) => ({ ...prev, [m.staging_variant_id]: { type: "link", masterVariantId: Number(v) } }));
                                    }
                                  }}
                                >
                                  <SelectTrigger className="w-[200px]">
                                    <SelectValue placeholder="Link or add new..." />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="add_new">+ Add new variant</SelectItem>
                                    {masterVariants.map((mv) => (
                                      <SelectItem key={mv.id} value={String(mv.id)}>
                                        Link: {mv.internal_sku} {mv.options && Object.keys(mv.options).length ? ` (${JSON.stringify(mv.options)})` : ""}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                {choice?.type === "add_new" && (
                                  <span className="text-xs text-muted-foreground">New variant will use staging options</span>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <Button
                  className="mt-4"
                  onClick={handleSubmitLinkExisting}
                  disabled={submitting}
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Approve & link
                </Button>
              </div>
            )}
          </Card>
        )}

        {flow === "create" && (
          <Card className="mt-6" padding="default">
            <h3 className="font-semibold text-foreground mb-4">Create new master product (full product page)</h3>
            <div className="space-y-6 max-w-2xl">
              <div>
                <label className="text-sm font-medium text-foreground">Title *</label>
                <Input
                  value={createTitle}
                  onChange={(e) => setCreateTitle(e.target.value)}
                  placeholder="Clean title"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Description (optional)</label>
                <Textarea
                  value={createDescription}
                  onChange={(e) => setCreateDescription(e.target.value)}
                  placeholder="Description"
                  className="mt-1"
                  rows={3}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Brand</label>
                <Select value={createBrandId || "none"} onValueChange={(v) => setCreateBrandId(v === "none" ? "" : v)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select brand..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No brand</SelectItem>
                    {(brands || []).map((b: { id: number; name: string }) => (
                      <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Categories</label>
                <p className="text-xs text-muted-foreground mt-0.5">Select one or more</p>
                <div className="mt-2 flex flex-wrap gap-3">
                  {(categories || []).map((c: { id: number; name: string }) => (
                    <label key={c.id} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={createCategoryIds.includes(c.id)}
                        onChange={() => toggleCategory(c.id)}
                        className="rounded border-border"
                      />
                      <span className="text-sm">{c.name}</span>
                    </label>
                  ))}
                </div>
              </div>
              {detail.media && detail.media.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-foreground">Product images</label>
                  <p className="text-xs text-muted-foreground mt-0.5">Select images in display order (click to toggle)</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {detail.media.map((m: { id: number; source_url: string; alt_text?: string | null }) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => toggleMediaSelection(m.id)}
                        className={`relative rounded-lg border-2 overflow-hidden w-20 h-20 shrink-0 block ${
                          selectedMediaIds.includes(m.id) ? "border-primary ring-2 ring-primary/20" : "border-border hover:border-muted-foreground"
                        }`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={m.source_url} alt={m.alt_text || ""} className="w-full h-full object-cover" />
                        {selectedMediaIds.includes(m.id) && (
                          <span className="absolute bottom-0 right-0 bg-primary text-primary-foreground text-xs px-1">
                            {selectedMediaIds.indexOf(m.id) + 1}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground mb-2">Variants ({detail.variants?.length ?? 0}) will be created from staging.</p>
              </div>
              <Button onClick={handleSubmitCreateNew} disabled={submitting}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                Create new master & approve
              </Button>
            </div>
          </Card>
        )}

        {flow === "reject" && (
          <Card className="mt-6" padding="default">
            <h3 className="font-semibold text-foreground mb-4">Reject</h3>
            <div className="space-y-4 max-w-md">
              <div>
                <label className="text-sm font-medium text-foreground">Rejection reason *</label>
                <Input
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="e.g. Fake Product"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Admin notes (optional)</label>
                <Textarea
                  value={rejectNotes}
                  onChange={(e) => setRejectNotes(e.target.value)}
                  placeholder="Internal note"
                  className="mt-1"
                  rows={2}
                />
              </div>
              <Button
                variant="destructive"
                onClick={handleSubmitReject}
                disabled={submitting || !rejectReason.trim()}
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                Reject
              </Button>
            </div>
          </Card>
        )}
      </Container>
    </PageWrapper>
  );
}
