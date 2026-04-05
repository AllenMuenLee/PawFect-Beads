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
  description: "手工韓式串珠客製訂單網站",
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
