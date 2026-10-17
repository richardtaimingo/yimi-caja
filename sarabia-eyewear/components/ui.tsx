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
  invert,
}: {
  eyebrow: string;
  title: ReactNode;
  description?: ReactNode;
  className?: string;
  invert?: boolean;
}) {
  return (
    <Reveal className={clsx("max-w-2xl", className)}>
      <p className={clsx("eyebrow", invert && "text-bone/60")}>{eyebrow}</p>
      <h2 className="mt-4 text-4xl font-semibold leading-[0.98] tracking-tightest sm:text-5xl lg:text-6xl">{title}</h2>
      {description && (
        <p className={clsx("mt-5 max-w-lg text-base leading-relaxed sm:text-lg", invert ? "text-bone/70" : "text-ink-muted")}>
          {description}
        </p>
      )}
    </Reveal>
  );
}
