"use client";

import { useGlobal } from "@/context/global-context";
import { fetcher } from "@/lib/fetcher";
import type { ApiProduct } from "@/lib/types";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  ChevronUp,
  Minus,
  Plus,
  Share2,
  Shield,
  ShoppingBag,
  Star,
  Truck,
  Store,
  AlertCircle
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import useSWR from "swr";
import { cn } from "@/lib/utils";

export default function ProductDetailPage() {
  const params = useParams();
  const { selectedBank } = useGlobal();
  const productId = params.productId as string;

  const { data: product, isLoading } = useSWR<ApiProduct>(
    `/api/products/${productId}`,
    fetcher
  );

  const { data: relatedRaw } = useSWR<ApiProduct[]>(
    product?.category_slug ? `/api/products?status=LIVE&category=${product.category_slug}` : null,
    fetcher
  );

  // --- State ---
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [selectedOfferId, setSelectedOfferId] = useState<number | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isDescExpanded, setIsDescExpanded] = useState(false);
  const [redeemState, setRedeemState] = useState<"idle" | "loading" | "success">("idle");

  const relatedProducts = (relatedRaw ?? []).filter((p) => p.id !== product?.id).slice(0, 4);
  const variants = product?.variants ?? [];
  const options = product?.available_options ?? [];
  const allOffers = product?.offers ?? [];
  const hasVariants = variants.length > 0;

  // --- Logic 1: Resolve active variant from selected options (Size, Color, etc.) ---
  const activeVariant = useMemo(() => {
    if (variants.length === 0) return null;
    if (options.length === 0) return variants[0];
    return variants.find((v) => {
      const attrs = (v.attributes ?? {}) as Record<string, string>;
      return Object.entries(selectedOptions).every(([key, value]) => attrs[key] === value);
    }) ?? null;
  }, [variants, selectedOptions, options.length]);

  // --- Logic 2: Auto-select default options from first variant ---
  useEffect(() => {
    if (options.length > 0 && Object.keys(selectedOptions).length === 0) {
      const first = variants[0];
      const attrs = (first?.attributes ?? {}) as Record<string, string>;
      if (Object.keys(attrs).length > 0) {
        setSelectedOptions(attrs);
      }
    }
  }, [options.length, variants]);

  // --- Logic 3: Filter offers by active variant ---
  const filteredOffers = useMemo(() => {
    if (!activeVariant) return [];
    return allOffers.filter((o) => o.variant_id === activeVariant.id);
  }, [allOffers, activeVariant]);

  // Reset selected offer when variant changes
  useEffect(() => {
    if (filteredOffers.length > 0) {
      const inStockOffer = filteredOffers.find((o) => o.current_stock > 0);
      setSelectedOfferId(inStockOffer ? inStockOffer.id : filteredOffers[0]?.id ?? null);
    } else {
      setSelectedOfferId(null);
    }
  }, [activeVariant?.id, filteredOffers]);

  const activeOffer = filteredOffers.find((o) => o.id === selectedOfferId);
  const currentStock = activeOffer ? activeOffer.current_stock : 0;
  const isOutOfStock = currentStock <= 0;

  // Price: from selected offer or product base (base_price is in minor/cents in DB; adjust if your schema differs)
  const priceInCurrency = activeOffer
    ? activeOffer.cached_price_minor / 100
    : (product?.base_price != null ? product.base_price / 100 : 0);

  const rate = selectedBank?.points_to_currency_rate ?? 0.25;
  const pointsPerItem = Math.ceil(priceInCurrency / rate);
  const totalPoints = pointsPerItem * quantity;

  // Image Gallery
  const galleryImages = useMemo(() => {
    if (!product) return [];
    const rawImages = (product.images && product.images.length > 0) ? product.images : [product.image_url];
    return [...new Set(rawImages)].filter(Boolean);
  }, [product]);

  // --- Handlers ---
  const handleQuantityChange = (delta: number) => {
    setQuantity((prev) => {
      const next = prev + delta;
      return next < 1 ? 1 : (next > currentStock ? currentStock : next);
    });
  };

  const handleRedeem = async () => {
    setRedeemState("loading");
    setTimeout(() => setRedeemState("success"), 1500);
  };

  if (isLoading) return <div className="flex h-[60vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>;
  if (!product) return <div className="p-10 text-center">Product not found</div>;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 animate-in fade-in duration-500">
      {/* Breadcrumb ... (same as before) */}
      <nav className="mb-6 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
         {/* ... code ... */}
         <Link href="/store">Store</Link> / <span>{product.title}</span>
      </nav>

      <div className="flex flex-col gap-8 lg:flex-row lg:gap-12">
        
        {/* Gallery Section ... (same as before) */}
        <div className="w-full lg:w-1/2">
           <div className="relative aspect-square w-full overflow-hidden rounded-2xl border bg-muted">
              <Image src={galleryImages[selectedImageIndex] || "/placeholder.png"} alt={product.title} fill className="object-cover" />
           </div>
           {/* Thumbnails code... */}
        </div>

        {/* Details Section */}
        <div className="flex-1 lg:w-1/2">
            
            {/* Header */}
            <div className="mb-6 border-b border-border pb-6">
              <p className="text-xs font-bold uppercase tracking-wider text-primary">{product.brand_name}</p>
              <h1 className="my-2 text-3xl font-bold text-foreground">{product.title}</h1>
              
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1 text-warning">
                  <Star className="h-4 w-4 fill-current" />
                  <span className="font-bold">{Number(product.rating).toFixed(1)}</span>
                </div>
                {/* Dynamic SKU based on selection */}
                <span className="text-sm text-muted-foreground">SKU: {activeVariant?.internal_sku ?? product.sku}</span>
              </div>
            </div>

            {/* Price Box */}
            <div className="mb-6 rounded-xl bg-muted/50 p-5 ring-1 ring-inset ring-border">
              <div className="flex items-end gap-3">
                <span className="text-4xl font-bold text-primary">
                  {totalPoints.toLocaleString()} <span className="text-lg text-muted-foreground">pts</span>
                </span>
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                Price: ₹{(priceInCurrency * quantity).toLocaleString()}
              </div>
            </div>

            {/* SELECTION AREA */}
            <div className="space-y-6">
              
              {/* 1. Option matrix (Size, Color, etc.) — Amazon-style */}
              {options.length > 0 ? (
                <div className="space-y-4">
                  {options.map((optionGroup) => {
                    const currentValue = selectedOptions[optionGroup.name];
                    return (
                      <div key={optionGroup.name}>
                        <h3 className="mb-2 text-sm font-medium text-foreground">
                          Select {optionGroup.name}
                          {currentValue && (
                            <span className="ml-2 text-muted-foreground">: {currentValue}</span>
                          )}
                        </h3>
                        <div className="flex flex-wrap gap-3">
                          {optionGroup.values.map((value) => {
                            const isSelected = currentValue === value;
                            const isValid = variants.some((v) => {
                              const attrs = (v.attributes ?? {}) as Record<string, string>;
                              return attrs[optionGroup.name] === value &&
                                Object.entries(selectedOptions).every(([k, v]) =>
                                  k === optionGroup.name ? true : attrs[k] === v
                                );
                            });
                            return (
                              <button
                                key={value}
                                type="button"
                                onClick={() =>
                                  setSelectedOptions((prev) => ({ ...prev, [optionGroup.name]: value }))
                                }
                                disabled={!isValid}
                                className={cn(
                                  "min-w-12 rounded-lg border px-4 py-2 text-sm font-medium transition-all",
                                  isSelected
                                    ? "border-primary bg-primary text-primary-foreground ring-2 ring-primary/20"
                                    : "border-border bg-background hover:border-primary/50 text-foreground",
                                  !isValid &&
                                    "cursor-not-allowed opacity-50 bg-muted text-muted-foreground line-through"
                                )}
                              >
                                {value}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : hasVariants ? (
                <div className="text-sm text-muted-foreground">Standard edition</div>
              ) : null}

              {/* 2. Merchants (Offers) — filtered by selected variant */}
              <div>
                <h3 className="mb-3 text-sm font-medium text-foreground">Available Sellers</h3>
                
                {filteredOffers.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
                        {hasVariants 
                            ? "No sellers available for this variant." 
                            : "No sellers available currently."}
                    </div>
                ) : (
                    <div className="grid gap-3 sm:grid-cols-2">
                        {filteredOffers.map((offer) => {
                        const isActive = selectedOfferId === offer.id;
                        const offerPrice = offer.cached_price_minor / 100;
                        const isOfferOOS = offer.current_stock <= 0;

                        return (
                            <button
                                key={offer.id}
                                onClick={() => !isOfferOOS && setSelectedOfferId(offer.id)}
                                disabled={isOfferOOS}
                                className={`
                                    relative flex items-center justify-between rounded-lg border p-3 text-left transition-all
                                    ${isActive 
                                        ? "border-primary bg-primary/5 ring-1 ring-primary" 
                                        : "border-border bg-background hover:border-muted-foreground"}
                                    ${isOfferOOS ? "opacity-60 cursor-not-allowed bg-muted" : "cursor-pointer"}
                                `}
                            >
                                <div>
                                    <div className="font-medium text-foreground">{offer.merchant_name}</div>
                                    <div className="text-xs text-muted-foreground">₹{offerPrice.toLocaleString()}</div>
                                </div>
                                <div className="text-right">
                                    {isActive && <Check className="ml-auto h-4 w-4 text-primary" />}
                                    <div className={`text-xs mt-1 ${isOfferOOS ? "text-destructive font-medium" : "text-success"}`}>
                                        {isOfferOOS ? "Out of Stock" : `${offer.current_stock} left`}
                                    </div>
                                </div>
                            </button>
                        );
                        })}
                    </div>
                )}
              </div>

              {/* 3. Quantity */}
              <div>
                 <h3 className="mb-3 text-sm font-medium text-foreground">Quantity</h3>
                 <div className="flex w-fit items-center rounded-lg border border-border bg-background">
                    <button 
                        onClick={() => handleQuantityChange(-1)}
                        disabled={quantity <= 1 || isOutOfStock}
                        className="p-3 hover:bg-muted disabled:opacity-50"
                    >
                        <Minus className="h-4 w-4" />
                    </button>
                    <span className="min-w-12 text-center font-semibold text-foreground">{quantity}</span>
                    <button 
                        onClick={() => handleQuantityChange(1)}
                        disabled={quantity >= currentStock || isOutOfStock}
                        className="p-3 hover:bg-muted disabled:opacity-50"
                    >
                        <Plus className="h-4 w-4" />
                    </button>
                 </div>
                 {isOutOfStock && (
                     <p className="mt-2 flex items-center gap-2 text-sm text-destructive">
                         <AlertCircle className="h-4 w-4" />
                         This combination is currently out of stock.
                     </p>
                 )}
              </div>
            </div>

            {/* Action Button */}
            <div className="mt-8">
                <button
                    onClick={handleRedeem}
                    disabled={redeemState !== "idle" || isOutOfStock}
                    className="w-full rounded-xl bg-primary py-4 font-bold text-primary-foreground shadow-lg hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground disabled:shadow-none"
                >
                    {redeemState === "loading" ? "Processing..." : isOutOfStock ? "Out of Stock" : "Redeem Now"}
                </button>
            </div>
            
            {/* Description etc... */}
        </div>
      </div>
    </div>
  );
}