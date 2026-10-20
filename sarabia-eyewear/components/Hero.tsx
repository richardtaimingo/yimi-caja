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
      // El hero sube por detrás del encabezado (transparente arriba): el estudio cubre la pantalla de borde a borde
      className="relative -mt-[var(--chrome-h)]"
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
      {/* A sangre y exactamente del alto de la pantalla (svh no cambia al ocultarse la barra del navegador) */}
      <div className="relative isolate flex h-[100svh] min-h-[34rem] flex-col overflow-hidden [contain:paint] max-sm:max-h-[60rem] lg:min-h-[36rem] short:min-h-0">
        <Atmosphere />

        <div className="relative z-10 mx-auto flex w-full max-w-[1360px] flex-1 flex-col px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-[calc(var(--chrome-h)+1.25rem)] sm:px-6 sm:pt-[calc(var(--chrome-h)+2rem)] lg:px-8 lg:pb-0 lg:pt-[calc(var(--chrome-h)+2.5rem)] short:pb-3 short:pt-[calc(var(--chrome-h)+0.5rem)]">
          {/* Columna editorial: en escritorio a la izquierda, centrada en el alto disponible */}
          <div className="relative z-10 flex flex-col lg:w-[44%] lg:flex-1 lg:justify-center lg:pb-[4.5rem] short:w-[52%]">
            <p className="eyebrow short:hidden">Colección 2026 · Diseñada en México</p>
            <h1 className="mt-3 sm:mt-4 short:mt-0">
              <span className="sr-only">Sarabia Eyewear: </span>
              <Stack active={active}>
                {(key) => (
                  <span className="headline block max-w-[13ch] text-[clamp(2.375rem,1.4rem+3.6vw,5rem)] text-ink short:text-[2rem]">{intents[key].headline}.</span>
                )}
              </Stack>
            </h1>
            <Stack active={active} className="mt-4 max-w-[38ch] max-sm:[@media(max-height:719px)]:hidden short:hidden lg:mt-6">
              {(key) => <p className="text-[clamp(0.9375rem,0.9rem+0.2vw,1.0625rem)] leading-relaxed text-ink/65">{intents[key].copy}</p>}
            </Stack>
            {/* CTAs (escritorio y horizontal; en móvil van al pie) */}
            <div className="mt-8 hidden items-center gap-3 lg:flex short:mt-4 short:flex">
              <Magnetic>
                <button type="button" onClick={goToCatalog} className="btn-primary h-12 px-7 text-[0.9375rem]">
                  Ver modelos <ArrowRight className="h-4 w-4" aria-hidden />
                </button>
              </Magnetic>
              <button type="button" onClick={() => openTryOn(current.id, color.id)} className="btn-outline h-12 px-6 text-[0.9375rem]">
                <ScanFace className="h-4 w-4" aria-hidden /> Pruébatelos en vivo
              </button>
            </div>
          </div>

          {/* Selector: en escritorio arriba a la derecha, sobre el producto */}
          <div
            role="tablist"
            aria-label="¿Qué estás buscando?"
            className="glass relative z-20 mt-5 grid h-11 w-full shrink-0 grid-cols-3 rounded-full p-1 sm:inline-grid sm:w-auto sm:self-start lg:absolute lg:right-8 lg:top-[calc(var(--chrome-h)+2.5rem)] lg:mt-0 short:absolute short:right-6 short:top-[calc(var(--chrome-h)+0.5rem)] short:mt-0"
          >
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
                    "relative flex h-9 items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-2 text-[0.6875rem] font-medium uppercase tracking-[0.12em] transition-colors duration-300 min-[380px]:text-[0.72rem] sm:px-4",
                    selected ? "text-white" : "text-ink/65 hover:text-ink",
                  )}
                >
                  {selected && (
                    <motion.span
                      layoutId="hero-intent"
                      className="absolute inset-0 rounded-full bg-ink shadow-[0_6px_16px_-8px_rgba(11,11,12,0.6)]"
                      transition={{ type: "spring", stiffness: 420, damping: 34 }}
                    />
                  )}
                  <Icon className="relative hidden h-3.5 w-3.5 shrink-0 min-[400px]:block" aria-hidden />
                  <span className="relative">{intents[key].label}</span>
                </button>
              );
            })}
          </div>

          {/* Escenario del producto: tamaño fijo, la foto cambia con crossfade sin mover el layout */}
          <div
            className="relative my-2 min-h-[8.5rem] flex-1 touch-pan-y [container-type:size] [perspective:1200px] sm:my-4 lg:absolute lg:bottom-[4.5rem] lg:right-0 lg:top-[calc(var(--chrome-h)+5.5rem)] lg:my-0 lg:w-[58%] short:absolute short:bottom-3 short:right-0 short:top-[calc(var(--chrome-h)+3.5rem)] short:my-0 short:w-[48%]"
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

          {/* Barra inferior: modelo en foco, flechas y (en móvil) los CTA */}
          <div className="relative z-10 lg:absolute lg:inset-x-8 lg:bottom-0 lg:flex lg:h-[4.5rem] lg:items-center lg:justify-between lg:border-t lg:border-ink/10 short:hidden">
            <div className="flex h-11 items-center justify-between gap-3 lg:h-auto lg:justify-start lg:gap-6">
              <p className="micro min-w-0 truncate">
                <span className="tabular-nums">
                  {pad(position + 1)} / {pad(list.length)}
                </span>
                <span className="text-ink"> · {current.name}</span>
                <span className="hidden sm:inline"> · {materialLabels[current.material].badge}</span> · {currency.format(current.price)}
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
            <div className="mt-3 grid grid-cols-[1fr_auto] gap-3 lg:hidden">
              <Magnetic className="min-w-0">
                <button type="button" onClick={goToCatalog} className="btn-primary h-12 w-full px-7 text-[0.9375rem]">
                  Ver modelos <ArrowRight className="h-4 w-4" aria-hidden />
                </button>
              </Magnetic>
              <button type="button" onClick={() => openTryOn(current.id, color.id)} className="btn-outline h-12 px-4 text-[0.8125rem]">
                <ScanFace className="h-4 w-4" aria-hidden /> Pruébatelos
              </button>
            </div>
            <a
              href={whatsappLink(config.message)}
              target="_blank"
              rel="noopener noreferrer"
              className="link-underline hidden items-center gap-2 text-[0.8125rem] font-medium text-ink/70 hover:text-ink lg:inline-flex"
            >
              <MessageCircle className="h-4 w-4 text-whatsapp-ink" aria-hidden /> Asesoría por WhatsApp
            </a>
          </div>
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
      <div className="relative" style={{ width: `min(90cqw, ${(ratio * 68).toFixed(1)}cqh)` }}>
        <div
          aria-hidden
          className="absolute -bottom-[16%] left-[16%] right-[16%] h-[12%] rounded-[50%] bg-[radial-gradient(closest-side,rgba(11,11,12,0.28),rgba(11,11,12,0.1)_60%,transparent)] motion-safe:animate-float-shadow"
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
                sizes="(min-width: 1024px) min(52vw, 760px), (min-width: 640px) 560px, 92vw"
                className="[filter:drop-shadow(0_2px_2px_rgba(11,11,12,0.18))_drop-shadow(0_18px_22px_rgba(11,11,12,0.16))]"
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
        "flex items-center justify-center rounded-full border border-ink/15 bg-white/70 text-ink transition-colors duration-300 hover:border-ink hover:bg-ink hover:text-white active:scale-95",
        large ? "h-11 w-11" : "h-10 w-10",
      )}
    >
      {children}
    </button>
  );
}

