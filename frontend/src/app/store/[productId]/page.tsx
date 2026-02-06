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
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(null);
  const [selectedOfferId, setSelectedOfferId] = useState<number | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isDescExpanded, setIsDescExpanded] = useState(false);
  const [redeemState, setRedeemState] = useState<"idle" | "loading" | "success">("idle");

  const relatedProducts = (relatedRaw ?? []).filter((p) => p.id !== product?.id).slice(0, 4);
  const variants = product?.variants ?? [];
  const allOffers = product?.offers ?? [];
  const hasVariants = variants.length > 0;

  // --- Logic 1: Initialize Selection (Smart Auto-Select) ---
  useEffect(() => {
    if (product && variants.length > 0) {
      // 1. Find the first variant that has stock > 0
      const inStockVariant = variants.find(v => v.stock > 0);
      // 2. If all are OOS, just pick the first one
      const targetVariantId = inStockVariant ? inStockVariant.id : variants[0].id;
      
      setSelectedVariantId(targetVariantId);
      setQuantity(1);
      setRedeemState("idle");
    }
  }, [product, variants]);

  // --- Logic 2: Filter Offers based on Selected Variant ---
  // We assume the API 'offers' have a 'variant_id' or matches the 'sku'
  // If your API is flat, you might need to adjust this filter condition.
  const filteredOffers = useMemo(() => {
    if (!hasVariants) return allOffers;
    return allOffers.filter(offer => offer.variant_id === selectedVariantId);
  }, [allOffers, selectedVariantId, hasVariants]);

  // Reset selected offer when variant changes
  useEffect(() => {
    if (filteredOffers.length > 0) {
      // Default to the first offer (usually best price) or the one with stock
      const inStockOffer = filteredOffers.find(o => o.current_stock > 0);
      setSelectedOfferId(inStockOffer ? inStockOffer.id : filteredOffers[0].id);
    } else {
      setSelectedOfferId(null);
    }
  }, [selectedVariantId, filteredOffers]);

  // --- Logic 3: Derived Calculation ---
  const activeVariant = variants.find((v) => v.id === selectedVariantId);
  const activeOffer = filteredOffers.find((o) => o.id === selectedOfferId);

  // Determine Stock: 
  // If offers exist, stock is specific to the selected merchant.
  // If no offers (direct sell), use variant stock.
  const currentStock = activeOffer 
    ? activeOffer.current_stock 
    : (activeVariant?.stock ?? 0);

  const isOutOfStock = currentStock <= 0;

  // Price Calculation
  const basePrice = activeVariant?.price ?? product?.base_price ?? 0;
  const priceInCurrency = activeOffer 
    ? (activeOffer.cached_price_minor / 100) 
    : basePrice;

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
              
              {/* 1. Variants Selection */}
              {hasVariants && (
                <div>
                  <h3 className="mb-3 text-sm font-medium text-foreground">Select Variant</h3>
                  <div className="flex flex-wrap gap-3">
                    {variants.map((variant) => {
                      const isActive = selectedVariantId === variant.id;
                      // Check if this specific variant has ANY stock globally (sum of its offers or base stock)
                      const isVariantOOS = variant.stock <= 0; 
                      
                      return (
                        <button
                          key={variant.id}
                          onClick={() => setSelectedVariantId(variant.id)}
                          className={`
                            relative min-w-[4rem] rounded-lg border px-4 py-2 text-sm font-medium transition-all
                            ${isActive 
                                ? "border-primary bg-primary text-primary-foreground ring-2 ring-primary/20" 
                                : "border-border bg-background hover:border-primary/50 text-foreground"}
                            ${isVariantOOS && !isActive ? "opacity-50 grayscale" : ""}
                          `}
                        >
                          {variant.internal_sku}
                          {/* Visual indicator for OOS variants */}
                          {isVariantOOS && (
                            <span className="absolute -top-2 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-muted text-[10px] text-muted-foreground shadow-sm">
                                x
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 2. Merchants (Offers) - FILTERED by current Variant */}
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
                    <span className="min-w-[3rem] text-center font-semibold text-foreground">{quantity}</span>
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