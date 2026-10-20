"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import clsx from "clsx";
import { LitFrame } from "./LitFrame";
import { useShop } from "./ShopProvider";
import { products } from "@/lib/products";
import { CharReveal } from "./CharReveal";
import { Reveal } from "./ui";

/**
 * Campaña en pósters: seis composiciones de estudio con fotos reales de los armazones, alternando
 * estudio blanco y grafito, titulares extendidos y texto diminuto en las esquinas.
 * Cada póster abre el probador virtual con ese modelo.
 */

type Poster = {
  productId: string;
  colorId: string;
  headline: string;
  copy: string;
  corner: string;
  /** Posición del armazón dentro del póster (porcentajes del póster). */
  frame: { width: string; left: string; top: string; rotate: number };
  light: string;
  /** Estudio blanco o fondo grafito: alterna en la rejilla para dar ritmo en blanco y negro. */
  tone: "studio" | "noir";
  layout: "wordmark-bottom" | "headline-bottom" | "watermark" | "wordmark-top";
  droplets?: boolean;
  plinth?: boolean;
  reflection?: boolean;
};

const POSTERS: Poster[] = [
  {
    productId: "costa",
    colorId: "negro-humo",
    headline: "Precisión en cada línea",
    copy: "Cada curva, bisagra y remache se revisa a mano para un ajuste que dura años.",
    corner: "Acetato pulido a mano",
    frame: { width: "150%", left: "-6%", top: "26%", rotate: -14 },
    light: "radial-gradient(90% 70% at 30% 38%, #FFFFFF 0%, #F2F2EE 42%, #E2E2DB 100%)",
    tone: "studio",
    layout: "wordmark-bottom",
  },
  {
    productId: "roma",
    colorId: "oro-g15",
    headline: "Una mirada que se queda",
    copy: "Titanio ligero y micas G-15 de vidrio: contraste natural bajo el sol más fuerte.",
    corner: "Hecho para la claridad",
    frame: { width: "84%", left: "8%", top: "40%", rotate: -5 },
    light: "radial-gradient(70% 55% at 50% 46%, #34343A 0%, #18181B 50%, #0B0B0C 100%)",
    tone: "noir",
    layout: "headline-bottom",
    reflection: true,
  },
  {
    productId: "brava",
    colorId: "negro-g15",
    headline: "Hechos para los audaces",
    copy: "Siluetas gruesas con bisagra flex de cinco barriles. Carácter que se nota.",
    corner: "Estética urbana",
    frame: { width: "80%", left: "10%", top: "49%", rotate: -3 },
    light: "radial-gradient(80% 60% at 62% 36%, #FFFFFF 0%, #F2F2EE 42%, #E2E2DB 100%)",
    tone: "studio",
    layout: "wordmark-top",
    plinth: true,
  },
  {
    productId: "gata",
    colorId: "negro",
    headline: "Mira más allá de lo ordinario",
    copy: "Cat-eye pronunciado en acetato negro piano. Protección UV400 de fábrica.",
    corner: "Edición Sarabia",
    frame: { width: "92%", left: "4%", top: "36%", rotate: 0 },
    light: "radial-gradient(75% 55% at 50% 44%, #34343A 0%, #18181B 50%, #0B0B0C 100%)",
    tone: "noir",
    layout: "watermark",
  },
  {
    productId: "andes",
    colorId: "negro-g15",
    headline: "Claridad bajo la lluvia",
    copy: "Aviador de doble puente con micas polarizadas: ves nítido aunque el clima cambie.",
    corner: "UV400 · Polarizado",
    frame: { width: "160%", left: "-40%", top: "22%", rotate: 12 },
    light: "radial-gradient(90% 70% at 62% 50%, #FFFFFF 0%, #F2F2EE 42%, #E2E2DB 100%)",
    tone: "studio",
    layout: "headline-bottom",
    droplets: true,
  },
  {
    productId: "tulum",
    colorId: "negro-oro",
    headline: "Visión que define presencia",
    copy: "Acetato y metal en un solo gesto. Edición limitada de la colección 2026.",
    corner: "Edición limitada",
    frame: { width: "118%", left: "4%", top: "42%", rotate: -11 },
    light: "radial-gradient(85% 65% at 68% 52%, #34343A 0%, #18181B 50%, #0B0B0C 100%)",
    tone: "noir",
    layout: "wordmark-top",
  },
];

