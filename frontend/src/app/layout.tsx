import "./globals.css";

import { type Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { GlobalProvider } from "@/context/global-context";
import { Navbar } from "@/components/navbar";

export const metadata: Metadata = {
  title: "Rewardify - Reward Redemption Marketplace",
  description:
    "Redeem your bank reward points for premium products from top brands.",
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
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        <GlobalProvider>
          <Navbar />
          <main>{children}</main>
        </GlobalProvider>
      </body>
    </html>
  );
}
