import type Lenis from "lenis";

/**
 * Estado global del scroll de la página.
 * - Una sola instancia de Lenis (sólo existe con puntero fino y sin "reducir movimiento").
 * - Bloqueo con contador de referencias para modales y menús que se abren a la vez.
 */

let lenis: Lenis | null = null;
const listeners = new Set<() => void>();

export function setLenis(instance: Lenis | null) {
  lenis = instance;
  listeners.forEach((notify) => notify());
}

export function getLenis() {
  return lenis;
}

/** Para useSyncExternalStore: avisa cuando Lenis se crea o se destruye. */
export function subscribeLenis(notify: () => void) {
  listeners.add(notify);
  return () => {
    listeners.delete(notify);
  };
}

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Desplaza la página hasta un elemento (respeta su scroll-margin-top) o una posición en px,
 * con la misma curva que el scroll suave; sin Lenis usa el scroll nativo.
 */
export function scrollToTarget(target: HTMLElement | number | null | undefined) {
  if (target == null) return;
  if (lenis) {
    lenis.scrollTo(target, { duration: 1.25 });
    return;
  }
  const behavior: ScrollBehavior = prefersReducedMotion() ? "auto" : "smooth";
  if (typeof target === "number") window.scrollTo({ top: target, behavior });
  else target.scrollIntoView({ behavior, block: "start" });
}

let locks = 0;

/** Bloquea el scroll de la página mientras haya al menos un modal o menú abierto. */
export function lockScroll() {
  locks += 1;
  if (locks > 1) return;
  lenis?.stop();
  document.documentElement.style.overflow = "hidden";
}

export function unlockScroll() {
  if (locks === 0) return;
  locks -= 1;
  if (locks > 0) return;
  lenis?.start();
  document.documentElement.style.overflow = "";
}
