"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { products, type LensOptionId } from "@/lib/products";

/** Intención de compra elegida en el selector rápido del Hero. */
export type Intent = "todos" | "ver" | "sol" | "blue";

type Selection = { productId: string; colorId: string; lensId: LensOptionId | null };

type ShopContextValue = {
  intent: Intent;
  setIntent: (intent: Intent) => void;
  selection: Selection;
  setSelection: (patch: Partial<Selection>) => void;
  /** Precarga un armazón en el configurador y hace scroll hasta él. */
  configure: (productId: string, colorId: string) => void;
  /** Armazón abierto en el probador virtual (null si está cerrado). */
  tryOn: { productId: string; colorId: string } | null;
  openTryOn: (productId: string, colorId: string) => void;
  closeTryOn: () => void;
};

const ShopContext = createContext<ShopContextValue | null>(null);

export function ShopProvider({ children }: { children: ReactNode }) {
  const [intent, setIntentState] = useState<Intent>("todos");
  const [selection, setSelectionState] = useState<Selection>({
    productId: products[0].id,
    colorId: products[0].colors[0].id,
    lensId: null,
  });

  const setSelection = useCallback((patch: Partial<Selection>) => setSelectionState((prev) => ({ ...prev, ...patch })), []);

  const setIntent = useCallback((next: Intent) => {
    setIntentState(next);
    // Elegir "Blue Block" en el Hero también preselecciona esa mica en el configurador.
    if (next === "blue") setSelectionState((prev) => ({ ...prev, lensId: "blue" }));
  }, []);

  const configure = useCallback(
    (productId: string, colorId: string) => {
      const product = products.find((p) => p.id === productId);
      setSelectionState((prev) => ({
        productId,
        colorId,
        lensId: product?.category === "sol" ? "solo" : intent === "blue" ? "blue" : prev.lensId === "solo" ? null : prev.lensId,
      }));
      document.getElementById("como-funciona")?.scrollIntoView({ behavior: "smooth", block: "start" });
    },
    [intent],
  );

  const [tryOn, setTryOn] = useState<ShopContextValue["tryOn"]>(null);
  const openTryOn = useCallback((productId: string, colorId: string) => setTryOn({ productId, colorId }), []);
  const closeTryOn = useCallback(() => setTryOn(null), []);

  const value = useMemo(
    () => ({ intent, setIntent, selection, setSelection, configure, tryOn, openTryOn, closeTryOn }),
    [intent, setIntent, selection, setSelection, configure, tryOn, openTryOn, closeTryOn],
  );

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
}

export function useShop() {
  const ctx = useContext(ShopContext);
  if (!ctx) throw new Error("useShop debe usarse dentro de <ShopProvider>");
  return ctx;
}
