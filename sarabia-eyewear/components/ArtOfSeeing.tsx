"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useMotionValueEvent, useScroll, useTransform, type MotionValue } from "framer-motion";
import { ArrowRight, ScanFace } from "lucide-react";
import clsx from "clsx";
import { products, type ProductPhoto } from "@/lib/products";
import { framePhotos } from "@/lib/framePhotos";
import { maskOf } from "@/lib/textures";
import { useShop } from "./ShopProvider";
import { scrollToTarget } from "@/lib/scroll";

/**
 * "El Arte de Ver Bien": escena fija de 4 capítulos controlada por el scroll.
 * I Materia · II Micas (mirar a través de la mica) · III Medida · IV Colección.
 * Todas las imágenes de armazones son fotografías reales recortadas.
 */

const ACETATE = framePhotos["costa-carey-degradado"];
const TITANIUM = framePhotos["roma-oro-g15"];
const OPTICAL = framePhotos["mateo-carey"];
const MATEO = products.find((p) => p.id === "mateo")!;

type Beat = { chapter: number; kicker: string; title: string; body: string; until: number };

const BEATS: Beat[] = [
  {
    chapter: 0,
    kicker: "I · Materia",
    title: "Acetato que no se pinta: se lleva dentro",
    body: "Bloques de acetato de alta densidad, curados durante semanas y pulidos a mano. El carey atraviesa todo el material, así que nunca se descarapela.",
    until: 0.15,
  },
  {
    chapter: 0,
    kicker: "I · Materia",
    title: "Titanio: casi no lo sientes",
    body: "Metal libre de níquel y con memoria flexible: vuelve a su forma aunque lo dobles. Ligero de día completo.",
    until: 0.3,
  },
  {
    chapter: 1,
    kicker: "II · Micas",
    title: "Mira a través",
    body: "Afuera, todo borroso. A través de la mica, cada letra en su lugar: tallamos tu graduación con precisión de laboratorio.",
    until: 0.43,
  },
  {
    chapter: 1,
    kicker: "II · Micas",
    title: "Adiós a los reflejos",
    body: "El antirreflejante multicapa elimina destellos de pantallas, faros y lámparas. Tus ojos se ven, y ven mejor.",
    until: 0.53,
  },
  {
    chapter: 1,
    kicker: "II · Micas",
    title: "Luz azul, filtrada",
    body: "El filtro Blue Block corta la luz azul-violeta de las pantallas para jornadas largas sin fatiga visual.",
    until: 0.62,
  },
  {
    chapter: 2,
    kicker: "III · Medida",
    title: "Hecho a tu medida",
    body: "Alineamos el centro óptico de cada mica con tu pupila. Calibre, puente y varilla pensados para tu rostro, al milímetro.",
    until: 0.82,
  },
  {
    chapter: 3,
    kicker: "IV · Colección",
    title: "Once formas de ver el mundo",
    body: "Elige la tuya, pruébatela en vivo con tu cámara y pídela por WhatsApp.",
    until: 1.01,
  },
];

const CHAPTERS = [
  { n: "I", label: "Materia", start: 0 },
  { n: "II", label: "Micas", start: 0.3 },
  { n: "III", label: "Medida", start: 0.62 },
  { n: "IV", label: "Colección", start: 0.82 },
];

// Bloque de luz azul del capítulo II (el mismo fondo se repite dentro de la mica para alinearse).
const MICAS_BG =
  "radial-gradient(30% 26% at 62% 42%, rgba(255,255,255,0.06), transparent 70%), radial-gradient(90% 80% at 62% 45%, #26262A 0%, #161618 45%, #0B0B0C 100%)";

function useIsMobile() {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1023px)");
    const update = () => setMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return mobile;
}

/** Ventana de opacidad: aparece en [a, b] y desaparece en [c, d]. */
function useWindow(p: MotionValue<number>, a: number, b: number, c: number, d: number) {
  return useTransform(p, [a, b, c, d], [0, 1, 1, 0]);
}

/** Fuera de [a, d] la escena no se dibuja (display: none): el navegador no la recalcula ni la pinta. */
function useGate(p: MotionValue<number>, a: number, d: number) {
  return useTransform(p, (v) => (v < a || v > d ? "none" : "block"));
}

