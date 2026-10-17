"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion, useMotionValueEvent, useScroll, useSpring, useTransform, type MotionValue } from "framer-motion";
import { Feather, Layers, ScanFace } from "lucide-react";
import clsx from "clsx";
import { FrameIllustration } from "./FrameIllustration";
import { products } from "@/lib/products";

const steps = [
  {
    icon: Feather,
    kicker: "01 · Materiales",
    title: "Acetato de alta densidad y Titanio aeroespacial",
    body: "Bloques de acetato de 6 mm curados durante semanas para que el color atraviese todo el material y no se descarapele. Y titanio grado aeroespacial: flexible, libre de níquel y hasta 40 % más ligero que el acero.",
    points: ["No se deforma con el calor", "Hipoalergénico", "Desde 9 g por armazón"],
  },
  {
    icon: Layers,
    kicker: "02 · Micas",
    title: "Micas con tratamiento premium",
    body: "Cada mica recibe capas de antirreflejante multicapa, filtro de luz azul opcional, endurecido antirrayas y acabado hidrofóbico. Ves más nítido, de día, de noche y frente a la pantalla.",
    points: ["Antirreflejante multicapa", "Filtro de luz azul", "UV400 en todas las micas"],
  },
  {
    icon: ScanFace,
    kicker: "03 · Ajuste",
    title: "Ajuste milimétrico",
    body: "Medimos distancia pupilar, altura y ancho de puente para que el centro óptico quede exactamente frente a tu pupila. Plaquetas y varillas se ajustan a tu rostro, sin presión detrás de las orejas.",
    points: ["Medición de distancia pupilar", "Varillas con alma metálica", "Ajustes gratis de por vida"],
  },
];

