"use client";

import { useGlobal } from "@/context/global-context";
import {
  INITIAL_MERCHANTS,
  createMerchant,
  type MerchantType,
} from "@/lib/mock-data";
import { Building2, LogIn, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function MerchantPage() {
  const { merchantSession, setMerchantSession, addMerchant, merchants } =
    useGlobal();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [selectedMerchantId, setSelectedMerchantId] = useState("");
  const [registerName, setRegisterName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const allMerchants = [...INITIAL_MERCHANTS, ...merchants];

  useEffect(() => {
    if (merchantSession) {
      if (!merchantSession.shopifyConfigured) {
        router.push("/merchant/onboarding");
      } else {
        router.push("/merchant/dashboard");
      }
    }
  }, [merchantSession, router]);

  if (merchantSession) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const handleLogin = () => {
    const merchant = allMerchants.find((m) => m.id === selectedMerchantId);
    if (merchant) {
      setMerchantSession(merchant);
    }
  };

  const handleRegister = async () => {
    if (!registerName.trim() || !registerEmail.trim()) return;
    setLoading(true);
    const newMerchant = await createMerchant({
      name: registerName.trim(),
      email: registerEmail.trim(),
    });
    addMerchant(newMerchant);
    setMerchantSession(newMerchant);
    setLoading(false);
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent">
            <Building2 className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">
            Merchant Portal
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Login to manage your products or register a new account
          </p>
        </div>

        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          {/* Tabs */}
          <div className="flex border-b border-border">
            <button
              onClick={() => setActiveTab("login")}
              className={`flex flex-1 items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
                activeTab === "login"
                  ? "border-b-2 border-primary bg-card text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <LogIn className="h-4 w-4" />
              Login
            </button>
            <button
              onClick={() => setActiveTab("register")}
              className={`flex flex-1 items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
                activeTab === "register"
                  ? "border-b-2 border-primary bg-card text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <UserPlus className="h-4 w-4" />
              Register
            </button>
          </div>

          <div className="p-6">
            {activeTab === "login" ? (
              <div className="flex flex-col gap-4">
                <div>
                  <label
                    htmlFor="merchant-select"
                    className="mb-1.5 block text-sm font-medium text-foreground"
                  >
                    Select Merchant
                  </label>
                  <select
                    id="merchant-select"
                    value={selectedMerchantId}
                    onChange={(e) => setSelectedMerchantId(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="">Choose a merchant...</option>
                    {allMerchants.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.email})
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={handleLogin}
                  disabled={!selectedMerchantId}
                  className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
                >
                  Login as Merchant
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <div>
                  <label
                    htmlFor="business-name"
                    className="mb-1.5 block text-sm font-medium text-foreground"
                  >
                    Business Name
                  </label>
                  <input
                    id="business-name"
                    type="text"
                    value={registerName}
                    onChange={(e) => setRegisterName(e.target.value)}
                    placeholder="Your Business Name"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label
                    htmlFor="business-email"
                    className="mb-1.5 block text-sm font-medium text-foreground"
                  >
                    Email
                  </label>
                  <input
                    id="business-email"
                    type="email"
                    value={registerEmail}
                    onChange={(e) => setRegisterEmail(e.target.value)}
                    placeholder="you@business.com"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <button
                  onClick={handleRegister}
                  disabled={
                    loading || !registerName.trim() || !registerEmail.trim()
                  }
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                      Creating...
                    </>
                  ) : (
                    "Create Account"
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
