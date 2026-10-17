"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, MessageCircle, X } from "lucide-react";
import clsx from "clsx";
import { nav, site, whatsappLink } from "@/lib/site";

export function Logo({ className }: { className?: string }) {
  return (
    <a href="#top" className={clsx("group inline-flex items-center gap-2.5 leading-none", className)} aria-label={`${site.name} — inicio`}>
      <span className="display text-[1.05rem] tracking-[0.14em] min-[400px]:text-[1.2rem]">Sarabia</span>
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

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
  }, [menuOpen]);

  return (
    <>
      <div className="border-b border-paper/10 bg-night text-paper/70">
        <div className="container flex h-9 items-center justify-center gap-2.5 whitespace-nowrap text-[0.52rem] font-medium uppercase tracking-[0.14em] min-[400px]:text-[0.56rem] sm:gap-3 sm:text-[0.62rem] sm:tracking-[0.2em]">
          <span>Envíos rápidos a todo México</span>
          <span className="h-1 w-1 rounded-full bg-volt" />
          <span>Garantía de ajuste</span>
          <span className="hidden h-1 w-1 rounded-full bg-volt sm:inline-block" />
          <span className="hidden sm:inline">Micas certificadas</span>
        </div>
      </div>

      <header
        className={clsx(
          "sticky top-0 z-40 transition-all duration-300",
          scrolled ? "border-b border-paper/10 bg-night/90 backdrop-blur-xl" : "bg-night",
        )}
      >
        <div className="container flex h-16 items-center justify-between gap-3 sm:gap-6 md:h-[4.5rem]">
          <Logo />

          <nav className="hidden items-center gap-8 lg:flex" aria-label="Principal">
            {nav.map((item) => (
              <a key={item.href} href={item.href} className="link-underline whitespace-nowrap text-[0.68rem] font-medium uppercase tracking-[0.22em] text-paper/70 hover:text-paper">
                {item.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <a
              href={whatsappLink("Hola Sarabia Eyewear, quiero hacer un pedido. ¿Me ayudan?")}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-volt h-10 whitespace-nowrap px-4 text-sm sm:px-5"
            >
              <MessageCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Pedir por WhatsApp</span>
              <span className="sm:hidden">Pedir</span>
            </a>
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full hover:bg-paper/10 lg:hidden"
              onClick={() => setMenuOpen(true)}
              aria-label="Abrir menú"
            >
              <Menu className="h-5 w-5" strokeWidth={1.75} />
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex flex-col bg-night text-paper lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="container flex h-16 items-center justify-between">
              <span className="text-sm uppercase tracking-[0.28em] text-paper/60">Menú</span>
              <button
                type="button"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full hover:bg-paper/10"
                onClick={() => setMenuOpen(false)}
                aria-label="Cerrar menú"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="container mt-8 flex flex-col gap-2" aria-label="Móvil">
              {nav.map((item, i) => (
                <motion.a
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * i + 0.1 }}
                  className="display border-b border-paper/10 py-5 text-2xl sm:text-3xl"
                >
                  {item.label}
                </motion.a>
              ))}
            </nav>
            <div className="container mt-auto pb-10">
              <a
                href={whatsappLink("Hola Sarabia Eyewear, quiero hacer un pedido. ¿Me ayudan?")}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-volt h-14 w-full text-base"
              >
                <MessageCircle className="h-5 w-5" /> Pedir por WhatsApp
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
