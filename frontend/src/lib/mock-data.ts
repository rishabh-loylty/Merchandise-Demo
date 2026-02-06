export interface Bank {
  id: string;
  name: string;
  pointRatio: number;
}

export interface Product {
  id: string;
  title: string;
  description: string;
  basePrice: number;
  image: string;
  brand: string;
  category: string;
  rating: number;
  reviewCount: number;
  sku: string;
  vendor: string;
  status: "LIVE" | "PENDING_REVIEW";
  merchantId: string;
}

export interface MerchantType {
  id: string;
  name: string;
  email: string;
  shopifyConfigured: boolean;
}

export interface MasterBrand {
  id: string;
  name: string;
}

export interface MasterCategory {
  id: string;
  name: string;
  children?: MasterCategory[];
}

export const BANKS: Bank[] = [
  { id: "sbi", name: "SBI", pointRatio: 0.25 },
  { id: "hdfc", name: "HDFC", pointRatio: 0.5 },
  { id: "axis", name: "Axis", pointRatio: 0.35 },
];

export const CATEGORIES = [
  { id: "kitchen", name: "Kitchen", icon: "ChefHat" },
  { id: "electronics", name: "Electronics", icon: "Smartphone" },
  { id: "fashion", name: "Fashion", icon: "Shirt" },
  { id: "home", name: "Home & Living", icon: "Sofa" },
  { id: "fitness", name: "Fitness", icon: "Dumbbell" },
  { id: "books", name: "Books", icon: "BookOpen" },
];

export const BRANDS = [
  "Prestige",
  "Samsung",
  "Nike",
  "Adidas",
  "Philips",
  "Bosch",
  "Sony",
  "LG",
  "Puma",
  "Reebok",
];

export const MASTER_BRANDS: MasterBrand[] = [
  { id: "prestige", name: "Prestige" },
  { id: "samsung", name: "Samsung" },
  { id: "nike", name: "Nike" },
  { id: "adidas", name: "Adidas" },
  { id: "philips", name: "Philips" },
  { id: "bosch", name: "Bosch" },
  { id: "sony", name: "Sony" },
  { id: "lg", name: "LG" },
  { id: "puma", name: "Puma" },
  { id: "reebok", name: "Reebok" },
];

export const MASTER_CATEGORIES: MasterCategory[] = [
  {
    id: "kitchen",
    name: "Kitchen",
    children: [
      { id: "cookware", name: "Cookware" },
      { id: "appliances", name: "Appliances" },
      { id: "storage", name: "Storage" },
    ],
  },
  {
    id: "electronics",
    name: "Electronics",
    children: [
      { id: "smartphones", name: "Smartphones" },
      { id: "audio", name: "Audio" },
      { id: "laptops", name: "Laptops" },
    ],
  },
  {
    id: "fashion",
    name: "Fashion",
    children: [
      { id: "mens", name: "Men's Wear" },
      { id: "womens", name: "Women's Wear" },
      { id: "footwear", name: "Footwear" },
    ],
  },
  {
    id: "home",
    name: "Home & Living",
    children: [
      { id: "furniture", name: "Furniture" },
      { id: "decor", name: "Decor" },
    ],
  },
  {
    id: "fitness",
    name: "Fitness",
    children: [
      { id: "equipment", name: "Equipment" },
      { id: "accessories", name: "Accessories" },
    ],
  },
];

