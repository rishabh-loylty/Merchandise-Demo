import type { Merchant } from "./types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

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

  
}

export const apiClient = new ApiClient();
