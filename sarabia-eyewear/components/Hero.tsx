"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Glasses, MonitorSmartphone, ScanFace, Sun } from "lucide-react";
import clsx from "clsx";
import { LitFrame } from "./LitFrame";
import { ProductImage } from "./ProductImage";
import { useShop, type Intent } from "./ShopProvider";
import { materialLabels, products, type Product } from "@/lib/products";
import { GRAIN } from "@/lib/textures";
import { currency, whatsappLink } from "@/lib/site";

type QuickIntent = Exclude<Intent, "todos">;

const intents: Record<QuickIntent, { label: string; icon: typeof Glasses; headline: string; copy: string; ids: string[]; message: string }> = {
  ver: {
    label: "Para Ver",
    icon: Glasses,
    headline: "Precisión en cada línea",
    copy: "Armazones oftálmicos de autor con micas monofocales, antirreflejante y UV. Tu graduación, nuestro diseño.",
    ids: ["mateo", "valeria"],
    message: "Hola Sarabia Eyewear, busco lentes graduados. ¿Me ayudan a elegir armazón?",
  },
  sol: {
    label: "De Sol",
    icon: Sun,
    headline: "Claridad bajo cualquier cielo",
    copy: "Protección UV400 y polarizado en siluetas audaces para ciudad, carretera y playa.",
    ids: ["costa", "roma", "olivia", "gata"],
    message: "Hola Sarabia Eyewear, me interesan sus lentes de sol. ¿Qué modelos me recomiendan?",
  },
  blue: {
    label: "Blue Block",
    icon: MonitorSmartphone,
    headline: "Visión que no se cansa",
    copy: "Micas neutras con filtro de luz azul para jornadas largas frente a pantallas.",
    ids: ["valeria", "mateo"],
    message: "Hola Sarabia Eyewear, quiero unos lentes con micas neutras Blue Block.",
  },
};

const order: QuickIntent[] = ["ver", "sol", "blue"];

