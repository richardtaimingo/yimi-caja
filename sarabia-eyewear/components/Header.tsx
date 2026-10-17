"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "framer-motion";
import { Menu, MessageCircle, X } from "lucide-react";
import clsx from "clsx";
import { Magnetic } from "./Magnetic";
import { nav, site, whatsappLink } from "@/lib/site";
import { lockScroll, unlockScroll } from "@/lib/scroll";

const ORDER_MESSAGE = "Hola Sarabia Eyewear, quiero hacer un pedido. ¿Me ayudan?";

export function Logo({ className }: { className?: string }) {
  return (
    <a href="#top" className={clsx("group inline-flex items-center gap-2.5 leading-none", className)} aria-label={`${site.name} — inicio`}>
      <span className="font-display text-[1.05rem] uppercase tracking-[0.14em] [margin-left:-0.06em] min-[400px]:text-[1.2rem]">Sarabia</span>
      <span className="hidden flex-col whitespace-nowrap border-l border-paper/20 pl-2.5 text-[0.5rem] font-semibold uppercase leading-[1.4] tracking-[0.26em] text-paper/60 sm:flex">
        <span>Eyewear</span>
        <span className="text-volt-ice">by J. Sarabia</span>
      </span>
    </a>
  );
}

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const scrolledRef = useRef(false);
  const { scrollY } = useScroll();

  // Se lee dentro del ciclo de Framer (sin forzar layout) y sólo re-renderiza al cruzar el umbral
  useMotionValueEvent(scrollY, "change", (y) => {
    const next = y > 12;
    if (next !== scrolledRef.current) {
      scrolledRef.current = next;
      setScrolled(next);
    }
  });

  useEffect(() => {
    if (!menuOpen) return;
    lockScroll();
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setMenuOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      unlockScroll();
    };
  }, [menuOpen]);

  return (
    <>
      {/* Aviso superior: en móvil se oculta para dar la pantalla completa al hero */}
      <div className="relative z-40 hidden border-b border-white/[0.06] text-paper/70 sm:block">
        <div className="container flex h-9 items-center justify-center gap-3 whitespace-nowrap text-[0.66rem] font-medium uppercase tracking-[0.18em]">
          <span>Envíos rápidos a todo México</span>
          <span className="h-1 w-1 rounded-full bg-volt-soft" aria-hidden />
          <span>Garantía de ajuste</span>
          <span className="hidden h-1 w-1 rounded-full bg-volt-soft md:inline-block" aria-hidden />
          <span className="hidden md:inline">Micas certificadas</span>
        </div>
      </div>

      <header
        className={clsx(
          "sticky top-0 z-40 border-b transition-[background-color,border-color,box-shadow] duration-300",
          scrolled
            ? "border-white/[0.06] bg-[linear-gradient(180deg,rgba(3,5,11,0.82),rgba(3,5,11,0.66))] shadow-[inset_0_-1px_0_rgba(134,168,255,0.06)] backdrop-blur-[18px] backdrop-saturate-150"
            : "border-transparent bg-transparent",
        )}
      >
        <div className="container flex h-16 items-center justify-between gap-3 sm:gap-6 md:h-[4.5rem]">
          <Logo />

          <nav className="hidden items-center gap-8 lg:flex" aria-label="Principal">
            {nav.map((item) => (
              <a key={item.href} href={item.href} className="link-underline whitespace-nowrap text-[0.6875rem] font-medium uppercase tracking-[0.2em] text-paper/75 hover:text-white">
                {item.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Magnetic>
              <a href={whatsappLink(ORDER_MESSAGE)} target="_blank" rel="noopener noreferrer" className="btn-glass h-10 whitespace-nowrap px-4 text-[0.8125rem] sm:px-5">
                <MessageCircle className="h-4 w-4 text-[#25D366]" aria-hidden />
                <span className="hidden sm:inline">Pedir por WhatsApp</span>
                <span className="sm:hidden">Pedir</span>
              </a>
            </Magnetic>
            <button
              type="button"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full transition-colors hover:bg-white/10 lg:hidden"
              onClick={() => setMenuOpen(true)}
              aria-label="Abrir menú"
              aria-expanded={menuOpen}
            >
              <Menu className="h-5 w-5" strokeWidth={1.75} />
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Menú"
            data-lenis-prevent
            className="fixed inset-0 z-50 flex flex-col overflow-y-auto bg-night text-paper lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <div className="container flex h-16 shrink-0 items-center justify-between">
              <span className="eyebrow">Menú</span>
              <button
                type="button"
                className="inline-flex h-11 w-11 items-center justify-center rounded-full transition-colors hover:bg-white/10"
                onClick={() => setMenuOpen(false)}
                aria-label="Cerrar menú"
                autoFocus
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="container mt-6 flex flex-col" aria-label="Móvil">
              {nav.map((item, i) => (
                <motion.a
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  initial={{ opacity: 0, transform: "translateY(16px)" }}
                  animate={{ opacity: 1, transform: "translateY(0px)" }}
                  transition={{ delay: 0.05 * i + 0.08, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                  className="display border-b border-white/[0.08] py-5 text-[1.375rem] sm:text-3xl"
                >
                  {item.label}
                </motion.a>
              ))}
            </nav>
            <div className="container mt-auto pb-[max(2.5rem,env(safe-area-inset-bottom))] pt-10">
              <a href={whatsappLink(ORDER_MESSAGE)} target="_blank" rel="noopener noreferrer" className="btn-volt h-14 w-full text-base">
                <MessageCircle className="h-5 w-5" aria-hidden /> Pedir por WhatsApp
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
