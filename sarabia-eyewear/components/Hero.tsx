"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Glasses, MessageCircle, MonitorSmartphone, Sun } from "lucide-react";
import clsx from "clsx";
import { FrameIllustration } from "./FrameIllustration";
import { useShop, type Intent } from "./ShopProvider";
import { products, type Product } from "@/lib/products";
import { currency, whatsappLink } from "@/lib/site";

type QuickIntent = Exclude<Intent, "todos">;

const intents: Record<QuickIntent, { label: string; icon: typeof Glasses; word: string; copy: string; bg: string; ids: string[]; message: string }> = {
  ver: {
    label: "Para Ver",
    icon: Glasses,
    word: "con claridad.",
    copy: "Armazones oftálmicos de autor con micas monofocales, antirreflejante y UV. Tu graduación, nuestro diseño.",
    bg: "#E6E2D9",
    ids: ["valeria", "roma", "ines", "mateo"],
    message: "Hola Sarabia Eyewear, busco lentes graduados. ¿Me ayudan a elegir armazón?",
  },
  sol: {
    label: "De Sol",
    icon: Sun,
    word: "sin filtros.",
    copy: "Lentes de sol con protección UV400 y polarizado. Siluetas audaces para ciudad, carretera y playa.",
    bg: "#DCE1D5",
    ids: ["costa", "tulum", "lumen", "brava"],
    message: "Hola Sarabia Eyewear, me interesan sus lentes de sol. ¿Qué modelos me recomiendan?",
  },
  blue: {
    label: "Blue Block",
    icon: MonitorSmartphone,
    word: "sin cansancio.",
    copy: "Micas neutras con filtro de luz azul para jornadas largas frente a pantallas. Sin graduación, sin pretextos.",
    bg: "#DFE3EA",
    ids: ["roma", "valeria", "mateo", "ines"],
    message: "Hola Sarabia Eyewear, quiero unos lentes con micas neutras Blue Block.",
  },
};

const order: QuickIntent[] = ["ver", "sol", "blue"];