export function ArtOfSeeing() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  // Sin useSpring: en escritorio Lenis ya suaviza la rueda y en táctil la inercia nativa es fluida.
  // Un resorte encima añadía ~300 px de retraso y seguía animando un segundo después de soltar.
  const p = scrollYProgress;
  const mobile = useIsMobile();

  const jump = (start: number) => {
    const el = ref.current;
    if (!el) return;
    scrollToTarget(el.getBoundingClientRect().top + window.scrollY + (el.offsetHeight - window.innerHeight) * (start + 0.035));
  };

  // Barrido del bloque azul con translateX (lo compone la GPU; clip-path repintaba toda la pantalla)
  const blueX = useTransform(p, [0.27, 0.33, 0.6, 0.65], ["100%", "0%", "0%", "-100%"]);
  const blueGate = useGate(p, 0.26, 0.66);

  return (
    <section id="materiales" ref={ref} className="relative h-[640vh] bg-canvas" aria-label="El Arte de Ver Bien">
      {/* Texto completo para lectores de pantalla */}
      <ol className="sr-only">
        {BEATS.map((b) => (
          <li key={b.title}>
            {b.kicker}. {b.title} {b.body}
          </li>
        ))}
      </ol>

      {/* svh: el escenario no cambia de tamaño cuando el navegador móvil oculta su barra */}
      <div className="sticky top-0 h-[100svh] overflow-hidden [container-type:size]">
        {/* Bloque de luz azul que barre la escena en el capítulo II */}
        <motion.div className="absolute inset-0 will-change-transform" style={{ x: blueX, display: blueGate, backgroundImage: MICAS_BG }} aria-hidden />

        <div aria-hidden>
          <ChapterNumeral p={p} />
          <MateriaScene p={p} mobile={mobile} />
          <MicasScene p={p} mobile={mobile} />
          <MedidaScene p={p} mobile={mobile} />
        </div>
        <ColeccionScene p={p} mobile={mobile} />

        <StoryChrome p={p} mobile={mobile} onJump={jump} />
      </div>
    </section>
  );
}

/**
 * Texto y riel de capítulos. El beat vive aquí (no en la raíz): al cambiar de beat sólo se
 * re-renderiza este bloque, no las cuatro escenas.
 */
function StoryChrome({ p, mobile, onJump }: { p: MotionValue<number>; mobile: boolean; onJump: (start: number) => void }) {
  const [beat, setBeat] = useState(0);
  const beatRef = useRef(0);
  useMotionValueEvent(p, "change", (v) => {
    const found = BEATS.findIndex((b) => v < b.until);
    const next = found === -1 ? BEATS.length - 1 : found;
    if (next !== beatRef.current) {
      beatRef.current = next;
      setBeat(next);
    }
  });
  const onBlue = BEATS[beat].chapter === 1;
  return (
    <>
      <StoryText beat={beat} onBlue={onBlue} mobile={mobile} />
      <ProgressRail p={p} beat={beat} onBlue={onBlue} onJump={onJump} />
    </>
  );
}

/* ───────────────────────── Texto y navegación ───────────────────────── */

function StoryText({ beat, onBlue, mobile }: { beat: number; onBlue: boolean; mobile: boolean }) {
  const b = BEATS[beat];
  const isFinale = beat === BEATS.length - 1;
  return (
    <div
      className={clsx(
        "pointer-events-none absolute z-30 transition-colors duration-500",
        mobile ? "inset-x-0 bottom-0 px-5 pb-6 pt-16" : "left-[max(7cqw,5.5rem)] top-1/2 w-[min(31cqw,440px)] -translate-y-1/2",
        onBlue ? "on-dark text-white" : "text-ink",
      )}
      style={
        mobile
          ? { backgroundImage: `linear-gradient(to top, ${onBlue ? "#0B0B0C" : "#FFFFFF"} 55%, transparent)` }
          : undefined
      }
    >
      <AnimatePresence mode="wait">
        <motion.div key={beat} initial="hidden" animate="show" exit="exit" className="pointer-events-auto">
          <motion.p
            variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 }, exit: { opacity: 0 } }}
            className={clsx("text-[0.68rem] font-semibold uppercase tracking-[0.3em]", onBlue ? "text-white/65" : "text-mute")}
          >
            {b.kicker}
          </motion.p>
          <h2 className={clsx("display mt-4 leading-[1.12]", mobile ? "text-[1.3rem]" : "text-[clamp(1.5rem,2.5cqw,2.6rem)]")}>
            {b.title.split(" ").map((word, i) => (
              <span key={i} className="inline-block overflow-hidden pb-[0.08em] align-top">
                <motion.span
                  className="inline-block"
                  variants={{
                    hidden: { y: "105%" },
                    show: { y: 0, transition: { duration: 0.6, delay: 0.04 * i, ease: [0.22, 1, 0.36, 1] } },
                    exit: { y: "-105%", transition: { duration: 0.25 } },
                  }}
                >
                  {word}&nbsp;
                </motion.span>
              </span>
            ))}
          </h2>
          {/* En móvil el párrafo deja libre la esquina del botón flotante de WhatsApp */}
          <motion.p
            variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { delay: 0.25 } }, exit: { opacity: 0 } }}
            className={clsx("mt-4 max-w-md leading-relaxed", mobile ? "pr-14 text-sm" : "text-base", onBlue ? "text-white/80" : "text-ink/70")}
          >
            {b.body}
          </motion.p>
          {isFinale && <FinaleCtas />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function FinaleCtas() {
  const { openTryOn } = useShop();
  return (
    <motion.div
      variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { delay: 0.4 } }, exit: { opacity: 0 } }}
      className="mt-6 flex flex-wrap gap-3"
    >
      <a href="#catalogo" className="btn-volt h-12 px-6 text-sm">
        Ver catálogo <ArrowRight className="h-4 w-4" />
      </a>
      <button type="button" onClick={() => openTryOn("costa", "carey-g15")} className="btn-outline h-12 px-6 text-sm">
        <ScanFace className="h-4 w-4" /> Pruébatelos en vivo
      </button>
    </motion.div>
  );
}

