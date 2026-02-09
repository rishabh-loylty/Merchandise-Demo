"use client";

import { useGlobal } from "@/context/global-context";
import { apiClient } from "@/lib/api";
import { Link2, ShoppingBag } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function OnboardingPage() {
  const { merchantSession, updateMerchantSession } = useGlobal();
  const router = useRouter();
  const [storeUrl, setStoreUrl] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!merchantSession) {
      router.push("/merchant");
      return;
    }
    if (merchantSession.shopify_configured) {
      router.push("/merchant/dashboard");
    }
  }, [merchantSession, router]);

  if (!merchantSession || merchantSession.shopify_configured) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const handleConnect = async () => {
    if (!storeUrl.trim() || !accessToken.trim()) {
      setError("Please fill in all fields.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await apiClient.updateMerchant(merchantSession.id.toString(), { shopify_configured: true, source_config: { store_url: storeUrl.trim(), access_token: accessToken.trim() } });
      if (res) {
        updateMerchantSession({ shopify_configured: true });
        router.push("/merchant/dashboard");
      } else {
        setError("Failed to connect. Please try again.");
      }
    } catch (error) {
      console.error(error);
      setError("Failed to connect. Please try again.");
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent">
            <ShoppingBag className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Connect Your Shopify Store</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Link your Shopify store to start listing products on Rewardify
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="mb-6 flex items-center gap-3 rounded-lg bg-accent/50 p-3">
            <Link2 className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm font-medium text-foreground">Logged in as {merchantSession.name}</p>
              <p className="text-xs text-muted-foreground">{merchantSession.email}</p>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div>
              <label htmlFor="store-url" className="mb-1.5 block text-sm font-medium text-foreground">
                Shopify Store URL
              </label>
              <input
                id="store-url"
                type="text"
                value={storeUrl}
                onChange={(e) => setStoreUrl(e.target.value)}
                placeholder="yourstore.myshopify.com"
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label htmlFor="access-token" className="mb-1.5 block text-sm font-medium text-foreground">
                Access Token
              </label>
              <input
                id="access-token"
                type="password"
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
                placeholder="shpat_xxxxxxxxxxxxx"
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <button
              type="button"
              onClick={handleConnect}
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                  Connecting...
                </>
              ) : (
                <>
                  <Link2 className="h-4 w-4" />
                  Connect Store
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