export const PRODUCTS: Product[] = [
  {
    id: "prod-1",
    title: "Prestige Svachh Pressure Cooker 5L",
    description:
      "The Prestige Svachh pressure cooker comes with a unique spillage control system that controls spillage from the lid. It features a deep lid for a better grip, a metallic safety plug, and a controlled gasket release system.",
    basePrice: 2499,
    image: "https://images.unsplash.com/photo-1585515320310-259814833e62?w=400&h=400&fit=crop",
    brand: "Prestige",
    category: "kitchen",
    rating: 4.5,
    reviewCount: 1203,
    sku: "PRE-SC-5L",
    vendor: "Prestiege Inc",
    status: "LIVE",
    merchantId: "merchant-1",
  },
  {
    id: "prod-2",
    title: "Samsung Galaxy Buds Pro",
    description:
      "Intelligent Active Noise Cancelling with enhanced ambient sound. 360 Audio with Dolby Head Tracking. IPX7 water resistant for workouts.",
    basePrice: 4999,
    image: "https://images.unsplash.com/photo-1590658268037-6bf12f032f55?w=400&h=400&fit=crop",
    brand: "Samsung",
    category: "electronics",
    rating: 4.3,
    reviewCount: 876,
    sku: "SAM-GBP-01",
    vendor: "Samsung Electronics",
    status: "LIVE",
    merchantId: "merchant-1",
  },
  {
    id: "prod-3",
    title: "Nike Air Max 270",
    description:
      "The Nike Air Max 270 delivers visible cushioning under every step. Updated for modern comfort, it nods to the original, 1991 Air Max 180 with its exaggerated tongue top and heritage tongue logo.",
    basePrice: 7999,
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop",
    brand: "Nike",
    category: "fashion",
    rating: 4.7,
    reviewCount: 2341,
    sku: "NIK-AM270",
    vendor: "Nike Inc.",
    status: "LIVE",
    merchantId: "merchant-1",
  },
  {
    id: "prod-4",
    title: "Philips Air Fryer HD9200",
    description:
      "Fry, bake, grill, roast, and even reheat with this amazing air fryer. Rapid Air Technology for healthier frying with up to 90% less fat.",
    basePrice: 5499,
    image: "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=400&h=400&fit=crop",
    brand: "Philips",
    category: "kitchen",
    rating: 4.4,
    reviewCount: 654,
    sku: "PHI-AF-HD9200",
    vendor: "Philips Home Appliances",
    status: "LIVE",
    merchantId: "merchant-2",
  },
  {
    id: "prod-5",
    title: "Sony WH-1000XM5 Headphones",
    description:
      "Industry-leading noise cancellation. Exceptional sound quality with 30-hour battery life. Ultra-comfortable and lightweight design.",
    basePrice: 19999,
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop",
    brand: "Sony",
    category: "electronics",
    rating: 4.8,
    reviewCount: 3120,
    sku: "SON-WH1000XM5",
    vendor: "Sony Corporation",
    status: "LIVE",
    merchantId: "merchant-2",
  },
  {
    id: "prod-6",
    title: "Adidas Ultraboost 22",
    description:
      "Responsive Boost midsole cushioning delivers incredible energy return. Primeknit+ upper adapts to your foot, while a Linear Energy Push system propels you forward.",
    basePrice: 11999,
    image: "https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=400&h=400&fit=crop",
    brand: "Adidas",
    category: "fashion",
    rating: 4.6,
    reviewCount: 1876,
    sku: "ADI-UB22",
    vendor: "Adidas AG",
    status: "LIVE",
    merchantId: "merchant-2",
  },
  {
    id: "prod-7",
    title: "Bosch 7kg Washing Machine",
    description:
      "Anti-tangle feature, ExpressWash, and VarioDrum design for gentle fabric care. Energy efficient with A+++ rating.",
    basePrice: 24999,
    image: "https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?w=400&h=400&fit=crop",
    brand: "Bosch",
    category: "home",
    rating: 4.2,
    reviewCount: 432,
    sku: "BOS-WM-7KG",
    vendor: "Bosch Home Appliances",
    status: "LIVE",
    merchantId: "merchant-1",
  },
  {
    id: "prod-8",
    title: "LG 55-inch OLED TV",
    description:
      "Self-lit OLED pixels create perfect blacks and infinite contrast. Dolby Vision IQ and Dolby Atmos for an incredible viewing experience.",
    basePrice: 89999,
    image: "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=400&h=400&fit=crop",
    brand: "LG",
    category: "electronics",
    rating: 4.9,
    reviewCount: 567,
    sku: "LG-OLED55",
    vendor: "LG Electronics",
    status: "LIVE",
    merchantId: "merchant-2",
  },
  {
    id: "prod-9",
    title: "Puma RS-X Reinvention",
    description:
      "Bold colour combinations and unexpected material mixes. RS technology with new cushioning and support for exceptional comfort.",
    basePrice: 6499,
    image: "https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=400&h=400&fit=crop",
    brand: "Puma",
    category: "fashion",
    rating: 4.1,
    reviewCount: 234,
    sku: "PUM-RSX",
    vendor: "Puma SE",
    status: "LIVE",
    merchantId: "merchant-1",
  },
  {
    id: "prod-10",
    title: "Prestige Iris Plus Mixer Grinder",
    description:
      "750-watt motor with 4 stainless steel jars. Powerful blending and grinding for all your kitchen needs.",
    basePrice: 3299,
    image: "https://images.unsplash.com/photo-1570222094114-d054a817e56b?w=400&h=400&fit=crop",
    brand: "Prestige",
    category: "kitchen",
    rating: 4.0,
    reviewCount: 890,
    sku: "PRE-IRIS-750",
    vendor: "Prestiege Inc",
    status: "PENDING_REVIEW",
    merchantId: "merchant-1",
  },
  {
    id: "prod-11",
    title: "Samsung 256GB SSD",
    description:
      "Blazing fast read/write speeds up to 560/530 MB/s. V-NAND technology for reliability and performance.",
    basePrice: 2999,
    image: "https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=400&h=400&fit=crop",
    brand: "Samsung",
    category: "electronics",
    rating: 4.6,
    reviewCount: 1567,
    sku: "SAM-SSD-256",
    vendor: "Samsung Electronics",
    status: "PENDING_REVIEW",
    merchantId: "merchant-2",
  },
  {
    id: "prod-12",
    title: "Reebok Classic Leather",
    description:
      "A timeless classic with clean lines and premium leather upper. Soft garment leather and padded foam sockliner for comfort.",
    basePrice: 5499,
    image: "https://images.unsplash.com/photo-1551107696-a4b0c5a0d9a2?w=400&h=400&fit=crop",
    brand: "Reebok",
    category: "fashion",
    rating: 4.3,
    reviewCount: 678,
    sku: "REE-CL-LTH",
    vendor: "Reebok International",
    status: "PENDING_REVIEW",
    merchantId: "merchant-2",
  },
];

