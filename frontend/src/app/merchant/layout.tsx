"use client";

import { useGlobal } from "@/context/global-context";
import {
  LayoutDashboard,
  LogOut,
  Package,
  Settings,
  Store,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

export default function MerchantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { merchantSession, setMerchantSession } = useGlobal();
  const router = useRouter();
  const pathname = usePathname();

  // Redirect logic
  useEffect(() => {
    if (!merchantSession) {
      if (pathname !== "/merchant") router.push("/merchant");
    }
  }, [merchantSession, pathname, router]);

  // Don't show layout on login or onboarding pages
  if (
    pathname === "/merchant" ||
    pathname === "/merchant/onboarding" ||
    !merchantSession
  ) {
    return <>{children}</>;
  }

  const navItems = [
    { href: "/merchant/dashboard", label: "Overview", icon: LayoutDashboard },
    { href: "/merchant/products", label: "Catalog", icon: Package },
    { href: "/merchant/settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="flex min-h-screen bg-muted/20">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-10 hidden w-64 border-r border-border bg-card px-4 py-6 md:block">
        <div className="mb-8 flex items-center gap-2 px-2 font-bold text-xl text-primary">
          <Store className="h-6 w-6" />
          <span>MerchantPortal</span>
        </div>

        <nav className="flex flex-col gap-1">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-6 left-4 right-4 border-t border-border pt-4">
          <div className="mb-4 flex items-center gap-3 px-2">
            <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
              {merchantSession.name.charAt(0)}
            </div>
            <div className="overflow-hidden">
              <p className="truncate text-sm font-medium text-foreground">
                {merchantSession.name}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {merchantSession.email}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setMerchantSession(null);
              router.push("/merchant");
            }}
            className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm font-medium text-destructive hover:bg-destructive/10"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-64">
        <div className="container mx-auto max-w-6xl p-6">{children}</div>
      </main>
    </div>
  );
}