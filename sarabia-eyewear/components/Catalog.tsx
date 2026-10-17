"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion, useMotionValue, useSpring } from "framer-motion";
import { MessageCircle, RotateCcw, SlidersHorizontal } from "lucide-react";
import clsx from "clsx";
import { materialLabels, products, shapeLabels, type FrameShape, type Material, type Product } from "@/lib/products";
import { currency, orderMessage, whatsappLink } from "@/lib/site";
import { swatchStyle } from "@/lib/swatch";
import { ProductImage } from "./ProductImage";
import { useShop, type Intent } from "./ShopProvider";
import { TryOnButton } from "./tryon/TryOnButton";
import { Reveal, SectionHeading } from "./ui";

const shapeFilters: (FrameShape | "todos")[] = ["todos", "round", "square", "cateye", "aviator"];
const materialFilters: (Material | "todos")[] = ["todos", "acetato", "titanio", "mixto"];
const intentLabels: Record<Intent, string> = { todos: "Todos", ver: "Para ver", sol: "De sol", blue: "Blue Block" };

function matchesIntent(p: Product, intent: Intent) {
  if (intent === "todos") return true;
  if (intent === "sol") return p.category === "sol";
  if (intent === "blue") return Boolean(p.blueBlockReady);
  return p.category === "oftalmico";
}

