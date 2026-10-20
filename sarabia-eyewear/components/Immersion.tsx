"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { cancelFrame, frame } from "framer-motion";
import { ArrowRight, BadgeCheck, Gem, Layers, Ruler, ScanFace, ShieldCheck, Sun, Truck, type LucideIcon } from "lucide-react";
import clsx from "clsx";
import { useShop } from "./ShopProvider";
import { products } from "@/lib/products";
import { currency } from "@/lib/site";
import { scrollToTarget } from "@/lib/scroll";
import { MAX_PARTICLES, STRIDE, defaultCameraStart, frameWidth, sceneAt, windowed, writeParticles } from "@/lib/immersion/timeline";
import { ImmersionRenderer } from "@/lib/immersion/renderer";

/**
 * "Inmersión": secuencia cinematográfica controlada por scroll. El Costa real (foto recortada) flota
 * sobre el agua, cae, salpica y se hunde entre burbujas y rayos de luz mientras aparecen tarjetas de
 * vidrio con sus atributos y, al final, la marca y el CTA del modelo. Después, la sección siguiente
 * sube por encima como un telón (ver Proof.tsx).
 *
 * - La escena se dibuja con WebGL2 a la resolución de la pantalla (lib/immersion/renderer.ts) y todo su
 *   estado es una función pura del avance (lib/immersion/timeline.ts): se puede rebobinar.
 * - Canvas y textos se actualizan en el mismo frame de Framer Motion que mueve Lenis (sin desfase).
 * - Sin WebGL2: fondo y foto estáticos con las mismas tarjetas. Con "reducir movimiento": un solo
 *   cuadro fijo y sin pin.
 */

const PRODUCT = products.find((p) => p.id === "costa")!;
const COLOR = PRODUCT.colors.find((c) => c.id === "carey-degradado")!;
const PHOTO = COLOR.photo!;
const PHOTO_ASPECT = PHOTO.width / PHOTO.height;
/** Cuadro que se muestra fijo con "reducir movimiento". */
const STILL = 0.92;

type Window4 = [number, number, number, number];
type Card = { icon: LucideIcon; title: string; body: string };

const SURFACE: Card[] = [
  { icon: Gem, title: "Acetato de alta densidad", body: "Color profundo que no se desvanece con los años." },
  { icon: ShieldCheck, title: "Micas certificadas", body: "UV400, antirreflejante y Blue Block de laboratorio." },
  { icon: Ruler, title: "Ajuste a tu medida", body: "Calibre, puente y varillas pensados para tu rostro." },
];

const DIVE: (Card & { side: "left" | "right"; at: Window4 })[] = [
  { icon: Sun, title: "Polarizado UV400", body: "Bloquea el 100 % de los rayos UVA y UVB.", side: "left", at: [0.27, 0.31, 0.41, 0.45] },
  { icon: Layers, title: PRODUCT.specs.hinge, body: "Se abre con tu rostro y siempre vuelve a su lugar.", side: "right", at: [0.39, 0.43, 0.53, 0.57] },
  { icon: BadgeCheck, title: "Garantía de ajuste", body: "30 días para ajustar o cambiar sin costo.", side: "left", at: [0.51, 0.55, 0.65, 0.69] },
  { icon: Truck, title: "Envío gratis", body: "A todo México, en 2 a 4 días hábiles.", side: "right", at: [0.63, 0.67, 0.77, 0.81] },
];

const SURFACE_WINDOW = (i: number): Window4 => [-2, -1, 0.05 + i * 0.014, 0.12 + i * 0.014];
const HINT_WINDOW: Window4 = [-2, -1, 0.015, 0.05];
const WORDMARK_WINDOW: Window4 = [0.44, 0.6, 2, 3];
const LABEL_WINDOW: Window4 = [0.74, 0.82, 2, 3];
/** Media anchura máxima del armazón en pantalla (ver frameWidth) más aire: las tarjetas laterales se colocan respecto a él. */
const SIDE = "min(15vw,28svh)";

type Beat = { el: HTMLElement; win: Window4; dy: number; blur: boolean; still: boolean; last: number };

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const pad = (n: number) => String(n).padStart(2, "0");

