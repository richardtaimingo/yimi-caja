import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    // Sólo WebP: conserva el canal alfa de los recortes sin pérdida (AVIF dejaba halo en el borde).
    formats: ["image/webp"],
    // Calidades permitidas (obligatorio desde Next 16): 90 para armazones, 75 para lo demás.
    qualities: [75, 90, 100],
    // Escalones pensados para pantallas 2x/3x: el hero en escritorio pide ~1400 px y en móvil ~1100 px.
    deviceSizes: [640, 750, 828, 1080, 1200, 1440, 1600, 1920, 2048],
    minimumCacheTTL: 60 * 60 * 24 * 365,
  },
  experimental: { optimizePackageImports: ["lucide-react", "framer-motion"] },
};

export default nextConfig;
