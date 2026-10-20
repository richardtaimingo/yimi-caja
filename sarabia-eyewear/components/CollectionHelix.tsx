"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { cancelFrame, frame } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useShop } from "./ShopProvider";
import { products, type Colorway, type Product } from "@/lib/products";
import { currency } from "@/lib/site";
import { scrollToTarget } from "@/lib/scroll";

/**
 * Colección en espiral: todos los colores reales de la colección forman una cinta de tarjetas que se
 * tuerce como una hélice y gira con el scroll (más una deriva lenta). Fondo claro, tipografía gigante
 * cortada por el borde y textos mono en las esquinas. Cada tarjeta abre el probador con ese color.
 *
 * Rendimiento: 3D de CSS (preserve-3d). En cada frame sólo se escribe `transform` de cada tarjeta, así que
 * el compositor la mueve sin repintar; el bucle corre sólo con la sección en pantalla.
 */

type Tile = { product: Product; color: Colorway };
const TILES: Tile[] = products.flatMap((product) => product.colors.filter((c) => c.photo).map((color) => ({ product, color })));
/** El reverso de cada tarjeta muestra el color que está a media colección de distancia. */
const BACK_OFFSET = Math.floor(TILES.length / 2);
/** Giro total de la cinta de un extremo al otro: poco por tarjeta, para que se vean caras y no cantos. */
const TWIST = Math.PI * 1.5;

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

