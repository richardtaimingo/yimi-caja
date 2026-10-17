"use client";

import { useEffect, useSyncExternalStore } from "react";
import Lenis from "lenis";
import { getLenis, setLenis, subscribeLenis } from "@/lib/scroll";

/**
 * Scroll suave con rueda y trackpad (Lenis). En pantallas táctiles se conserva el scroll nativo
 * del sistema (inercia de iOS/Android), que ya es fluido y que el usuario espera.
 */
export function SmoothScroll() {
  useEffect(() => {
    const finePointer = window.matchMedia("(pointer: fine)").matches;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!finePointer || reducedMotion) return;

    const lenis = new Lenis({
      autoRaf: true,
      lerp: 0.09,
      wheelMultiplier: 0.95,
      anchors: true, // los enlaces #catalogo, #materiales… usan la misma curva y respetan scroll-margin-top
      stopInertiaOnNavigate: true,
      allowNestedScroll: true, // el panel del probador y el menú conservan su scroll propio
    });
    setLenis(lenis);
    return () => {
      setLenis(null);
      lenis.destroy();
    };
  }, []);

  return null;
}

/** true cuando Lenis está suavizando el scroll (escritorio con rueda o trackpad). */
export function useSmoothScrollActive() {
  return useSyncExternalStore(
    subscribeLenis,
    () => getLenis() !== null,
    () => false,
  );
}