export function ArtOfSeeing() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 24, mass: 0.3 });
  const [step, setStep] = useState(0);

  useMotionValueEvent(scrollYProgress, "change", (v) => setStep(v < 0.34 ? 0 : v < 0.67 ? 1 : 2));

  const jump = (i: number) => {
    const el = ref.current;
    if (!el) return;
    const top = el.offsetTop + (el.offsetHeight - window.innerHeight) * (i / 3 + 0.12);
    window.scrollTo({ top, behavior: "smooth" });
  };

  return (
    <section id="materiales" ref={ref} className="relative h-[320vh] scroll-mt-0 bg-night-2 text-paper" aria-label="El Arte de Ver Bien">
      <div className="sticky top-0 flex h-[100dvh] flex-col overflow-hidden pt-16 md:pt-[4.5rem]">
        <div className="container flex flex-1 flex-col gap-6 py-6 lg:grid lg:grid-cols-2 lg:items-center lg:gap-16 lg:py-10">
          {/* Texto */}
          <div className="order-2 lg:order-1">
            <p className="eyebrow text-paper/50">El Arte de Ver Bien</p>

            <div className="mt-4 flex gap-2" role="tablist" aria-label="Fases">
              {steps.map((s, i) => (
                <button
                  key={s.kicker}
                  role="tab"
                  aria-selected={i === step}
                  aria-label={s.title}
                  onClick={() => jump(i)}
                  className="relative h-1 flex-1 overflow-hidden rounded-full bg-white/15"
                >
                  <PhaseBar progress={progress} index={i} />
                </button>
              ))}
            </div>

            <div className="relative mt-6 min-h-[17rem] sm:min-h-[15rem] lg:mt-10 lg:min-h-[22rem]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -24 }}
                  transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                >
                  <p className="flex items-center gap-2 text-sm font-medium text-sun">
                    {(() => {
                      const Icon = steps[step].icon;
                      return <Icon className="h-4 w-4" />;
                    })()}
                    {steps[step].kicker}
                  </p>
                  <h2 className="mt-3 text-3xl font-semibold leading-[1] tracking-tightest sm:text-5xl lg:text-6xl">{steps[step].title}</h2>
                  <p className="mt-4 max-w-lg text-sm leading-relaxed text-paper/65 sm:text-base lg:mt-6 lg:text-lg">{steps[step].body}</p>
                  <ul className="mt-5 flex flex-wrap gap-2">
                    {steps[step].points.map((p) => (
                      <li key={p} className="rounded-full bg-white/[0.08] px-3 py-1.5 text-xs font-medium text-paper/85">
                        {p}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Escenario visual */}
          <div className="relative order-1 min-h-[34vh] flex-1 overflow-hidden rounded-[2rem] bg-gradient-to-br from-white/[0.07] to-white/[0.02] lg:order-2 lg:aspect-square lg:min-h-0 lg:flex-none">
            <MaterialScene progress={progress} />
            <LensScene progress={progress} />
            <FitScene progress={progress} />
          </div>
        </div>
      </div>
    </section>
  );
}

function PhaseBar({ progress, index }: { progress: MotionValue<number>; index: number }) {
  const scaleX = useTransform(progress, [index / 3, (index + 1) / 3], [0, 1]);
  return <motion.span className="absolute inset-0 origin-left rounded-full bg-paper" style={{ scaleX }} />;
}

/** Opacidad de cada escena según su tercio del recorrido. */
function usePhaseOpacity(progress: MotionValue<number>, index: number) {
  const start = index / 3;
  const end = (index + 1) / 3;
  const input = index === 0 ? [0, end - 0.06, end] : index === 2 ? [start, start + 0.06, 1] : [start, start + 0.06, end - 0.06, end];
  const output = index === 0 ? [1, 1, 0] : index === 2 ? [0, 1, 1] : [0, 1, 1, 0];
  return useTransform(progress, input, output);
}

function MaterialScene({ progress }: { progress: MotionValue<number> }) {
  const opacity = usePhaseOpacity(progress, 0);
  const rotate = useTransform(progress, [0, 0.33], [-8, 6]);
  const acetateX = useTransform(progress, [0, 0.3], ["0%", "-12%"]);
  const titaniumX = useTransform(progress, [0, 0.3], ["0%", "12%"]);
  const titaniumOpacity = useTransform(progress, [0.04, 0.16], [0, 1]);
  const acetate = products.find((p) => p.id === "valeria")!;
  const titanium = products.find((p) => p.id === "roma")!;

  return (
    <motion.div style={{ opacity }} className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 sm:gap-8 sm:p-10">
      <motion.div style={{ rotate, x: acetateX }} className="w-[72%] drop-shadow-[0_30px_30px_rgba(0,0,0,0.5)]">
        <FrameIllustration shape={acetate.shape} material="acetato" color={acetate.colors[1]} className="w-full" />
      </motion.div>
      <motion.div style={{ opacity: titaniumOpacity, x: titaniumX }} className="w-[62%] drop-shadow-[0_20px_20px_rgba(0,0,0,0.45)]">
        <FrameIllustration shape={titanium.shape} material="titanio" color={titanium.colors[0]} className="w-full" />
      </motion.div>
      <SpecChip className="left-4 top-4 sm:left-6 sm:top-6" label="Acetato 6 mm" value="Alta densidad" />
      <SpecChip className="bottom-4 right-4 sm:bottom-6 sm:right-6" label="Titanio β" value="Desde 9 g" />
    </motion.div>
  );
}

const lensLayers = [
  { label: "Capa hidrofóbica", color: "rgba(255,255,255,0.18)" },
  { label: "Antirreflejante multicapa", color: "rgba(140,200,180,0.35)" },
  { label: "Filtro de luz azul", color: "rgba(240,210,120,0.35)" },
  { label: "Mica base certificada", color: "rgba(200,215,225,0.4)" },
];

function LensScene({ progress }: { progress: MotionValue<number> }) {
  const opacity = usePhaseOpacity(progress, 1);
  const spread = useTransform(progress, [0.36, 0.52], [0, 1]);

  return (
    <motion.div style={{ opacity }} className="absolute inset-0 flex items-center justify-center p-6" aria-hidden>
      <div className="relative h-[80%] w-[70%] [perspective:900px]">
        {lensLayers.map((layer, i) => (
          <LensLayer key={layer.label} spread={spread} index={i} total={lensLayers.length} {...layer} />
        ))}
      </div>
    </motion.div>
  );
}

function LensLayer({ spread, index, total, label, color }: { spread: MotionValue<number>; index: number; total: number; label: string; color: string }) {
  const offset = (index - (total - 1) / 2) * 75; // % de separación vertical (relativo a la capa)
  const y = useTransform(spread, [0, 1], ["0%", `${offset}%`]);
  const labelOpacity = useTransform(spread, [0.5, 1], [0, 1]);
  return (
    <motion.div style={{ y }} className="absolute inset-x-0 top-[36%] h-[28%]">
      <div
        className="h-full w-full rounded-[50%] border border-white/30 shadow-[0_10px_30px_rgba(0,0,0,0.35)] backdrop-blur-[2px] [transform:rotateX(62deg)]"
        style={{ background: `radial-gradient(ellipse at 35% 35%, rgba(255,255,255,0.35), ${color} 60%)` }}
      />
      <motion.span
        style={{ opacity: labelOpacity }}
        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 whitespace-nowrap rounded-full bg-paper px-2.5 py-1 text-[0.65rem] font-semibold text-night sm:text-xs"
      >
        {label}
      </motion.span>
    </motion.div>
  );
}

function FitScene({ progress }: { progress: MotionValue<number> }) {
  const opacity = usePhaseOpacity(progress, 2);
  const draw = useTransform(progress, [0.7, 0.9], [0, 1]);
  const frameY = useTransform(progress, [0.67, 0.8], [-40, 0]);
  const fitFrame = products.find((p) => p.id === "mateo")!;

  return (
    <motion.div style={{ opacity }} className="absolute inset-0 flex items-center justify-center p-6">
      <svg viewBox="0 0 300 300" className="h-full max-h-[90%] w-auto" aria-hidden>
        {/* Rostro minimalista */}
        <path d="M150 36 C214 36 244 92 240 160 C236 228 196 272 150 272 C104 272 64 228 60 160 C56 92 86 36 150 36 Z" fill="none" stroke="rgba(249,249,248,0.25)" strokeWidth="2" />
        <path d="M150 150 L144 186 Q150 192 158 186" fill="none" stroke="rgba(249,249,248,0.2)" strokeWidth="2" strokeLinecap="round" />
        <path d="M128 222 Q150 234 172 222" fill="none" stroke="rgba(249,249,248,0.2)" strokeWidth="2" strokeLinecap="round" />
        <circle cx="116" cy="136" r="5" fill="#F9F9F8" />
        <circle cx="184" cy="136" r="5" fill="#F9F9F8" />

        {/* Líneas de medición */}
        <motion.path d="M116 108 L184 108" stroke="#C9B79C" strokeWidth="1.5" fill="none" style={{ pathLength: draw }} />
        <motion.path d="M116 102 L116 114 M184 102 L184 114" stroke="#C9B79C" strokeWidth="1.5" fill="none" style={{ pathLength: draw }} />
        <motion.path d="M64 136 L40 136" stroke="#C9B79C" strokeWidth="1.5" fill="none" strokeDasharray="3 3" style={{ pathLength: draw }} />
        <motion.text x="150" y="98" textAnchor="middle" fill="#C9B79C" fontSize="11" fontWeight="600" style={{ opacity: draw }}>
          DP 62 mm
        </motion.text>
        <motion.text x="150" y="176" textAnchor="middle" fill="#C9B79C" fontSize="10" style={{ opacity: draw }}>
          Puente 20 mm
        </motion.text>
        <motion.g style={{ y: frameY }}>
          <FrameIllustration shape={fitFrame.shape} material="acetato" color={fitFrame.colors[0]} x={80} y={105} width={141} height={61} />
        </motion.g>
      </svg>
      <SpecChip className="bottom-4 left-4 sm:bottom-6 sm:left-6" label="Ajuste" value="± 0.5 mm" />
    </motion.div>
  );
}

function SpecChip({ className, label, value }: { className?: string; label: string; value: string }) {
  return (
    <div className={clsx("absolute rounded-2xl border border-white/10 bg-black/70 px-3 py-2 backdrop-blur", className)}>
      <p className="text-[0.65rem] uppercase tracking-[0.18em] text-paper/50">{label}</p>
      <p className="text-sm font-semibold">{value}</p>
    </div>
  );
}
