"use client";

import { useGlobal } from "@/context/global-context";
import { Store, Check, Link2 } from "lucide-react";

export default function SettingsPage() {
  const { merchantSession } = useGlobal();

  if (!merchantSession) return null;

  return (
    <div className="max-w-2xl">
      <h1 className="mb-6 text-2xl font-bold text-foreground">Settings</h1>
      
      <div className="rounded-xl border border-border bg-card">
        <div className="border-b border-border px-6 py-4">
          <h2 className="font-semibold text-foreground">Store Connection</h2>
          <p className="text-sm text-muted-foreground">Manage your Shopify integration</p>
        </div>
        
        <div className="p-6">
          <div className="flex items-center gap-4 rounded-lg border border-success/20 bg-success/5 p-4">
            <div className="rounded-full bg-success/20 p-2">
               <Store className="h-5 w-5 text-success" />
            </div>
            <div className="flex-1">
               <div className="flex items-center gap-2">
                  <h3 className="font-medium text-foreground">Shopify Connected</h3>
                  <Check className="h-4 w-4 text-success" />
               </div>
               <p className="text-sm text-muted-foreground">
                 Syncing enabled. Products update automatically on sync action.
               </p>
            </div>
            <div className="text-sm font-medium text-muted-foreground bg-background border px-3 py-1 rounded">
               {merchantSession.email}
            </div>
          </div>

          <div className="mt-6 flex justify-end">
             <button className="text-sm text-muted-foreground hover:text-destructive hover:underline">
               Disconnect Store
             </button>
          </div>
        </div>
      </div>
    </div>
  );
}