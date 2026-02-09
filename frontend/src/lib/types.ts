// API response types that match the SQL join query shape

export interface ApiProduct {
  id: number;
  title: string;
  slug: string;
  description: string;
  image_url: string;
  base_price: number;
  rating: number;
  review_count: number;
  product_status: string;
  brand_name: string;
  brand_slug: string;
  brand_id?: number;
  sku: string;
  variant_id?: number;
  offer_status: string;
  merchant_id: number;
  cached_price_minor: number;
  current_stock: number;
  merchant_name: string;
  category_slug: string;
  category_name: string;
  category_id?: number;
  // Staging data (for review)
  raw_title?: string;
  raw_vendor?: string;
  raw_product_type?: string;
  staging_id?: number;
  offer_id?: number;
  variants?: Array<{
    id: number;
    internal_sku: string;
    attributes?: Record<string, unknown> | null;
    is_active?: boolean;
    stock?: number;
    price?: number;
  }>;
  available_options?: Array<{ name: string; values: string[] }>;
  offers?: Array<{
    id: number;
    merchant_id: number;
    variant_id: number;
    offer_status: string;
    cached_price_minor: number;
    current_stock: number;
    merchant_name: string;
  }>;
  images?: Array<string>;
}

export interface ApiCategory {
  id: number;
  parent_id: number | null;
  name: string;
  slug: string;
  icon: string | null;
  path: string | null;
  is_active: boolean;
  children?: ApiCategory[];
}

export interface ApiBrand {
  id: number;
  name: string;
  slug: string;
  logo_url: string | null;
  is_active: boolean;
}

export interface ApiMerchant {
  id: number;
  name: string;
  email: string;
  source_type: string;
  shopify_configured: boolean;
  is_active: boolean;
  created_at: string;
}


export interface Merchant {
  id: number;
  name: string;
  email: string;
  sourceType: "SHOPIFY";
  sourceConfig: string;
  isActive: boolean;
  shopifyConfigured: boolean;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}

export interface SourceConfig {
  store_url: string;
  access_token: string;
}

export interface UpdateMerchantResponse {
  id: number;
  name: string;
  email: string;
  sourceType: "SHOPIFY";
  sourceConfig: string; // JSON string
  isActive: boolean;
  shopifyConfigured: boolean;
  createdAt: string; // ISO 8601 timestamp
  updatedAt: string; // ISO 8601 timestamp
}

// Merchant operations (staging / issues / stats)
export interface StagingProductListItem {
  id: number;
  title: string;
  vendor: string;
  productType: string;
  createdAt: string;
  imageUrl: string | null;
  status: string;
}

export interface IssueProduct {
  id: number;
  title: string;
  vendor: string;
  rejectedAt: string;
  rejectionReason: string | null;
  imageUrl: string | null;
}

export interface DashboardStats {
  liveProducts: number;
  underReview: number;
  issues: number;
  totalSkus: number;
}

// Public product (live catalog) - API may return snake_case
export interface LiveProductItem {
  id: number;
  title: string;
  sku: string;
  brand_name: string;
  merchant_name: string;
  base_price: number;
  offer_status: string;
  image_url: string | null;
}

// Spring Page response
export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}