export function Hero() {
  const { setIntent } = useShop();
  const [active, setActive] = useState<QuickIntent>("ver");
  const [featured, setFeatured] = useState(0);

  const config = intents[active];
  const list = useMemo(() => config.ids.map((id) => products.find((p) => p.id === id)!) as Product[], [config]);
  const current = list[featured % list.length];
  const color = current.colors[Math.floor(featured / list.length) % current.colors.length];

  useEffect(() => {
    const t = setInterval(() => setFeatured((n) => n + 1), 4200);
    return () => clearInterval(t);
  }, [active, featured]);

  const choose = (key: QuickIntent) => {
    setActive(key);
    setFeatured(0);
  };

  const goToCatalog = () => {
    setIntent(active);
    document.getElementById("catalogo")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section id="top" className="relative overflow-hidden">
      <div className="container grid items-center gap-10 pb-14 pt-8 md:pt-14 lg:grid-cols-12 lg:gap-8 lg:pb-20">
        <div className="lg:col-span-6">
          <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="eyebrow">
            Diseño de autor · Hecho para México
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="mt-5 text-[3.1rem] font-semibold leading-[0.92] tracking-tightest sm:text-7xl xl:text-[5.6rem]"
          >
            Mira el mundo
            <br />
            <span className="relative inline-block h-[1.02em] overflow-hidden align-bottom">
              <AnimatePresence mode="wait">
                <motion.span
                  key={config.word}
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  exit={{ y: "-100%" }}
                  transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                  className="block whitespace-nowrap text-ink-muted"
                >
                  {config.word}
                </motion.span>
              </AnimatePresence>
            </span>
          </motion.h1>

          {/* Selector rápido */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mt-8 inline-flex w-full max-w-md rounded-full bg-bone-warm p-1 sm:w-auto"
            role="tablist"
            aria-label="¿Qué estás buscando?"
          >
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
                    "relative flex flex-1 items-center justify-center gap-2 rounded-full px-3 py-3 text-sm font-semibold transition-colors sm:flex-none sm:px-5",
                    selected ? "text-bone" : "text-ink-soft hover:text-ink",
                  )}
                >
                  {selected && <motion.span layoutId="hero-intent" className="absolute inset-0 rounded-full bg-ink" transition={{ type: "spring", bounce: 0.2, duration: 0.5 }} />}
                  <Icon className="relative h-4 w-4" />
                  <span className="relative whitespace-nowrap">{intents[key].label}</span>
                </button>
              );
            })}
          </motion.div>

          <AnimatePresence mode="wait">
            <motion.p
              key={active}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
              className="mt-6 min-h-[5.25rem] max-w-md text-lg leading-relaxed text-ink-soft sm:min-h-[3.5rem]"
            >
              {config.copy}
            </motion.p>
          </AnimatePresence>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button type="button" onClick={goToCatalog} className="btn-primary h-14 px-8 text-base">
              Ver modelos <ArrowRight className="h-4 w-4" />
            </button>
            <a href={whatsappLink(config.message)} target="_blank" rel="noopener noreferrer" className="btn-ghost h-14 px-7 text-base">
              <MessageCircle className="h-4 w-4" /> Asesoría por WhatsApp
            </a>
          </div>

          <p className="mt-6 text-sm text-ink-muted">
            Desde <strong className="font-semibold text-ink">{currency.format(Math.min(...products.map((p) => p.price)))}</strong> · Envíos rápidos · Garantía de ajuste
          </p>
        </div>

        {/* Preview flotante */}
        <div className="relative lg:col-span-6">
          <motion.div
            className="relative aspect-[4/4.2] overflow-hidden rounded-[2rem] sm:aspect-[4/3.5]"
            animate={{ backgroundColor: config.bg }}
            transition={{ duration: 0.8 }}
          >
            <AnimatePresence mode="wait">
              <motion.span
                key={current.id}
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
                transition={{ duration: 0.6 }}
                className="pointer-events-none absolute -left-3 top-4 select-none text-[7rem] font-semibold leading-none tracking-tightest text-white/50 sm:text-[10rem]"
              >
                {current.name}
              </motion.span>
            </AnimatePresence>

            <AnimatePresence mode="wait">
              <motion.div
                key={`${active}-${current.id}-${color.id}`}
                initial={{ opacity: 0, x: 60, rotate: -6 }}
                animate={{ opacity: 1, x: 0, rotate: 0 }}
                exit={{ opacity: 0, x: -60, rotate: 6 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="absolute inset-0 flex items-center justify-center px-8 pb-28 pt-10"
              >
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                  className="w-[86%] drop-shadow-[0_30px_30px_rgba(21,21,20,0.25)]"
                >
                  <FrameIllustration
                    shape={current.shape}
                    material={current.material}
                    color={active === "blue" ? { ...color, lens: undefined } : color}
                    title={`${current.name} en ${color.name}`}
                    className="h-auto w-full"
                  />
                </motion.div>
              </motion.div>
            </AnimatePresence>

            {active === "blue" && (
              <span className="absolute right-5 top-5 inline-flex items-center gap-1.5 rounded-full bg-[#2F5C8A] px-3 py-1.5 text-xs font-semibold text-white">
                <MonitorSmartphone className="h-3.5 w-3.5" /> Filtro de luz azul
              </span>
            )}

            {/* Mini tarjetas flotantes para cambiar de modelo */}
            <div className="absolute inset-x-3 bottom-3 grid grid-cols-4 gap-2 sm:inset-x-5 sm:bottom-5">
              {list.map((p, k) => {
                const selected = p.id === current.id;
                return (
                  <motion.button
                    key={`${active}-${p.id}`}
                    type="button"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.06 * k }}
                    whileHover={{ y: -4 }}
                    onClick={() => setFeatured(k)}
                    aria-label={`Ver ${p.name}`}
                    aria-pressed={selected}
                    className={clsx(
                      "flex min-w-0 flex-col rounded-2xl p-2 text-left backdrop-blur transition-colors sm:p-2.5",
                      selected ? "bg-white shadow-card" : "bg-white/55 hover:bg-white/80",
                    )}
                  >
                    <FrameIllustration
                      shape={p.shape}
                      material={p.material}
                      color={active === "blue" ? { ...p.colors[0], lens: undefined } : p.colors[0]}
                      className="h-7 w-full sm:h-9"
                    />
                    <span className="mt-1.5 truncate text-[0.7rem] font-semibold sm:text-xs">{p.name}</span>
                    <span className="hidden text-[0.7rem] text-ink-muted sm:block">{currency.format(p.price)}</span>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
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
    <div className="overflow-hidden border-y border-ink/10 bg-bone-warm py-4" aria-hidden>
      <div className="flex w-max animate-marquee gap-10 whitespace-nowrap">
        {[...items, ...items].map((t, k) => (
          <span key={k} className="flex items-center gap-10 text-sm font-medium uppercase tracking-[0.18em] text-ink-soft">
            {t}
            <span className="h-1.5 w-1.5 rounded-full bg-sand" />
          </span>
        ))}
      </div>
    </div>
  );
}
