"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MessageCircle } from "lucide-react";
import { whatsappLink } from "@/lib/site";

/**
 * Asesoría por WhatsApp. Aparece cuando el hero ya salió de pantalla (el hero y el header tienen su
 * propio acceso). No interrumpe la secuencia de Inmersión y se retira junto al formulario de contacto,
 * cuando un control marcado con data-fab-avoid pasa por su franja y mientras hay un modal o menú
 * abierto, para no tapar textos ni competir con otros CTA. Respeta las áreas seguras del teléfono.
 */
export function WhatsAppFab() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // 1. Secciones donde no aparece: hero, la secuencia de Inmersión y contacto
    const sections = ["top", "inmersion", "contacto"].map((id) => document.getElementById(id)).filter((el): el is HTMLElement => Boolean(el));
    const inSection = new Set<Element>();
    // 2. Controles que pasan por la franja inferior donde vive el botón (CTA de tarjetas, FAQ, opciones)
    const inBand = new Set<Element>();
    const update = () => setVisible(inSection.size === 0 && inBand.size === 0);
    const track = (set: Set<Element>) => (entries: IntersectionObserverEntry[]) => {
      for (const entry of entries) {
        if (entry.isIntersecting) set.add(entry.target);
        else set.delete(entry.target);
      }
      update();
    };

    const sectionObserver = new IntersectionObserver(track(inSection), { rootMargin: "0px 0px -30% 0px" });
    sections.forEach((el) => sectionObserver.observe(el));

    let bandObserver: IntersectionObserver | null = null;
    const observeBand = () => {
      bandObserver?.disconnect();
      inBand.clear();
      bandObserver = new IntersectionObserver(track(inBand), { rootMargin: `-${Math.max(0, window.innerHeight - 96)}px 0px 0px 0px` });
      document.querySelectorAll("[data-fab-avoid]").forEach((el) => bandObserver!.observe(el));
    };
    observeBand();
    window.addEventListener("resize", observeBand);

    return () => {
      sectionObserver.disconnect();
      bandObserver?.disconnect();
      window.removeEventListener("resize", observeBand);
    };
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.a
          key="whatsapp-fab"
          href={whatsappLink("Hola Sarabia Eyewear, quiero asesoría para elegir mis lentes.")}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Asesoría en línea por WhatsApp"
          initial={{ opacity: 0, transform: "translateY(16px) scale(0.92)" }}
          animate={{ opacity: 1, transform: "translateY(0px) scale(1)" }}
          exit={{ opacity: 0, transform: "translateY(16px) scale(0.92)" }}
          transition={{ type: "spring", stiffness: 260, damping: 22 }}
          className="group fixed bottom-[max(1rem,calc(env(safe-area-inset-bottom)+0.5rem))] right-[max(1rem,env(safe-area-inset-right))] z-30 flex items-center gap-3 transition-opacity [html[data-scroll-locked]_&]:pointer-events-none [html[data-scroll-locked]_&]:opacity-0 lg:bottom-6 lg:right-6"
        >
          <span className="hidden items-center gap-2 rounded-full bg-ink py-2 pl-3 pr-4 text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-white/90 shadow-[0_12px_28px_-14px_rgba(11,11,12,0.6)] transition-colors group-hover:text-white lg:flex">
            <span className="h-2 w-2 rounded-full bg-whatsapp" aria-hidden />
            Asesoría en línea
          </span>
          <span className="relative flex h-12 w-12 items-center justify-center rounded-full bg-ink text-whatsapp shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_14px_30px_-12px_rgba(11,11,12,0.55)] transition-transform duration-300 group-hover:scale-105 group-active:scale-95 lg:h-14 lg:w-14">
            <MessageCircle className="h-[1.375rem] w-[1.375rem] lg:h-6 lg:w-6" aria-hidden />
            <span className="absolute right-0.5 top-0.5 h-2.5 w-2.5 rounded-full bg-whatsapp ring-2 ring-ink" aria-hidden />
          </span>
        </motion.a>
      )}
    </AnimatePresence>
  );
}
