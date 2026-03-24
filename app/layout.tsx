import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "DigiVet VMS — Veteriner Klinik Yönetim Sistemi",
    template: "%s | DigiVet VMS",
  },
  description:
    "Türkiye'nin modern veteriner klinik otomasyon platformu. Hasta yönetimi, randevu, reçete, stok ve faturalama.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <body className={`${inter.className} antialiased`}>
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