export function Campaign() {
  return (
    <section aria-label="Campaña" className="py-16 md:py-24">
      <div className="container">
        <Reveal className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <p className="eyebrow">Campaña 2026</p>
            <CharReveal as="h2" text="Ve más allá" className="display mt-4 text-[1.7rem] text-ink sm:text-4xl lg:text-5xl" />
          </div>
          <p className="max-w-sm text-[0.7rem] uppercase leading-[1.8] tracking-[0.14em] text-ink/60">
            Seis armazones reales bajo la luz de estudio. Toca cualquiera para probártelo en vivo con tu cámara.
          </p>
        </Reveal>
      </div>

      {/* Móvil: carrusel deslizable · tablet y escritorio: rejilla de pósters */}
      <div className="container mt-10">
        <div data-fab-avoid className="-mx-5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-2 [scrollbar-width:none] md:mx-0 md:grid md:grid-cols-2 md:overflow-visible md:px-0 lg:grid-cols-3 [&::-webkit-scrollbar]:hidden">
          {POSTERS.map((poster, i) => (
            <PosterTile key={poster.productId} poster={poster} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

function PosterTile({ poster, index }: { poster: Poster; index: number }) {
  const { openTryOn } = useShop();
  const product = products.find((p) => p.id === poster.productId)!;
  const color = product.colors.find((c) => c.id === poster.colorId) ?? product.colors[0];
  const photo = color.photo!;
  const { rotate, ...frameBox } = poster.frame;

  return (
    <motion.button
      type="button"
      onClick={() => openTryOn(product.id, color.id)}
      // transform como cadena: entrada por WAAPI, sin re-rasterizar el póster en cada frame
      initial={{ opacity: 0, transform: "translateY(30px)" }}
      whileInView={{ opacity: 1, transform: "translateY(0px)" }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.8, delay: (index % 3) * 0.08, ease: [0.22, 1, 0.36, 1] }}
      className={clsx("group relative isolate aspect-[4/5] w-[82%] shrink-0 snap-center overflow-hidden rounded-2xl text-left [container-type:inline-size] sm:w-[60%] md:w-auto", poster.tone === "noir" ? "on-dark bg-ink" : "bg-canvas-3 ring-1 ring-inset ring-ink/[0.06]")}
      aria-label={`${poster.headline}. Pruébate ${product.name} en ${color.name}`}
    >
      {/* Luz y textura */}
      <div className="absolute inset-0 -z-10 transition-transform duration-700 group-hover:scale-110" style={{ backgroundImage: poster.light }} />
      <div
        className={clsx(
          "pointer-events-none absolute inset-0",
          poster.tone === "noir" ? "bg-[radial-gradient(120%_90%_at_50%_45%,transparent_55%,rgba(0,0,0,0.4))]" : "bg-[radial-gradient(120%_90%_at_50%_45%,transparent_60%,rgba(11,11,12,0.05))]",
        )}
      />

      {poster.layout === "watermark" && (
        <span className={clsx("display pointer-events-none absolute left-1/2 top-[11%] -translate-x-1/2 select-none whitespace-nowrap text-[13.5cqw]", poster.tone === "noir" ? "text-white/[0.08]" : "text-ink/[0.05]")} aria-hidden>
          Sarabia
        </span>
      )}

      {poster.plinth && (
        <div className="absolute inset-x-[-8%] bottom-0 h-[34%]" aria-hidden>
          <div className="absolute inset-0 bg-[linear-gradient(180deg,#E9E9E4_0%,#DCDCD5_45%,#CFCFC7_100%)] [clip-path:polygon(0_22%,58%_0,100%_14%,100%_100%,0_100%)]" />
          <div className="absolute inset-x-0 top-0 h-[24%] bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.9),transparent)] opacity-80 blur-[1px] [clip-path:polygon(0_92%,58%_0,100%_58%,100%_66%,58%_8%,0_100%)]" />
        </div>
      )}

      {/* Armazón real */}
      <div className="absolute" style={{ ...frameBox, transform: `rotate(${rotate}deg)` }}>
        <div className="transition-transform duration-700 ease-out group-hover:scale-[1.04]">
          <LitFrame
            photo={photo}
            alt=""
            droplets={poster.droplets}
            reflection={poster.reflection}
            sizes="(min-width: 1024px) 55vw, (min-width: 768px) 75vw, 135vw"
          />
        </div>
      </div>

      {/* Tipografía de póster */}
      <PosterType poster={poster} productName={product.name} colorName={color.name} />
    </motion.button>
  );
}

function PosterType({ poster, productName, colorName }: { poster: Poster; productName: string; colorName: string }) {
  const noir = poster.tone === "noir";
  const fg = noir ? { strong: "text-white", soft: "text-white/75", faint: "text-white/60" } : { strong: "text-ink", soft: "text-ink/70", faint: "text-ink/60" };
  const headline = <p className={clsx("display max-w-[86%] text-[clamp(0.95rem,6.2cqw,1.65rem)]", fg.strong)}>{poster.headline}</p>;
  const copy = (
    <p className={clsx("min-w-0 max-w-[58%] text-[clamp(0.625rem,2.1cqw,0.6875rem)] uppercase leading-[1.7] tracking-[0.1em] [@container(max-width:300px)]:hidden", fg.soft)}>{poster.copy}</p>
  );
  const wordmark = <p className={clsx("shrink-0 font-display text-[clamp(1.2rem,8cqw,2.4rem)] uppercase leading-none tracking-[0.05em] [margin-left:-0.06em]", fg.strong)}>Sarabia</p>;
  const model = (
    <span className="flex min-w-0 flex-col items-end gap-1 whitespace-nowrap text-right text-[clamp(0.625rem,2.1cqw,0.6875rem)] font-semibold uppercase tracking-[0.16em]">
      <span className={fg.soft}>{poster.corner}</span>
      <span className={clsx("inline-flex items-center gap-1 transition group-hover:opacity-100", fg.strong)}>
        {productName} <ArrowUpRight className="h-3 w-3" aria-hidden />
      </span>
      <span className={fg.faint}>{colorName}</span>
    </span>
  );

  const slots: Record<Poster["layout"], ReactNode> = {
    "wordmark-bottom": (
      <>
        <div className="absolute left-[6%] top-[6%]">{headline}</div>
        <div className="absolute inset-x-[6%] bottom-[6%] space-y-4">
          {copy}
          <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
            {wordmark}
            {model}
          </div>
        </div>
      </>
    ),
    "headline-bottom": (
      <>
        <div className="absolute left-[6%] top-[6%] max-w-[60%]">
          <p className={clsx("text-[clamp(0.625rem,2.1cqw,0.6875rem)] font-semibold uppercase tracking-[0.2em]", fg.soft)}>Sarabia Eyewear</p>
        </div>
        <div className="absolute inset-x-[6%] bottom-[6%] space-y-3">
          {headline}
          <div className="flex items-end justify-between gap-4">
            {copy}
            {model}
          </div>
        </div>
      </>
    ),
    watermark: (
      <>
        <div className="absolute inset-x-[6%] bottom-[6%] flex items-end justify-between gap-4">
          {copy}
          <div className="flex flex-col items-end gap-3 text-right">
            <p className={clsx("display max-w-[18ch] text-[clamp(0.95rem,6cqw,1.6rem)]", fg.strong)}>{poster.headline}</p>
            {model}
          </div>
        </div>
      </>
    ),
    "wordmark-top": (
      <>
        <div className="absolute left-[6%] top-[6%] space-y-3">
          {wordmark}
          {headline}
        </div>
        <div className="absolute inset-x-[6%] bottom-[6%] flex items-end justify-between gap-4">
          {copy}
          {model}
        </div>
      </>
    ),
  };

  return <div className={clsx("pointer-events-none absolute inset-0")}>{slots[poster.layout]}</div>;
}
