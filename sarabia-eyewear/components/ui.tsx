"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import clsx from "clsx";
import type { ReactNode } from "react";

export function Reveal({ children, className, delay = 0, ...rest }: HTMLMotionProps<"div"> & { delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
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
      <h2 className="display mt-4 text-[2.75rem] sm:text-6xl lg:text-7xl">{title}</h2>
      {description && <p className="mt-5 max-w-lg text-base leading-relaxed text-paper/60 sm:text-lg">{description}</p>}
    </Reveal>
  );
}
