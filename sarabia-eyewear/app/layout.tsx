import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Michroma } from "next/font/google";
import { MotionConfig } from "framer-motion";
import { ShopProvider } from "@/components/ShopProvider";
import { site } from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: `${site.name} — Armazones oftálmicos y de sol de autor`, template: `%s · ${site.name}` },
  description: site.description,
  keywords: ["lentes", "armazones", "lentes de sol", "lentes graduados", "óptica", "Jennifer Sarabia", "acetato", "titanio", "Blue Block", "WhatsApp"],
  openGraph: {
    type: "website",
    locale: "es_MX",
    siteName: site.name,
    title: `${site.name} — ${site.endorsement}`,
    description: site.description,
  },
  twitter: { card: "summary_large_image", title: site.name, description: site.description },
  alternates: { canonical: "/" },
};

export const viewport: Viewport = {
  themeColor: "#04070E",
  width: "device-width",
  initialScale: 1,
};

// Sans extendida de titulares (se descarga en build y se sirve desde el propio dominio).
const display = Michroma({ weight: "400", subsets: ["latin"], variable: "--font-display", display: "swap" });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-MX" className={`${GeistSans.variable} ${GeistMono.variable} ${display.variable}`}>
      <body>
        <MotionConfig reducedMotion="user">
          <ShopProvider>{children}</ShopProvider>
        </MotionConfig>
      </body>
    </html>
  );
}
