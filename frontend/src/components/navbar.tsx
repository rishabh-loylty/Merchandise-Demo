"use client";

import { useGlobal, type PartnerBank } from "@/context/global-context";
import { fetcher } from "@/lib/fetcher";
import {
  ChevronDown,
  CreditCard,
  LogOut,
  Search,
  Shield,
  Store,
  User,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import useSWR from "swr";

export function Navbar() {
  const {
    currentRole,
    selectedBank,
    merchantSession,
    setRole,
    setSelectedBank,
    setMerchantSession,
  } = useGlobal();
  const router = useRouter();

  // Fetch partners (banks) from API
  const { data: partners } = useSWR<PartnerBank[]>("/api/partners", fetcher);

  // Auto-select first bank when data loads
  useEffect(() => {
    if (partners && partners.length > 0 && !selectedBank) {
      setSelectedBank(partners[0]!);
    }
  }, [partners, selectedBank, setSelectedBank]);

  if (currentRole === "CUSTOMER") {
    return (
      <CustomerNavbar
        banks={partners ?? []}
        selectedBank={selectedBank}
        onBankChange={setSelectedBank}
        onLoginMerchant={() => {
          setRole("MERCHANT");
          router.push("/merchant");
        }}
        onLoginAdmin={() => {
          setRole("ADMIN");
          router.push("/admin/review");
        }}
      />
    );
  }

  return (
    <ConsoleNavbar
      role={currentRole}
      merchantName={merchantSession?.name}
      onExit={() => {
        setRole("CUSTOMER");
        setMerchantSession(null);
        router.push("/store");
      }}
    />
  );
}

function CustomerNavbar({
  banks,
  selectedBank,
  onBankChange,
  onLoginMerchant,
  onLoginAdmin,
}: {
  banks: PartnerBank[];
  selectedBank: PartnerBank | null;
  onBankChange: (bank: PartnerBank) => void;
  onLoginMerchant: () => void;
  onLoginAdmin: () => void;
}) {
  const [bankOpen, setBankOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/store/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-card shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center gap-6 px-4 py-3">
        <Link
          href="/store"
          className="flex-shrink-0 text-xl font-bold tracking-tight text-primary"
        >
          Rewardify
        </Link>

        <form
          onSubmit={handleSearch}
          className="relative mx-4 hidden max-w-md flex-1 md:block"
        >
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-border bg-muted py-2 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </form>

        <div className="flex items-center gap-3">
          {/* Bank Selector */}
          <div className="relative">
            <button
              onClick={() => {
                setBankOpen(!bankOpen);
                setUserOpen(false);
              }}
              className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              <CreditCard className="h-4 w-4 text-primary" />
              <span>{selectedBank?.name ?? "Loading..."}</span>
              <ChevronDown className="h-3 w-3 text-muted-foreground" />
            </button>
            {bankOpen && (
              <div className="absolute right-0 top-full z-50 mt-1 w-48 rounded-lg border border-border bg-card p-1 shadow-lg">
                {banks.map((bank) => (
                  <button
                    key={bank.id}
                    onClick={() => {
                      onBankChange(bank);
                      setBankOpen(false);
                    }}
                    className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-sm transition-colors hover:bg-muted ${
                      selectedBank?.id === bank.id
                        ? "bg-accent font-medium text-accent-foreground"
                        : "text-foreground"
                    }`}
                  >
                    <span>{bank.name}</span>
                    <span className="text-xs text-muted-foreground">
                      1pt = {bank.points_to_currency_rate} INR
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => {
                setUserOpen(!userOpen);
                setBankOpen(false);
              }}
              className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              <User className="h-4 w-4" />
              <ChevronDown className="h-3 w-3 text-muted-foreground" />
            </button>
            {userOpen && (
              <div className="absolute right-0 top-full z-50 mt-1 w-52 rounded-lg border border-border bg-card p-1 shadow-lg">
                <button
                  onClick={() => {
                    onLoginMerchant();
                    setUserOpen(false);
                  }}
                  className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-foreground transition-colors hover:bg-muted"
                >
                  <Store className="h-4 w-4" />
                  Login as Merchant
                </button>
                <button
                  onClick={() => {
                    onLoginAdmin();
                    setUserOpen(false);
                  }}
                  className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-foreground transition-colors hover:bg-muted"
                >
                  <Shield className="h-4 w-4" />
                  Login as Admin
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile search */}
      <div className="border-t border-border px-4 py-2 md:hidden">
        <form onSubmit={handleSearch} className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-border bg-muted py-2 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </form>
      </div>
    </nav>
  );
}

function ConsoleNavbar({
  role,
  merchantName,
  onExit,
}: {
  role: "MERCHANT" | "ADMIN";
  merchantName?: string;
  onExit: () => void;
}) {
  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-foreground shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          {role === "MERCHANT" ? (
            <Store className="h-5 w-5 text-primary-foreground" />
          ) : (
            <Shield className="h-5 w-5 text-primary-foreground" />
          )}
          <span className="text-sm font-semibold text-primary-foreground">
            {role === "MERCHANT"
              ? `Merchant Console: ${merchantName ?? "Unknown"}`
              : "Admin Console"}
          </span>
        </div>
        <button
          onClick={onExit}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <LogOut className="h-4 w-4" />
          Exit to Store
        </button>
      </div>
    </nav>
  );
}