/**
 * Estudio blanco a sangre: fondo infinito cálido, una luz principal blanca que deriva muy lento detrás
 * del producto (transform, GPU) y un piso apenas más gris para asentar la sombra de contacto.
 */
function Atmosphere() {
  return (
    <div aria-hidden className="atmos pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div className="atmos-key motion-safe:animate-drift [will-change:transform]" />
      <div className="absolute inset-x-0 bottom-0 h-[38%] bg-[linear-gradient(to_bottom,transparent,rgba(11,11,12,0.03))]" />
    </div>
  );
}

function Marquee() {
  const from = `Desde ${currency.format(Math.min(...products.map((p) => p.price)))}`;
  const items = ["Acetato de alta densidad", "Titanio aeroespacial", "Antirreflejante premium", "Blue Block", "Polarizado UV400", "Ajuste milimétrico", "Envíos rápidos", from];
  return (
    // Líneas finas que se desvanecen en los extremos y texto con fundido lateral: sin cortes rectos
    <div className="relative overflow-hidden py-4 [mask-image:linear-gradient(90deg,transparent,#000_12%,#000_88%,transparent)]" aria-hidden>
      <span className="absolute inset-x-0 bottom-0 h-px bg-ink/10" />
      <div className="flex w-max gap-10 whitespace-nowrap motion-safe:animate-marquee">
        {[...items, ...items].map((t, k) => (
          <span key={k} className="flex items-center gap-10 font-display text-[0.6875rem] uppercase tracking-[0.24em] text-ink/60">
            {t}
            <span className="h-1 w-1 rounded-full bg-ink/30" />
          </span>
        ))}
      </div>
    </div>
  );
}