function ProgressRail({ p, beat, onBlue, onJump }: { p: MotionValue<number>; beat: number; onBlue: boolean; onJump: (s: number) => void }) {
  const chapter = BEATS[beat].chapter;
  const fill = useTransform(p, [0, 1], [0, 1]);
  return (
    <>
      {/* Escritorio: riel vertical */}
      <nav className="pointer-events-auto absolute left-5 top-1/2 z-30 hidden -translate-y-1/2 lg:block" aria-label="Capítulos">
        <div className={clsx("relative flex flex-col gap-5 border-l pl-3", onBlue ? "border-white/25" : "border-ink/15")}>
          <motion.span className={clsx("absolute -left-px top-0 h-full w-px origin-top", onBlue ? "bg-white" : "bg-ink")} style={{ scaleY: fill }} />
          {CHAPTERS.map((c, i) => (
            <button
              key={c.n}
              type="button"
              onClick={() => onJump(c.start)}
              className={clsx(
                "flex items-baseline gap-2 text-left transition-colors",
                i === chapter ? (onBlue ? "text-white" : "text-ink") : onBlue ? "text-white/55 hover:text-white/85" : "text-ink/55 hover:text-ink/80",
              )}
            >
              <span className="font-display text-[0.7rem]" title={c.label}>
                {c.n}
              </span>
              <span className="sr-only">{c.label}</span>
            </button>
          ))}
        </div>
      </nav>
      {/* Móvil: segmentos arriba */}
      <div className="absolute inset-x-5 top-[4.75rem] z-30 flex gap-1.5 lg:hidden">
        {CHAPTERS.map((c, i) => (
          <Segment key={c.n} p={p} a={c.start} b={CHAPTERS[i + 1]?.start ?? 1} onBlue={onBlue} />
        ))}
      </div>
    </>
  );
}

function Segment({ p, a, b, onBlue }: { p: MotionValue<number>; a: number; b: number; onBlue: boolean }) {
  const scaleX = useTransform(p, [a, b], [0, 1]);
  return (
    <div className={clsx("h-[3px] flex-1 overflow-hidden rounded-full", onBlue ? "bg-white/20" : "bg-ink/15")}>
      <motion.div className={clsx("h-full origin-left rounded-full", onBlue ? "bg-white" : "bg-ink")} style={{ scaleX }} />
    </div>
  );
}

function ChapterNumeral({ p }: { p: MotionValue<number> }) {
  return (
    <>
      {CHAPTERS.map((c, i) => (
        <Numeral key={c.n} p={p} n={c.n} a={c.start} b={CHAPTERS[i + 1]?.start ?? 1.05} dark={i === 1} />
      ))}
    </>
  );
}

function Numeral({ p, n, a, b, dark }: { p: MotionValue<number>; n: string; a: number; b: number; dark: boolean }) {
  const opacity = useTransform(p, [a - 0.03, a + 0.02, b - 0.03, b], [0, 1, 1, 0]);
  const y = useTransform(p, [a, b], ["6cqh", "-6cqh"]);
  const display = useGate(p, a - 0.04, b + 0.01);
  return (
    <motion.span
      className="display pointer-events-none absolute bottom-[-2cqh] right-[2cqw] select-none text-[34cqh] leading-none text-transparent will-change-transform"
      style={{ opacity, y, display, WebkitTextStroke: `1.5px ${dark ? "rgba(255,255,255,0.16)" : "rgba(11,11,12,0.08)"}` }}
    >
      {n}
    </motion.span>
  );
}

/* ───────────────────────── Piezas compartidas ───────────────────────── */

/**
 * Foto real con un destello de luz que recorre sólo el armazón (enmascarado con su silueta).
 * El destello se mueve con transform en su propia capa: la foto y su sombra se rasterizan una vez.
 */
function ShinyFrame({ photo, sheen, className, style }: { photo: ProductPhoto; sheen: MotionValue<string>; className?: string; style?: CSSProperties }) {
  return (
    <div className={clsx("relative", className)} style={{ aspectRatio: `${photo.width} / ${photo.height}`, ...style }}>
      <Image src={photo.front} alt="" fill quality={90} sizes="(min-width: 1024px) 44vw, 86vw" className="object-contain drop-shadow-[0_30px_30px_rgba(11,11,12,0.22)]" />
      <div className="absolute inset-0 overflow-hidden mix-blend-screen" style={maskOf(photo.mask ?? photo.front)}>
        <motion.div
          className="absolute inset-y-0 left-0 w-[280%] bg-[linear-gradient(105deg,transparent_42%,rgba(255,255,255,0.5)_50%,transparent_58%)] will-change-transform"
          style={{ x: sheen }}
        />
      </div>
    </div>
  );
}

/** El "%" de la sans extendida parece "0/o": se compone con la sans de texto. */
function Pct() {
  return <span className="ml-0.5 font-sans font-light">%</span>;
}

