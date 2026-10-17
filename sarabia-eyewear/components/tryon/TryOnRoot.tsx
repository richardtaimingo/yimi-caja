"use client";

import dynamic from "next/dynamic";
import { AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";
import { useShop } from "../ShopProvider";

// El probador (y MediaPipe) se cargan sólo cuando alguien lo abre.
const TryOnModal = dynamic(() => import("./TryOnModal").then((m) => m.TryOnModal), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm" role="status">
      <Loader2 className="h-8 w-8 animate-spin text-paper" />
      <span className="sr-only">Abriendo probador virtual…</span>
    </div>
  ),
});

export function TryOnRoot() {
  const { tryOn, closeTryOn } = useShop();

  return (
    <AnimatePresence>
      {tryOn && <TryOnModal key="tryon" initialProductId={tryOn.productId} initialColorId={tryOn.colorId} onClose={closeTryOn} />}
    </AnimatePresence>
  );
}
