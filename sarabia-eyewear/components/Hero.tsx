"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion, useInView, useMotionValue, useReducedMotion, useScroll, useSpring, useTransform } from "framer-motion";
import { ArrowLeft, ArrowRight, Glasses, MessageCircle, MonitorSmartphone, ScanFace, Sun } from "lucide-react";
import clsx from "clsx";
import { LitFrame } from "./LitFrame";
import { Magnetic } from "./Magnetic";
import { ProductImage } from "./ProductImage";
import { useShop, type Intent } from "./ShopProvider";
import { materialLabels, products, type Colorway, type Product } from "@/lib/products";
import { scrollToTarget } from "@/lib/scroll";
import { GRAIN } from "@/lib/textures";
import { currency, whatsappLink } from "@/lib/site";

type QuickIntent = Exclude<Intent, "todos">;

const intents: Record<QuickIntent, { label: string; icon: typeof Glasses; headline: string; copy: string; ids: string[]; message: string }> = {
  ver: {
    label: "Para ver",
    icon: Glasses,
    headline: "Precisión en cada línea",
    copy: "Armazones oftálmicos de autor con micas monofocales, antirreflejante y UV.",
    ids: ["mateo", "valeria"],
    message: "Hola Sarabia Eyewear, busco lentes graduados. ¿Me ayudan a elegir armazón?",
  },
  sol: {
    label: "De sol",
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

const ORDER: QuickIntent[] = ["ver", "sol", "blue"];
const ROTATE_MS = 6000;
const EASE = [0.22, 1, 0.36, 1] as const;

const productById = (id: string) => products.find((p) => p.id === id)!;
const heroColor = (product: Product) => product.colors.find((c) => c.photo) ?? product.colors[0];
const pad = (n: number) => String(n).padStart(2, "0");

export function Hero() {
  const { setIntent, openTryOn } = useShop();
  const reduced = useReducedMotion() ?? false;
  const sectionRef = useRef<HTMLElement>(null);
  const inView = useInView(sectionRef, { margin: "0px 0px -20% 0px" });
  const [active, setActive] = useState<QuickIntent>("ver");
  const [index, setIndex] = useState(0);
  const [hovering, setHovering] = useState(false);

  const config = intents[active];
  const list = useMemo(() => config.ids.map(productById), [config]);
  const position = index % list.length;
  const current = list[position];
  const next = list[(position + 1) % list.length];
  const color = heroColor(current);

  // Rotación automática: sólo con el hero en pantalla, sin cursor encima y sin "reducir movimiento"
  useEffect(() => {
    if (!inView || hovering || reduced) return;
    const timer = setTimeout(() => setIndex((n) => n + 1), ROTATE_MS);
    return () => clearTimeout(timer);
  }, [active, index, inView, hovering, reduced]);

  // Parallax al salir del hero (transform/opacity: lo compone la GPU)
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end start"] });
  const parallaxY = useTransform(scrollYProgress, [0, 1], [0, reduced ? 0 : 140]);
  const parallaxScale = useTransform(scrollYProgress, [0, 1], [1, reduced ? 1 : 0.9]);
  const parallaxOpacity = useTransform(scrollYProgress, [0, 0.9], [1, reduced ? 1 : 0.15]);

  // Inclinación 3D con el cursor (sólo mouse): resortes que se detienen al quedar quietos
  const tiltX = useMotionValue(0);
  const tiltY = useMotionValue(0);
  const rotateX = useSpring(tiltX, { stiffness: 110, damping: 18, mass: 0.6 });
  const rotateY = useSpring(tiltY, { stiffness: 110, damping: 18, mass: 0.6 });

  const choose = (key: QuickIntent) => {
    setActive(key);
    setIndex(0);
  };
  const step = (delta: number) => setIndex((n) => (((n + delta) % list.length) + list.length) % list.length);
  const goToCatalog = () => {
    setIntent(active);
    scrollToTarget(document.getElementById("catalogo"));
  };

  return (
    <section
      id="top"
      ref={sectionRef}
      className="relative sm:pb-4 sm:pt-4 lg:pt-5"
      onPointerMove={(e) => {
        if (e.pointerType !== "mouse" || reduced) return;
        tiltY.set((e.clientX / window.innerWidth - 0.5) * 9);
        tiltX.set(-(e.clientY / window.innerHeight - 0.5) * 6);
      }}
      onPointerLeave={() => {
        tiltX.set(0);
        tiltY.set(0);
      }}
    >
      <div className="sm:mx-auto sm:max-w-[1360px] sm:px-6 lg:px-8">
        {/* Móvil: panel a sangre con la altura exacta de la pantalla bajo el header (svh no cambia al
            ocultarse la barra del navegador, así el CTA nunca queda cortado ni salta al hacer scroll). */}
        <div className="relative isolate flex min-h-[34rem] flex-col overflow-hidden [contain:paint] max-sm:[height:calc(100svh-var(--chrome-h))] max-sm:max-h-[56rem] sm:min-h-[640px] sm:rounded-[2rem] sm:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.07),inset_0_1px_0_rgba(255,255,255,0.1)] lg:min-h-[min(780px,calc(100svh-var(--chrome-h)-2.5rem))]">
          <Atmosphere />

          <div className="relative z-10 flex flex-1 flex-col px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-6 sm:px-10 sm:pb-10 sm:pt-10 lg:px-12 lg:pb-11 lg:pt-11">
            {/* Titular, texto y selector */}
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between lg:gap-10">
              <div className="max-w-[36rem]">
                <p className="eyebrow">Colección 2026 · Diseñada en México</p>
                <Stack active={active} className="mt-3 sm:mt-4">
                  {(key) => (
                    <p className="display max-w-[16ch] text-[clamp(1.375rem,1.05rem+1.45vw,2.5rem)] text-white [letter-spacing:0.02em]">{intents[key].headline}</p>
                  )}
                </Stack>
                <Stack active={active} className="mt-3 max-w-[34ch] max-sm:[@media(max-height:719px)]:hidden">
                  {(key) => <p className="text-[clamp(0.9375rem,0.9rem+0.15vw,1.0625rem)] leading-[1.55] text-paper/75">{intents[key].copy}</p>}
                </Stack>
              </div>

              <div role="tablist" aria-label="¿Qué estás buscando?" className="glass grid h-12 w-full shrink-0 grid-cols-3 rounded-full p-1 sm:inline-grid sm:w-auto">
                {ORDER.map((key) => {
                  const Icon = intents[key].icon;
                  const selected = key === active;
                  return (
                    <button
                      key={key}
                      role="tab"
                      aria-selected={selected}
                      onClick={() => choose(key)}
                      className={clsx(
                        "relative flex h-10 items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-2 text-[0.6875rem] font-semibold uppercase tracking-[0.12em] transition-colors duration-300 min-[380px]:text-[0.72rem] sm:px-4 sm:tracking-[0.14em]",
                        selected ? "text-night" : "text-paper/75 hover:text-white",
                      )}
                    >
                      {selected && (
                        <motion.span
                          layoutId="hero-intent"
                          className="absolute inset-0 rounded-full bg-ice shadow-[inset_0_1px_0_#fff,0_1px_2px_rgba(0,0,0,0.35),0_6px_16px_-6px_rgba(134,168,255,0.45)]"
                          transition={{ type: "spring", stiffness: 420, damping: 34 }}
                        />
                      )}
                      <Icon className="relative hidden h-3.5 w-3.5 shrink-0 min-[400px]:block" aria-hidden />
                      <span className="relative">{intents[key].label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Escenario del producto: tamaño fijo, la foto cambia con crossfade sin mover el layout */}
            <div
              className="relative my-3 min-h-[8.5rem] flex-1 touch-pan-y [container-type:size] [perspective:1200px] sm:my-6 sm:h-[22rem] sm:flex-none lg:absolute lg:left-[61%] lg:top-[48%] lg:my-0 lg:aspect-[16/8] lg:h-auto lg:w-[48%] lg:-translate-x-1/2 lg:-translate-y-1/2"
              onMouseEnter={() => setHovering(true)}
              onMouseLeave={() => setHovering(false)}
            >
              <motion.div className="absolute inset-0" style={{ y: parallaxY, scale: parallaxScale, opacity: parallaxOpacity }}>
                <motion.div className="absolute inset-0 [transform-style:preserve-3d]" style={reduced ? undefined : { rotateX, rotateY }}>
                  <AnimatePresence initial={false}>
                    {[current, next].map((product) => (
                      <StageItem
                        key={product.id}
                        product={product}
                        color={heroColor(product)}
                        visible={product.id === current.id}
                        priority={product.id === list[0].id && active === "ver"}
                      />
                    ))}
                  </AnimatePresence>
                </motion.div>
              </motion.div>

              {/* Deslizar para cambiar de modelo (móvil) */}
              <motion.div
                className="absolute inset-0 touch-pan-y lg:hidden"
                onPanEnd={(_, info) => {
                  if (Math.abs(info.offset.x) > 48 && Math.abs(info.offset.x) > Math.abs(info.offset.y) * 1.2) step(info.offset.x < 0 ? 1 : -1);
                }}
                aria-hidden
              />
            </div>

            {/* Móvil y tablet: modelo en foco en una sola línea + CTAs */}
            <div className="relative lg:hidden">
              <div className="flex h-11 items-center justify-between gap-3">
                <p className="micro min-w-0 truncate">
                  <span className="tabular-nums text-paper/50">
                    {pad(position + 1)}/{pad(list.length)}
                  </span>
                  <span className="text-white"> · {current.name}</span> · {currency.format(current.price)}
                </p>
                <div className="flex shrink-0 gap-2">
                  <IconButton label="Modelo anterior" onClick={() => step(-1)}>
                    <ArrowLeft className="h-4 w-4" />
                  </IconButton>
                  <IconButton label="Modelo siguiente" onClick={() => step(1)}>
                    <ArrowRight className="h-4 w-4" />
                  </IconButton>
                </div>
              </div>
            </div>

            {/* Wordmark y CTAs · modelo en foco (escritorio) */}
            <div className="relative mt-3 flex flex-col gap-5 sm:mt-6 lg:mt-auto lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h1 className="font-display text-[clamp(2.75rem,1.7rem+5vw,6.25rem)] uppercase leading-[0.92] tracking-[0.05em] text-white [margin-left:-0.06em]">
                  Sarabia
                  <span className="sr-only"> Eyewear: armazones oftálmicos y de sol de autor</span>
                </h1>
                <p className="eyebrow mt-3 text-volt-ice">Eyewear · By Jennifer Sarabia</p>
                <div className="mt-5 grid grid-cols-[1fr_auto] gap-3 sm:flex sm:items-center lg:mt-7">
                  <Magnetic className="min-w-0">
                    <button type="button" onClick={goToCatalog} className="btn-primary h-12 w-full px-7 text-[0.9375rem] sm:w-auto">
                      Ver modelos <ArrowRight className="h-4 w-4" aria-hidden />
                    </button>
                  </Magnetic>
                  <button type="button" onClick={() => openTryOn(current.id, color.id)} className="btn-glass h-12 px-4 text-[0.8125rem] lg:hidden">
                    <ScanFace className="h-4 w-4" aria-hidden /> Pruébatelos
                  </button>
                  <a href={whatsappLink(config.message)} target="_blank" rel="noopener noreferrer" className="btn-glass hidden h-12 px-6 text-[0.8125rem] lg:inline-flex">
                    <MessageCircle className="h-4 w-4 text-[#25D366]" aria-hidden /> Asesoría por WhatsApp
                  </a>
                </div>
                <p className="micro mt-6 hidden lg:block">
                  Desde {currency.format(Math.min(...products.map((p) => p.price)))} · Envíos rápidos · Garantía de ajuste
                </p>
              </div>

              <div className="hidden min-w-[300px] flex-col items-end text-right lg:flex">
                <p className="micro tabular-nums">
                  {pad(position + 1)} / {pad(list.length)}
                </p>
                <div className="grid">
                  {Array.from(new Set(ORDER.flatMap((k) => intents[k].ids))).map((id) => {
                    const product = productById(id);
                    const shown = id === current.id;
                    return (
                      <motion.div
                        key={id}
                        aria-hidden={!shown}
                        className="[grid-area:1/1]"
                        initial={false}
                        animate={shown ? { opacity: 1, transform: "translateY(0px)" } : { opacity: 0, transform: "translateY(8px)" }}
                        transition={{ duration: 0.45, ease: EASE }}
                      >
                        <p className="mt-2 font-display text-[clamp(1.125rem,0.95rem+0.6vw,1.5rem)] uppercase tracking-[0.06em] text-white">{product.name}</p>
                        <p className="micro mt-1.5">
                          {materialLabels[product.material].badge} · {currency.format(product.price)}
                        </p>
                      </motion.div>
                    );
                  })}
                </div>
                <div className="mt-5 flex items-center gap-2">
                  <IconButton label="Modelo anterior" onClick={() => step(-1)} large>
                    <ArrowLeft className="h-4 w-4" />
                  </IconButton>
                  <IconButton label="Modelo siguiente" onClick={() => step(1)} large>
                    <ArrowRight className="h-4 w-4" />
                  </IconButton>
                  <button type="button" onClick={() => openTryOn(current.id, color.id)} className="btn-glass h-11 px-5 text-[0.8125rem]" aria-label={`Pruébatelos en vivo: ${current.name}`}>
                    <ScanFace className="h-4 w-4" aria-hidden /> Pruébatelos
                  </button>
                </div>
              </div>
            </div>
          </div>

          <p className="micro pointer-events-none absolute right-5 top-1/2 z-10 hidden -translate-y-1/2 rotate-180 text-paper/45 [writing-mode:vertical-rl] lg:block" aria-hidden>
            Visión que define presencia
          </p>
        </div>
      </div>

      <Marquee />
    </section>
  );
}

/** Un armazón del escenario: crossfade (opacity/transform por WAAPI), levitación CSS y sombra de contacto. */
function StageItem({ product, color, visible, priority }: { product: Product; color: Colorway; visible: boolean; priority: boolean }) {
  const photo = color.photo;
  const ratio = photo ? photo.width / photo.height : 3;
  return (
    <motion.div
      aria-hidden={!visible}
      className={clsx("absolute inset-0 flex items-center justify-center", !visible && "pointer-events-none")}
      initial={{ opacity: 0, transform: "scale(0.96)" }}
      animate={visible ? { opacity: 1, transform: "scale(1)" } : { opacity: 0, transform: "scale(0.96)" }}
      exit={{ opacity: 0, transform: "scale(1.03)" }}
      transition={{ duration: 0.8, ease: EASE }}
    >
      {/* Ancho limitado por el alto del escenario (container query): nunca se sale ni se deforma */}
      <div className="relative" style={{ width: `min(92cqw, ${(ratio * 76).toFixed(1)}cqh)` }}>
        <div
          aria-hidden
          className="absolute -bottom-[18%] left-[14%] right-[14%] h-[16%] rounded-[50%] bg-[radial-gradient(closest-side,rgba(1,3,12,0.72),rgba(1,3,12,0.3)_60%,transparent)] motion-safe:animate-float-shadow"
        />
        <div className="motion-safe:animate-float [will-change:transform]">
          {/* Giro estático dentro de la capa animada: se rasteriza una sola vez */}
          <div className="[transform:rotate(-4deg)]">
            {photo ? (
              <LitFrame
                photo={photo}
                alt={visible ? `${product.name} en ${color.name}` : ""}
                priority={priority}
                fetchPriority={priority ? "high" : "auto"}
                quality={90}
                sizes="(min-width: 1024px) min(48vw, 680px), (min-width: 640px) 560px, 92vw"
                className="[filter:drop-shadow(0_2px_1px_rgba(0,2,10,0.35))_drop-shadow(0_22px_24px_rgba(0,3,15,0.45))]"
              />
            ) : (
              <ProductImage product={product} color={color} priority={priority} className="h-auto w-full" />
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/** Textos de cada pestaña apilados en la misma celda: la altura es la del más largo (CLS 0). */
function Stack({ active, className, children }: { active: QuickIntent; className?: string; children: (key: QuickIntent) => ReactNode }) {
  return (
    <div className={clsx("grid", className)}>
      {ORDER.map((key) => (
        <motion.div
          key={key}
          aria-hidden={key !== active}
          className="[grid-area:1/1]"
          initial={false}
          animate={key === active ? { opacity: 1, transform: "translateY(0px)" } : { opacity: 0, transform: "translateY(10px)" }}
          transition={{ duration: 0.5, ease: EASE }}
        >
          {children(key)}
        </motion.div>
      ))}
    </div>
  );
}

function IconButton({ label, onClick, large, children }: { label: string; onClick: () => void; large?: boolean; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={clsx(
        "glass flex items-center justify-center rounded-full text-white transition-colors duration-300 hover:bg-white hover:text-night active:scale-95",
        large ? "h-11 w-11" : "h-10 w-10",
      )}
    >
      {children}
    </button>
  );
}

/** Iluminación de estudio en capas; la luz principal deriva muy lento con transform (GPU). */
function Atmosphere() {
  return (
    <div aria-hidden className="atmos pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div className="atmos-key motion-safe:animate-drift [will-change:transform]" />
      <div className="absolute inset-0 bg-[linear-gradient(112deg,transparent_38%,rgba(134,168,255,0.07)_48%,transparent_60%)]" />
      <div className="absolute inset-0 opacity-[0.1] mix-blend-overlay" style={{ backgroundImage: GRAIN }} />
      <span className="display absolute left-[58%] top-[44%] hidden -translate-x-1/2 -translate-y-1/2 select-none whitespace-nowrap text-[12.5rem] leading-none text-white/[0.035] lg:block">
        Sarabia
      </span>
    </div>
  );
}

function Marquee() {
  const from = `Desde ${currency.format(Math.min(...products.map((p) => p.price)))}`;
  const items = ["Acetato de alta densidad", "Titanio aeroespacial", "Antirreflejante premium", "Blue Block", "Polarizado UV400", "Ajuste milimétrico", "Envíos rápidos", from];
  return (
    <div className="mt-6 overflow-hidden border-y border-white/[0.07] py-4 sm:mt-8" aria-hidden>
      <div className="flex w-max gap-10 whitespace-nowrap motion-safe:animate-marquee">
        {[...items, ...items].map((t, k) => (
          <span key={k} className="flex items-center gap-10 font-display text-[0.6875rem] uppercase tracking-[0.24em] text-paper/60">
            {t}
            <span className="h-1 w-1 rounded-full bg-volt-soft" />
          </span>
        ))}
      </div>
    </div>
  );
}
