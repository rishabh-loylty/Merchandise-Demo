"use client";

import * as React from "react";
import { HeroUIProvider } from "@heroui/react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { GlobalProvider } from "@/context/global-context";
import { StoreConfigProvider } from "@/context/store-config-context";
import { Toaster } from "sonner";

interface ProvidersProps {
	children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
	return (
		<NextThemesProvider
			attribute="class"
			defaultTheme="light"
			enableSystem={false}
			disableTransitionOnChange
		>
			<HeroUIProvider>
				<GlobalProvider>
					<StoreConfigProvider>{children}</StoreConfigProvider>
					<Toaster
						position="top-right"
						richColors
						closeButton
						toastOptions={{
							duration: 4000,
							classNames: {
								toast:
									"group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
								description: "group-[.toast]:text-muted-foreground",
								actionButton:
									"group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
								cancelButton:
									"group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
								error:
									"group-[.toaster]:bg-destructive group-[.toaster]:text-destructive-foreground group-[.toaster]:border-destructive",
								success:
									"group-[.toaster]:bg-success group-[.toaster]:text-success-foreground group-[.toaster]:border-success",
								warning:
									"group-[.toaster]:bg-warning group-[.toaster]:text-warning-foreground group-[.toaster]:border-warning",
							},
						}}
					/>
				</GlobalProvider>
			</HeroUIProvider>
		</NextThemesProvider>
	);
}

// Export a simple toast helper
export { toast } from "sonner";
