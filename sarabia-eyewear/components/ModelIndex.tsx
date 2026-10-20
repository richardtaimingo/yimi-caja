"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import Image from "next/image";
import { motion, useMotionValue, useReducedMotion, useSpring } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import clsx from "clsx";
import { useShop } from "./ShopProvider";
import { SectionHeading } from "./ui";
import { materialLabels, products } from "@/lib/products";
import { currency } from "@/lib/site";

/**
 * Índice de modelos: los 11 nombres en tipografía mono gigante, escalonados. Al pasar el cursor (o con
 * foco de teclado) una barra de luz recorre el nombre, las letras se decodifican desde símbolos y una
 * vista previa del armazón sigue al cursor con un resorte. En táctil se activa la fila que pasa por el
 * centro de la pantalla y la foto aparece en la propia fila. Cada fila abre el probador.
 *
 * La mono evita saltos de layout durante la decodificación: todos los caracteres miden lo mismo.
 */

const ROWS = products.map((product) => ({ product, color: product.colors.find((c) => c.photo) ?? product.colors[0] }));
/** Sangría de cada fila en escritorio (ritmo editorial, no una lista plana). */
const INDENT = ["0%", "16%", "30%", "8%", "38%", "20%", "4%", "34%", "12%", "26%", "2%"];
const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/#_*";
const pad = (n: number) => String(n).padStart(2, "0");

/** Decodifica el texto: los caracteres aún no revelados muestran símbolos al azar. */
function scramble(el: HTMLElement, text: string, previous: { id: number }) {
  cancelAnimationFrame(previous.id);
  const frames = 16;
  let n = 0;
  const step = () => {
    n += 1;
    const revealed = Math.floor((n / frames) * text.length);
    el.textContent = Array.from(text, (ch, i) => (i < revealed || ch === " " ? ch : GLYPHS[(Math.random() * GLYPHS.length) | 0])).join("");
    if (n < frames) previous.id = requestAnimationFrame(step);
    else el.textContent = text;
  };
  previous.id = requestAnimationFrame(step);
}

