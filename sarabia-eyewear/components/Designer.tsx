"use client";

import { useRef } from "react";
import Image from "next/image";
import { motion, useMotionValue, useReducedMotion, useScroll, useSpring, useTransform } from "framer-motion";
import { ArrowRight, MessageCircle } from "lucide-react";
import clsx from "clsx";
import { useShop } from "./ShopProvider";
import { products } from "@/lib/products";
import { whatsappLink } from "@/lib/site";
import { scrollToTarget } from "@/lib/scroll";

/**
 * La diseñadora: nombre gigante en grotesca ligera y una nube de armazones reales en tarjetas que flotan
 * en 3D. La nube gira con el scroll y se inclina hacia el cursor (resortes). Fondo claro, para dar ritmo
 * entre las secciones oscuras. Cada tarjeta abre el probador con ese armazón.
 */

type Tone = "studio" | "paper" | "ink";
type Tile = { productId: string; colorId: string; tone: Tone; x: number; y: number; z: number; rx: number; ry: number; rz: number; w: number };

// Posiciones en % de la caja y profundidad en px: una composición, no una rejilla
const TILES: Tile[] = [
  { productId: "costa", colorId: "negro-humo", tone: "studio", x: 6, y: 4, z: 110, rx: 16, ry: -26, rz: -8, w: 36 },
  { productId: "roma", colorId: "oro-g15", tone: "paper", x: 50, y: -2, z: -70, rx: -12, ry: 30, rz: 6, w: 32 },
  { productId: "gata", colorId: "negro", tone: "ink", x: 60, y: 30, z: 150, rx: 10, ry: -18, rz: 10, w: 38 },
  { productId: "valeria", colorId: "verde", tone: "paper", x: 16, y: 36, z: -130, rx: -18, ry: 24, rz: -12, w: 30 },
  { productId: "olivia", colorId: "carey-cafe", tone: "studio", x: 36, y: 60, z: 60, rx: 22, ry: -10, rz: 4, w: 38 },
  { productId: "tulum", colorId: "negro-oro", tone: "ink", x: 0, y: 70, z: -40, rx: -8, ry: 28, rz: -6, w: 28 },
  { productId: "mateo", colorId: "carey", tone: "studio", x: 70, y: 68, z: -110, rx: 14, ry: -28, rz: 9, w: 28 },
  { productId: "brava", colorId: "miel", tone: "paper", x: 30, y: 14, z: 230, rx: -6, ry: 12, rz: -3, w: 24 },
];

const TONES: Record<Tone, string> = {
  studio: "bg-[radial-gradient(90%_80%_at_50%_38%,#FFFFFF_0%,#F1F1EE_52%,#E2E2DC_100%)] ring-1 ring-ink/[0.06]",
  paper: "bg-white ring-1 ring-ink/10",
  ink: "bg-[radial-gradient(90%_80%_at_50%_35%,#2A2A2E_0%,#151517_60%,#0B0B0C_100%)]",
};

