"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import clsx from "clsx";
import type { ReactNode } from "react";
import { CharReveal } from "./CharReveal";

export function Reveal({ children, className, delay = 0, ...rest }: HTMLMotionProps<"div"> & { delay?: number }) {
  return (
    <motion.div
      // transform como cadena: Framer lo delega a WAAPI y lo anima el compositor (sin repintar)
      initial={{ opacity: 0, transform: "translateY(24px)" }}
      whileInView={{ opacity: 1, transform: "translateY(0px)" }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  className,
}: {
  eyebrow: string;
  title: ReactNode;
  description?: ReactNode;
  className?: string;
}) {
  return (
    <Reveal className={clsx("max-w-2xl", className)}>
      <p className="eyebrow">{eyebrow}</p>
      {/* Titulares de campaña sin punto final */}
      {typeof title === "string" ? (
        <CharReveal as="h2" text={title.replace(/\.$/, "")} className="display mt-4 text-[1.7rem] text-white sm:text-4xl lg:text-5xl" />
      ) : (
        <h2 className="display mt-4 text-[1.7rem] text-white sm:text-4xl lg:text-5xl">{title}</h2>
      )}
      {description && <p className="mt-5 max-w-lg text-base leading-relaxed text-paper/60 sm:text-lg">{description}</p>}
    </Reveal>
  );
}