export function Catalog() {
  const { intent, setIntent } = useShop();
  const [shape, setShape] = useState<FrameShape | "todos">("todos");
  const [material, setMaterial] = useState<Material | "todos">("todos");

  const list = useMemo(
    () =>
      products.filter(
        (p) => matchesIntent(p, intent) && (shape === "todos" || p.shape === shape) && (material === "todos" || p.material === material),
      ),
    [intent, shape, material],
  );

  const hasFilters = intent !== "todos" || shape !== "todos" || material !== "todos";
  const reset = () => {
    setIntent("todos");
    setShape("todos");
    setMaterial("todos");
  };

  return (
    <section id="catalogo" className="scroll-mt-20 py-20 md:py-28">
      <div className="container">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <SectionHeading
            eyebrow="Catálogo"
            title="Encuentra tu par."
            description="Cambia el color en tiempo real, gira el armazón y pídelo directo por WhatsApp. Precios transparentes, sin letras chiquitas."
          />
          <div className="inline-flex self-start rounded-full bg-night-2 p-1 md:self-auto" role="tablist" aria-label="Uso">
            {(Object.keys(intentLabels) as Intent[]).map((key) => (
              <button
                key={key}
                role="tab"
                aria-selected={intent === key}
                onClick={() => setIntent(key)}
                className={clsx(
                  "relative rounded-full px-2.5 py-2 text-[0.8rem] font-medium transition-colors min-[380px]:px-3 min-[380px]:text-sm sm:px-4",
                  intent === key ? "text-night" : "text-paper/80 hover:text-paper",
                )}
              >
                {intent === key && <motion.span layoutId="intent-pill" className="absolute inset-0 rounded-full bg-paper" transition={{ type: "spring", bounce: 0.2, duration: 0.5 }} />}
                <span className="relative whitespace-nowrap">{intentLabels[key]}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Filtros dinámicos */}
        <div className="mt-10 flex flex-col gap-4 rounded-3xl border border-paper/10 bg-night-2/60 p-4 sm:p-5 lg:flex-row lg:items-center lg:gap-8">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <SlidersHorizontal className="h-4 w-4" /> Filtrar
          </div>
          <FilterGroup
            label="Estilo"
            options={shapeFilters.map((s) => ({ id: s, label: s === "todos" ? "Todos" : shapeLabels[s] }))}
            value={shape}
            onChange={(v) => setShape(v as FrameShape | "todos")}
          />
          <FilterGroup
            label="Material"
            options={materialFilters.map((m) => ({ id: m, label: m === "todos" ? "Todos" : materialLabels[m].label }))}
            value={material}
            onChange={(v) => setMaterial(v as Material | "todos")}
          />
          <div className="flex items-center justify-between gap-4 lg:ml-auto">
            <span className="text-sm text-paper/55" aria-live="polite">
              {list.length} {list.length === 1 ? "modelo" : "modelos"}
            </span>
            {hasFilters && (
              <button type="button" onClick={reset} className="inline-flex items-center gap-1.5 text-sm font-medium hover:text-volt">
                <RotateCcw className="h-3.5 w-3.5" /> Limpiar
              </button>
            )}
          </div>
        </div>

        <motion.div layout className="mt-10 grid gap-x-5 gap-y-12 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <AnimatePresence mode="popLayout">
            {list.map((p) => (
              <motion.div
                key={p.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.35 }}
              >
                <ProductCard product={p} intent={intent} />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {list.length === 0 && (
          <div className="mt-6 rounded-3xl bg-night-2 p-10 text-center">
            <p className="font-semibold">No hay modelos con esa combinación.</p>
            <p className="mt-1 text-sm text-paper/55">Prueba otro estilo o pregúntanos: tenemos más modelos en tienda.</p>
            <button type="button" onClick={reset} className="btn-volt mt-5 h-11 px-6 text-sm">
              Ver todos
            </button>
          </div>
        )}

        <Reveal className="mt-14 text-center text-sm text-paper/55">
          ¿No encuentras tu estilo?{" "}
          <a
            href={whatsappLink("Hola Sarabia Eyewear, no encontré mi estilo en el catálogo. ¿Tienen más modelos?")}
            target="_blank"
            rel="noopener noreferrer"
            className="link-underline font-medium text-paper"
          >
            Pregúntanos por WhatsApp
          </a>
          : tenemos más modelos en tienda.
        </Reveal>
      </div>
    </section>
  );
}

function FilterGroup({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { id: string; label: string }[];
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
      <span className="shrink-0 text-xs font-semibold uppercase tracking-[0.16em] text-paper/55 sm:w-16 lg:w-auto">{label}</span>
      <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label={label}>
        {options.map((o) => (
          <button
            key={o.id}
            type="button"
            role="radio"
            aria-checked={value === o.id}
            onClick={() => onChange(o.id)}
            className={clsx(
              "shrink-0 rounded-full border px-3.5 py-1.5 text-sm transition",
              value === o.id ? "border-paper bg-paper text-night" : "border-paper/15 hover:border-paper/50",
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function ProductCard({ product, intent }: { product: Product; intent: Intent }) {
  const { configure } = useShop();
  const [colorId, setColorId] = useState(product.colors[0].id);
  const [view, setView] = useState<"front" | "angle">("front");
  const color = product.colors.find((c) => c.id === colorId) ?? product.colors[0];
  const tiltX = useMotionValue(0);
  const tiltY = useMotionValue(0);
  const springX = useSpring(tiltX, { stiffness: 160, damping: 18 });
  const springY = useSpring(tiltY, { stiffness: 160, damping: 18 });

  const lens = product.category === "sol" ? "solares de fábrica UV400" : intent === "blue" ? "neutras con Blue Block" : undefined;
  const message = orderMessage({
    model: product.name,
    color: color.name,
    lens,
    extra: lens ? undefined : "¿Me ayudan a personalizar mis micas?",
  });

  return (
    <article className="group flex h-full flex-col">
      <div
        className="stage-blue relative aspect-[5/4] overflow-hidden rounded-3xl [perspective:900px]"
        onPointerMove={(e) => {
          if (e.pointerType !== "mouse") return;
          const r = e.currentTarget.getBoundingClientRect();
          tiltY.set(((e.clientX - r.left) / r.width - 0.5) * 26);
          tiltX.set(-((e.clientY - r.top) / r.height - 0.5) * 16);
        }}
        onPointerLeave={() => {
          tiltX.set(0);
          tiltY.set(0);
        }}
      >
        {/* Al pasar el cursor se enciende un segundo foco */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(65%_55%_at_50%_45%,rgba(140,180,255,0.45),transparent_70%)] opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
        <div className="absolute left-4 top-4 z-10 flex flex-wrap gap-1.5">
          {product.badge && (
            <span
              className={clsx(
                "rounded-full px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-wide",
                product.badge === "Edición limitada" ? "bg-volt text-white" : "bg-paper text-night",
              )}
            >
              {product.badge}
            </span>
          )}
          <span className="rounded-full bg-night/80 px-2.5 py-1 text-[0.68rem] font-medium text-paper/80 backdrop-blur">
            {materialLabels[product.material].badge}
          </span>
        </div>

        {/* Foto real en 3D: se inclina con el cursor y "Ángulo" la gira a 3/4 */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center px-6 pb-10 pt-12 [transform-style:preserve-3d]"
          animate={view === "angle" ? { rotateY: -34, rotateX: 7, scale: 0.94 } : { rotateY: 0, rotateX: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 120, damping: 16 }}
        >
          <motion.div className="w-full [transform-style:preserve-3d]" style={{ rotateX: springX, rotateY: springY }}>
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={color.id}
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.03 }}
                transition={{ duration: 0.25 }}
              >
                <ProductImage
                  product={product}
                  color={color}
                  sizes="(min-width: 1280px) 25vw, (min-width: 640px) 45vw, 90vw"
                  className="h-auto max-h-full w-full object-contain drop-shadow-[0_24px_20px_rgba(0,0,0,0.55)]"
                />
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </motion.div>

        <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 rounded-full bg-night/80 p-0.5 text-[0.68rem] font-medium backdrop-blur">
          {(["front", "angle"] as const).map((v) => (
            <button
              key={v}
              type="button"
              aria-pressed={view === v}
              onClick={() => setView(v)}
              className={clsx("rounded-full px-3 py-1 transition", view === v ? "bg-paper text-night" : "text-paper/80")}
            >
              {v === "front" ? "Frente" : "Ángulo"}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-display text-base uppercase tracking-[0.06em]">{product.name}</h3>
          <p className="text-sm text-paper/55">{product.tagline}</p>
        </div>
        <p className="shrink-0 text-lg font-semibold">{currency.format(product.price)}</p>
      </div>

      <div className="mt-3 flex items-center gap-2" role="radiogroup" aria-label={`Colores de ${product.name}`}>
        {product.colors.map((c) => (
          <button
            key={c.id}
            type="button"
            role="radio"
            aria-checked={c.id === colorId}
            aria-label={c.name}
            title={c.name}
            onClick={() => setColorId(c.id)}
            className={clsx(
              "h-7 w-7 shrink-0 rounded-full ring-offset-2 ring-offset-night transition",
              c.id === colorId ? "ring-2 ring-paper" : "ring-1 ring-paper/20 hover:ring-paper/50",
            )}
            style={swatchStyle(c)}
          />
        ))}
        <span className="ml-1 truncate text-xs text-paper/55">{color.name}</span>
      </div>

      <dl className="mt-3 grid grid-cols-3 gap-2 rounded-2xl bg-night-2 px-3 py-2.5 text-center text-[0.7rem]">
        <div>
          <dt className="text-paper/55">Medidas</dt>
          <dd className="font-semibold">
            {product.specs.lens}□{product.specs.bridge}
          </dd>
        </div>
        <div>
          <dt className="text-paper/55">Peso</dt>
          <dd className="font-semibold">{product.specs.weight} g</dd>
        </div>
        <div>
          <dt className="text-paper/55">Rostro</dt>
          <dd className="font-semibold">{product.specs.fit}</dd>
        </div>
      </dl>

      <div className="mt-auto flex flex-col gap-2 pt-4">
        <TryOnButton productId={product.id} colorId={color.id} />
        <a
          href={whatsappLink(message)}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-volt h-12 px-4 text-sm"
          aria-label={`Comprar o personalizar ${product.name} en ${color.name} por WhatsApp`}
        >
          <MessageCircle className="h-4 w-4" /> Comprar / Personalizar por WhatsApp
        </a>
        <button
          type="button"
          onClick={() => configure(product.id, color.id)}
          className="text-sm font-medium text-paper/55 underline-offset-4 hover:text-paper hover:underline"
        >
          Configurar micas paso a paso
        </button>
      </div>
    </article>
  );
}