export function Designer() {
  const { openTryOn, setIntent } = useShop();
  const reduced = useReducedMotion() ?? false;
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const scrollY = useTransform(scrollYProgress, [0, 1], [reduced ? 0 : -24, reduced ? 0 : 24]);
  const scrollX = useTransform(scrollYProgress, [0, 1], [reduced ? 6 : 12, reduced ? 6 : -8]);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const tiltX = useSpring(mouseX, { stiffness: 90, damping: 18, mass: 0.7 });
  const tiltY = useSpring(mouseY, { stiffness: 90, damping: 18, mass: 0.7 });
  const rotateY = useTransform([scrollY, tiltY] as const, ([a, b]: number[]) => a + b);
  const rotateX = useTransform([scrollX, tiltX] as const, ([a, b]: number[]) => a + b);

  const tiles = TILES.map((tile) => {
    const product = products.find((p) => p.id === tile.productId)!;
    const color = product.colors.find((c) => c.id === tile.colorId) ?? product.colors[0];
    return { ...tile, product, color };
  });

  return (
    <section
      ref={ref}
      id="disenadora"
      aria-labelledby="disenadora-title"
      className="relative overflow-hidden bg-canvas-2 py-20 text-ink md:py-28"
      onPointerMove={(event) => {
        if (event.pointerType !== "mouse" || reduced) return;
        const box = event.currentTarget.getBoundingClientRect();
        mouseY.set(((event.clientX - box.left) / box.width - 0.5) * 14);
        mouseX.set(-((event.clientY - box.top) / box.height - 0.5) * 10);
      }}
      onPointerLeave={() => {
        mouseX.set(0);
        mouseY.set(0);
      }}
    >
      <div className="container grid items-center gap-12 lg:grid-cols-[1fr_1.05fr] lg:gap-8">
        <div className="relative z-10">
          <div className="flex items-center gap-4 font-mono text-[0.6875rem] uppercase leading-[1.7] tracking-[0.12em] text-ink/60">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-ink font-display text-[0.75rem] tracking-[0.08em] text-white">JS</span>
            <p>
              <span className="text-ink">Diseñadora y fundadora</span>
              <br />
              Ciudad de México
            </p>
          </div>
          <p className="mt-10 text-[1.0625rem] text-ink/70">Directora creativa de Sarabia Eyewear</p>
          <h2 id="disenadora-title" className="mt-2 text-[clamp(3.25rem,1.8rem+6vw,8.5rem)] font-light leading-[0.88] tracking-[-0.055em]">
            Jennifer
            <br />
            Sarabia
          </h2>
          <p className="mt-8 max-w-[46ch] text-[0.9375rem] leading-relaxed text-ink/70 sm:text-base">
            Cada armazón Sarabia empieza como un trazo de Jennifer: proporciones pensadas para rostros reales, acetatos de alta densidad y
            titanio, y un ajuste que se revisa a mano antes de llegar a ti.
          </p>
          <div data-fab-avoid className="mt-9 flex flex-wrap gap-3">
            <a
              href={whatsappLink("Hola Jennifer, me gustaría una asesoría para elegir mis lentes.")}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-ink h-12 px-6 text-[0.9375rem]"
            >
              <MessageCircle className="h-4 w-4 text-whatsapp" aria-hidden /> Agenda una asesoría
            </a>
            <button
              type="button"
              onClick={() => {
                setIntent("todos");
                scrollToTarget(document.getElementById("catalogo"));
              }}
              className="btn-line-ink h-12 px-6 text-[0.875rem]"
            >
              Ver la colección <ArrowRight className="h-4 w-4" aria-hidden />
            </button>
          </div>
        </div>

        {/* Nube de armazones en 3D */}
        <div className="relative h-[min(62svh,36rem)] [perspective:1300px] max-lg:-mx-5 max-lg:h-[52svh]">
          <motion.div className="absolute inset-[6%] [transform-style:preserve-3d]" style={{ rotateX, rotateY }}>
            {tiles.map((tile, i) => (
              <button
                key={`${tile.productId}-${tile.colorId}`}
                type="button"
                onClick={() => openTryOn(tile.product.id, tile.color.id)}
                aria-label={`Pruébate ${tile.product.name} en ${tile.color.name}`}
                className="group absolute aspect-[4/3]"
                style={{
                  left: `${tile.x}%`,
                  top: `${tile.y}%`,
                  width: `${tile.w}%`,
                  transform: `translateZ(${tile.z}px) rotateX(${tile.rx}deg) rotateY(${tile.ry}deg) rotateZ(${tile.rz}deg)`,
                }}
              >
                {/* La levitación (animación CSS) y el realce al pasar el cursor van en capas distintas: ambos usan transform */}
                <span className="absolute inset-0 motion-safe:animate-float" style={{ animationDelay: `${-i * 0.8}s`, animationDuration: `${6 + (i % 3)}s` }}>
                <span
                  className={clsx(
                    "absolute inset-0 flex items-center justify-center overflow-hidden rounded-xl p-[10%] shadow-[0_24px_50px_-26px_rgba(11,11,12,0.4)] transition-transform duration-500 ease-out group-hover:scale-[1.05]",
                    TONES[tile.tone],
                  )}
                >
                  {tile.color.photo && (
                    <Image
                      src={tile.color.photo.front}
                      alt=""
                      width={tile.color.photo.width}
                      height={tile.color.photo.height}
                      sizes="(min-width: 1024px) 18vw, 40vw"
                      className={clsx("h-auto w-full [filter:drop-shadow(0_10px_10px_rgba(11,11,12,0.2))]", tile.tone === "ink" && "grade-duotone")}
                    />
                  )}
                  <span className={clsx("absolute bottom-2 left-3 font-mono text-[0.5625rem] uppercase tracking-[0.14em]", tile.tone === "ink" ? "text-white/70" : "text-ink/60")}>
                    {tile.product.name}
                  </span>
                </span>
                </span>
              </button>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
