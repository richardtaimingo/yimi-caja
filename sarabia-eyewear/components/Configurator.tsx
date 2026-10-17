"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, FileText, MessageCircle } from "lucide-react";
import clsx from "clsx";
import { lensOptionsFor, materialLabels, products } from "@/lib/products";
import { currency, orderMessage, whatsappLink } from "@/lib/site";
import { swatchStyle } from "@/lib/swatch";
import { FrameIllustration } from "./FrameIllustration";
import { useShop } from "./ShopProvider";
import { SectionHeading } from "./ui";

export function Configurator() {
  const { selection, setSelection } = useShop();
  const product = products.find((p) => p.id === selection.productId) ?? products[0];
  const color = product.colors.find((c) => c.id === selection.colorId) ?? product.colors[0];
  const options = lensOptionsFor(product.category);
  const lens = options.find((o) => o.id === selection.lensId) ?? null;
  const total = product.price + (lens?.price ?? 0);

  const isFrameOnly = lens?.id === "solo" && product.category === "oftalmico";
  const baseMessage = lens
    ? orderMessage({
        model: product.name,
        color: color.name,
        lens: isFrameOnly ? undefined : lens.short,
        extra: isFrameOnly ? "Lo quiero solo armazón, sin micas." : undefined,
      })
    : "";

  return (
    <section id="como-funciona" className="scroll-mt-20 bg-bone-warm py-20 md:py-28">
      <div className="container">
        <SectionHeading
          eyebrow="Cómo funciona"
          title="Tu par en 3 clics."
          description="Elige armazón, elige mica y confirma con un asesor real por WhatsApp. Sin registros, sin formularios eternos."
        />

        <div className="mt-12 grid gap-6 lg:grid-cols-[1.35fr_1fr] lg:items-start">
          <div className="space-y-6">
            {/* Paso 1 */}
            <Step number={1} title="Elige tu armazón favorito" done>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {products.map((p) => {
                  const selected = p.id === product.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      aria-pressed={selected}
                      onClick={() =>
                        setSelection({
                          productId: p.id,
                          colorId: p.colors[0].id,
                          lensId: lensOptionsFor(p.category).some((o) => o.id === selection.lensId) ? selection.lensId : null,
                        })
                      }
                      className={clsx(
                        "rounded-2xl border p-3 text-left transition",
                        selected ? "border-ink bg-white shadow-card" : "border-ink/10 bg-bone hover:border-ink/30",
                      )}
                    >
                      <FrameIllustration shape={p.shape} material={p.material} color={p.colors[0]} className="h-10 w-full" />
                      <span className="mt-2 flex items-baseline justify-between gap-1">
                        <span className="text-sm font-semibold">{p.name}</span>
                        <span className="text-[0.68rem] text-ink-muted">{p.category === "sol" ? "Sol" : "Ver"}</span>
                      </span>
                      <span className="text-xs text-ink-muted">{currency.format(p.price)}</span>
                    </button>
                  );
                })}
              </div>
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <span className="text-sm font-medium">Color:</span>
                {product.colors.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    aria-label={c.name}
                    aria-pressed={c.id === color.id}
                    onClick={() => setSelection({ colorId: c.id })}
                    className={clsx(
                      "h-8 w-8 rounded-full ring-offset-2 ring-offset-bone transition",
                      c.id === color.id ? "ring-2 ring-ink" : "ring-1 ring-ink/15 hover:ring-ink/40",
                    )}
                    style={swatchStyle(c)}
                  />
                ))}
                <span className="text-sm text-ink-muted">{color.name}</span>
              </div>
            </Step>

            {/* Paso 2 */}
            <Step number={2} title="Selecciona tu tipo de mica" done={Boolean(lens)}>
              <div className={clsx("grid gap-2", options.length === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2")}>
                {options.map((o) => {
                  const selected = o.id === lens?.id;
                  return (
                    <button
                      key={o.id}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => setSelection({ lensId: o.id })}
                      className={clsx(
                        "flex flex-col rounded-2xl border p-4 text-left transition",
                        selected ? "border-ink bg-white shadow-card" : "border-ink/10 bg-bone hover:border-ink/30",
                      )}
                    >
                      <span className="flex items-start justify-between gap-2">
                        <span className="text-sm font-semibold">{o.name}</span>
                        <span
                          className={clsx(
                            "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border",
                            selected ? "border-ink bg-ink text-bone" : "border-ink/25",
                          )}
                        >
                          {selected && <Check className="h-3 w-3" strokeWidth={3} />}
                        </span>
                      </span>
                      <span className="mt-1 flex-1 text-xs leading-relaxed text-ink-muted">{o.description}</span>
                      <span className="mt-3 text-sm font-medium">{o.price ? `+${currency.format(o.price)}` : "Sin costo extra"}</span>
                    </button>
                  );
                })}
              </div>
            </Step>
          </div>

          {/* Paso 3 · Resumen */}
          <div className="lg:sticky lg:top-24">
            <Step number={3} title="Envía tu receta o confirma tu pedido" done={false} highlight>
              <div className="rounded-2xl bg-bone-warm p-4">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`${product.id}-${color.id}`}
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25 }}
                  >
                    <FrameIllustration
                      shape={product.shape}
                      material={product.material}
                      color={color}
                      title={`${product.name} en ${color.name}`}
                      className="mx-auto w-3/5 drop-shadow-[0_16px_16px_rgba(21,21,20,0.18)]"
                    />
                  </motion.div>
                </AnimatePresence>
              </div>

              <dl className="mt-5 space-y-2 text-sm">
                <Row label={`${product.name} · ${color.name}`} value={currency.format(product.price)} />
                <Row label={materialLabels[product.material].badge} value={`${product.specs.lens}□${product.specs.bridge}-${product.specs.temple}`} muted />
                <Row label={lens ? `Micas: ${lens.name}` : "Micas: elige una opción"} value={lens ? (lens.price ? `+${currency.format(lens.price)}` : "Incluido") : "—"} />
                <Row label="Envío" value="Gratis" muted />
                <div className="flex items-baseline justify-between border-t border-ink/10 pt-3">
                  <dt className="font-semibold">Total</dt>
                  <dd className="text-2xl font-semibold tracking-tight">{currency.format(total)}</dd>
                </div>
              </dl>

              <div className="mt-5 space-y-2">
                {!lens ? (
                  <p className="rounded-2xl border border-dashed border-ink/20 p-4 text-center text-sm text-ink-muted">Elige tu tipo de mica en el paso 2 para continuar.</p>
                ) : lens.needsRx ? (
                  <>
                    <a
                      href={whatsappLink(`${baseMessage} Les envío la foto de mi receta.`)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-primary h-14 w-full text-base"
                    >
                      <FileText className="h-4 w-4" /> Enviar mi receta por WhatsApp
                    </a>
                    <a
                      href={whatsappLink(`${baseMessage} No tengo receta reciente, ¿me ayudan con mi examen de la vista?`)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-ghost h-12 w-full text-sm"
                    >
                      No tengo receta: hablar con un asesor
                    </a>
                  </>
                ) : (
                  <a href={whatsappLink(`${baseMessage} ¿Me ayudan a confirmar mi pedido?`)} target="_blank" rel="noopener noreferrer" className="btn-primary h-14 w-full text-base">
                    <MessageCircle className="h-4 w-4" /> Confirmar pedido por WhatsApp
                  </a>
                )}
              </div>
              <p className="mt-3 text-center text-xs text-ink-muted">Un asesor confirma medidas, forma de pago y fecha de entrega.</p>
            </Step>
          </div>
        </div>
      </div>
    </section>
  );
}

function Step({ number, title, done, highlight, children }: { number: number; title: string; done: boolean; highlight?: boolean; children: React.ReactNode }) {
  return (
    <div className={clsx("rounded-[1.75rem] p-5 sm:p-7", highlight ? "bg-white shadow-lift" : "bg-bone")}>
      <div className="mb-5 flex items-center gap-3">
        <span
          className={clsx(
            "flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-colors",
            done ? "bg-ink text-bone" : "bg-bone-deep text-ink",
          )}
        >
          {done ? <Check className="h-4 w-4" strokeWidth={2.5} /> : number}
        </span>
        <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function Row({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className={clsx("flex items-baseline justify-between gap-4", muted && "text-ink-muted")}>
      <dt>{label}</dt>
      <dd className="shrink-0 font-medium">{value}</dd>
    </div>
  );
}
