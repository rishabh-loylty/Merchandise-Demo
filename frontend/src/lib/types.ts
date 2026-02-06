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
  }>;
  offers?: Array<{
    id: number;
    merchant_id: number;
    variant_id: number;
    offer_status: string;
    cached_price_minor: number;
    current_stock: number;
    merchant_name: string;
  }>;
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