/** Número que cuenta con el scroll (actualiza el texto sin re-render). */
function Counter({ p, range, to, decimals = 0 }: { p: MotionValue<number>; range: [number, number]; to: number; decimals?: number }) {
  const value = useTransform(p, range, [0, to], { clamp: true });
  const ref = useRef<HTMLSpanElement>(null);
  useMotionValueEvent(value, "change", (v) => {
    const text = v.toFixed(decimals);
    if (ref.current && ref.current.textContent !== text) ref.current.textContent = text;
  });
  return <span ref={ref}>0</span>;
}

/* ───────────────────────── I · Materia ───────────────────────── */

function MateriaScene({ p, mobile }: { p: MotionValue<number>; mobile: boolean }) {
  const scene = useWindow(p, -1, 0, 0.29, 0.32);
  const display = useGate(p, -1, 0.33);
  const wordX = useTransform(p, [0, 0.3], ["8%", "-48%"]);
  const acetateWord = useTransform(p, [0.13, 0.16], [1, 0]);
  const titaniumWord = useTransform(p, [0.14, 0.17], [0, 1]);

  // Acetato: gira de perfil a frente y sale hacia la izquierda
  const aOpacity = useTransform(p, [0, 0.01, 0.135, 0.165], [0.4, 1, 1, 0]);
  const aRotY = useTransform(p, [0, 0.11, 0.165], [-48, 4, 34]);
  const aRotX = useTransform(p, [0, 0.11], [10, 0]);
  const aScale = useTransform(p, [0, 0.11, 0.165], [0.78, 1.06, 0.86]);
  const aX = useTransform(p, [0.12, 0.165], ["0cqw", mobile ? "-30cqw" : "-14cqw"]);
  const aSheen = useTransform(p, [0.03, 0.12], ["-77%", "13%"]);

  // Titanio: entra desde la derecha
  const tOpacity = useTransform(p, [0.14, 0.175, 0.28, 0.31], [0, 1, 1, 0]);
  const tRotY = useTransform(p, [0.14, 0.22, 0.31], [50, -2, -26]);
  const tScale = useTransform(p, [0.14, 0.22, 0.31], [0.8, 1.04, 0.92]);
  const tX = useTransform(p, [0.14, 0.2], [mobile ? "30cqw" : "16cqw", "0cqw"]);
  const tSheen = useTransform(p, [0.18, 0.28], ["-77%", "13%"]);

  const frameStyle = mobile ? { left: "50cqw", top: "36cqh", width: "86cqw" } : { left: "63cqw", top: "46cqh", width: "min(44cqw, 640px)" };

  return (
    <motion.div className="absolute inset-0" style={{ opacity: scene, display }}>
      {/* Palabra gigante contorneada, deslizada por el scroll */}
      <motion.div className="absolute left-0 top-[14cqh] whitespace-nowrap will-change-transform lg:top-[10cqh]" style={{ x: wordX }}>
        <div className="relative">
          <motion.span className="display block text-[22cqh] text-transparent" style={{ opacity: acetateWord, WebkitTextStroke: "1.5px rgba(11,11,12,0.12)" }}>
            acetato · acetato · acetato
          </motion.span>
          <motion.span className="display absolute left-0 top-0 block text-[22cqh] text-transparent" style={{ opacity: titaniumWord, WebkitTextStroke: "1.5px rgba(11,11,12,0.35)" }}>
            titanio · titanio · titanio
          </motion.span>
        </div>
      </motion.div>

      {/* Luz cálida detrás del armazón */}
      <div className="absolute h-[70cqh] w-[70cqh] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(11,11,12,0.06),transparent_65%)]" style={{ left: frameStyle.left, top: frameStyle.top }} />

      <div className="absolute -translate-x-1/2 -translate-y-1/2 [perspective:1100px]" style={frameStyle}>
        <motion.div style={{ opacity: aOpacity, rotateY: aRotY, rotateX: aRotX, scale: aScale, x: aX }}>
          <ShinyFrame photo={ACETATE} sheen={aSheen} />
        </motion.div>
        <motion.div className="absolute inset-0 flex items-center" style={{ opacity: tOpacity, rotateY: tRotY, scale: tScale, x: tX }}>
          <ShinyFrame photo={TITANIUM} sheen={tSheen} className="w-full" />
        </motion.div>
      </div>

      {/* Especificaciones que cuentan con el scroll */}
      <div className={clsx("absolute grid grid-cols-3 gap-4", mobile ? "inset-x-5 top-[54cqh]" : "bottom-[9cqh] left-[45cqw] right-[6cqw]")}>
        <SpecStack p={p} show={[0.03, 0.06, 0.13, 0.16]} items={[
          { node: <><Counter p={p} range={[0.03, 0.1]} to={6} /> mm</>, label: "acetato de alta densidad" },
          { node: <><Counter p={p} range={[0.04, 0.11]} to={5} /></>, label: "barriles en la bisagra flex" },
          { node: <><Counter p={p} range={[0.05, 0.12]} to={100} /><Pct /></>, label: "color en toda la masa" },
        ]} />
        <SpecStack p={p} show={[0.17, 0.2, 0.28, 0.31]} overlay items={[
          { node: <><Counter p={p} range={[0.17, 0.24]} to={16} /> g</>, label: "de metal en tu rostro" },
          { node: <><Counter p={p} range={[0.18, 0.25]} to={0} /><Pct /></>, label: "níquel: hipoalergénico" },
          { node: <><Counter p={p} range={[0.19, 0.26]} to={140} /> mm</>, label: "de varilla flexible" },
        ]} />
      </div>
    </motion.div>
  );
}