export function CollectionHelix() {
  const { openTryOn, setIntent } = useShop();
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const cards = useRef<(HTMLButtonElement | null)[]>([]);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const section = sectionRef.current;
    const stage = stageRef.current;
    if (!section || !stage) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let top = 0;
    let height = 1;
    let vw = 1;
    let vh = 1;
    let phase = -1;
    let running = false;

    const place = (angle: number) => {
      const n = TILES.length;
      const portrait = vw < vh;
      // En vertical la cinta cruza la pantalla en diagonal larga; en horizontal, de lado a lado y un poco más
      const span = portrait ? vh * 1.5 : Math.max(vw * 1.7, vh * 1.9);
      const ampY = (portrait ? vw : vh) * 0.16;
      const ampZ = Math.min(vw, vh) * 0.34;
      for (let i = 0; i < n; i++) {
        const el = cards.current[i];
        if (!el) continue;
        const s = i / (n - 1);
        const x = (s - 0.5) * span;
        // Curva en S en el plano y en profundidad: la cinta serpentea, no es una línea recta
        const y = Math.sin(s * Math.PI * 1.6 + angle * 0.35) * ampY;
        const z = Math.cos(s * Math.PI * 1.2 + angle * 0.25) * ampZ;
        el.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,${z.toFixed(1)}px) rotateX(${(s * TWIST + angle).toFixed(4)}rad)`;
      }
    };

    const measure = () => {
      top = section.getBoundingClientRect().top + window.scrollY;
      height = section.offsetHeight;
      vw = stage.clientWidth;
      vh = stage.clientHeight;
      if (reduced) place(1.1);
    };

    const loop = ({ timestamp, delta }: { timestamp: number; delta: number }) => {
      // Avance desde que la sección asoma por abajo hasta que sale por arriba
      const p = clamp01((window.scrollY - (top - vh)) / (height + vh));
      const target = p * Math.PI * 2.4 + (timestamp / 1000) * 0.12;
      phase = phase < 0 ? target : phase + (target - phase) * (1 - Math.exp(-delta / 140));
      place(phase);
    };

    const observer = new IntersectionObserver(([entry]) => {
      if (reduced) return;
      if (entry.isIntersecting && !running) {
        running = true;
        frame.render(loop, true);
      } else if (!entry.isIntersecting && running) {
        running = false;
        cancelFrame(loop);
      }
    });
    observer.observe(section);
    const resize = new ResizeObserver(measure);
    resize.observe(stage);
    resize.observe(document.body);
    measure();
    place(reduced ? 1.1 : 0);

    return () => {
      observer.disconnect();
      resize.disconnect();
      if (running) cancelFrame(loop);
    };
  }, []);

  const current = TILES[active];
  const goToCatalog = () => {
    setIntent("todos");
    scrollToTarget(document.getElementById("catalogo"));
  };

  return (
    <section
      id="coleccion"
      ref={sectionRef}
      aria-labelledby="coleccion-title"
      className="relative h-[230svh] bg-canvas-2 text-ink motion-reduce:h-auto"
    >
      <div ref={stageRef} className="sticky top-0 h-[100svh] overflow-hidden motion-reduce:relative">
        {/* Esquinas: textos mono como en una ficha técnica */}
        <div className="container relative z-20 flex justify-between gap-6 pt-[calc(var(--chrome-h)+1.25rem)] font-mono text-[0.6875rem] uppercase leading-[1.7] tracking-[0.12em] text-ink/60">
          <div>
            <p className="text-ink">Sarabia — Colección 2026</p>
            <p>Armazones de autor</p>
            <p>
              {products.length} modelos · {TILES.length} colores
            </p>
          </div>
        </div>

        {/* Tipografía gigante, cortada por el borde derecho */}
        <h2
          id="coleccion-title"
          className="pointer-events-none absolute -bottom-[0.06em] left-[max(1rem,calc((100vw-1360px)/2+1rem))] z-0 select-none whitespace-nowrap font-display text-[clamp(4.5rem,17vw,17rem)] uppercase leading-[0.8] tracking-[-0.01em] text-ink"
        >
          Colección
        </h2>

        {/* La cinta: eje en diagonal, cada tarjeta gira sobre él */}
        <div className="absolute inset-0 z-10 [perspective:1600px]">
          {/* Diagonal y en escorzo: un extremo cerca y otro lejos, como en un set fotográfico */}
          <div className="absolute inset-0 [transform-style:preserve-3d] [transform:rotateZ(-16deg)_rotateY(-26deg)_rotateX(10deg)] max-sm:[transform:rotateZ(-64deg)_rotateY(-18deg)]">
            {TILES.map(({ product, color }, i) => (
              <button
                key={`${product.id}-${color.id}`}
                ref={(el) => {
                  cards.current[i] = el;
                }}
                type="button"
                onClick={() => openTryOn(product.id, color.id)}
                onMouseEnter={() => setActive(i)}
                onFocus={() => setActive(i)}
                aria-label={`Pruébate ${product.name} en ${color.name}`}
                // Centrada con márgenes negativos: el transform lo escribe el bucle en cada frame
                className="group absolute left-1/2 top-1/2 h-[var(--ch)] w-[var(--cw)] [--ch:calc(var(--cw)*0.78)] [--cw:clamp(11rem,16.5vw,20rem)] [transform-style:preserve-3d] [will-change:transform] max-sm:[--cw:44vw]"
                style={{ marginLeft: "calc(var(--cw) / -2)", marginTop: "calc(var(--ch) / -2)" }}
              >
                {/* Frente: el armazón real en estudio blanco */}
                <span className="absolute inset-0 overflow-hidden rounded-[10px] bg-[radial-gradient(90%_80%_at_50%_38%,#FFFFFF_0%,#F1F1EE_52%,#E2E2DC_100%)] shadow-[0_18px_40px_-22px_rgba(11,11,12,0.4)] ring-1 ring-ink/[0.06] [backface-visibility:hidden]">
                  <span className="absolute inset-0 flex items-center justify-center p-[9%] transition-transform duration-500 ease-out group-hover:scale-[1.06]">
                    <Image
                      src={color.photo!.front}
                      alt=""
                      width={color.photo!.width}
                      height={color.photo!.height}
                      sizes="(min-width: 640px) 15vw, 38vw"
                      className="h-auto w-full [filter:drop-shadow(0_10px_10px_rgba(11,11,12,0.2))]"
                    />
                  </span>
                  <span className="absolute bottom-2 left-2.5 font-mono text-[0.5625rem] uppercase tracking-[0.14em] text-ink/60">{product.name}</span>
                </span>
                {/* Reverso: otro color de la colección sobre grafito (la cinta alterna blanco y negro, nunca caras vacías) */}
                <span className="absolute inset-0 overflow-hidden rounded-[10px] bg-[radial-gradient(90%_80%_at_50%_35%,#2A2A2E_0%,#151517_60%,#0B0B0C_100%)] [backface-visibility:hidden] [transform:rotateX(180deg)]">
                  <span className="absolute inset-0 flex items-center justify-center p-[9%]">
                    <Image
                      src={TILES[(i + BACK_OFFSET) % TILES.length].color.photo!.front}
                      alt=""
                      width={TILES[(i + BACK_OFFSET) % TILES.length].color.photo!.width}
                      height={TILES[(i + BACK_OFFSET) % TILES.length].color.photo!.height}
                      sizes="(min-width: 640px) 15vw, 38vw"
                      className="h-auto w-full [filter:drop-shadow(0_10px_10px_rgba(11,11,12,0.2))]"
                    />
                  </span>
                  <span className="absolute bottom-2 left-2.5 font-mono text-[0.5625rem] uppercase tracking-[0.14em] text-white/70">
                    {TILES[(i + BACK_OFFSET) % TILES.length].product.name}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Ficha del armazón señalado + acceso al catálogo */}
        <div data-fab-avoid className="container pointer-events-none absolute inset-x-0 bottom-[calc(min(17vw,17rem)*0.8+1.5rem)] z-20 flex items-end justify-between gap-4 max-sm:bottom-[calc(4.5rem*0.8+2.5rem)]">
          <p aria-live="polite" className="font-mono text-[0.6875rem] uppercase leading-[1.7] tracking-[0.12em] text-ink/60">
            <span className="text-ink">{current.product.name}</span> — {current.color.name}
            <br />
            {currency.format(current.product.price)} · Toca un armazón para probártelo
          </p>
          <button type="button" onClick={goToCatalog} className="btn-ink pointer-events-auto h-11 shrink-0 px-5 text-[0.8125rem]">
            Ver catálogo <ArrowRight className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </div>
    </section>
  );
}
