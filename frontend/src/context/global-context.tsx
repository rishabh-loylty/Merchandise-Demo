"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";
import {
  BANKS,
  type Bank,
  type MerchantType,
  type Product,
} from "@/lib/mock-data";

export type Role = "CUSTOMER" | "MERCHANT" | "ADMIN";

interface GlobalState {
  currentRole: Role;
  selectedBank: Bank;
  merchantSession: MerchantType | null;
  merchants: MerchantType[];
  products: Product[];
  setRole: (role: Role) => void;
  setSelectedBank: (bank: Bank) => void;
  setMerchantSession: (merchant: MerchantType | null) => void;
  addMerchant: (merchant: MerchantType) => void;
  updateMerchantSession: (updates: Partial<MerchantType>) => void;
  addProducts: (products: Product[]) => void;
  updateProductStatus: (productId: string, status: "LIVE" | "PENDING_REVIEW") => void;
  removeProduct: (productId: string) => void;
}

const GlobalContext = createContext<GlobalState | undefined>(undefined);

export function GlobalProvider({ children }: { children: ReactNode }) {
  const [currentRole, setCurrentRole] = useState<Role>("CUSTOMER");
  const [selectedBank, setSelectedBankState] = useState<Bank>(BANKS[0]!);
  const [merchantSession, setMerchantSessionState] =
    useState<MerchantType | null>(null);
  const [merchants, setMerchants] = useState<MerchantType[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const setRole = useCallback((role: Role) => {
    setCurrentRole(role);
  }, []);

  const setSelectedBank = useCallback((bank: Bank) => {
    setSelectedBankState(bank);
  }, []);

  const setMerchantSession = useCallback((merchant: MerchantType | null) => {
    setMerchantSessionState(merchant);
  }, []);

  const addMerchant = useCallback((merchant: MerchantType) => {
    setMerchants((prev) => [...prev, merchant]);
  }, []);

  const updateMerchantSession = useCallback(
    (updates: Partial<MerchantType>) => {
      setMerchantSessionState((prev) => (prev ? { ...prev, ...updates } : null));
    },
    []
  );

  const addProducts = useCallback((newProducts: Product[]) => {
    setProducts((prev) => [...prev, ...newProducts]);
  }, []);

  const updateProductStatus = useCallback(
    (productId: string, status: "LIVE" | "PENDING_REVIEW") => {
      setProducts((prev) =>
        prev.map((p) => (p.id === productId ? { ...p, status } : p))
      );
    },
    []
  );

  const removeProduct = useCallback((productId: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== productId));
  }, []);

  return (
    <GlobalContext.Provider
      value={{
        currentRole,
        selectedBank,
        merchantSession,
        merchants,
        products,
        setRole,
        setSelectedBank,
        setMerchantSession,
        addMerchant,
        updateMerchantSession,
        addProducts,
        updateProductStatus,
        removeProduct,
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
