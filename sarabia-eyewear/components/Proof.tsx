"use client";

import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, MessageCircle, ScanFace } from "lucide-react";
import { CharReveal } from "./CharReveal";
import { LitFrame } from "./LitFrame";
import { useShop } from "./ShopProvider";
import { products } from "@/lib/products";
import { currency, whatsappLink } from "@/lib/site";
import { scrollToTarget } from "@/lib/scroll";

const PRODUCT = products.find((p) => p.id === "costa")!;
const COLOR = PRODUCT.colors.find((c) => c.id === "carey-degradado")!;

const STATS = [
  { value: String(products.length), label: "Modelos de autor" },
  { value: "UV400", label: "En cada mica de sol" },
  { value: "30 días", label: "Para ajustar o cambiar" },
  { value: "2–4 días", label: "Envío gratis a todo México" },
];

/**
 * Telón que sube sobre "Inmersión": a la izquierda el Costa recién salido del agua en el estudio
 * cobalto; a la derecha un panel claro con titular que se revela letra por letra y cifras con líneas
 * finas que se trazan solas. Se monta 100svh por encima del final de la escena fija (margen negativo).
 */
export function Proof() {
  const { openTryOn, setIntent } = useShop();
  const reduced = useReducedMotion() ?? false;
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "start start"] });
  const scale = useTransform(scrollYProgress, [0, 1], [reduced ? 1 : 1.18, 1]);
  const lift = useTransform(scrollYProgress, [0, 1], [reduced ? "0%" : "-6%", "0%"]);

  const goToCatalog = () => {
    setIntent("todos");
    scrollToTarget(document.getElementById("catalogo"));
  };

  return (
    <section
      ref={ref}
      aria-labelledby="proof-title"
      className="relative z-10 -mt-[100svh] shadow-[0_-40px_90px_-10px_rgba(0,0,0,0.6)] motion-reduce:mt-0"
    >
      <div className="grid lg:min-h-[100svh] lg:grid-cols-2">
        {/* Estudio cobalto */}
        <div className="stage-blue relative isolate h-[56svh] min-h-[22rem] overflow-hidden lg:h-auto">
          {/* En escritorio el armazón va arriba: se ve en cuanto el panel asoma, continuando la escena del agua */}
          <motion.div className="absolute inset-0 flex items-center justify-center lg:items-start lg:pt-[20svh]" style={{ scale, y: lift }}>
            <div className="w-[80%] max-w-[40rem] [transform:rotate(-6deg)]">
              <LitFrame
                photo={COLOR.photo!}
                alt={`${PRODUCT.name} en ${COLOR.name}, con gotas de agua`}
                droplets
                sizes="(min-width: 1024px) 40vw, 80vw"
                className="[filter:drop-shadow(0_2px_1px_rgba(0,2,10,0.35))_drop-shadow(0_26px_28px_rgba(0,3,15,0.5))]"
              />
            </div>
          </motion.div>
          <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-[linear-gradient(to_top,rgba(3,5,11,0.55),transparent)]" />
          <p className="micro absolute left-5 top-5 sm:left-8 sm:top-8">Recién salido del agua</p>
          <div data-fab-avoid className="absolute inset-x-5 bottom-5 flex items-end justify-between gap-4 sm:inset-x-8 sm:bottom-8">
            <div>
              <p className="font-display text-xl uppercase tracking-[0.06em] text-white">{PRODUCT.name}</p>
              <p className="micro mt-1.5">
                {COLOR.name} · {currency.format(PRODUCT.price)}
              </p>
            </div>
            <button type="button" onClick={() => openTryOn(PRODUCT.id, COLOR.id)} className="btn-glass h-11 shrink-0 px-5 text-[0.8125rem]">
              <ScanFace className="h-4 w-4" aria-hidden /> Pruébatelos
            </button>
          </div>
        </div>

        {/* Panel claro */}
        <div className="on-light relative flex flex-col bg-[#E8EDF9] px-5 pb-16 pt-14 text-night sm:px-10 lg:justify-between lg:px-14 lg:py-[max(4rem,11vh)] xl:px-20">
          <div>
            <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.22em] text-night/55">Sarabia Eyewear · Colección 2026</p>
            <CharReveal
              as="h2"
              id="proof-title"
              text="Diseñados en México. Ajustados a ti."
              // Grotesca ligera (como la referencia): contrasta con la Michroma de la marca y cabe en 2–3 líneas
              className="mt-5 block max-w-[16ch] text-balance text-[clamp(2.25rem,1.5rem+2.6vw,4rem)] font-light leading-[1.02] tracking-[-0.035em] text-night"
            />
            <p className="mt-6 max-w-[44ch] text-[0.9375rem] leading-relaxed text-night/70 sm:text-base">
              Armazones de autor por Jennifer Sarabia, con micas de laboratorio y ajuste garantizado. Elige tu modelo y lo personalizamos
              contigo por WhatsApp.
            </p>
          </div>

          <dl className="mt-12 lg:mt-10">
            {STATS.map((stat, i) => (
              <div key={stat.label} className="relative grid grid-cols-[1fr_auto] items-baseline gap-4 py-4 sm:py-5">
                <dt className="order-2 max-w-[11rem] text-right text-[0.6875rem] font-semibold uppercase leading-[1.5] tracking-[0.16em] text-night/55 sm:max-w-none">{stat.label}</dt>
                <dd className="order-1">
                  <CharReveal text={stat.value} delay={0.2 + i * 0.12} spread={0.5} className="whitespace-nowrap text-[clamp(1.75rem,1.2rem+1.6vw,2.75rem)] font-light tracking-[-0.03em] text-night" />
                </dd>
                <motion.span
                  aria-hidden
                  className="absolute inset-x-0 bottom-0 h-px origin-left bg-night/15"
                  initial={{ transform: "scaleX(0)" }}
                  whileInView={{ transform: "scaleX(1)" }}
                  viewport={{ once: true, margin: "0px 0px -10% 0px" }}
                  transition={{ duration: 1.1, delay: 0.15 + i * 0.12, ease: [0.65, 0, 0.35, 1] }}
                />
              </div>
            ))}
          </dl>

          <div data-fab-avoid className="mt-10 flex flex-wrap gap-3">
            <button type="button" onClick={goToCatalog} className="btn-ink h-12 px-7 text-[0.9375rem]">
              Ver la colección <ArrowRight className="h-4 w-4" aria-hidden />
            </button>
            <a
              href={whatsappLink(`Hola Sarabia Eyewear, me interesa el modelo ${PRODUCT.name} en ${COLOR.name}.`)}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-line-ink h-12 px-6 text-[0.875rem]"
            >
              <MessageCircle className="h-4 w-4 text-[#128C4B]" aria-hidden /> Asesoría por WhatsApp
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
