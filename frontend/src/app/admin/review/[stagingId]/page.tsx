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
import { OptionsEditor, type Option } from "@/components/ui/options-editor";
import { KeyValueEditor } from "@/components/ui/key-value-editor";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { CategoryMultiSelect } from "@/components/ui/category-multi-select";
import {
  PageHeader,
  Container,
  PageWrapper,
} from "@/components/layout/page-header";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ArrowRight, Loader2, Search, CheckCircle2, XCircle, Plus, Layers, FolderTree, Link2, ImagePlus, SkipForward, Pencil } from "lucide-react";
import useSWR from "swr";
import { toast } from "sonner";

// Helper to generate slug from name
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

type Flow = "match" | "create" | "reject";
interface LinkChoice { type: "link"; masterVariantId: number }
interface AddNewChoice { type: "add_new"; attributes: Record<string, string> }
interface SkipChoice { type: "skip" }
type VariantRowChoice = LinkChoice | AddNewChoice | SkipChoice;

/** Normalize options to a comparable key, e.g. "color=pink|size=s" */
function optionsKey(opts: Record<string, string>): string {
  return Object.entries(opts)
    .filter(([k]) => k !== "SKU")
    .map(([k, v]) => `${k.toLowerCase().trim()}=${v.toLowerCase().trim()}`)
    .sort()
    .join("|");
}

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
  const [createSlug, setCreateSlug] = React.useState("");
  const [createDescription, setCreateDescription] = React.useState("");
  const [createSpecifications, setCreateSpecifications] = React.useState<Array<{ key: string; value: string }>>([]);
  const [createOptionsDefinition, setCreateOptionsDefinition] = React.useState<Option[]>([]);
  const [createBrandId, setCreateBrandId] = React.useState<string>("");
  const [createCategoryIds, setCreateCategoryIds] = React.useState<number[]>([]);
  const [selectedMediaIds, setSelectedMediaIds] = React.useState<number[]>([]);
  const [extraMedia, setExtraMedia] = React.useState<Array<{ url: string; alt_text?: string }>>([]);
  const [extraMediaUrl, setExtraMediaUrl] = React.useState("");
  const [extraMediaAlt, setExtraMediaAlt] = React.useState("");
  const [rejectReason, setRejectReason] = React.useState("");
  const [rejectNotes, setRejectNotes] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [selectedImage, setSelectedImage] = React.useState<any | null>(null);

  const { data: brands, mutate: mutateBrands } = useSWR(
    flow === "create" ? "/api/admin/brands" : null,
    apiFetcher
  );
  const { data: categories, mutate: mutateCategories } = useSWR(
    flow === "create" ? "/api/admin/categories" : null,
    apiFetcher
  );

  // Quick-create states
  const [showCreateBrand, setShowCreateBrand] = React.useState(false);
  const [newBrandName, setNewBrandName] = React.useState("");
  const [newBrandSlug, setNewBrandSlug] = React.useState("");
  const [newBrandLogoUrl, setNewBrandLogoUrl] = React.useState("");
  const [creatingBrand, setCreatingBrand] = React.useState(false);

  const [showCreateCategory, setShowCreateCategory] = React.useState(false);
  const [newCategoryName, setNewCategoryName] = React.useState("");
  const [newCategorySlug, setNewCategorySlug] = React.useState("");
  const [newCategoryParentId, setNewCategoryParentId] = React.useState<string>("none");
  const [newCategoryIcon, setNewCategoryIcon] = React.useState("");
  const [creatingCategory, setCreatingCategory] = React.useState(false);

  // Auto-generate slugs for inline create
  React.useEffect(() => {
    if (newBrandName) setNewBrandSlug(generateSlug(newBrandName));
  }, [newBrandName]);
  React.useEffect(() => {
    if (newCategoryName) setNewCategorySlug(generateSlug(newCategoryName));
  }, [newCategoryName]);

  const handleQuickCreateBrand = async () => {
    if (!newBrandName.trim()) {
      toast.error("Brand name is required");
      return;
    }
    setCreatingBrand(true);
    try {
      const created = await apiClient.createBrand({
        name: newBrandName.trim(),
        slug: newBrandSlug.trim() || generateSlug(newBrandName),
        logo_url: newBrandLogoUrl.trim() || null,
      });
      await mutateBrands();
      setCreateBrandId(String(created.id));
      setNewBrandName("");
      setNewBrandSlug("");
      setNewBrandLogoUrl("");
      setShowCreateBrand(false);
      toast.success(`Brand "${created.name}" created`);
    } catch (e: any) {
      toast.error(e?.message || "Failed to create brand");
    } finally {
      setCreatingBrand(false);
    }
  };

  const handleQuickCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      toast.error("Category name is required");
      return;
    }
    setCreatingCategory(true);
    try {
      const created = await apiClient.createCategory({
        name: newCategoryName.trim(),
        slug: newCategorySlug.trim() || generateSlug(newCategoryName),
        parent_id: newCategoryParentId === "none" ? null : Number(newCategoryParentId),
        icon: newCategoryIcon.trim() || null,
      });
      await mutateCategories();
      setCreateCategoryIds((prev) => [...prev, created.id]);
      setNewCategoryName("");
      setNewCategorySlug("");
      setNewCategoryParentId("none");
      setNewCategoryIcon("");
      setShowCreateCategory(false);
      toast.success(`Category "${created.name}" created`);
    } catch (e: any) {
      toast.error(e?.message || "Failed to create category");
    } finally {
      setCreatingCategory(false);
    }
  };

  const [masterVariants, setMasterVariants] = React.useState<Array<{ id: number; internal_sku: string; gtin: string | null; options: Record<string, string> }>>([]);
  const [variantChoices, setVariantChoices] = React.useState<Record<number, VariantRowChoice>>({});
  const [linkOptionsDefinition, setLinkOptionsDefinition] = React.useState<Option[]>([]);
  const [editingVariantId, setEditingVariantId] = React.useState<number | null>(null);
  const [linkMediaIds, setLinkMediaIds] = React.useState<number[]>([]);
  const [linkExtraMedia, setLinkExtraMedia] = React.useState<Array<{ url: string; alt_text?: string }>>([]);
  const [linkExtraUrl, setLinkExtraUrl] = React.useState("");
  const [linkExtraAlt, setLinkExtraAlt] = React.useState("");

  React.useEffect(() => {
    if (detail) {
      if (detail.raw_title) {
        setCreateTitle(detail.raw_title);
        setCreateSlug(detail.raw_title.toLowerCase().replace(/\s+/g, '-'));
      }
      if (detail.raw_body_html) {
        setCreateDescription(detail.raw_body_html);
      }
      if (detail.media) {
        setSelectedMediaIds(detail.media.map((m: any) => m.id));
      }
      if (detail.variants) {
        // Extract options definition from variant raw_options
        const optionMap: Record<string, Set<string>> = {};
        detail.variants.forEach((v: any) => {
          if (v.raw_options) {
            Object.entries(v.raw_options).forEach(([key, value]) => {
              if (!optionMap[key]) optionMap[key] = new Set();
              if (value) optionMap[key].add(String(value));
            });
          }
        });
        const extracted: Option[] = Object.entries(optionMap).map(([name, valuesSet]) => ({
          name,
          values: Array.from(valuesSet),
        }));
        if (extracted.length > 0) {
          setCreateOptionsDefinition(extracted);
        }
      }
    }
  }, [detail]);

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
    setLinkOptionsDefinition([]);
    setEditingVariantId(null);
    setLinkMediaIds([]);
    setLinkExtraMedia([]);
    try {
      const [match, variants] = await Promise.all([
        apiClient.getVariantMatch(stagingId, masterId),
        apiClient.getProductVariants(masterId),
      ]);
      setVariantMatch(match);
      setMasterVariants(variants);

      // Build initial variant choices
      const initial: Record<number, VariantRowChoice> = {};
      match.matches.forEach((m: { staging_variant_id: number; suggested_master_variant_id: number | null; staging_options: Record<string, string> }) => {
        if (m.suggested_master_variant_id != null) {
          initial[m.staging_variant_id] = { type: "link", masterVariantId: m.suggested_master_variant_id };
        } else {
          initial[m.staging_variant_id] = { type: "add_new", attributes: m.staging_options || {} };
        }
      });
      setVariantChoices(initial);

      // Build merged options definition from existing master + incoming staging
      const mergedMap: Record<string, Set<string>> = {};
      for (const mv of variants) {
        if (mv.options) {
          for (const [k, v] of Object.entries(mv.options)) {
            if (!mergedMap[k]) mergedMap[k] = new Set();
            mergedMap[k].add(v);
          }
        }
      }
      for (const m of match.matches) {
        if (m.staging_options) {
          for (const [k, v] of Object.entries(m.staging_options)) {
            if (k === "SKU") continue;
            if (!mergedMap[k]) mergedMap[k] = new Set();
            mergedMap[k].add(String(v));
          }
        }
      }
      setLinkOptionsDefinition(
        Object.entries(mergedMap).map(([name, vals]) => ({ name, values: Array.from(vals) }))
      );
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
    if (!createTitle.trim() || !createSlug.trim()) {
      toast.error("Title and Slug are required");
      return;
    }

    const specifications = createSpecifications.reduce((acc, { key, value }) => {
      if (key) acc[key] = value;
      return acc;
    }, {} as Record<string, string>);

    let optionsDefinition;
    if (createOptionsDefinition.length > 0) {
      const hasEmpty = createOptionsDefinition.some((opt) => !opt.name.trim());
      if (hasEmpty) {
        toast.error("All option names must be filled in");
        return;
      }
      optionsDefinition = createOptionsDefinition.reduce((acc, opt) => {
        if (opt.name.trim()) {
          acc[opt.name.trim()] = opt.values;
        }
        return acc;
      }, {} as Record<string, string[]>);
    }

    setSubmitting(true);
    try {
      await apiClient.submitReviewDecision(stagingId, {
        action: "CREATE_NEW",
        clean_data: {
          title: createTitle.trim(),
          slug: createSlug.trim(),
          description: createDescription.trim() || undefined,
          brand_id: createBrandId ? Number(createBrandId) : undefined,
          category_ids: createCategoryIds.length ? createCategoryIds : undefined,
          selected_media_ids: selectedMediaIds.length ? selectedMediaIds : undefined,
          extra_media: extraMedia.length ? extraMedia : undefined,
          specifications: specifications,
          options_definition: optionsDefinition,
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

  const addExtraMedia = () => {
    const url = extraMediaUrl.trim();
    if (!url) {
      toast.error("Enter an image URL");
      return;
    }
    try {
      new URL(url);
    } catch {
      toast.error("Enter a valid URL");
      return;
    }
    setExtraMedia((prev) => [...prev, { url, alt_text: extraMediaAlt.trim() || undefined }]);
    setExtraMediaUrl("");
    setExtraMediaAlt("");
  };

  const removeExtraMedia = (index: number) => {
    setExtraMedia((prev) => prev.filter((_, i) => i !== index));
  };


  const addLinkExtraMedia = () => {
    const url = linkExtraUrl.trim();
    if (!url) { toast.error("Enter an image URL"); return; }
    try { new URL(url); } catch { toast.error("Enter a valid URL"); return; }
    setLinkExtraMedia((prev) => [...prev, { url, alt_text: linkExtraAlt.trim() || undefined }]);
    setLinkExtraUrl("");
    setLinkExtraAlt("");
  };

  const removeLinkExtraMedia = (index: number) => {
    setLinkExtraMedia((prev) => prev.filter((_, i) => i !== index));
  };

  const toggleLinkMedia = (id: number) => {
    setLinkMediaIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  /** Compute the cross-product of current linkOptionsDefinition */
  const computeLinkCrossProduct = React.useCallback((): Record<string, string>[] => {
    const valid = linkOptionsDefinition.filter((o) => o.name.trim() && o.values.length > 0);
    if (valid.length === 0) return [];
    return valid.reduce<Record<string, string>[]>(
      (acc, opt) => {
        if (acc.length === 0) return opt.values.map((v) => ({ [opt.name]: v }));
        const result: Record<string, string>[] = [];
        for (const existing of acc) {
          for (const val of opt.values) {
            result.push({ ...existing, [opt.name]: val });
          }
        }
        return result;
      },
      []
    );
  }, [linkOptionsDefinition]);

  /** Identify additional variants from the options editor that don't exist on master and aren't covered by staging add_new */
  const computeAdditionalVariants = React.useCallback((): Record<string, string>[] => {
    const crossProduct = computeLinkCrossProduct();
    if (crossProduct.length === 0) return [];

    // Keys of existing master variants
    const existingKeys = new Set(masterVariants.map((mv) => optionsKey(mv.options || {})));

    // Keys of staging variants being added as new
    const stagingAddNewKeys = new Set<string>();
    Object.values(variantChoices).forEach((c) => {
      if (c.type === "add_new") stagingAddNewKeys.add(optionsKey(c.attributes));
    });

    return crossProduct.filter((combo) => {
      const key = optionsKey(combo);
      return key && !existingKeys.has(key) && !stagingAddNewKeys.has(key);
    });
  }, [computeLinkCrossProduct, masterVariants, variantChoices]);

  const handleSubmitLinkExisting = async () => {
    if (selectedMasterId == null || !variantMatch?.matches?.length) {
      toast.error("Select a master product and ensure variant match is loaded");
      return;
    }
    const stagingIds: number[] = variantMatch.matches.map((m: any) => m.staging_variant_id);
    // Check that every staging variant has a choice assigned
    const missing = stagingIds.filter((id: number) => !variantChoices[id]);
    if (missing.length > 0) {
      toast.error("Choose an action (link, add new, or skip) for every incoming variant");
      return;
    }

    // Check for duplicates: staging "add_new" that matches an existing master variant
    for (const svId of stagingIds) {
      const choice = variantChoices[svId];
      if (choice?.type === "add_new") {
        const key = optionsKey(choice.attributes);
        const matchedMaster = masterVariants.find((mv) => optionsKey(mv.options || {}) === key);
        if (matchedMaster) {
          toast.error(
            `Variant #${stagingIds.indexOf(svId) + 1} is set to "Add as new" but already exists on the master product. Please link it instead or skip it.`
          );
          return;
        }
      }
    }

    // Build mapping: only include non-skipped staging variants
    const variant_mapping: Array<{
      staging_variant_id?: number;
      master_variant_id?: number | null;
      new_variant_attributes?: Record<string, string>;
    }> = [];
    for (const svId of stagingIds) {
      const choice = variantChoices[svId]!;
      if (choice.type === "skip") continue;
      if (choice.type === "link") {
        variant_mapping.push({ staging_variant_id: svId, master_variant_id: choice.masterVariantId });
      } else {
        variant_mapping.push({ staging_variant_id: svId, new_variant_attributes: choice.attributes });
      }
    }
    // Add additional variants from options editor (not from staging)
    const additional = computeAdditionalVariants();
    for (const combo of additional) {
      variant_mapping.push({ new_variant_attributes: combo });
    }
    if (variant_mapping.length === 0) {
      toast.error("No variants to link or create. Adjust your options or variant mapping.");
      return;
    }
    const hasMedia = linkMediaIds.length > 0 || linkExtraMedia.length > 0;
    setSubmitting(true);
    try {
      await apiClient.submitReviewDecision(stagingId, {
        action: "LINK_EXISTING",
        master_product_id: selectedMasterId,
        variant_mapping,
        ...(hasMedia ? {
          clean_data: {
            selected_media_ids: linkMediaIds.length ? linkMediaIds : undefined,
            extra_media: linkExtraMedia.length ? linkExtraMedia : undefined,
          },
        } : {}),
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
          <Card padding="default" className="lg:col-span-2">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Staging (dirty) data
            </h3>
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <p className="font-medium text-foreground text-lg">{detail.raw_title}</p>
                <p className="text-sm text-muted-foreground">{detail.raw_vendor} · {detail.raw_product_type}</p>
                
                {detail.raw_body_html && (
                  <div className="mt-4">
                    <h4 className="font-semibold text-foreground mb-2">Description</h4>
                    <div
                      className="prose prose-sm max-w-none text-muted-foreground"
                      dangerouslySetInnerHTML={{ __html: detail.raw_body_html }}
                    />
                  </div>
                )}
              </div>
              <div>
                <h4 className="font-semibold text-foreground mb-2">Variants ({detail.variants?.length ?? 0})</h4>
                {detail.variants && detail.variants.length > 0 ? (
                  <div className="overflow-y-auto max-h-80 border rounded-lg">
                    <table className="w-full text-sm">
                      <thead className="bg-muted sticky top-0">
                        <tr>
                          <th className="text-left py-2 px-3">SKU</th>
                          <th className="text-left py-2 px-3">Price</th>
                          <th className="text-left py-2 px-3">Options</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detail.variants.map((v: any) => (
                          <tr key={v.staging_variant_id} className="border-t">
                            <td className="py-2 px-3 font-mono text-xs">{v.raw_sku}</td>
                            <td className="py-2 px-3">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v.raw_price_minor / 100)}</td>
                            <td className="py-2 px-3">
                              <div className="flex flex-wrap gap-1">
                                {Object.entries(v.raw_options).map(([key, value]) => (
                                  <span key={key} className="text-xs bg-muted text-muted-foreground px-1.5 py-0.5 rounded-md">
                                    {key}: {String(value)}
                                  </span>
                                ))}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No variants for this product.</p>
                )}
              </div>
            </div>
          </Card>

          <Card padding="default" className="lg:col-span-2">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Media
            </h3>
            {detail.media && detail.media.length > 0 ? (
              <Dialog>
                <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                  {detail.media.map((m: any) => (
                    <DialogTrigger key={m.id} asChild>
                      <button
                        type="button"
                        onClick={() => setSelectedImage(m)}
                        className="relative aspect-square w-full rounded-lg overflow-hidden hover:opacity-80 transition-opacity"
                      >
                        <Image
                          src={m.source_url}
                          alt={m.alt_text || "Product image"}
                          fill
                          className="object-cover"
                        />
                      </button>
                    </DialogTrigger>
                  ))}
                </div>
                <DialogContent className="max-w-3xl">
                  {selectedImage && (
                    <>
                      <DialogHeader>
                        <DialogTitle>Image Preview</DialogTitle>
                      </DialogHeader>
                      <div className="relative aspect-video w-full mt-4">
                        <Image
                          src={selectedImage.source_url}
                          alt={selectedImage.alt_text || "Product image"}
                          fill
                          className="object-contain"
                        />
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">{selectedImage.alt_text}</p>
                    </>
                  )}
                </DialogContent>
              </Dialog>
            ) : (
              <p className="text-sm text-muted-foreground">No media for this product.</p>
            )}
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
          <div className="mt-6 space-y-6">
            {/* Step 1: Search & select master */}
            <Card padding="default">
              <h3 className="font-semibold text-foreground mb-4">
                <span className="inline-flex items-center gap-2"><Link2 className="h-5 w-5" /> Step 1: Find &amp; select master product</span>
              </h3>
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
                <ul className="space-y-2">
                  {searchResults.map((p) => (
                    <li key={p.id}>
                      <button
                        type="button"
                        onClick={() => handleSelectMaster(p.id)}
                        className={`w-full text-left rounded-lg border px-4 py-3 transition-colors flex items-center gap-3 ${
                          selectedMasterId === p.id
                            ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                            : "border-border hover:bg-muted/50"
                        }`}
                      >
                        {p.image_url && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.image_url} alt="" className="h-12 w-12 rounded-lg object-cover shrink-0 border" />
                        )}
                        <div className="flex-1 min-w-0">
                          <span className="font-medium">{p.title}</span>
                          {p.brand && <span className="text-muted-foreground text-sm ml-2">{p.brand}</span>}
                          <div className="text-muted-foreground text-xs">{p.variant_count} variant{p.variant_count !== 1 ? "s" : ""}</div>
                        </div>
                        {selectedMasterId === p.id && <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            {/* Step 2: Incoming data overview (shown once master is selected) */}
            {variantMatch && (() => {
              const matches: any[] = variantMatch.matches;
              // Build aggregated incoming options from staging variants
              const incomingOptionsMap: Record<string, Set<string>> = {};
              matches.forEach((m: any) => {
                if (m.staging_options) {
                  Object.entries(m.staging_options).forEach(([k, v]) => {
                    if (k === "SKU") return;
                    if (!incomingOptionsMap[k]) incomingOptionsMap[k] = new Set();
                    incomingOptionsMap[k].add(String(v));
                  });
                }
              });
              const incomingOptions = Object.entries(incomingOptionsMap).map(([name, vals]) => ({
                name,
                values: Array.from(vals),
              }));

              // Build existing master options from master variants
              const existingOptionsMap: Record<string, Set<string>> = {};
              masterVariants.forEach((mv) => {
                if (mv.options) {
                  Object.entries(mv.options).forEach(([k, v]) => {
                    if (!existingOptionsMap[k]) existingOptionsMap[k] = new Set();
                    existingOptionsMap[k].add(v);
                  });
                }
              });
              const existingOptions = Object.entries(existingOptionsMap).map(([name, vals]) => ({
                name,
                values: Array.from(vals),
              }));

              const selectedMaster = searchResults.find((p: any) => p.id === selectedMasterId);

              return (
                <Card padding="default">
                  <h3 className="font-semibold text-foreground mb-4">
                    <span className="inline-flex items-center gap-2"><Layers className="h-5 w-5" /> Step 2: Review incoming data</span>
                  </h3>

                  {/* Side-by-side comparison */}
                  <div className="grid gap-6 md:grid-cols-2 mb-6">
                    {/* Incoming (staging) */}
                    <div className="rounded-lg border border-blue-500/30 bg-blue-500/5 p-4">
                      <h4 className="text-sm font-semibold text-blue-600 mb-3 flex items-center gap-1.5">
                        <ArrowRight className="h-4 w-4" /> Incoming from merchant
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Title:</span>{" "}
                          <span className="font-medium">{detail.raw_title}</span>
                        </div>
                        {detail.raw_vendor && (
                          <div>
                            <span className="text-muted-foreground">Vendor:</span>{" "}
                            <span>{detail.raw_vendor}</span>
                          </div>
                        )}
                        <div>
                          <span className="text-muted-foreground">Variants:</span>{" "}
                          <Badge variant="info" size="sm">{matches.length}</Badge>
                        </div>
                        {incomingOptions.length > 0 && (
                          <div>
                            <span className="text-muted-foreground block mb-1">Options:</span>
                            <div className="space-y-1.5">
                              {incomingOptions.map((opt) => (
                                <div key={opt.name} className="flex flex-wrap items-center gap-1">
                                  <span className="text-xs font-medium text-foreground min-w-[60px]">{opt.name}:</span>
                                  {opt.values.map((v) => (
                                    <Badge key={v} variant="info" size="sm">{v}</Badge>
                                  ))}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {detail.media && detail.media.length > 0 && (
                          <div>
                            <span className="text-muted-foreground">Images:</span>{" "}
                            <span>{detail.media.length}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Existing master */}
                    <div className="rounded-lg border border-border bg-muted/30 p-4">
                      <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-1.5">
                        <Layers className="h-4 w-4" /> Existing master product
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Title:</span>{" "}
                          <span className="font-medium">{selectedMaster?.title ?? "—"}</span>
                        </div>
                        {selectedMaster?.brand && (
                          <div>
                            <span className="text-muted-foreground">Brand:</span>{" "}
                            <span>{selectedMaster.brand}</span>
                          </div>
                        )}
                        <div>
                          <span className="text-muted-foreground">Current variants:</span>{" "}
                          <Badge variant="muted" size="sm">{masterVariants.length}</Badge>
                        </div>
                        {existingOptions.length > 0 && (
                          <div>
                            <span className="text-muted-foreground block mb-1">Options:</span>
                            <div className="space-y-1.5">
                              {existingOptions.map((opt) => (
                                <div key={opt.name} className="flex flex-wrap items-center gap-1">
                                  <span className="text-xs font-medium text-foreground min-w-[60px]">{opt.name}:</span>
                                  {opt.values.map((v) => (
                                    <Badge key={v} variant="secondary" size="sm">{v}</Badge>
                                  ))}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })()}

            {/* Step 3: Options Definition */}
            {variantMatch && (
              <Card padding="default">
                <h3 className="font-semibold text-foreground mb-1">
                  <span className="inline-flex items-center gap-2"><Pencil className="h-5 w-5" /> Step 3: Options Definition</span>
                </h3>
                <p className="text-xs text-muted-foreground mb-1">
                  Edit the master product&apos;s options. Add new values to create additional variants, or remove values to keep the catalog clean.
                  Variants are auto-generated from the cross-product of all options below.
                </p>
                <OptionsEditor
                  value={linkOptionsDefinition}
                  onChange={setLinkOptionsDefinition}
                />

                {/* Cross-product preview */}
                {(() => {
                  const crossProduct = computeLinkCrossProduct();
                  if (crossProduct.length === 0) return null;

                  const existingKeys = new Set(masterVariants.map((mv) => optionsKey(mv.options || {})));
                  const stagingAddNewKeys = new Set<string>();
                  const stagingLinkedKeys = new Set<string>();
                  Object.entries(variantChoices).forEach(([, c]) => {
                    if (c.type === "add_new") stagingAddNewKeys.add(optionsKey(c.attributes));
                    if (c.type === "link") {
                      const mv = masterVariants.find((m) => m.id === (c as LinkChoice).masterVariantId);
                      if (mv) stagingLinkedKeys.add(optionsKey(mv.options || {}));
                    }
                  });

                  const validOptions = linkOptionsDefinition.filter((o) => o.name.trim() && o.values.length > 0);
                  const additionalCount = crossProduct.filter((combo) => {
                    const key = optionsKey(combo);
                    return key && !existingKeys.has(key) && !stagingAddNewKeys.has(key);
                  }).length;

                  return (
                    <div className="mt-4 pt-4 border-t border-border">
                      <h4 className="text-sm font-semibold text-foreground mb-2">
                        Variant Preview ({crossProduct.length} total variant{crossProduct.length !== 1 ? "s" : ""} from options)
                      </h4>
                      {additionalCount > 0 && (
                        <p className="text-xs text-purple-600 mb-2">
                          {additionalCount} additional variant{additionalCount !== 1 ? "s" : ""} will be created from your options edits (no merchant offer).
                        </p>
                      )}
                      <div className="overflow-x-auto border rounded-lg max-h-72 overflow-y-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-muted sticky top-0">
                            <tr>
                              <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">#</th>
                              {validOptions.map((opt) => (
                                <th key={opt.name} className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">{opt.name}</th>
                              ))}
                              <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {crossProduct.slice(0, 100).map((combo, i) => {
                              const key = optionsKey(combo);
                              const isExisting = existingKeys.has(key);
                              const isFromStaging = stagingAddNewKeys.has(key);
                              const isLinked = stagingLinkedKeys.has(key);
                              const isAdditional = !isExisting && !isFromStaging;
                              return (
                                <tr key={i} className={`border-t ${isAdditional ? "bg-purple-500/5" : isFromStaging ? "bg-blue-500/5" : ""}`}>
                                  <td className="py-1.5 px-3 text-xs text-muted-foreground">{i + 1}</td>
                                  {validOptions.map((opt) => (
                                    <td key={opt.name} className="py-1.5 px-3">{combo[opt.name] || "—"}</td>
                                  ))}
                                  <td className="py-1.5 px-3">
                                    {isExisting && isLinked ? (
                                      <Badge variant="success" size="sm">Linked</Badge>
                                    ) : isExisting ? (
                                      <Badge variant="secondary" size="sm">Existing</Badge>
                                    ) : isFromStaging ? (
                                      <Badge variant="info" size="sm">New (staging)</Badge>
                                    ) : (
                                      <Badge variant="default" size="sm">New (options)</Badge>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                            {crossProduct.length > 100 && (
                              <tr className="border-t">
                                <td colSpan={validOptions.length + 2} className="py-2 px-3 text-xs text-muted-foreground text-center">
                                  ... and {crossProduct.length - 100} more variants
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })()}
              </Card>
            )}

            {/* Step 4: Add images (optional) */}
            {variantMatch && (
              <Card padding="default">
                <h3 className="font-semibold text-foreground mb-1">
                  <span className="inline-flex items-center gap-2"><ImagePlus className="h-5 w-5" /> Step 4: Add images (optional)</span>
                </h3>
                <p className="text-xs text-muted-foreground mb-3">
                  Select from this merchant&apos;s staging images and/or add by URL. These will be appended to the master product&apos;s existing images.
                </p>

                {detail.media && detail.media.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {detail.media.map((m: { id: number; source_url: string; alt_text?: string | null }) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => toggleLinkMedia(m.id)}
                        className={`relative rounded-lg border-2 overflow-hidden w-20 h-20 shrink-0 block ${
                          linkMediaIds.includes(m.id) ? "border-primary ring-2 ring-primary/20" : "border-border hover:border-muted-foreground"
                        }`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={m.source_url} alt={m.alt_text || ""} className="w-full h-full object-cover" />
                        {linkMediaIds.includes(m.id) && (
                          <span className="absolute bottom-0 right-0 bg-primary text-primary-foreground text-xs px-1">
                            {linkMediaIds.indexOf(m.id) + 1}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}

                <div className="space-y-2">
                  <p className="text-xs font-medium text-foreground">Add by URL</p>
                  <div className="flex flex-wrap items-end gap-2">
                    <Input
                      placeholder="https://example.com/image.jpg"
                      value={linkExtraUrl}
                      onChange={(e) => setLinkExtraUrl(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addLinkExtraMedia())}
                      className="flex-1 min-w-[200px]"
                    />
                    <Input
                      placeholder="Alt text (optional)"
                      value={linkExtraAlt}
                      onChange={(e) => setLinkExtraAlt(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && addLinkExtraMedia()}
                      className="w-40"
                    />
                    <Button type="button" variant="secondary" size="sm" onClick={addLinkExtraMedia} disabled={!linkExtraUrl.trim()}>
                      <Plus className="h-4 w-4 mr-1" /> Add
                    </Button>
                  </div>
                  {linkExtraMedia.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {linkExtraMedia.map((item, idx) => (
                        <div key={idx} className="relative rounded-lg border-2 border-border overflow-hidden w-20 h-20 shrink-0 group">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={item.url} alt={item.alt_text || ""} className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => removeLinkExtraMedia(idx)}
                            className="absolute top-0 right-0 bg-destructive text-destructive-foreground rounded-bl p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                            aria-label="Remove image"
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Step 5: Summary & submit */}
            {variantMatch && (() => {
              const matches: any[] = variantMatch.matches;
              const linkedCount = matches.filter((m: any) => variantChoices[m.staging_variant_id]?.type === "link").length;
              const addNewCount = matches.filter((m: any) => variantChoices[m.staging_variant_id]?.type === "add_new").length;
              const skippedCount = matches.filter((m: any) => variantChoices[m.staging_variant_id]?.type === "skip").length;
              const additional = computeAdditionalVariants();
              const additionalCount = additional.length;
              const imageCount = linkMediaIds.length + linkExtraMedia.length;
              const totalAfter = masterVariants.length + addNewCount + additionalCount;
              const actionCount = linkedCount + addNewCount + additionalCount;

              // Check for duplicate warnings
              const hasDuplicates = matches.some((m: any) => {
                const c = variantChoices[m.staging_variant_id];
                if (c?.type !== "add_new") return false;
                return masterVariants.some((mv) => optionsKey(mv.options || {}) === optionsKey(c.attributes));
              });

              return (
                <Card padding="default" className="border-primary/30 bg-primary/5">
                  <h3 className="font-semibold text-foreground mb-2">Step 5: Confirm & approve</h3>
                  {hasDuplicates && (
                    <div className="mb-3 p-2 rounded-md bg-warning/10 border border-warning/30 text-warning text-sm flex items-center gap-2">
                      <XCircle className="h-4 w-4 shrink-0" />
                      Some variants marked &quot;Add as new&quot; duplicate existing master variants. Fix these before approving.
                    </div>
                  )}
                  <ul className="text-sm space-y-1.5 mb-4">
                    <li className="flex items-center gap-2">
                      <Layers className="h-4 w-4 text-muted-foreground" />
                      Master product will have <strong>{totalAfter}</strong> variant{totalAfter !== 1 ? "s" : ""} after linking
                      <span className="text-muted-foreground">
                        ({masterVariants.length} existing
                        {addNewCount > 0 ? ` + ${addNewCount} from staging` : ""}
                        {additionalCount > 0 ? ` + ${additionalCount} from options` : ""})
                      </span>
                    </li>
                    {linkedCount > 0 && (
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-success" />
                        <strong>{linkedCount}</strong> variant{linkedCount !== 1 ? "s" : ""} linked to existing — merchant offers created
                      </li>
                    )}
                    {addNewCount > 0 && (
                      <li className="flex items-center gap-2">
                        <Plus className="h-4 w-4 text-blue-500" />
                        <strong>{addNewCount}</strong> new variant{addNewCount !== 1 ? "s" : ""} from staging — added to master + merchant offers created
                      </li>
                    )}
                    {additionalCount > 0 && (
                      <li className="flex items-center gap-2">
                        <Pencil className="h-4 w-4 text-purple-500" />
                        <strong>{additionalCount}</strong> additional variant{additionalCount !== 1 ? "s" : ""} from options — added to master (no merchant offer)
                      </li>
                    )}
                    {skippedCount > 0 && (
                      <li className="flex items-center gap-2 text-muted-foreground">
                        <SkipForward className="h-4 w-4" />
                        <strong>{skippedCount}</strong> incoming variant{skippedCount !== 1 ? "s" : ""} skipped
                      </li>
                    )}
                    {imageCount > 0 && (
                      <li className="flex items-center gap-2">
                        <ImagePlus className="h-4 w-4 text-purple-500" />
                        <strong>{imageCount}</strong> image{imageCount !== 1 ? "s" : ""} will be added to master product
                      </li>
                    )}
                    {actionCount === 0 && (
                      <li className="text-muted-foreground">No variant changes to apply.</li>
                    )}
                  </ul>
                  <Button
                    onClick={handleSubmitLinkExisting}
                    disabled={submitting || actionCount === 0 || hasDuplicates}
                    className="gap-2"
                    size="lg"
                  >
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                    Approve & link to master
                  </Button>
                </Card>
              );
            })()}
          </div>
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
                <label className="text-sm font-medium text-foreground">Slug *</label>
                <Input
                  value={createSlug}
                  onChange={(e) => setCreateSlug(e.target.value)}
                  placeholder="url-friendly-slug"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Description (optional)</label>
                <RichTextEditor
                  value={createDescription}
                  onChange={setCreateDescription}
                  placeholder="Description"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Specifications</label>
                <KeyValueEditor
                  value={createSpecifications}
                  onChange={setCreateSpecifications}
                  keyPlaceholder="e.g. Material"
                  valuePlaceholder="e.g. Cotton"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Options Definition</label>
                <p className="text-xs text-muted-foreground mt-0.5">Define option names and their possible values (e.g. Color: Red, Blue)</p>
                <OptionsEditor
                  value={createOptionsDefinition}
                  onChange={setCreateOptionsDefinition}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Brand</label>
                <div className="flex items-center gap-2 mt-1">
                  <Select value={createBrandId || "none"} onValueChange={(v) => setCreateBrandId(v === "none" ? "" : v)}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select brand..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No brand</SelectItem>
                      {(brands || []).map((b: { id: number; name: string; logo_url?: string | null }) => (
                        <SelectItem key={b.id} value={String(b.id)}>
                          <span className="flex items-center gap-2">
                            {b.logo_url ? (
                              <img src={b.logo_url} alt="" className="h-4 w-4 rounded object-contain" />
                            ) : (
                              <Layers className="h-4 w-4 text-muted-foreground" />
                            )}
                            {b.name}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowCreateBrand(true)}
                    className="shrink-0"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {/* Inline Brand Create */}
                <Dialog open={showCreateBrand} onOpenChange={setShowCreateBrand}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <Layers className="h-5 w-5" />
                        Quick Add Brand
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-2">
                      <Input
                        label="Brand Name"
                        placeholder="Enter brand name"
                        value={newBrandName}
                        onChange={(e) => setNewBrandName(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleQuickCreateBrand()}
                      />
                      <Input
                        label="Slug"
                        placeholder="brand-slug"
                        value={newBrandSlug}
                        onChange={(e) => setNewBrandSlug(e.target.value)}
                        helperText="URL-friendly identifier (auto-generated)"
                      />
                      <Input
                        label="Logo URL"
                        placeholder="https://example.com/logo.png"
                        value={newBrandLogoUrl}
                        onChange={(e) => setNewBrandLogoUrl(e.target.value)}
                        helperText="Optional: URL to the brand's logo image"
                      />
                      {newBrandLogoUrl && (
                        <div className="flex items-center gap-3 rounded-lg border border-border p-3">
                          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted overflow-hidden">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={newBrandLogoUrl}
                              alt="Logo preview"
                              className="h-full w-full object-contain"
                              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                            />
                          </div>
                          <p className="text-sm text-muted-foreground">Logo Preview</p>
                        </div>
                      )}
                      <div className="flex justify-end gap-2 pt-2">
                        <Button type="button" variant="outline" size="sm" onClick={() => setShowCreateBrand(false)}>
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={handleQuickCreateBrand}
                          disabled={creatingBrand || !newBrandName.trim()}
                        >
                          {creatingBrand ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                          Create Brand
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-foreground">Categories</label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowCreateCategory(true)}
                    className="h-6 px-1.5 shrink-0"
                    title="Create new category"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">Search and select one or more; scales to many categories</p>
                <div className="mt-2">
                  <CategoryMultiSelect
                    categories={categories || []}
                    value={createCategoryIds}
                    onChange={setCreateCategoryIds}
                    placeholder="Select categories..."
                    label="Categories"
                    listMaxHeight={320}
                  />
                </div>
                {/* Inline Category Create */}
                <Dialog open={showCreateCategory} onOpenChange={setShowCreateCategory}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <FolderTree className="h-5 w-5" />
                        Quick Add Category
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-2">
                      <Input
                        label="Category Name"
                        placeholder="Enter category name"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleQuickCreateCategory()}
                      />
                      <Input
                        label="Slug"
                        placeholder="category-slug"
                        value={newCategorySlug}
                        onChange={(e) => setNewCategorySlug(e.target.value)}
                        helperText="URL-friendly identifier (auto-generated)"
                      />
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-foreground">Parent Category</label>
                        <Select value={newCategoryParentId} onValueChange={setNewCategoryParentId}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select parent (optional)" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">No Parent (Top Level)</SelectItem>
                            {(categories || [])
                              .filter((c: { id: number; parent_id?: number | null }) => !c.parent_id)
                              .map((c: { id: number; name: string; icon?: string | null }) => (
                                <SelectItem key={c.id} value={String(c.id)}>
                                  <span className="flex items-center gap-2">
                                    {c.icon && <span>{c.icon}</span>}
                                    {c.name}
                                  </span>
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">Leave empty to create a top-level category</p>
                      </div>
                      <Input
                        label="Icon"
                        placeholder="e.g. 🛍️ or an icon name"
                        value={newCategoryIcon}
                        onChange={(e) => setNewCategoryIcon(e.target.value)}
                        helperText="Optional: emoji or icon identifier for this category"
                      />
                      {/* Path preview */}
                      {newCategoryName.trim() && (
                        <div className="rounded-md bg-muted/50 px-3 py-2">
                          <p className="text-xs text-muted-foreground">Path preview:</p>
                          <p className="text-sm font-medium">
                            {newCategoryParentId !== "none"
                              ? `${(categories || []).find((c: { id: number }) => c.id === Number(newCategoryParentId))?.name ?? "?"} > ${newCategoryName.trim()}`
                              : newCategoryName.trim()}
                          </p>
                        </div>
                      )}
                      <div className="flex justify-end gap-2 pt-2">
                        <Button type="button" variant="outline" size="sm" onClick={() => setShowCreateCategory(false)}>
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={handleQuickCreateCategory}
                          disabled={creatingCategory || !newCategoryName.trim()}
                        >
                          {creatingCategory ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                          Create Category
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Product images</label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Select from staging images (click to toggle) and/or add more by URL. Order: selected first, then added URLs.
                </p>
                {detail.media && detail.media.length > 0 && (
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
                )}
                <div className="mt-4 space-y-2">
                  <p className="text-xs font-medium text-foreground">Add more images by URL</p>
                  <div className="flex flex-wrap items-end gap-2">
                    <Input
                      placeholder="https://example.com/image.jpg"
                      value={extraMediaUrl}
                      onChange={(e) => setExtraMediaUrl(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addExtraMedia())}
                      className="flex-1 min-w-[200px]"
                    />
                    <Input
                      placeholder="Alt text (optional)"
                      value={extraMediaAlt}
                      onChange={(e) => setExtraMediaAlt(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && addExtraMedia()}
                      className="w-40"
                    />
                    <Button type="button" variant="secondary" size="sm" onClick={addExtraMedia} disabled={!extraMediaUrl.trim()}>
                      <Plus className="h-4 w-4 mr-1" />
                      Add
                    </Button>
                  </div>
                  {extraMedia.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {extraMedia.map((item, idx) => (
                        <div key={idx} className="relative rounded-lg border-2 border-border overflow-hidden w-20 h-20 shrink-0 group">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={item.url} alt={item.alt_text || ""} className="w-full h-full object-cover" />
                          <span className="absolute bottom-0 right-0 bg-muted text-muted-foreground text-xs px-1">
                            {(selectedMediaIds.length || 0) + idx + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeExtraMedia(idx)}
                            className="absolute top-0 right-0 bg-destructive text-destructive-foreground rounded-bl p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                            aria-label="Remove image"
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              {(() => {
                const validOptions = createOptionsDefinition.filter((opt) => opt.name.trim() && opt.values.length > 0);
                if (validOptions.length === 0) return null;
                // Compute cross-product preview (cap at 50 to avoid huge renders)
                const crossProduct: Record<string, string>[] = validOptions.reduce<Record<string, string>[]>(
                  (acc, opt) => {
                    if (acc.length === 0) return opt.values.map((v) => ({ [opt.name]: v }));
                    const result: Record<string, string>[] = [];
                    for (const existing of acc) {
                      for (const val of opt.values) {
                        result.push({ ...existing, [opt.name]: val });
                      }
                    }
                    return result;
                  },
                  []
                );
                const total = crossProduct.length;
                const preview = crossProduct.slice(0, 50);
                return (
                  <div>
                    <h4 className="font-semibold text-foreground mb-2">
                      Variant Preview ({total} variant{total !== 1 ? "s" : ""} will be created)
                    </h4>
                    <p className="text-xs text-muted-foreground mb-2">
                      Generated from the cross-product of all options. SKU and pricing are set per-merchant when they make an offer.
                    </p>
                    <div className="overflow-x-auto border rounded-lg max-h-72 overflow-y-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-muted sticky top-0">
                          <tr>
                            <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">#</th>
                            {validOptions.map((opt) => (
                              <th key={opt.name} className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">{opt.name}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {preview.map((combo, i) => (
                            <tr key={i} className="border-t">
                              <td className="py-1.5 px-3 text-xs text-muted-foreground">{i + 1}</td>
                              {validOptions.map((opt) => (
                                <td key={opt.name} className="py-1.5 px-3 text-sm">{combo[opt.name]}</td>
                              ))}
                            </tr>
                          ))}
                          {total > 50 && (
                            <tr className="border-t">
                              <td colSpan={validOptions.length + 1} className="py-2 px-3 text-xs text-muted-foreground text-center">
                                ... and {total - 50} more variants
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })()}
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