function SpecStack({ p, show, items, overlay }: { p: MotionValue<number>; show: [number, number, number, number]; items: { node: ReactNode; label: string }[]; overlay?: boolean }) {
  const opacity = useWindow(p, ...show);
  const y = useTransform(p, [show[0], show[1]], [24, 0]);
  return (
    <motion.div className={clsx("col-span-3 grid grid-cols-3 gap-4", overlay && "absolute inset-0")} style={{ opacity, y }}>
      {items.map((it) => (
        <div key={it.label} className="border-t border-ink/15 pt-3">
          <p className="display whitespace-nowrap text-[clamp(1.05rem,2.3cqw,2.3rem)] tabular-nums text-ink">{it.node}</p>
          <p className="mt-1 text-[0.7rem] leading-snug text-ink/60 sm:text-xs">{it.label}</p>
        </div>
      ))}
    </motion.div>
  );
}

/* ───────────────────────── II · Micas ───────────────────────── */

const CHART: { letters: string; size: number; label: string }[] = [
  { letters: "E", size: 13, label: "20/200" },
  { letters: "F P", size: 8.6, label: "20/100" },
  { letters: "T O Z", size: 6.6, label: "20/70" },
  { letters: "L P E D", size: 5.2, label: "20/50" },
  { letters: "P E C F D", size: 4.2, label: "20/40" },
  { letters: "E D F C Z P", size: 3.4, label: "20/30" },
  { letters: "F E L O P Z D", size: 2.8, label: "20/25" },
  { letters: "D E F P O T E C", size: 2.3, label: "20/20" },
];

