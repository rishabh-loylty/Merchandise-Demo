import type {
  Merchant,
  UpdateMerchantResponse,
  StagingProductListItem,
  IssueProduct,
  DashboardStats,
  LiveProductItem,
  PageResponse,
  AdminStats,
  ReviewQueuePage,
  MasterProductSearchItem,
  VariantMatchResponse,
  StagingDetail,
  BrandListItem,
  CategoryListItem,
  MasterVariantDto,
} from "./types";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

/** Fetcher for SWR that hits the backend (use with keys like /api/merchants/1/staging) */
export const apiFetcher = (url: string) =>
  fetch(`${API_BASE_URL}${url}`, { credentials: "omit" }).then((res) => {
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    const contentType = res.headers.get("content-type");
    if (contentType?.includes("application/json")) return res.json();
    return undefined;
  });

class ApiClient {

  private async fetch<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...options.headers,
    };


    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
      credentials: "omit",
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `API Error: ${response.status}`);
    }

    // Handle 204 No Content and other status codes with empty body
    if (
      response.status === 204 ||
      (response.status === 200 &&
        response.headers.get("content-length") === "0")
    ) {
      return undefined as T;
    }

    // Check if response has content
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      return undefined as T;
    }

    try {
      return await response.json();
    } catch (e) {
      // If JSON parsing fails, return undefined
      return undefined as T;
    }
  }

  async getMerchants(): Promise<Merchant[]> {
    return this.fetch<Merchant[]>("/api/merchants");
  }

  async createMerchant({ name, email }: { name: string; email: string }): Promise<Merchant> {
    return this.fetch<Merchant>("/api/merchants", {
      method: "POST",
      body: JSON.stringify({ name, email }),
    });
  }

  async updateMerchant(id: string, data: { shopify_configured?: boolean, source_config?: { store_url: string, access_token: string } }): Promise<Merchant> {
    return this.fetch<UpdateMerchantResponse>(`/api/merchants/${id}`, {
      method: "PATCH",
      body: JSON.stringify({
        shopify_configured: data.shopify_configured,
        source_config: data.source_config,
      }),
    });
  }

  async syncMerchant(id: string): Promise<void> {
    return this.fetch<void>(`/api/merchants/${id}/sync`, {
      method: "POST",
    });
  }

  async getStaging(merchantId: number, page = 0, size = 20): Promise<PageResponse<StagingProductListItem>> {
    const params = new URLSearchParams({ page: String(page), size: String(size) });
    return this.fetch<PageResponse<StagingProductListItem>>(`/api/merchants/${merchantId}/staging?${params}`);
  }

  async getIssues(merchantId: number, page = 0, size = 20): Promise<PageResponse<IssueProduct>> {
    const params = new URLSearchParams({ page: String(page), size: String(size) });
    return this.fetch<PageResponse<IssueProduct>>(`/api/merchants/${merchantId}/issues?${params}`);
  }

  async searchStagingProducts(
    merchantId: number,
    q: string,
    page = 0,
    size = 20
  ): Promise<PageResponse<StagingProductListItem>> {
    const params = new URLSearchParams({ page: String(page), size: String(size) });
    if (q.trim()) params.set("q", q.trim());
    return this.fetch<PageResponse<StagingProductListItem>>(`/api/merchants/${merchantId}/search?${params}`);
  }

  async getStats(merchantId: number): Promise<DashboardStats> {
    return this.fetch<DashboardStats>(`/api/merchants/${merchantId}/stats`);
  }

  async getProducts(merchantId: number, status: string = "all"): Promise<LiveProductItem[]> {
    const params = new URLSearchParams({ merchantId: String(merchantId), status });
    return this.fetch<LiveProductItem[]>(`/api/products?${params}`);
  }

  async resyncStagingProduct(merchantId: number, stagingId: number): Promise<void> {
    return this.fetch<void>(`/api/merchants/${merchantId}/products/${stagingId}/resync`, {
      method: "POST",
    });
  }

  // Admin APIs (Spring Boot backend)
  async getAdminStats(): Promise<AdminStats> {
    return this.fetch<AdminStats>("/api/admin/stats");
  }

  async getAdminQueue(status: string | null, page = 0, size = 20): Promise<ReviewQueuePage> {
    const params = new URLSearchParams({ page: String(page), size: String(size) });
    if (status) params.set("status", status);
    return this.fetch<ReviewQueuePage>(`/api/admin/queue?${params}`);
  }

  async getMasterProducts(page = 0, size = 20): Promise<PageResponse<MasterProductSearchItem>> {
    const params = new URLSearchParams({ page: String(page), size: String(size) });
    return this.fetch<PageResponse<MasterProductSearchItem>>(`/api/admin/products?${params}`);
  }

  async searchMasterProducts(q: string): Promise<MasterProductSearchItem[]> {
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    return this.fetch<MasterProductSearchItem[]>(`/api/admin/products/search?${params}`);
  }

  async updateMasterProduct(
    productId: number,
    data: { title?: string; description?: string; brand_id?: number; image_url?: string }
  ): Promise<void> {
    return this.fetch<void>(`/api/admin/products/${productId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async getStagingDetail(stagingId: number): Promise<StagingDetail> {
    return this.fetch<StagingDetail>(`/api/admin/review/${stagingId}`);
  }

  async getVariantMatch(stagingId: number, targetMasterId: number): Promise<VariantMatchResponse> {
    return this.fetch<VariantMatchResponse>(
      `/api/admin/review/${stagingId}/variants/match?targetMasterId=${targetMasterId}`
    );
  }

  async getAdminBrands(): Promise<BrandListItem[]> {
    return this.fetch<BrandListItem[]>("/api/admin/brands");
  }

  async createBrand(data: { name: string; slug: string; logo_url?: string | null }): Promise<BrandListItem> {
    return this.fetch<BrandListItem>("/api/admin/brands", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateBrand(brandId: number, data: { name?: string; slug?: string; logo_url?: string | null; is_active?: boolean }): Promise<void> {
    return this.fetch<void>(`/api/admin/brands/${brandId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async deleteBrand(brandId: number): Promise<void> {
    return this.fetch<void>(`/api/admin/brands/${brandId}`, {
      method: "DELETE",
    });
  }

  async getAdminCategories(): Promise<CategoryListItem[]> {
    return this.fetch<CategoryListItem[]>("/api/admin/categories");
  }

  async createCategory(data: { name: string; slug: string; parent_id?: number | null; icon?: string | null }): Promise<CategoryListItem> {
    return this.fetch<CategoryListItem>("/api/admin/categories", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateCategory(categoryId: number, data: { name?: string; slug?: string; parent_id?: number | null; is_active?: boolean }): Promise<void> {
    return this.fetch<void>(`/api/admin/categories/${categoryId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async deleteCategory(categoryId: number): Promise<void> {
    return this.fetch<void>(`/api/admin/categories/${categoryId}`, {
      method: "DELETE",
    });
  }

  async getProductVariants(productId: number): Promise<MasterVariantDto[]> {
    return this.fetch<MasterVariantDto[]>(`/api/admin/products/${productId}/variants`);
  }

  async submitReviewDecision(
    stagingId: number,
    body: {
      action: string;
      clean_data?: {
        title: string;
        slug?: string;
        description?: string;
        brand_id?: number;
        category_id?: number;
        category_ids?: number[];
        selected_media_ids?: number[];
        extra_media?: Array<{ url: string; alt_text?: string }>;
        options_definition?: Record<string, string[]>;
        specifications?: Record<string, string>;
        variants?: any[];
      };
      master_product_id?: number;
      variant_mapping?: Array<{
        staging_variant_id: number;
        master_variant_id?: number | null;
        new_variant_attributes?: Record<string, string>;
      }>;
      rejection_reason?: string;
      admin_notes?: string;
    }
  ): Promise<void> {
    return this.fetch<void>(`/api/admin/review/${stagingId}/decision`, {
      method: "POST",
      body: JSON.stringify(body),
    });
  }
}

export const apiClient = new ApiClient();