export function Hero() {
  const { setIntent, openTryOn } = useShop();
  const [active, setActive] = useState<QuickIntent>("ver");
  const [index, setIndex] = useState(0);

  const config = intents[active];
  const list = useMemo(() => config.ids.map((id) => products.find((p) => p.id === id)!) as Product[], [config]);
  const current = list[index % list.length];
  const color = current.colors.find((c) => c.photo) ?? current.colors[0];

  useEffect(() => {
    const t = setTimeout(() => setIndex((n) => n + 1), 5600);
    return () => clearTimeout(t);
  }, [active, index]);

  const choose = (key: QuickIntent) => {
    setActive(key);
    setIndex(0);
  };

  const goToCatalog = () => {
    setIntent(active);
    document.getElementById("catalogo")?.scrollIntoView({ behavior: "smooth" });
  };

  const step = (delta: number) => setIndex((n) => (n + delta + list.length) % list.length);

  return (
    <section id="top" className="relative pb-12 pt-3 md:pb-16 md:pt-5">
      <div className="container">
        <div className="relative isolate overflow-hidden rounded-[1.5rem] bg-night sm:rounded-[2rem] lg:min-h-[700px]">
          {/* Luz de estudio: foco azul, haz diagonal, viñeta y grano */}
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(85%_65%_at_50%_44%,#2160FF_0%,#0C35A8_22%,#071A55_46%,#02050D_80%)] lg:bg-[radial-gradient(70%_75%_at_64%_46%,#2160FF_0%,#0C35A8_22%,#071A55_46%,#02050D_80%)]" />
          <div className="absolute -top-1/3 left-[48%] -z-10 h-[170%] w-[34%] rotate-[22deg] bg-[linear-gradient(to_bottom,rgba(150,190,255,0.28),transparent_65%)] blur-3xl" />
          <div className="pointer-events-none absolute inset-0 -z-10 opacity-[0.14] mix-blend-overlay" style={{ backgroundImage: GRAIN }} />
          <p className="display pointer-events-none absolute left-1/2 top-[44%] -z-10 -translate-x-1/2 -translate-y-1/2 select-none whitespace-nowrap text-[19vw] text-white/[0.045] lg:left-[62%] lg:text-[12.5rem]" aria-hidden>
            Sarabia
          </p>

          <div className="relative flex flex-col gap-8 p-5 sm:p-10 lg:min-h-[700px] lg:justify-between">
            {/* Fila superior: titular de campaña y selector rápido */}
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-md">
                <p className="micro text-paper/60">Colección 2026 · Diseñada en México</p>
                <AnimatePresence mode="wait">
                  <motion.p
                    key={active}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.35 }}
                    className="display mt-4 text-[clamp(1.45rem,2.6vw,2.4rem)] text-white"
                  >
                    {config.headline}
                  </motion.p>
                </AnimatePresence>
                <AnimatePresence mode="wait">
                  <motion.p
                    key={active}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                    className="mt-4 min-h-[3.5rem] max-w-[22rem] text-[0.7rem] uppercase leading-[1.75] tracking-[0.12em] text-paper/60"
                  >
                    {config.copy}
                  </motion.p>
                </AnimatePresence>
              </div>

              <div className="inline-flex max-w-full self-start rounded-full border border-white/15 bg-white/[0.06] p-1 backdrop-blur-md" role="tablist" aria-label="¿Qué estás buscando?">
                {order.map((key) => {
                  const Icon = intents[key].icon;
                  const selected = key === active;
                  return (
                    <button
                      key={key}
                      role="tab"
                      aria-selected={selected}
                      onClick={() => choose(key)}
                      className={clsx(
                        "relative flex items-center gap-1.5 rounded-full px-2 py-2 text-[0.64rem] font-semibold uppercase tracking-[0.06em] transition-colors min-[380px]:px-2.5 sm:px-3 sm:text-xs sm:tracking-[0.12em]",
                        selected ? "text-night" : "text-paper/70 hover:text-white",
                      )}
                    >
                      {selected && <motion.span layoutId="hero-intent" className="absolute inset-0 rounded-full bg-white" transition={{ type: "spring", bounce: 0.2, duration: 0.5 }} />}
                      <Icon className="relative hidden h-3.5 w-3.5 min-[380px]:block" />
                      <span className="relative whitespace-nowrap">{intents[key].label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Producto: foto real con luz de estudio (en escritorio flota a la derecha del centro) */}
            <div className="pointer-events-none relative mx-auto w-full max-w-[560px] py-6 lg:absolute lg:left-[61%] lg:top-[47%] lg:w-[52%] lg:max-w-none lg:-translate-x-1/2 lg:-translate-y-1/2 lg:py-0">
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${current.id}-${color.id}`}
                  initial={{ opacity: 0, x: 90, rotate: 2 }}
                  animate={{ opacity: 1, x: 0, rotate: -6 }}
                  exit={{ opacity: 0, x: -70, rotate: -12 }}
                  transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                >
                  <motion.div animate={{ y: [0, -12, 0] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}>
                    {color.photo ? (
                      <LitFrame
                        photo={color.photo}
                        alt={`${current.name} en ${color.name}`}
                        priority
                        reflection
                        sizes="(min-width: 1024px) 52vw, 90vw"
                        className="drop-shadow-[0_45px_40px_rgba(0,0,0,0.6)]"
                      />
                    ) : (
                      <ProductImage product={current} color={color} priority className="h-auto w-full" />
                    )}
                  </motion.div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Fila inferior: wordmark y CTAs · modelo en foco */}
            <div className="relative flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h1 className="display text-[clamp(2.4rem,7.4vw,6rem)] leading-none text-white">
                  Sarabia
                  <span className="sr-only"> Eyewear: armazones oftálmicos y de sol de autor</span>
                </h1>
                <p className="micro mt-3 text-volt-ice">Eyewear · By Jennifer Sarabia</p>
                <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3">
                  <button type="button" onClick={goToCatalog} className="btn-volt h-12 px-7 text-sm">
                    Ver modelos <ArrowRight className="h-4 w-4" />
                  </button>
                  <a
                    href={whatsappLink(config.message)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="link-underline text-xs font-semibold uppercase tracking-[0.16em] text-paper"
                  >
                    Asesoría por WhatsApp
                  </a>
                </div>
                <p className="micro mt-6 text-paper/45">
                  Desde {currency.format(Math.min(...products.map((p) => p.price)))} · Envíos rápidos · Garantía de ajuste
                </p>
              </div>

              <div className="flex items-end justify-between gap-6 border-t border-white/10 pt-6 lg:min-w-[300px] lg:flex-col lg:items-end lg:border-0 lg:pt-0 lg:text-right">
                <div>
                  <p className="micro tabular-nums text-paper/50">
                    {String((index % list.length) + 1).padStart(2, "0")} / {String(list.length).padStart(2, "0")}
                  </p>
                  <AnimatePresence mode="wait">
                    <motion.div key={current.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
                      <p className="display mt-2 text-3xl text-white sm:text-4xl">{current.name}</p>
                      <p className="micro mt-2 text-paper/60">
                        {materialLabels[current.material].badge} · {currency.format(current.price)}
                      </p>
                    </motion.div>
                  </AnimatePresence>
                </div>
                <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                  <button type="button" onClick={() => step(-1)} aria-label="Modelo anterior" className="flex h-11 w-11 items-center justify-center rounded-full border border-white/25 text-white transition hover:bg-white hover:text-night">
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                  <button type="button" onClick={() => step(1)} aria-label="Modelo siguiente" className="flex h-11 w-11 items-center justify-center rounded-full border border-white/25 text-white transition hover:bg-white hover:text-night">
                    <ArrowRight className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => openTryOn(current.id, color.id)}
                    className="inline-flex h-11 items-center gap-2 rounded-full bg-white px-4 text-xs font-semibold uppercase tracking-[0.12em] text-night transition hover:bg-volt-ice"
                    aria-label={`Pruébatelos en vivo: ${current.name}`}
                  >
                    <ScanFace className="h-4 w-4" /> Pruébatelos
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Texto vertical de póster */}
          <p className="micro pointer-events-none absolute right-4 top-1/2 hidden -translate-y-1/2 rotate-180 text-paper/40 [writing-mode:vertical-rl] lg:block" aria-hidden>
            Visión que define presencia
          </p>
        </div>
      </div>

      <Marquee />
    </section>
  );
}

function Marquee() {
  const items = [
    "Acetato de alta densidad",
    "Titanio aeroespacial",
    "Antirreflejante premium",
    "Blue Block",
    "Polarizado UV400",
    "Ajuste milimétrico",
    "Envíos rápidos",
    "Micas certificadas",
  ];
  return (
    <div className="mt-10 overflow-hidden border-y border-paper/10 py-4" aria-hidden>
      <div className="flex w-max animate-marquee gap-10 whitespace-nowrap">
        {[...items, ...items].map((t, k) => (
          <span key={k} className="flex items-center gap-10 font-display text-xs uppercase tracking-[0.24em] text-paper/60">
            {t}
            <span className="h-1 w-1 rounded-full bg-volt" />
          </span>
        ))}
      </div>
    </div>
  );
}
