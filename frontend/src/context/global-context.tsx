"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";

export type Role = "CUSTOMER" | "MERCHANT" | "ADMIN";

export interface PartnerBank {
  id: number;
  name: string;
  points_to_currency_rate: number;
  currency_code: string;
}

export interface MerchantSession {
  id: number;
  name: string;
  email: string;
  shopify_configured: boolean;
}

interface GlobalState {
  currentRole: Role;
  selectedBank: PartnerBank | null;
  merchantSession: MerchantSession | null;
  setRole: (role: Role) => void;
  setSelectedBank: (bank: PartnerBank) => void;
  setMerchantSession: (merchant: MerchantSession | null) => void;
  updateMerchantSession: (updates: Partial<MerchantSession>) => void;
}

const GlobalContext = createContext<GlobalState | undefined>(undefined);

export function GlobalProvider({ children }: { children: ReactNode }) {
  const [currentRole, setCurrentRole] = useState<Role>("CUSTOMER");
  const [selectedBank, setSelectedBankState] = useState<PartnerBank | null>(null);
  const [merchantSession, setMerchantSessionState] = useState<MerchantSession | null>(null);

  const setRole = useCallback((role: Role) => {
    setCurrentRole(role);
  }, []);

  const setSelectedBank = useCallback((bank: PartnerBank) => {
    setSelectedBankState(bank);
  }, []);

  const setMerchantSession = useCallback((merchant: MerchantSession | null) => {
    setMerchantSessionState(merchant);
  }, []);

  const updateMerchantSession = useCallback(
    (updates: Partial<MerchantSession>) => {
      setMerchantSessionState((prev) => (prev ? { ...prev, ...updates } : null));
    },
    []
  );

  return (
    <GlobalContext.Provider
      value={{
        currentRole,
        selectedBank,
        merchantSession,
        setRole,
        setSelectedBank,
        setMerchantSession,
        updateMerchantSession,
      }}
    >
      {children}
    </GlobalContext.Provider>
  );
}

export function useGlobal() {
  const context = useContext(GlobalContext);
  if (context === undefined) {
    throw new Error("useGlobal must be used within a GlobalProvider");
  }
  return context;
}