/** Opacidad y desplazamiento de un texto según el avance (sólo transform/opacity; desenfoque con mouse). */
function applyBeat(beat: Beat, p: number, blurOk: boolean) {
  const [a, b, c, d] = beat.win;
  const value = Math.round(windowed(p, a, b, c, d) * 1000) / 1000;
  if (value === beat.last) return;
  beat.last = value;
  const style = beat.el.style;
  style.opacity = String(value);
  style.visibility = value === 0 ? "hidden" : "visible";
  const leaving = p > (b + c) / 2;
  style.transform = value === 1 ? "none" : `translate3d(0,${((1 - value) * beat.dy * (leaving ? -1 : 1)).toFixed(1)}px,0)`;
  if (blurOk && beat.blur) style.filter = value === 1 || value === 0 ? "none" : `blur(${((1 - value) * 10).toFixed(1)}px)`;
}

/** Resolución del canvas: nativa hasta 2x, con un tope de píxeles para pantallas enormes. */
function pixelRatio(width: number, height: number) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  return Math.max(1, Math.min(dpr, Math.sqrt(4.2e6 / Math.max(1, width * height))));
}

export function Immersion() {
  const { openTryOn, setIntent } = useShop();
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const surfaceRef = useRef<HTMLDivElement>(null);
  const overlaysRef = useRef<HTMLDivElement>(null);
  const wordmarkRef = useRef<HTMLDivElement>(null);
  const beats = useRef(new Map<string, Beat>());
  const [webgl, setWebgl] = useState(true);

  const bind =
    (id: string, win: Window4, { dy = 18, blur = true, still = false }: { dy?: number; blur?: boolean; still?: boolean } = {}) =>
    (el: HTMLElement | null) => {
      if (el) beats.current.set(id, { el, win, dy, blur, still, last: -1 });
      else beats.current.delete(id);
    };
  // Estado inicial en el HTML del servidor: lo visible al empezar ya se ve sin JavaScript
  const initial = (win: Window4) => (win[1] <= 0 ? undefined : ({ opacity: 0, visibility: "hidden" } as const));

  useEffect(() => {
    const section = sectionRef.current;
    const stage = stageRef.current;
    const canvas = canvasRef.current;
    const sceneLayer = sceneRef.current;
    const surface = surfaceRef.current;
    const wordmark = wordmarkRef.current;
    const overlays = overlaysRef.current;
    if (!section || !stage || !canvas || !sceneLayer || !surface || !wordmark || !overlays) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const blurOk = window.matchMedia("(pointer: fine)").matches;
    const particles = new Float32Array(MAX_PARTICLES * STRIDE);
    let renderer: ImmersionRenderer | null = null;
    let failed = false;
    let top = 0;
    let height = 0;
    let vw = 1;
    let vh = 1;
    let cameraStart = 0.2;
    let quality = 1;
    let smoothP = -1;
    let curtain = 0;
    let time = 0;
    let running = false;
    let sampled = 0;
    let slow = 0;

    const draw = (p: number, curtain: number, time: number) => {
      if (!renderer || renderer.lost) return;
      const aspect = vw / vh;
      const scene = sceneAt(p, time, aspect, PHOTO_ASPECT, cameraStart);
      const count = writeParticles(particles, p, time, aspect, scene);
      renderer.render(scene, particles, count, time, curtain * 0.55);
    };

    const showStill = () => {
      for (const beat of beats.current.values()) {
        const style = beat.el.style;
        style.opacity = beat.still ? "1" : "0";
        style.visibility = beat.still ? "visible" : "hidden";
        style.transform = "none";
      }
      draw(STILL, 0, 0);
    };

    const measure = () => {
      top = section.getBoundingClientRect().top + window.scrollY;
      height = section.offsetHeight;
      vw = stage.clientWidth;
      vh = stage.clientHeight;
      // El armazón arranca al menos 24 px por debajo de las tarjetas iniciales, sin que el agua salga de cuadro
      const aspect = vw / vh;
      const cardsBottom = surface.offsetTop + surface.offsetHeight;
      const needed = (cardsBottom + 24) / vh - 0.3 + frameWidth(aspect) / PHOTO_ASPECT / 2 + 0.012;
      cameraStart = Math.min(0.4, Math.max(defaultCameraStart(aspect), needed));
      renderer?.resize(vw, vh, Math.max(1, pixelRatio(vw, vh) * quality));
      // Cambiar el tamaño del canvas lo borra: se vuelve a dibujar en el mismo frame (sin parpadeo)
      if (reduced) showStill();
      else if (running) draw(smoothP, curtain, time);
    };

    const prepare = () => {
      if (renderer || failed) return;
      try {
        renderer = new ImmersionRenderer(canvas);
      } catch {
        failed = true;
        setWebgl(false);
        return;
      }
      measure();
      const image = new Image();
      image.decoding = "async";
      image.src = PHOTO.front;
      image
        .decode()
        .then(() => {
          if (!renderer) return;
          renderer.setTexture(image);
          if (reduced) showStill();
        })
        .catch(() => undefined);
    };

    const loop = ({ timestamp, delta }: { timestamp: number; delta: number }) => {
      const scrolled = window.scrollY - top;
      const sceneLength = Math.max(1, height - 2 * vh);
      const target = clamp01(scrolled / sceneLength);
      curtain = clamp01((scrolled - sceneLength) / vh);
      time = timestamp / 1000;
      // Amortiguación ligera: en táctil el scroll llega a saltos; un salto grande (ancla) no se anima
      smoothP = smoothP < 0 || Math.abs(target - smoothP) > 0.2 ? target : smoothP + (target - smoothP) * (1 - Math.exp(-delta / 80));

      // Calidad adaptativa: si el GPU no llega a ~40 fps se baja la resolución (nunca de 1x). Va antes de
      // dibujar porque cambiar el tamaño del canvas lo borra.
      if (renderer && delta > 0) {
        sampled += 1;
        if (delta > 26) slow += 1;
        if (sampled === 90) {
          if (slow > 45 && quality > 0.6) {
            quality *= 0.8;
            renderer.resize(vw, vh, Math.max(1, pixelRatio(vw, vh) * quality));
          }
          sampled = 0;
          slow = 0;
        }
      }

      draw(smoothP, curtain, time);
      for (const beat of beats.current.values()) applyBeat(beat, smoothP, blurOk);
      sceneLayer.style.transform = curtain > 0 ? `translate3d(0,${(-curtain * 0.2 * vh).toFixed(1)}px,0)` : "";
      // Con el telón: los textos se retiran y la marca sube con el borde del panel en vez de quedar cortada
      overlays.style.opacity = curtain > 0 ? String(Math.max(0, 1 - curtain * 2)) : "";
      wordmark.style.transform = curtain > 0 ? `translate3d(0,${(-curtain * 0.65 * vh).toFixed(1)}px,0)` : "";
      wordmark.style.opacity = curtain > 0 ? String(Math.max(0, 1 - curtain * 1.4)) : "";

    };

    const start = () => {
      if (running || reduced) return;
      running = true;
      frame.render(loop, true);
    };
    const stop = () => {
      if (!running) return;
      running = false;
      cancelFrame(loop);
    };

    // Se prepara (shaders + foto) con anticipación y sólo se dibuja mientras está en pantalla
    const near = new IntersectionObserver(([entry]) => entry.isIntersecting && prepare(), { rootMargin: "150% 0px" });
    const onScreen = new IntersectionObserver(([entry]) => (entry.isIntersecting ? start() : stop()));
    near.observe(section);
    onScreen.observe(section);
    const resize = new ResizeObserver(measure);
    resize.observe(stage);
    resize.observe(document.body);
    measure();

    return () => {
      near.disconnect();
      onScreen.disconnect();
      resize.disconnect();
      stop();
      renderer?.dispose();
      renderer = null;
    };
  }, []);

  const goToCatalog = () => {
    setIntent("sol");
    scrollToTarget(document.getElementById("catalogo"));
  };

  return (
    <section
      id="inmersion"
      ref={sectionRef}
      className="relative h-[500svh] bg-night motion-reduce:h-auto"
      aria-label={`Inmersión: ${PRODUCT.name} en ${COLOR.name}`}
    >
      <div ref={stageRef} className="sticky top-0 h-[100svh] overflow-hidden motion-reduce:relative">
        <div ref={sceneRef} className="absolute inset-0">
          {/* Fondo mientras carga (o sin WebGL): mismo aire tinta y agua cobalto de la escena */}
          <div aria-hidden className="absolute inset-0 bg-[linear-gradient(180deg,#03050B_0%,#0A1A52_68%,#2554DA_70%,#12349E_88%,#0A1F66_100%)]" />
          <canvas ref={canvasRef} aria-hidden className="absolute inset-0 h-full w-full" />
          {!webgl && (
            <div aria-hidden className="absolute inset-0 flex items-center justify-center">
              <div className="w-[min(70vw,28rem)] motion-safe:animate-float">
                <img src={PHOTO.front} alt="" width={PHOTO.width} height={PHOTO.height} className="h-auto w-full" decoding="async" />
              </div>
            </div>
          )}

          {/* Textos sobre la escena (en la retícula del sitio) */}
          <div ref={overlaysRef} className="container h-full">
            <div className="relative h-full">
              {/* 1. Tres tarjetas sobre el agua */}
              <div
                ref={surfaceRef}
                aria-hidden
                className="absolute inset-x-0 top-[calc(var(--chrome-h)+1.25rem)] flex flex-col gap-2.5 sm:gap-3 wide:top-[12vh] wide:flex-row wide:items-start wide:justify-between short:top-[calc(var(--chrome-h)+0.5rem)] short:flex-row short:gap-3"
              >
                {SURFACE.map((card, i) => (
                  <div
                    key={card.title}
                    className={clsx(
                      "w-[88%] max-w-[26rem] wide:w-[min(21rem,31%)] short:w-auto short:flex-1",
                      i === 1 && "self-end wide:mt-[3vh] wide:self-auto short:self-auto",
                      i === 2 && "wide:mt-[6vh]",
                    )}
                  >
                    <GlassCard card={card} index={i + 1} beatRef={bind(`surface-${i}`, SURFACE_WINDOW(i), { blur: false })} style={initial(SURFACE_WINDOW(i))} />
                  </div>
                ))}
              </div>

              {/* 2. Tarjetas que aparecen a los lados mientras se hunde */}
              {DIVE.map((card, i) => (
                <div
                  key={card.title}
                  aria-hidden
                  // Escritorio y horizontal: a los lados del armazón (medido desde el centro), nunca encima
                  className={clsx(
                    "absolute w-[min(23rem,88%)] wide:w-[min(21rem,calc(50%-var(--side)-2.5rem))] short:w-[calc(50%-var(--side)-1rem)]",
                    card.side === "left"
                      ? "left-0 top-[calc(var(--chrome-h)+1.25rem)] wide:left-auto wide:right-[calc(50%+var(--side)+2.5rem)] wide:top-[27%] short:left-auto short:right-[calc(50%+var(--side)+1rem)] short:top-[30%]"
                      : "right-0 top-[72%] wide:left-[calc(50%+var(--side)+2.5rem)] wide:right-auto wide:top-[50%] short:left-[calc(50%+var(--side)+1rem)] short:right-auto short:top-[46%]",
                  )}
                  style={{ "--side": SIDE } as CSSProperties}
                >
                  <GlassCard card={card} index={SURFACE.length + i + 1} beatRef={bind(`dive-${i}`, card.at, { blur: false })} style={initial(card.at)} />
                </div>
              ))}

              {/* 3. Remate: el modelo y sus CTA (junto al armazón en escritorio, debajo en móvil) */}
              <div className="absolute inset-x-0 top-[60%] flex justify-center wide:inset-x-auto wide:right-0 wide:top-1/2 wide:-translate-y-1/2 short:inset-x-auto short:right-0 short:top-1/2 short:-translate-y-1/2">
                <div ref={bind("label", LABEL_WINDOW, { still: true })} style={initial(LABEL_WINDOW)} className="flex flex-col items-center text-center wide:items-end wide:text-right short:items-end short:text-right">
                  <p className="eyebrow text-volt-ice">
                    {COLOR.name} · {currency.format(PRODUCT.price)}
                  </p>
                  <p className="mt-3 font-display text-[clamp(2.25rem,1.2rem+2.6vw,3.75rem)] uppercase leading-none tracking-[0.04em] text-white [margin-right:-0.04em] short:text-[1.75rem]">
                    {PRODUCT.name}
                  </p>
                  <p className="mt-3 max-w-[30ch] text-[0.9375rem] leading-relaxed text-paper/70 max-lg:[@media(max-height:719px)]:hidden short:hidden">{PRODUCT.tagline}</p>
                  <div className="mt-6 flex gap-2.5 whitespace-nowrap short:mt-4">
                    <button type="button" onClick={() => openTryOn(PRODUCT.id, COLOR.id)} className="btn-primary h-12 px-6 text-[0.9375rem] max-[389px]:px-4 max-[389px]:text-[0.8125rem]">
                      <ScanFace className="h-4 w-4" aria-hidden /> Pruébatelos
                    </button>
                    <button type="button" onClick={goToCatalog} className="btn-glass h-12 px-6 text-[0.9375rem] max-[389px]:px-4 max-[389px]:text-[0.8125rem]">
                      Ver modelos <ArrowRight className="h-4 w-4" aria-hidden />
                    </button>
                  </div>
                </div>
              </div>

              {/* Indicación inicial */}
              <div aria-hidden className="absolute inset-x-0 bottom-[max(1.5rem,4vh)] flex justify-center short:hidden">
                <div ref={bind("hint", HINT_WINDOW, { blur: false })} style={initial(HINT_WINDOW)} className="flex flex-col items-center gap-3">
                  <span className="micro text-paper/70">Desliza para sumergirte</span>
                  <span className="relative h-10 w-px overflow-hidden bg-white/15">
                    <span className="absolute inset-x-0 top-0 h-1/2 bg-ice motion-safe:animate-hint" />
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Marca gigante translúcida, a sangre */}
          <div ref={wordmarkRef} aria-hidden className="pointer-events-none absolute inset-x-0 bottom-[max(1rem,3vh)] flex justify-center overflow-x-clip">
            <div ref={bind("wordmark", WORDMARK_WINDOW, { dy: 60, blur: false, still: true })} style={initial(WORDMARK_WINDOW)}>
              {/* Degradado en el texto: hielo arriba que se disuelve en el agua */}
              <span className="block select-none whitespace-nowrap bg-[linear-gradient(180deg,rgba(232,238,255,0.78)_0%,rgba(200,216,255,0.42)_55%,rgba(200,216,255,0.08)_100%)] bg-clip-text pb-[0.04em] font-display text-[13.4vw] uppercase leading-[0.9] short:text-[10vw] tracking-[0.02em] text-transparent [margin-right:-0.02em]">
                Sarabia
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Lectores de pantalla: el contenido completo de la secuencia, sin depender del scroll */}
      <ul className="sr-only">
        {[...SURFACE, ...DIVE].map((card) => (
          <li key={card.title}>
            {card.title}: {card.body}
          </li>
        ))}
      </ul>
    </section>
  );
}

/**
 * La opacidad y el desplazamiento se aplican a la propia tarjeta: si se aplicaran a un contenedor, éste
 * aislaría el backdrop-filter y el vidrio perdería el desenfoque del fondo durante la transición.
 */
function GlassCard({ card, index, beatRef, style }: { card: Card; index: number; beatRef: (el: HTMLElement | null) => void; style?: CSSProperties }) {
  const Icon = card.icon;
  return (
    <div ref={beatRef} style={style} className="glass-card flex items-start gap-3.5 p-3.5 sm:p-4">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/[0.1] ring-1 ring-white/20">
        <Icon className="h-4 w-4 text-ice" strokeWidth={1.75} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="flex items-baseline justify-between gap-3 text-[0.9375rem] font-medium leading-snug text-white">
          {card.title}
          <span className="font-mono text-[0.6875rem] tabular-nums text-paper/45 max-sm:hidden">{pad(index)}</span>
        </p>
        <p className="mt-1 text-[0.8125rem] leading-[1.45] text-paper/70 max-lg:[@media(max-height:719px)]:hidden short:hidden">{card.body}</p>
      </div>
    </div>
  );
}
