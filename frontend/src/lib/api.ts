import type {
  Merchant,
  UpdateMerchantResponse,
  StagingProductListItem,
  IssueProduct,
  DashboardStats,
  LiveProductItem,
  PageResponse,
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
}

export const apiClient = new ApiClient();
