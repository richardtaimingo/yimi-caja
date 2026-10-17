"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Glasses, MonitorSmartphone, ScanFace, Sun } from "lucide-react";
import clsx from "clsx";
import { ProductImage } from "./ProductImage";
import { useShop, type Intent } from "./ShopProvider";
import { materialLabels, products, type Product } from "@/lib/products";
import { media } from "@/lib/media";
import { currency, whatsappLink } from "@/lib/site";

type QuickIntent = Exclude<Intent, "todos">;

const intents: Record<QuickIntent, { label: string; icon: typeof Glasses; copy: string; ids: string[]; message: string }> = {
  ver: {
    label: "Para Ver",
    icon: Glasses,
    copy: "Armazones oftálmicos de autor con micas monofocales, antirreflejante y UV. Tu graduación, nuestro diseño.",
    ids: ["mateo", "valeria"],
    message: "Hola Sarabia Eyewear, busco lentes graduados. ¿Me ayudan a elegir armazón?",
  },
  sol: {
    label: "De Sol",
    icon: Sun,
    copy: "Protección UV400 y polarizado en siluetas audaces para ciudad, carretera y playa.",
    ids: ["costa", "roma", "olivia", "gata"],
    message: "Hola Sarabia Eyewear, me interesan sus lentes de sol. ¿Qué modelos me recomiendan?",
  },
  blue: {
    label: "Blue Block",
    icon: MonitorSmartphone,
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
    const t = setTimeout(() => setIndex((n) => n + 1), 5200);
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

  const cutout = (
    <AnimatePresence mode="wait">
      <motion.div
        key={`${current.id}-${color.id}`}
        initial={{ opacity: 0, x: 80, rotate: 4 }}
        animate={{ opacity: 1, x: 0, rotate: -7 }}
        exit={{ opacity: 0, x: -60, rotate: -14 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      >
        <motion.div animate={{ y: [0, -12, 0] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}>
          <ProductImage
            product={current}
            color={color}
            priority
            sizes="(min-width: 768px) 46vw, 90vw"
            className="h-auto w-full drop-shadow-[0_40px_40px_rgba(0,0,0,0.55)]"
          />
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );

  return (
    <section id="top" className="relative pb-14 pt-3 md:pb-20 md:pt-6 lg:pt-6">
      <div className="container">
        <div className="relative overflow-hidden rounded-[1.5rem] bg-black sm:rounded-[2rem] lg:grid lg:min-h-[620px] lg:grid-cols-[1.7fr_1fr]">
          {/* Panel oscuro con fotografía y wordmark (abajo deja aire para el armazón que cruza en móvil/tablet) */}
          <div className="relative flex min-h-[480px] flex-col justify-between overflow-hidden p-5 pb-24 sm:min-h-[540px] sm:p-10 sm:pb-36 lg:pb-10">
            {media.hero ? (
              <Image src={media.hero.src} alt={media.hero.alt} fill priority sizes="(min-width: 768px) 62vw, 100vw" className="object-cover opacity-75" />
            ) : (
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,#3a2a30,transparent_60%)]" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/45 to-black/20" />

            <div className="relative flex items-center justify-between gap-4">
              <p className="eyebrow text-paper/70">Colección Otoño · 2026</p>
              <p className="hidden text-xs text-paper/50 sm:block">Diseñada en México</p>
            </div>

            <div className="relative">
              <h1 className="display text-[clamp(4.6rem,12.5vw,11.5rem)] lowercase text-paper">
                sarabia
                <span className="sr-only"> Eyewear: armazones oftálmicos y de sol de autor</span>
              </h1>
              <div className="mt-5 grid max-w-md gap-5">
                <p className="font-display text-xl italic text-paper sm:text-2xl">Mira el mundo con claridad.</p>
                <AnimatePresence mode="wait">
                  <motion.p
                    key={active}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.3 }}
                    className="min-h-[3rem] text-sm leading-relaxed text-paper/70"
                  >
                    {config.copy}
                  </motion.p>
                </AnimatePresence>
                <div className="flex flex-wrap items-center gap-3">
                  <button type="button" onClick={goToCatalog} className="btn-sun h-12 px-7 text-sm">
                    Ver modelos <ArrowRight className="h-4 w-4" />
                  </button>
                  <a
                    href={whatsappLink(config.message)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="link-underline text-sm font-semibold text-paper"
                  >
                    Asesoría por WhatsApp
                  </a>
                </div>
              </div>
              <p className="mt-8 text-xs text-paper/45">
                Desde {currency.format(Math.min(...products.map((p) => p.price)))} · Envíos rápidos · Garantía de ajuste
              </p>
            </div>
          </div>

          {/* Bloque amarillo */}
          <div className="relative flex min-h-[340px] flex-col justify-between gap-6 bg-sun p-5 text-night sm:p-8">
            <div className="inline-flex max-w-full self-start rounded-full bg-night/10 p-1" role="tablist" aria-label="¿Qué estás buscando?">
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
                      "relative flex items-center gap-1.5 rounded-full px-2.5 py-2 text-xs font-semibold transition-colors min-[380px]:px-3 sm:text-sm",
                      selected ? "text-sun" : "text-night/70 hover:text-night",
                    )}
                  >
                    {selected && <motion.span layoutId="hero-intent" className="absolute inset-0 rounded-full bg-night" transition={{ type: "spring", bounce: 0.2, duration: 0.5 }} />}
                    <Icon className="relative h-3.5 w-3.5" />
                    <span className="relative whitespace-nowrap">{intents[key].label}</span>
                  </button>
                );
              })}
            </div>

            {/* En móvil el armazón cruza el borde entre el panel oscuro y el amarillo */}
            <div className="pointer-events-none relative order-first -mt-24 w-[90%] max-w-[460px] self-center sm:-mt-36 lg:hidden">{cutout}</div>

            <div className="mt-auto flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-semibold tabular-nums text-night/60">
                  {String((index % list.length) + 1).padStart(2, "0")} / {String(list.length).padStart(2, "0")}
                </p>
                <AnimatePresence mode="wait">
                  <motion.div key={current.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
                    <p className="display mt-1 text-5xl">{current.name}</p>
                    <p className="mt-2 text-sm font-medium text-night/70">
                      {materialLabels[current.material].badge} · {currency.format(current.price)}
                    </p>
                  </motion.div>
                </AnimatePresence>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <button type="button" onClick={() => step(-1)} aria-label="Modelo anterior" className="flex h-10 w-10 items-center justify-center rounded-full border border-night/25 transition hover:bg-night hover:text-sun">
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                  <button type="button" onClick={() => step(1)} aria-label="Modelo siguiente" className="flex h-10 w-10 items-center justify-center rounded-full border border-night/25 transition hover:bg-night hover:text-sun">
                    <ArrowRight className="h-4 w-4" />
                  </button>
                  {/* En móvil y tablet va junto a las flechas para no chocar con el botón flotante de WhatsApp */}
                  <button
                    type="button"
                    onClick={() => openTryOn(current.id, color.id)}
                    className="ml-1 inline-flex h-10 items-center gap-2 rounded-full bg-night px-4 text-sm font-semibold text-sun transition hover:bg-night/85 lg:hidden"
                  >
                    <ScanFace className="h-4 w-4" /> Pruébatelos
                  </button>
                </div>
              </div>
              <button
                type="button"
                onClick={() => openTryOn(current.id, color.id)}
                className="hidden h-14 w-14 shrink-0 flex-col items-center justify-center rounded-2xl bg-paper/75 text-night shadow-card backdrop-blur transition hover:bg-paper lg:flex"
                aria-label={`Pruébatelos en vivo: ${current.name}`}
                title="Pruébatelos en vivo"
              >
                <ScanFace className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* En escritorio el armazón cruza la unión de ambos paneles */}
          <div className="pointer-events-none absolute left-[63%] top-[46%] hidden w-[44%] -translate-x-1/2 -translate-y-1/2 lg:block">{cutout}</div>
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
          <span key={k} className="flex items-center gap-10 font-display text-xl italic text-paper/70">
            {t}
            <span className="h-1.5 w-1.5 rounded-full bg-sun" />
          </span>
        ))}
      </div>
    </div>
  );
}
