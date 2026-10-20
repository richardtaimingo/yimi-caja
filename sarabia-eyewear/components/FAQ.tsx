"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus } from "lucide-react";
import { Reveal, SectionHeading } from "./ui";
import { faqs } from "@/lib/faqs";


export function FAQ() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section className="bg-night-2 py-20 md:py-28">
      <div className="container grid gap-12 lg:grid-cols-[1fr_1.4fr]">
        <SectionHeading eyebrow="Preguntas frecuentes" title="Sin letras chiquitas." description="¿Te quedó alguna duda? Escríbenos por WhatsApp y te contestamos en minutos." />
        <div data-fab-avoid className="divide-y divide-paper/10 border-y border-paper/10">
          {faqs.map((f, i) => {
            const isOpen = open === i;
            return (
              <Reveal key={f.q} delay={i * 0.04}>
                <h3>
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() => setOpen(isOpen ? null : i)}
                    className="flex w-full items-center justify-between gap-6 py-6 text-left text-lg font-semibold tracking-tight"
                  >
                    {f.q}
                    <motion.span animate={{ rotate: isOpen ? 45 : 0 }} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-paper/15">
                      <Plus className="h-4 w-4" />
                    </motion.span>
                  </button>
                </h3>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden"
                    >
                      <p className="max-w-2xl pb-6 leading-relaxed text-paper/55">{f.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
