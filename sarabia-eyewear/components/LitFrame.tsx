import Image from "next/image";
import clsx from "clsx";
import { useId, type CSSProperties } from "react";
import type { ProductPhoto } from "@/lib/products";
import { maskOf } from "@/lib/textures";

type Props = {
  photo: ProductPhoto;
  alt?: string;
  sizes?: string;
  priority?: boolean;
  /** "true": color real con luz azul de contorno. "blue": gradación monocroma azul de campaña. */
  grade?: "true" | "blue";
  /** Gotas de agua sobre el armazón. */
  droplets?: boolean;
  /** Reflejo del armazón en el piso. */
  reflection?: boolean;
  className?: string;
  style?: CSSProperties;
};

const gradeClass = "[filter:grayscale(1)_contrast(1.3)_brightness(0.78)]";

/**
 * Foto real del armazón iluminada como en un set de campaña: luz azul de contorno y reflejo
 * espejo sobre las micas. Todos los efectos se recortan con la silueta de la propia foto.
 */
export function LitFrame({ photo, alt = "", sizes = "50vw", priority, grade = "true", droplets, reflection, className, style }: Props) {
  const src = photo.front;
  return (
    <div className={clsx("relative isolate", className)} style={{ aspectRatio: `${photo.width} / ${photo.height}`, ...style }}>
      <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className={clsx("object-contain", grade === "blue" && gradeClass)} />
      {grade === "blue" && <div className="absolute inset-0 bg-volt mix-blend-color" style={maskOf(src)} />}
      {/* Luz de contorno desde arriba y reflejo espejo que cruza las micas */}
      <div
        className="absolute inset-0 mix-blend-screen"
        style={{
          ...maskOf(src),
          backgroundImage:
            "linear-gradient(170deg, rgba(160,195,255,0.7) 0%, rgba(80,130,255,0.22) 20%, transparent 42%, transparent 78%, rgba(45,107,255,0.4) 100%), linear-gradient(104deg, transparent 34%, rgba(120,170,255,0.32) 46%, transparent 58%)",
        }}
      />
      {droplets && <Droplets photo={photo} />}
      {reflection && (
        <div
          className="pointer-events-none absolute inset-x-0 top-[96%] h-full opacity-30 [transform:scaleY(-1)]"
          style={{ WebkitMaskImage: "linear-gradient(to top, rgba(0,0,0,0.55), transparent 45%)", maskImage: "linear-gradient(to top, rgba(0,0,0,0.55), transparent 45%)" }}
          aria-hidden
        >
          <Image src={src} alt="" fill sizes={sizes} className={clsx("object-contain blur-[1px]", grade === "blue" && gradeClass)} />
        </div>
      )}
    </div>
  );
}

/** Gotas de agua deterministas (mismas en servidor y cliente), recortadas a la silueta del armazón. */
function Droplets({ photo }: { photo: ProductPhoto }) {
  const { width: w, height: h } = photo;
  const id = `drop-${useId().replace(/[^\w-]/g, "")}`; // apto para url(#…)
  let seed = 7;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  const drops = Array.from({ length: 70 }, () => {
    const big = rand() < 0.18;
    return { x: rand() * w, y: rand() * h, r: (big ? 0.022 + rand() * 0.02 : 0.006 + rand() * 0.012) * w, sq: 0.8 + rand() * 0.35 };
  });
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="absolute inset-0 h-full w-full" style={maskOf(photo.front)} aria-hidden>
      <defs>
        <radialGradient id={id} cx="45%" cy="40%" r="60%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.05)" />
          <stop offset="70%" stopColor="rgba(150,190,255,0.12)" />
          <stop offset="88%" stopColor="rgba(0,8,30,0.55)" />
          <stop offset="100%" stopColor="rgba(190,215,255,0.5)" />
        </radialGradient>
      </defs>
      {drops.map((d, i) => (
        <g key={i} transform={`translate(${d.x} ${d.y}) scale(1 ${d.sq})`}>
          <circle r={d.r} fill={`url(#${id})`} />
          <ellipse cx={-d.r * 0.35} cy={-d.r * 0.4} rx={d.r * 0.28} ry={d.r * 0.18} fill="rgba(255,255,255,0.85)" />
        </g>
      ))}
    </svg>
  );
}
