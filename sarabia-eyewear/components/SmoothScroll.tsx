"use client";

import { useEffect, useSyncExternalStore } from "react";
import { cancelFrame, frame } from "framer-motion";
import Lenis from "lenis";
import { getLenis, setLenis, subscribeLenis } from "@/lib/scroll";

/**
 * Scroll suave con rueda y trackpad (Lenis). En pantallas táctiles se conserva el scroll nativo
 * (inercia de iOS/Android) y Lenis ni siquiera se instala, así no añade listeners no pasivos.
 */
export function SmoothScroll() {
  useEffect(() => {
    const media = window.matchMedia("(pointer: fine) and (prefers-reduced-motion: no-preference)");
    if (!media.matches) return;

    const lenis = new Lenis({
      lerp: 0.1,
      smoothWheel: true,
      syncTouch: false,
      autoRaf: false,
      stopInertiaOnNavigate: true,
      // El probador, el menú y los carruseles conservan su propio scroll
      prevent: (node) => Boolean(node.closest?.("[role=dialog], [data-lenis-prevent]")),
    });
    // Un solo bucle de animación: Lenis avanza en el mismo frame que Framer Motion
    const tick = ({ timestamp }: { timestamp: number }) => lenis.raf(timestamp);
    frame.update(tick, true);
    setLenis(lenis);

    // Enlaces internos (#catalogo, #materiales…): misma curva y respeta scroll-margin-top
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = (event.target as HTMLElement | null)?.closest?.("a[href^='#']") as HTMLAnchorElement | null;
      if (!link || link.target === "_blank") return;
      const id = decodeURIComponent(link.hash.slice(1));
      const target = id ? document.getElementById(id) : null;
      if (!target) return;
      event.preventDefault();
      lenis.scrollTo(target, { duration: 1.25 });
      history.pushState(null, "", link.hash);
    };
    document.addEventListener("click", onClick);

    return () => {
      document.removeEventListener("click", onClick);
      cancelFrame(tick);
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
