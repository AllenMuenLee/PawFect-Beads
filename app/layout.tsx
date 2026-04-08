import type { Metadata } from "next";
import { Noto_Sans_TC, Noto_Serif_TC } from "next/font/google";

import { CartProvider } from "@/src/components/providers/cart-provider";
import { SiteHeader } from "@/src/components/site-header";

import "./globals.css";

const notoSans = Noto_Sans_TC({
  variable: "--font-noto-sans-tc",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const notoSerif = Noto_Serif_TC({
  variable: "--font-noto-serif-tc",
  subsets: ["latin"],
  weight: ["500", "700"],
});

export const metadata: Metadata = {
  title: "PawFect Beads-韓式串珠",
  description: "\u624b\u5de5\u97d3\u5f0f\u4e32\u73e0\u5ba2\u88fd\u8a02\u55ae\u7db2\u7ad9",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-Hant-TW" className={`${notoSans.variable} ${notoSerif.variable}`}>
      <body className="min-h-screen bg-[#fffdfa] text-stone-800">
        <CartProvider>
          <div className="flex min-h-screen flex-col">
            <SiteHeader />
            {children}
          </div>
        </CartProvider>
      </body>
    </html>
  );
}
