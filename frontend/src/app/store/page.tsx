"use client";

import { useGlobal } from "@/context/global-context";
import { CATEGORIES, PRODUCTS } from "@/lib/mock-data";
import {
  BookOpen,
  ChefHat,
  ChevronLeft,
  ChevronRight,
  Dumbbell,
  ShoppingBag,
  Shirt,
  Smartphone,
  Sofa,
  Star,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

const ICON_MAP: Record<string, React.ReactNode> = {
  ChefHat: <ChefHat className="h-8 w-8" />,
  Smartphone: <Smartphone className="h-8 w-8" />,
  Shirt: <Shirt className="h-8 w-8" />,
  Sofa: <Sofa className="h-8 w-8" />,
  Dumbbell: <Dumbbell className="h-8 w-8" />,
  BookOpen: <BookOpen className="h-8 w-8" />,
};

const HERO_SLIDES = [
  {
    title: "Redeem Your Rewards",
    subtitle: "Turn your bank points into premium products",
    bg: "from-primary to-blue-700",
  },
  {
    title: "Top Electronics Deals",
    subtitle: "Sony, Samsung, LG and more at your fingertips",
    bg: "from-blue-700 to-blue-900",
  },
  {
    title: "Fashion Favorites",
    subtitle: "Nike, Adidas, Puma - all redeemable with points",
    bg: "from-blue-900 to-primary",
  },
];

export default function StorePage() {
  const { selectedBank } = useGlobal();
  const liveProducts = PRODUCTS.filter((p) => p.status === "LIVE");
  const featured = liveProducts.slice(0, 4);

  const [currentSlide, setCurrentSlide] = useState(0);

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
  }, []);

  const prevSlide = useCallback(() => {
    setCurrentSlide(
      (prev) => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length
    );
  }, []);

  useEffect(() => {
    const timer = setInterval(nextSlide, 5000);
    return () => clearInterval(timer);
  }, [nextSlide]);

  const calculatePoints = (price: number) =>
    Math.ceil(price / selectedBank.pointRatio).toLocaleString();

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Carousel */}
      <section className="relative overflow-hidden">
        <div
          className="flex transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(-${currentSlide * 100}%)` }}
        >
          {HERO_SLIDES.map((slide, i) => (
            <div
              key={i}
              className={`flex min-w-full flex-col items-center justify-center bg-gradient-to-r ${slide.bg} px-4 py-20 text-primary-foreground`}
            >
              <ShoppingBag className="mb-4 h-12 w-12 opacity-80" />
              <h1 className="mb-2 text-balance text-center text-4xl font-bold tracking-tight md:text-5xl">
                {slide.title}
              </h1>
              <p className="mb-6 text-center text-lg opacity-90">
                {slide.subtitle}
              </p>
              <Link
                href="/store/search"
                className="rounded-lg bg-card px-6 py-3 text-sm font-semibold text-foreground shadow-lg transition-transform hover:scale-105"
              >
                Browse All Products
              </Link>
            </div>
          ))}
        </div>
        <button
          onClick={prevSlide}
          className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-card/80 p-2 shadow-md backdrop-blur-sm transition-colors hover:bg-card"
          aria-label="Previous slide"
        >
          <ChevronLeft className="h-5 w-5 text-foreground" />
        </button>
        <button
          onClick={nextSlide}
          className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-card/80 p-2 shadow-md backdrop-blur-sm transition-colors hover:bg-card"
          aria-label="Next slide"
        >
          <ChevronRight className="h-5 w-5 text-foreground" />
        </button>
        <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
          {HERO_SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentSlide(i)}
              className={`h-2 rounded-full transition-all ${
                currentSlide === i
                  ? "w-6 bg-primary-foreground"
                  : "w-2 bg-primary-foreground/50"
              }`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      </section>

      {/* Shop by Category */}
      <section className="mx-auto max-w-7xl px-4 py-12">
        <h2 className="mb-8 text-2xl font-bold text-foreground">
          Shop by Category
        </h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.id}
              href={`/store/search?category=${cat.id}`}
              className="group flex flex-col items-center gap-3 rounded-xl border border-border bg-card p-6 text-center transition-all hover:border-primary hover:shadow-md"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                {ICON_MAP[cat.icon]}
              </div>
              <span className="text-sm font-medium text-foreground">
                {cat.name}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="mx-auto max-w-7xl px-4 pb-16">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-foreground">
            Featured Products
          </h2>
          <Link
            href="/store/search"
            className="text-sm font-medium text-primary hover:underline"
          >
            View All
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((product) => (
            <Link
              key={product.id}
              href={`/store/${product.id}`}
              className="group overflow-hidden rounded-xl border border-border bg-card transition-all hover:shadow-lg"
            >
              <div className="relative aspect-square overflow-hidden bg-muted">
                <Image
                  src={product.image}
                  alt={product.title}
                  fill
                  className="object-cover transition-transform group-hover:scale-105"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                />
              </div>
              <div className="p-4">
                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {product.brand}
                </p>
                <h3 className="mb-2 line-clamp-2 text-sm font-semibold text-foreground">
                  {product.title}
                </h3>
                <div className="mb-2 flex items-center gap-1">
                  <Star className="h-3.5 w-3.5 fill-warning text-warning" />
                  <span className="text-xs font-medium text-foreground">
                    {product.rating}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    ({product.reviewCount.toLocaleString()})
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-lg font-bold text-primary">
                    {calculatePoints(product.basePrice)} pts
                  </span>
                  <span className="text-xs text-muted-foreground">
                    ({selectedBank.name})
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
