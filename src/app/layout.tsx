import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import { clinic } from "@/config/site";
import { baseUrl, siteTitle } from "@/lib/content";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { MobileContactBar } from "@/components/MobileContactBar";
import { JsonLd } from "@/components/JsonLd";
import "./globals.css";

const serif = Cormorant_Garamond({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});

const sans = Inter({
  subsets: ["latin", "latin-ext"],
  variable: "--font-inter",
  display: "swap",
});

const description = `${clinic.name}, ${clinic.city} / ${clinic.region}. Ağız ve diş sağlığınıza yönelik değerlendirme ve tedavi süreçlerinde yanınızdayız.`;

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: { default: siteTitle, template: `%s | ${siteTitle}` },
  description,
  applicationName: clinic.name,
  openGraph: {
    type: "website",
    locale: "tr_TR",
    siteName: clinic.name,
    title: siteTitle,
    description,
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#f6f2ea",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" className={`${serif.variable} ${sans.variable}`} data-scroll-behavior="smooth">
      <body className="flex min-h-dvh flex-col">
        <JsonLd />
        <Header />
        <main id="icerik" className="flex-1">
          {children}
        </main>
        <Footer />
        <MobileContactBar />
      </body>
    </html>
  );
}
