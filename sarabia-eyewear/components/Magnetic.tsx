"use client";

import { useRef, type ReactNode } from "react";
import { motion, useMotionValue, useReducedMotion, useSpring } from "framer-motion";
import clsx from "clsx";

const MAX_OFFSET = 8; // px

/**
 * Atracción magnética sutil hacia el cursor (sólo con mouse y si el usuario no pidió menos
 * movimiento). El botón se desplaza hasta 8 px y vuelve con un resorte al salir.
 */
export function Magnetic({ children, strength = 0.25, className }: { children: ReactNode; strength?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 320, damping: 22, mass: 0.5 });
  const springY = useSpring(y, { stiffness: 320, damping: 22, mass: 0.5 });
  const clamp = (v: number) => Math.max(-MAX_OFFSET, Math.min(MAX_OFFSET, v));

  return (
    <motion.div
      ref={ref}
      className={clsx("inline-flex", className)}
      style={reduced ? undefined : { x: springX, y: springY }}
      onPointerMove={(event) => {
        if (reduced || event.pointerType !== "mouse" || !ref.current) return;
        const rect = ref.current.getBoundingClientRect();
        x.set(clamp((event.clientX - (rect.left + rect.width / 2)) * strength));
        y.set(clamp((event.clientY - (rect.top + rect.height / 2)) * strength));
      }}
      onPointerLeave={() => {
        x.set(0);
        y.set(0);
      }}
    >
      {children}
    </motion.div>
  );
}
