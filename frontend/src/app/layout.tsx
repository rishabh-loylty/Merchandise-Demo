import "./globals.css";

import { type Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "@/components/providers";
import { Navbar } from "@/components/navbar";

export const metadata: Metadata = {
	title: "Rewardify - Reward Redemption Marketplace",
	description:
		"Redeem your bank reward points for premium products from top brands. Shop electronics, fashion, home goods and more using your loyalty points.",
	keywords: [
		"rewards",
		"loyalty points",
		"redemption",
		"marketplace",
		"bank points",
		"shopping",
	],
	authors: [{ name: "Rewardify" }],
	openGraph: {
		title: "Rewardify - Reward Redemption Marketplace",
		description:
			"Redeem your bank reward points for premium products from top brands.",
		type: "website",
	},
};

const geistSans = Geist({
	subsets: ["latin"],
	variable: "--font-geist-sans",
});

const geistMono = Geist_Mono({
	subsets: ["latin"],
	variable: "--font-geist-mono",
});

export default function RootLayout({
	children,
}: Readonly<{ children: React.ReactNode }>) {
	return (
		<html
			lang="en"
			className={`${geistSans.variable} ${geistMono.variable}`}
			suppressHydrationWarning
		>
			<body className="min-h-screen bg-background font-sans text-foreground antialiased">
				<Providers>
					<div className="relative flex min-h-screen flex-col">
						<Navbar />
						<main className="flex-1">{children}</main>
					</div>
				</Providers>
			</body>
		</html>
	);
}
