import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { MotionConfig } from "framer-motion";
import { ShopProvider } from "@/components/ShopProvider";
import { SmoothScroll } from "@/components/SmoothScroll";
import { site } from "@/lib/site";
import "lenis/dist/lenis.css";
import "./fonts/michroma.css";
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
  themeColor: "#03050B",
  width: "device-width",
  initialScale: 1,
  // Permite usar env(safe-area-inset-*) para el botón flotante y el hero en pantallas con muesca.
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-MX" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body>
        {/* Duotono de campaña (clase .grade-duotone): negro → tinta #03050B, medios → cobalto #1B47C9,
            blancos → hielo #E8EEFF. Mantiene los brillos especulares en vez de teñirlos de azul plano. */}
        <svg width="0" height="0" aria-hidden className="absolute">
          <filter id="sb-duotone" colorInterpolationFilters="sRGB">
            <feColorMatrix type="saturate" values="0" />
            <feComponentTransfer>
              <feFuncR type="table" tableValues="0.012 0.106 0.910" />
              <feFuncG type="table" tableValues="0.020 0.278 0.933" />
              <feFuncB type="table" tableValues="0.043 0.788 1.000" />
            </feComponentTransfer>
          </filter>
        </svg>
        <SmoothScroll />
        <MotionConfig reducedMotion="user">
          <ShopProvider>{children}</ShopProvider>
        </MotionConfig>
      </body>
    </html>
  );
}
