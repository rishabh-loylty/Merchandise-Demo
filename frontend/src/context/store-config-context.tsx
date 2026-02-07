"use client";

import {
	createContext,
	useContext,
	useEffect,
	useState,
	useMemo,
	type ReactNode,
} from "react";
import { useGlobal } from "./global-context";
import {
	type StoreConfig,
	defaultStoreConfig,
	mergeWithDefaults,
	generateCssVariables,
} from "@/lib/store-config";

interface StoreConfigContextValue {
	config: StoreConfig;
	isLoading: boolean;
	error: string | null;
	refreshConfig: () => Promise<void>;
}

const StoreConfigContext = createContext<StoreConfigContextValue | undefined>(
	undefined,
);

export function StoreConfigProvider({ children }: { children: ReactNode }) {
	const { selectedBank } = useGlobal();
	const [config, setConfig] = useState<StoreConfig>(defaultStoreConfig);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const fetchConfig = async () => {
		if (!selectedBank?.id) {
			console.log("[StoreConfig] No bank selected, using defaults");
			setConfig(defaultStoreConfig);
			setIsLoading(false);
			return;
		}

		console.log(
			`[StoreConfig] Fetching config for bank: ${selectedBank.name} (ID: ${selectedBank.id})`,
		);
		setIsLoading(true);
		setError(null);

		try {
			const response = await fetch(
				`/api/partners/${selectedBank.id}/store-config`,
			);

			if (!response.ok) {
				throw new Error("Failed to fetch store configuration");
			}

			const data = await response.json();
			console.log("[StoreConfig] Received config:", data.store_config);

			// Merge with defaults to ensure all fields exist
			const mergedConfig = mergeWithDefaults(data.store_config || {});
			console.log(
				"[StoreConfig] Merged config - primary color:",
				mergedConfig.theme.colors.primary,
			);
			console.log(
				"[StoreConfig] Merged config - store name:",
				mergedConfig.branding.storeName,
			);
			setConfig(mergedConfig);
		} catch (err) {
			console.error("Error fetching store config:", err);
			setError(err instanceof Error ? err.message : "Unknown error");
			// Fall back to default config on error
			setConfig(defaultStoreConfig);
		} finally {
			setIsLoading(false);
		}
	};

	// Fetch config when selected bank changes
	useEffect(() => {
		fetchConfig();
	}, [selectedBank?.id]);

	// Generate and apply CSS variables
	useEffect(() => {
		const cssVariables = generateCssVariables(config);
		console.log(
			"[StoreConfig] Applying CSS variables for:",
			config.branding.storeName,
		);
		console.log("[StoreConfig] Primary color:", config.theme.colors.primary);

		// Create or update style element
		let styleElement = document.getElementById("store-config-styles");
		if (!styleElement) {
			styleElement = document.createElement("style");
			styleElement.id = "store-config-styles";
			document.head.appendChild(styleElement);
			console.log("[StoreConfig] Created new style element");
		}

		styleElement.textContent = cssVariables;
		console.log("[StoreConfig] CSS variables applied successfully");

		// Apply custom CSS if provided
		let customStyleElement = document.getElementById("store-custom-css");
		if (config.customCss) {
			if (!customStyleElement) {
				customStyleElement = document.createElement("style");
				customStyleElement.id = "store-custom-css";
				document.head.appendChild(customStyleElement);
			}
			customStyleElement.textContent = config.customCss;
		} else if (customStyleElement) {
			customStyleElement.remove();
		}

		// Cleanup on unmount
		return () => {
			// We don't remove styles on unmount to prevent flash
		};
	}, [config]);

	const value = useMemo(
		() => ({
			config,
			isLoading,
			error,
			refreshConfig: fetchConfig,
		}),
		[config, isLoading, error],
	);

	return (
		<StoreConfigContext.Provider value={value}>
			{children}
		</StoreConfigContext.Provider>
	);
}

export function useStoreConfig() {
	const context = useContext(StoreConfigContext);
	if (context === undefined) {
		throw new Error("useStoreConfig must be used within a StoreConfigProvider");
	}
	return context;
}

// Hook to get specific section config
export function useSectionConfig<T>(sectionType: string): T | null {
	const { config } = useStoreConfig();
	const section = config.homepage.sections.find((s) => s.type === sectionType);
	if (!section || !section.enabled) return null;
	return section.config as T;
}

// Hook to check if a feature is enabled
export function useFeature(feature: keyof StoreConfig["features"]): boolean {
	const { config } = useStoreConfig();
	return config.features[feature] ?? false;
}

// Hook to get theme colors
export function useThemeColors() {
	const { config } = useStoreConfig();
	return config.theme.colors;
}

// Hook to get branding
export function useBranding() {
	const { config } = useStoreConfig();
	return config.branding;
}

// Hook to get points display config
export function usePointsDisplay() {
	const { config } = useStoreConfig();
	return config.pointsDisplay;
}

// Hook to get product card config
export function useProductCardConfig() {
	const { config } = useStoreConfig();
	return config.productCard;
}

// Hook to get component styles
export function useComponentStyles() {
	const { config } = useStoreConfig();
	return config.components;
}