export const INITIAL_MERCHANTS: MerchantType[] = [
  {
    id: "merchant-1",
    name: "Seller A",
    email: "seller.a@example.com",
    shopifyConfigured: true,
  },
  {
    id: "merchant-2",
    name: "Seller B",
    email: "seller.b@example.com",
    shopifyConfigured: false,
  },
];

// Mock API functions
export function mockDelay(ms: number = 800): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function fetchProducts(filters?: {
  category?: string;
  query?: string;
  brands?: string[];
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
}): Promise<Product[]> {
  await mockDelay();
  let results = PRODUCTS.filter((p) => p.status === "LIVE");

  if (filters?.category) {
    results = results.filter((p) => p.category === filters.category);
  }
  if (filters?.query) {
    const q = filters.query.toLowerCase();
    results = results.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
    );
  }
  if (filters?.brands && filters.brands.length > 0) {
    results = results.filter((p) => filters.brands!.includes(p.brand));
  }
  if (filters?.minPrice !== undefined) {
    results = results.filter((p) => p.basePrice >= filters.minPrice!);
  }
  if (filters?.maxPrice !== undefined) {
    results = results.filter((p) => p.basePrice <= filters.maxPrice!);
  }
  if (filters?.minRating !== undefined) {
    results = results.filter((p) => p.rating >= filters.minRating!);
  }

  return results;
}

export async function fetchProductById(
  id: string
): Promise<Product | undefined> {
  await mockDelay(500);
  return PRODUCTS.find((p) => p.id === id);
}

export async function fetchMerchants(): Promise<MerchantType[]> {
  await mockDelay(500);
  return [...INITIAL_MERCHANTS];
}

export async function createMerchant(data: {
  name: string;
  email: string;
}): Promise<MerchantType> {
  await mockDelay(1000);
  const newMerchant: MerchantType = {
    id: `merchant-${Date.now()}`,
    name: data.name,
    email: data.email,
    shopifyConfigured: false,
  };
  return newMerchant;
}

export async function saveShopifyConfig(_data: {
  storeUrl: string;
  accessToken: string;
}): Promise<boolean> {
  await mockDelay(1500);
  return true;
}

export async function fetchMerchantProducts(
  merchantId: string
): Promise<Product[]> {
  await mockDelay(800);
  return PRODUCTS.filter((p) => p.merchantId === merchantId);
}

export async function syncShopifyProducts(
  merchantId: string
): Promise<Product[]> {
  await mockDelay(2000);
  const newProducts: Product[] = [
    {
      id: `prod-sync-${Date.now()}`,
      title: "New Shopify Product - Ceramic Pan Set",
      description: "Premium non-stick ceramic pan set from Shopify store.",
      basePrice: 3499,
      image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=400&fit=crop",
      brand: "Prestige",
      category: "kitchen",
      rating: 0,
      reviewCount: 0,
      sku: `SYNC-${Date.now()}`,
      vendor: "Prestiege Inc",
      status: "PENDING_REVIEW",
      merchantId,
    },
  ];
  return newProducts;
}

export async function fetchPendingReviewProducts(): Promise<Product[]> {
  await mockDelay(600);
  return PRODUCTS.filter((p) => p.status === "PENDING_REVIEW");
}

export async function approveProduct(
  _productId: string,
  _data: {
    title: string;
    brand: string;
    category: string;
  }
): Promise<boolean> {
  await mockDelay(1000);
  return true;
}

export async function rejectProduct(_productId: string): Promise<boolean> {
  await mockDelay(500);
  return true;
}
