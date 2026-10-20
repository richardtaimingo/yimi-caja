"use client";

import { Fragment, createElement, useEffect, useRef, useState } from "react";
import clsx from "clsx";

/** Orden pseudoaleatorio pero estable (igual en servidor y cliente). */
const order = (i: number) => {
  const s = Math.sin(i * 91.7 + 13.1) * 43758.5453;
  return s - Math.floor(s);
};

type Props = {
  text: string;
  as?: "h1" | "h2" | "h3" | "p" | "span";
  id?: string;
  className?: string;
  /** Retraso antes de la primera letra (s). */
  delay?: number;
  /** Ventana en la que aparecen todas las letras (s). */
  spread?: number;
};

/**
 * Titular que se revela letra por letra en orden aleatorio, con desenfoque, al entrar en pantalla.
 * El texto completo queda para lectores de pantalla y, sin JavaScript o con "reducir movimiento",
 * se ve desde el principio.
 */
export function CharReveal({ text, as = "span", id, className, delay = 0, spread = 0.9 }: Props) {
  const ref = useRef<HTMLElement>(null);
  const [state, setState] = useState<"idle" | "armed" | "on">("idle");

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    setState("armed");
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setState("on");
        observer.disconnect();
      },
      { rootMargin: "0px 0px -12% 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  let index = 0;
  const words = text.split(" ");
  return createElement(
    as,
    { ref, id, className: clsx("char-reveal", state !== "idle" && "is-armed", state === "on" && "is-on", className) },
    <span className="sr-only">{text}</span>,
    <span aria-hidden className="char-reveal__glyphs">
      {words.map((word, w) => (
        <Fragment key={w}>
          <span className="inline-block whitespace-nowrap">
            {Array.from(word).map((glyph) => {
              const i = index++;
              return (
                <span key={i} style={{ transitionDelay: `${(delay + order(i) * spread).toFixed(3)}s` }}>
                  {glyph}
                </span>
              );
            })}
          </span>
          {w < words.length - 1 ? " " : null}
        </Fragment>
      ))}
    </span>,
  );
}
