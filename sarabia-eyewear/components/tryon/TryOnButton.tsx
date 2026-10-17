"use client";

import { ScanFace } from "lucide-react";
import clsx from "clsx";
import { useShop } from "../ShopProvider";

// Descarga el código del probador en cuanto el usuario muestra intención (hover/foco).
const preload = () => void import("./TryOnModal");

type Props = {
  productId: string;
  colorId: string;
  /** outline: botón completo para tarjetas · chip: píldora flotante sobre imágenes. */
  variant?: "outline" | "chip";
  className?: string;
};

export function TryOnButton({ productId, colorId, variant = "outline", className }: Props) {
  const { openTryOn } = useShop();

  return (
    <button
      type="button"
      onClick={() => openTryOn(productId, colorId)}
      onPointerEnter={preload}
      onFocus={preload}
      className={clsx(
        variant === "outline"
          ? "group/try inline-flex h-12 items-center justify-center gap-2.5 rounded-full border-2 border-paper bg-night-2 px-4 text-sm font-semibold text-paper transition-colors hover:bg-paper hover:text-night"
          : "inline-flex items-center gap-2 rounded-full bg-night/85 py-1.5 pl-1.5 pr-3.5 text-xs font-semibold text-paper shadow-card backdrop-blur transition hover:bg-night-3",
        className,
      )}
    >
      <span className={clsx("relative flex items-center justify-center rounded-full bg-sun text-night", variant === "outline" ? "h-7 w-7" : "h-6 w-6")}>
        <ScanFace className={variant === "outline" ? "h-4 w-4" : "h-3.5 w-3.5"} strokeWidth={2} />
        <span className="absolute -right-0.5 -top-0.5 flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sun opacity-60" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full border-2 border-white bg-sun" />
        </span>
      </span>
      Pruébatelos en vivo
    </button>
  );
}
