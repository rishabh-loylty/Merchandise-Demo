"use client";

import { useGlobal } from "@/context/global-context";
import { fetcher } from "@/lib/fetcher";
import type { ApiProduct } from "@/lib/types";
import {
  ArrowLeft,
  Check,
  Shield,
  ShoppingBag,
  Star,
  Truck,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import useSWR from "swr";

export default function ProductDetailPage() {
  const params = useParams();
  const { selectedBank } = useGlobal();
  const productId = params.productId as string;

  const { data: product, isLoading } = useSWR<ApiProduct>(
    `/api/products/${productId}`,
    fetcher
  );

  // Fetch related products (same category)
  const { data: relatedRaw } = useSWR<ApiProduct[]>(
    product?.category_slug ? `/api/products?status=LIVE&category=${product.category_slug}` : null,
    fetcher
  );

  const relatedProducts = (relatedRaw ?? [])
    .filter((p) => p.id !== product?.id)
    .slice(0, 4);

  const [selectedImage, setSelectedImage] = useState(0);
  const [redeemState, setRedeemState] = useState<"idle" | "loading" | "success">("idle");

  const rate = selectedBank?.points_to_currency_rate ?? 0.25;

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center">
        <h2 className="mb-2 text-xl font-bold text-foreground">Product Not Found</h2>
        <p className="mb-4 text-sm text-muted-foreground">The product you are looking for does not exist.</p>
        <Link href="/store" className="flex items-center gap-2 text-sm font-medium text-primary hover:underline">
          <ArrowLeft className="h-4 w-4" />
          Back to Store
        </Link>
      </div>
    );
  }

  const points = Math.ceil(product.base_price / rate).toLocaleString();
  const images = [product.image_url, product.image_url, product.image_url];

  const handleRedeem = () => {
    setRedeemState("loading");
    setTimeout(() => {
      setRedeemState("success");
    }, 1500);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/store" className="hover:text-foreground">Store</Link>
        <span>/</span>
        <Link href={`/store/search?category=${product.category_slug}`} className="capitalize hover:text-foreground">
          {product.category_name ?? product.category_slug}
        </Link>
        <span>/</span>
        <span className="text-foreground">{product.title}</span>
      </nav>

      {/* Product Layout */}
      <div className="flex flex-col gap-8 lg:flex-row">
        {/* Image Gallery */}
        <div className="lg:w-1/2">
          <div className="relative aspect-square overflow-hidden rounded-xl border border-border bg-muted">
            <Image
              src={images[selectedImage]!}
              alt={product.title}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
              priority
            />
          </div>
          <div className="mt-4 flex gap-3">
            {images.map((img, i) => (
              <button
                key={i}
                onClick={() => setSelectedImage(i)}
                className={`relative h-20 w-20 overflow-hidden rounded-lg border-2 transition-all ${
                  selectedImage === i ? "border-primary" : "border-border hover:border-muted-foreground"
                }`}
              >
                <Image src={img} alt={`${product.title} view ${i + 1}`} fill className="object-cover" sizes="80px" />
              </button>
            ))}
          </div>
        </div>

        {/* Product Details */}
        <div className="flex-1 lg:w-1/2">
          <p className="mb-2 text-sm font-medium uppercase tracking-wide text-primary">{product.brand_name}</p>
          <h1 className="mb-4 text-pretty text-3xl font-bold text-foreground">{product.title}</h1>

          <div className="mb-4 flex items-center gap-2">
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${i < Math.floor(product.rating) ? "fill-warning text-warning" : "text-border"}`}
                />
              ))}
            </div>
            <span className="text-sm font-medium text-foreground">{product.rating}</span>
            <span className="text-sm text-muted-foreground">({product.review_count.toLocaleString()} reviews)</span>
          </div>

          <p className="mb-6 leading-relaxed text-muted-foreground">{product.description}</p>

          {/* Price / Points */}
          <div className="mb-6 rounded-xl border border-border bg-muted p-6">
            <div className="mb-1 text-sm text-muted-foreground">
              Redeem with {selectedBank?.name ?? "..."} Points
            </div>
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-bold text-primary">{points} pts</span>
              <span className="text-sm text-muted-foreground line-through">
                INR {product.base_price.toLocaleString()}
              </span>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">1 point = {rate} INR</p>
          </div>

          {/* Redeem Button */}
          <button
            onClick={handleRedeem}
            disabled={redeemState !== "idle"}
            className={`mb-6 flex w-full items-center justify-center gap-2 rounded-xl px-6 py-4 text-base font-semibold transition-all ${
              redeemState === "success"
                ? "bg-success text-success-foreground"
                : redeemState === "loading"
                  ? "bg-primary/70 text-primary-foreground"
                  : "bg-primary text-primary-foreground hover:bg-primary/90"
            }`}
          >
            {redeemState === "loading" ? (
              <>
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                Processing...
              </>
            ) : redeemState === "success" ? (
              <>
                <Check className="h-5 w-5" />
                Redeemed Successfully!
              </>
            ) : (
              <>
                <ShoppingBag className="h-5 w-5" />
                Redeem Now - {points} pts
              </>
            )}
          </button>

          {/* Features */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3 text-sm text-foreground">
              <Truck className="h-5 w-5 text-muted-foreground" />
              Free delivery within 5-7 business days
            </div>
            <div className="flex items-center gap-3 text-sm text-foreground">
              <Shield className="h-5 w-5 text-muted-foreground" />
              1-year manufacturer warranty
            </div>
          </div>

          {/* Product Info */}
          <div className="mt-8 rounded-xl border border-border bg-card">
            <h3 className="border-b border-border px-4 py-3 text-sm font-semibold text-foreground">Product Details</h3>
            <div className="divide-y divide-border">
              {[
                ["Brand", product.brand_name],
                ["SKU", product.sku],
                ["Category", product.category_name ?? product.category_slug],
                ["Merchant", product.merchant_name],
              ].map(([label, value]) => (
                <div key={label} className="flex px-4 py-3 text-sm">
                  <span className="w-32 flex-shrink-0 font-medium text-muted-foreground">{label}</span>
                  <span className="capitalize text-foreground">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="mt-16">
          <h2 className="mb-6 text-xl font-bold text-foreground">Related Products</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {relatedProducts.map((p) => (
              <Link
                key={p.id}
                href={`/store/${p.id}`}
                className="group overflow-hidden rounded-xl border border-border bg-card transition-all hover:shadow-lg"
              >
                <div className="relative aspect-square overflow-hidden bg-muted">
                  <Image
                    src={p.image_url}
                    alt={p.title}
                    fill
                    className="object-cover transition-transform group-hover:scale-105"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  />
                </div>
                <div className="p-4">
                  <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {p.brand_name}
                  </p>
                  <h3 className="mb-2 line-clamp-2 text-sm font-semibold text-foreground">{p.title}</h3>
                  <span className="text-lg font-bold text-primary">
                    {Math.ceil(p.base_price / rate).toLocaleString()} pts
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