export function ModelIndex() {
  const { openTryOn } = useShop();
  const reduced = useReducedMotion() ?? false;
  const [active, setActive] = useState<number | null>(null);
  const [hovering, setHovering] = useState(false);
  const names = useRef<(HTMLSpanElement | null)[]>([]);
  const rows = useRef<(HTMLLIElement | null)[]>([]);
  const tick = useRef({ id: 0 });

  // Vista previa que sigue al cursor (sólo mouse)
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const px = useSpring(x, { stiffness: 260, damping: 26, mass: 0.6 });
  const py = useSpring(y, { stiffness: 260, damping: 26, mass: 0.6 });

  const activate = (i: number) => {
    setActive(i);
    const el = names.current[i];
    if (el && !reduced) scramble(el, ROWS[i].product.name, tick.current);
  };

  // Táctil: la fila que cruza la franja central de la pantalla queda activa
  useEffect(() => {
    if (window.matchMedia("(pointer: fine)").matches) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const i = rows.current.indexOf(entry.target as HTMLLIElement);
          if (i >= 0) activate(i);
        }
      },
      { rootMargin: "-46% 0px -46% 0px" },
    );
    rows.current.forEach((row) => row && observer.observe(row));
    return () => observer.disconnect();
    // activate sólo depende de refs estables y de "reduced"
  }, [reduced]);

  useEffect(() => () => cancelAnimationFrame(tick.current.id), []);

  return (
    <section id="indice" aria-label="Índice de modelos" className="relative overflow-hidden py-20 md:py-28">
      <div className="container">
        <SectionHeading
          eyebrow="Índice de modelos"
          title="Encuentra tu forma"
          description="Pasa el cursor o desliza para verlos. Toca cualquiera para probártelo con tu cámara."
        />

        <ol
          data-fab-avoid
          className="mt-12 border-t border-white/[0.08] md:mt-16"
          onMouseEnter={() => setHovering(true)}
          onMouseLeave={() => {
            setHovering(false);
            setActive(null);
          }}
          onMouseMove={(event) => {
            x.set(event.clientX + 28);
            y.set(event.clientY - 110);
          }}
        >
          {ROWS.map(({ product, color }, i) => {
            const on = active === i;
            return (
              <li
                key={product.id}
                ref={(el) => {
                  rows.current[i] = el;
                }}
                className="border-b border-white/[0.08]"
                style={{ "--indent": INDENT[i % INDENT.length] } as CSSProperties}
              >
                <button
                  type="button"
                  onMouseEnter={() => activate(i)}
                  onFocus={() => activate(i)}
                  onClick={() => openTryOn(product.id, color.id)}
                  aria-label={`${product.name}: ${materialLabels[product.material].label}, ${currency.format(product.price)}. Pruébatelos en vivo`}
                  className="group relative flex min-h-[4.25rem] w-full items-center gap-3 py-3 text-left sm:gap-5 lg:pl-[var(--indent)]"
                >
                  <span className="w-6 shrink-0 font-mono text-[0.6875rem] tabular-nums text-paper/40">{pad(i + 1)}</span>
                  <span className="relative min-w-0">
                    {/* Barra de luz que recorre el nombre */}
                    <span
                      aria-hidden
                      className={clsx(
                        "absolute -inset-x-[0.18em] inset-y-[0.04em] origin-left bg-ice transition-transform duration-500 ease-[cubic-bezier(0.65,0,0.35,1)]",
                        on ? "scale-x-100" : "scale-x-0",
                      )}
                    />
                    <span
                      ref={(el) => {
                        names.current[i] = el;
                      }}
                      aria-hidden
                      className={clsx(
                        "relative block whitespace-nowrap font-mono text-[clamp(2rem,1.1rem+3.6vw,4.25rem)] font-medium uppercase leading-[1.05] tracking-[-0.04em] transition-colors duration-300",
                        on ? "text-night" : "text-paper",
                      )}
                    >
                      {product.name}
                    </span>
                  </span>
                  <span className={clsx("hidden font-mono text-[0.6875rem] uppercase leading-[1.6] tracking-[0.12em] transition-colors sm:block", on ? "text-paper" : "text-paper/45")}>
                    {materialLabels[product.material].label}
                    <br />
                    {currency.format(product.price)}
                  </span>
                  {/* Táctil: la foto aparece en la fila activa */}
                  <span
                    aria-hidden
                    className={clsx(
                      "ml-auto flex h-14 w-24 shrink-0 items-center justify-center rounded-lg bg-[radial-gradient(90%_75%_at_50%_40%,#2F6BFF_0%,#0E3BB8_40%,#071A55_100%)] p-2 transition-all duration-500 [@media(pointer:fine)]:hidden",
                      on ? "scale-100 opacity-100" : "scale-90 opacity-0",
                    )}
                  >
                    {color.photo && <Image src={color.photo.front} alt="" width={color.photo.width} height={color.photo.height} sizes="96px" className="h-auto w-full" />}
                  </span>
                  <ArrowUpRight
                    className={clsx("hidden h-5 w-5 shrink-0 transition-all duration-300 [@media(pointer:fine)]:ml-auto [@media(pointer:fine)]:block", on ? "text-ice opacity-100" : "opacity-0")}
                    aria-hidden
                  />
                </button>
              </li>
            );
          })}
        </ol>
      </div>

      {/* Vista previa flotante (mouse) */}
      <motion.div
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-30 hidden h-[13.5rem] w-[18rem] [@media(pointer:fine)]:block"
        style={{ x: px, y: py }}
        initial={false}
        animate={{ opacity: hovering && active !== null ? 1 : 0, scale: hovering && active !== null ? 1 : 0.92 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="relative h-full w-full overflow-hidden rounded-2xl bg-[radial-gradient(90%_75%_at_50%_40%,#2F6BFF_0%,#0E3BB8_34%,#071A55_72%,#030712_100%)] shadow-[0_30px_60px_-24px_rgba(0,0,0,0.8)] ring-1 ring-white/10">
          {ROWS.map(({ product, color }, i) =>
            color.photo ? (
              <div
                key={product.id}
                className="absolute inset-0 flex items-center justify-center p-6 transition-[opacity,transform] duration-300"
                style={{ opacity: active === i ? 1 : 0, transform: active === i ? "scale(1) rotate(-4deg)" : "scale(0.94) rotate(-4deg)" }}
              >
                <Image src={color.photo.front} alt="" width={color.photo.width} height={color.photo.height} sizes="288px" className="h-auto w-full [filter:drop-shadow(0_14px_14px_rgba(0,3,15,0.5))]" />
              </div>
            ) : null,
          )}
          <span className="absolute bottom-3 left-4 font-mono text-[0.625rem] uppercase tracking-[0.14em] text-white/80">
            {active !== null ? `${ROWS[active].product.name} — ${ROWS[active].color.name}` : ""}
          </span>
        </div>
      </motion.div>
    </section>
  );
}