/** Cartilla de Snellen ocupando todo el escenario (mismas medidas dentro y fuera de la mica). */
function EyeChart({ cx }: { cx: string }) {
  return (
    <div className="absolute left-0 top-0 h-[100cqh] w-[100cqw]">
      <div className="absolute top-[7cqh] flex -translate-x-1/2 flex-col items-center gap-[1.6cqh]" style={{ left: cx }}>
        {CHART.map((row) => (
          <div key={row.label} className="relative flex items-center">
            <span className="whitespace-nowrap font-sans font-bold tracking-[0.32em] text-white" style={{ fontSize: `${row.size}cqh`, lineHeight: 1 }}>
              {row.letters}
            </span>
            <span className="absolute left-full ml-[3cqh] whitespace-nowrap font-mono text-[1.3cqh] text-white/60">{row.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function MicasScene({ p, mobile }: { p: MotionValue<number>; mobile: boolean }) {
  const scene = useWindow(p, 0.29, 0.32, 0.61, 0.645);
  const display = useGate(p, 0.28, 0.655);
  const frameIn = useWindow(p, 0.31, 0.345, 0.6, 0.63);
  // Qué le pasa al mundo "afuera" de la mica en cada paso
  const blurLayer = useTransform(p, [0.4, 0.44], [1, 0]);
  const glare = useWindow(p, 0.42, 0.455, 0.51, 0.535);
  const glareX = useTransform(p, [0.42, 0.535], ["-18%", "18%"]);
  const blue = useWindow(p, 0.52, 0.555, 0.6, 0.63);

  const cx = mobile ? "50cqw" : "62cqw";
  const cy = mobile ? "38cqh" : "46cqh";
  const width = mobile ? "92cqw" : "min(50cqw, 700px)";
  const ratio = OPTICAL.height / OPTICAL.width;
  const box: CSSProperties = { left: cx, top: cy, width, aspectRatio: `${OPTICAL.width} / ${OPTICAL.height}` };

  const labels: [MotionValue<number>, string, string][] = [
    [useWindow(p, 0.33, 0.36, 0.41, 0.43), "Sin graduación", "Con tu graduación"],
    [useWindow(p, 0.44, 0.47, 0.51, 0.53), "Con reflejos", "Antirreflejante"],
    [useWindow(p, 0.54, 0.57, 0.6, 0.62), "Luz azul", "Blue Block"],
  ];

  return (
    <motion.div className="absolute inset-0" style={{ opacity: scene, display }}>
      {/* El mundo afuera: borroso, con destellos o con luz azul */}
      <div className="absolute inset-0 opacity-60">
        <motion.div className="absolute inset-0 blur-[0.55cqh] will-change-[opacity]" style={{ opacity: blurLayer }}>
          <EyeChart cx={cx} />
        </motion.div>
        <motion.div className="absolute inset-0" style={{ opacity: useTransform(blurLayer, (v) => 1 - v) }}>
          <EyeChart cx={cx} />
        </motion.div>
      </div>
      <motion.div
        className="absolute inset-[-10%] will-change-transform"
        style={{
          opacity: glare,
          x: glareX,
          backgroundImage:
            "linear-gradient(115deg, transparent 28%, rgba(255,255,255,0.85) 36%, transparent 44%, transparent 56%, rgba(255,255,255,0.6) 61%, transparent 67%), radial-gradient(circle at 70% 30%, rgba(255,255,255,0.9), transparent 22%)",
        }}
      />
      {/* Luz azul-violeta de pantallas: dura y con líneas de barrido */}
      <motion.div
        className="absolute inset-0 mix-blend-screen"
        style={{ opacity: blue, backgroundColor: "rgba(112,72,255,0.5)", backgroundImage: "repeating-linear-gradient(0deg, rgba(255,255,255,0.1) 0 2px, transparent 2px 4px)" }}
      />

      {/* A través de la mica: nítido, sin reflejos ni luz azul (máscara real de cada mica) */}
      <motion.div
        className="absolute -translate-x-1/2 -translate-y-1/2 overflow-hidden"
        style={{
          ...box,
          opacity: frameIn,
          WebkitMaskImage: `url(${OPTICAL.lensMask})`,
          maskImage: `url(${OPTICAL.lensMask})`,
          WebkitMaskSize: "100% 100%",
          maskSize: "100% 100%",
        }}
      >
        <div
          className="absolute"
          style={{
            backgroundImage: MICAS_BG,
            width: "100cqw",
            height: "100cqh",
            left: `calc(${width} / 2 - ${cx})`,
            top: `calc(${width} * ${ratio} / 2 - ${cy})`,
            transform: "scale(1.05)",
            transformOrigin: `${cx} ${cy}`,
          }}
        >
          <EyeChart cx={cx} />
        </div>
        {/* Con Blue Block, a través de la mica la luz azul desaparece */}
        <motion.div className="absolute inset-0 bg-[#808080] mix-blend-saturation" style={{ opacity: blue }} />
      </motion.div>

      {/* El armazón real encima (versión sin las varillas que se ven tras la mica); capa propia */}
      <motion.div className="absolute -translate-x-1/2 -translate-y-1/2 will-change-transform" style={{ ...box, opacity: frameIn }}>
        <Image src={OPTICAL.tryOn ?? OPTICAL.front} alt="" fill quality={90} sizes="(min-width: 1024px) 50vw, 92vw" className="object-contain drop-shadow-[0_30px_30px_rgba(0,0,0,0.45)]" />
        {labels.map(([opacity, outside, inside]) => (
          <motion.div key={inside} className="absolute inset-0" style={{ opacity }}>
            <span className="absolute -top-[9cqh] left-[2%] whitespace-nowrap rounded-full bg-white/10 px-3 py-1.5 text-[clamp(0.6rem,1.4cqh,0.78rem)] font-semibold uppercase tracking-[0.14em] text-white/80 backdrop-blur-sm">
              ← {outside}
            </span>
            <span className="absolute right-[2%] top-[104%] whitespace-nowrap rounded-full bg-white px-3 py-1.5 text-[clamp(0.6rem,1.4cqh,0.78rem)] font-semibold uppercase tracking-[0.14em] text-ink">
              {inside} ↑
            </span>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
}

/* ───────────────────────── III · Medida ───────────────────────── */

function MedidaScene({ p, mobile }: { p: MotionValue<number>; mobile: boolean }) {
  const scene = useWindow(p, 0.6, 0.645, 0.8, 0.835);
  const display = useGate(p, 0.59, 0.845);
  const grid = useTransform(p, [0.62, 0.68], [0, 1]);
  const frameScale = useTransform(p, [0.62, 0.7, 0.83], [0.9, 1, 1.04]);
  const W = OPTICAL.width;
  const H = OPTICAL.height;
  const [L, R] = OPTICAL.lensBoxes!.map(([x0, y0, x1, y1]) => ({ x0: x0 * W, y0: y0 * H, x1: x1 * W, y1: y1 * H }));
  const [c1, c2] = OPTICAL.lensCenters.map(([x, y]) => ({ x: x * W, y: y * H }));

  const d1 = useTransform(p, [0.655, 0.69], [0, 1]);
  const d2 = useTransform(p, [0.675, 0.71], [0, 1]);
  const d3 = useTransform(p, [0.695, 0.73], [0, 1]);
  const d4 = useTransform(p, [0.715, 0.75], [0, 1]);
  const t1 = useTransform(d1, [0.7, 1], [0, 1]);
  const t2 = useTransform(d2, [0.7, 1], [0, 1]);
  const t3 = useTransform(d3, [0.7, 1], [0, 1]);
  const t4 = useTransform(d4, [0.7, 1], [0, 1]);

  const box: CSSProperties = mobile
    ? { left: "50cqw", top: "36cqh", width: "84cqw" }
    : { left: "63cqw", top: "46cqh", width: "min(44cqw, 620px)" };
  const stroke = "#0B0B0C";
  const sw = W / 300; // grosor proporcional al tamaño de la foto

  return (
    <motion.div className="absolute inset-0" style={{ opacity: scene, display }}>
      {/* Retícula de plano técnico */}
      <motion.div
        className="absolute inset-0"
        style={{
          opacity: grid,
          backgroundImage:
            "linear-gradient(rgba(11,11,12,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(11,11,12,0.06) 1px, transparent 1px)",
          backgroundSize: "4cqh 4cqh",
        }}
      />
      {/* Luz de mesa de trabajo: separa el carey oscuro del fondo */}
      <motion.div
        className="absolute aspect-[16/9] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(11,11,12,0.07),rgba(11,11,12,0.02)_55%,transparent)]"
        style={{ left: box.left, top: box.top, width: mobile ? "120cqw" : "min(70cqw, 1000px)", opacity: grid }}
      />
      <motion.div className="absolute will-change-transform" style={{ ...box, aspectRatio: `${W} / ${H}`, scale: frameScale, x: "-50%", y: "-50%" }}>
        <Image src={OPTICAL.tryOn ?? OPTICAL.front} alt="" fill quality={90} sizes="(min-width: 1024px) 44vw, 84vw" className="object-contain drop-shadow-[0_24px_26px_rgba(11,11,12,0.22)]" />
        <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 h-full w-full overflow-visible">
          <g fill="none" stroke={stroke} strokeWidth={sw} strokeLinecap="round">
            {/* Ancho total */}
            <motion.path d={`M0 ${-H * 0.42} H${W} M0 ${-H * 0.48} V${-H * 0.36} M${W} ${-H * 0.48} V${-H * 0.36}`} style={{ pathLength: d1 }} />
            {/* Calibre (ancho de mica) */}
            <motion.path d={`M${L.x0} ${H * 1.12} H${L.x1} M${L.x0} ${H * 1.06} V${H * 1.18} M${L.x1} ${H * 1.06} V${H * 1.18}`} style={{ pathLength: d2 }} />
            {/* Puente */}
            <motion.path d={`M${L.x1} ${L.y0 - H * 0.08} H${R.x0} M${L.x1} ${L.y0 - H * 0.13} V${L.y0 - H * 0.03} M${R.x0} ${L.y0 - H * 0.13} V${L.y0 - H * 0.03}`} style={{ pathLength: d3 }} />
            {/* Centros ópticos y distancia pupilar */}
            <motion.path
              d={`M${c1.x - 14} ${c1.y} H${c1.x + 14} M${c1.x} ${c1.y - 14} V${c1.y + 14} M${c2.x - 14} ${c2.y} H${c2.x + 14} M${c2.x} ${c2.y - 14} V${c2.y + 14}`}
              style={{ pathLength: d4 }}
            />
            <motion.path d={`M${c1.x} ${c1.y} L${c2.x} ${c2.y}`} strokeDasharray={`${sw * 3} ${sw * 4}`} style={{ pathLength: d4 }} />
          </g>
          <motion.circle cx={c1.x} cy={c1.y} r={sw * 5} fill={stroke} style={{ opacity: t4 }} />
          <motion.circle cx={c2.x} cy={c2.y} r={sw * 5} fill={stroke} style={{ opacity: t4 }} />
        </svg>
        {/* Etiquetas */}
        <Dimension style={{ left: "50%", top: "-66%" }} opacity={t1} value={<>Ancho total</>} hint="a la medida de tu rostro" />
        <Dimension style={{ left: `${((L.x0 + L.x1) / 2 / W) * 100}%`, top: "126%" }} opacity={t2} value={<><Counter p={p} range={[0.675, 0.7]} to={MATEO.specs.lens} /> mm</>} hint="calibre" />
        <Dimension style={{ left: "50%", top: `${((L.y0 - H * 0.21) / H) * 100}%` }} opacity={t3} value={<><Counter p={p} range={[0.695, 0.72]} to={MATEO.specs.bridge} /> mm</>} hint="puente" small />
        <Dimension style={{ left: "50%", top: `${(c1.y / H) * 100 + 9}%` }} opacity={t4} value={<>DP</>} hint="tu distancia pupilar" small />
      </motion.div>

      {/* Ficha técnica */}
      <motion.dl
        className={clsx("absolute grid grid-cols-3 gap-4 text-ink", mobile ? "inset-x-5 top-[62cqh]" : "bottom-[8cqh] left-[45cqw] right-[6cqw]")}
        style={{ opacity: useTransform(p, [0.74, 0.77], [0, 1]) }}
      >
        {[
          ["Varilla", `${MATEO.specs.temple} mm`],
          ["Peso", `${MATEO.specs.weight} g`],
          ["Bisagra", "Flex 5 barriles"],
        ].map(([k, v]) => (
          <div key={k} className="border-t border-ink/15 pt-3">
            <dt className="text-[0.7rem] uppercase tracking-[0.18em] text-ink/60">{k}</dt>
            <dd className="mt-2 font-display text-sm uppercase sm:text-base">{v}</dd>
          </div>
        ))}
      </motion.dl>
    </motion.div>
  );
}

function Dimension({ style, opacity, value, hint, small }: { style: CSSProperties; opacity: MotionValue<number>; value: ReactNode; hint: string; small?: boolean }) {
  return (
    <motion.div className="absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap text-center" style={{ ...style, opacity }}>
      <p className={clsx("display tabular-nums text-ink", small ? "text-[clamp(0.85rem,1.5cqw,1.2rem)]" : "text-[clamp(1rem,2cqw,1.7rem)]")}>{value}</p>
      <p className="text-[0.62rem] font-semibold uppercase tracking-[0.2em] text-ink/60">{hint}</p>
    </motion.div>
  );
}

/* ───────────────────────── IV · Colección ───────────────────────── */

const COLLECTION = products.map((product) => ({ product, color: product.colors[0] }));

function ColeccionScene({ p, mobile }: { p: MotionValue<number>; mobile: boolean }) {
  const scene = useTransform(p, [0.8, 0.84], [0, 1]);
  const display = useGate(p, 0.79, 2);
  const cols = mobile ? 3 : 4;
  const area = mobile ? { x0: 4, x1: 96, y0: 13, y1: 62 } : { x0: 44, x1: 97, y0: 14, y1: 88 };
  const rows = Math.ceil((COLLECTION.length + 1) / cols);
  const cellW = (area.x1 - area.x0) / cols;
  const cellH = (area.y1 - area.y0) / rows;

  return (
    <motion.div className="absolute inset-0" style={{ opacity: scene, display }}>
      {COLLECTION.map((item, i) => (
        <FlyingFrame
          key={item.product.id}
          p={p}
          index={i}
          item={item}
          to={{ x: area.x0 + cellW * ((i % cols) + 0.5), y: area.y0 + cellH * (Math.floor(i / cols) + 0.5) }}
          width={cellW * 0.86}
        />
      ))}
      <CtaTile
        p={p}
        style={{
          left: `${area.x0 + cellW * ((COLLECTION.length % cols) + 0.5)}cqw`,
          top: `${area.y0 + cellH * (Math.floor(COLLECTION.length / cols) + 0.5)}cqh`,
          width: `${cellW * 0.86}cqw`,
          height: `${cellH * 0.78}cqh`,
        }}
      />
    </motion.div>
  );
}

function FlyingFrame({
  p,
  index,
  item,
  to,
  width,
}: {
  p: MotionValue<number>;
  index: number;
  item: (typeof COLLECTION)[number];
  to: { x: number; y: number };
  width: number;
}) {
  const { openTryOn } = useShop();
  const photo = item.color.photo!;
  // Punto de partida disperso (determinista por índice)
  const fromX = 50 + Math.sin(index * 12.9898) * 70;
  const fromY = 50 + Math.cos(index * 78.233) * 80;
  const fromRot = Math.sin(index * 4.1) * 70;
  const start = 0.82 + index * 0.005;
  const end = start + 0.07;
  // La caja queda fija en su celda; el vuelo es sólo transform (no mueve el layout ni cuenta como CLS)
  const x = useTransform(p, [start, end], [`${(fromX - to.x).toFixed(2)}cqw`, "0cqw"]);
  const y = useTransform(p, [start, end], [`${(fromY - to.y).toFixed(2)}cqh`, "0cqh"]);
  const rotate = useTransform(p, [start, end], [fromRot, 0]);
  const scale = useTransform(p, [start, end], [1.7, 1]);
  const opacity = useTransform(p, [start - 0.01, start + 0.02], [0, 1]);

  return (
    <div className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${to.x}cqw`, top: `${to.y}cqh`, width: `${width}cqw` }}>
    <motion.button
      type="button"
      onClick={() => openTryOn(item.product.id, item.color.id)}
      className="group pointer-events-auto block w-full text-center will-change-transform"
      style={{ x, y, rotate, scale, opacity }}
      aria-label={`Probarte ${item.product.name}`}
    >
      <span className="relative block" style={{ aspectRatio: `${photo.width} / ${photo.height}` }}>
        <Image src={photo.front} alt="" fill quality={90} sizes="(min-width: 1024px) 12vw, 28vw" className="object-contain drop-shadow-[0_14px_12px_rgba(11,11,12,0.2)] transition-transform duration-300 group-hover:-translate-y-1 group-hover:scale-105" />
      </span>
      <span className="mt-[0.8cqh] block font-display text-[clamp(0.58rem,1.3cqh,0.82rem)] uppercase tracking-[0.06em] text-ink">{item.product.name}</span>
      <span className="block text-[clamp(0.55rem,1.15cqh,0.72rem)] font-semibold uppercase tracking-[0.18em] text-ink/60 opacity-0 transition-opacity group-hover:opacity-100">
        Pruébatelos
      </span>
    </motion.button>
    </div>
  );
}

function CtaTile({ p, style }: { p: MotionValue<number>; style: CSSProperties }) {
  const opacity = useTransform(p, [0.9, 0.94], [0, 1]);
  const scale = useTransform(p, [0.9, 0.94], [0.8, 1]);
  return (
    <motion.a
      href="#catalogo"
      className="pointer-events-auto absolute flex flex-col items-start justify-between rounded-2xl bg-ink p-[min(1.6cqh,2.4cqw)] text-white shadow-float transition-colors hover:bg-ink-2"
      style={{ ...style, opacity, scale, x: "-50%", y: "-50%" }}
    >
      <span className="display text-[clamp(0.5rem,min(1.9cqh,2.2cqw),1.25rem)] leading-[1.2]">Encuentra tu par</span>
      <ArrowRight className="h-[2.6cqh] w-[2.6cqh]" />
    </motion.a>
  );
}
