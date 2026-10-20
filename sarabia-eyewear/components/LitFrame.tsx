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
  fetchPriority?: "high" | "low" | "auto";
  /** Calidad del WebP servido por next/image (los recortes ya vienen afinados: 90 evita artefactos). */
  quality?: number;
  /** "true": color real con luz de estudio suave. "blue": duotono monocromo de campaña. */
  grade?: "true" | "blue";
  /** Gotas de agua sobre el armazón. */
  droplets?: boolean;
  /** Reflejo del armazón en el piso. */
  reflection?: boolean;
  className?: string;
  style?: CSSProperties;
};

/**
 * Foto real del armazón iluminada como en un set: luz de contorno desde arriba y, en campaña,
 * reflejo espejo sobre las micas. Los efectos se recortan con la silueta ligera de la foto (photo.mask),
 * no con el archivo original, para no descargar cada recorte dos veces.
 */
export function LitFrame({
  photo,
  alt = "",
  sizes = "50vw",
  priority,
  fetchPriority,
  quality = 90,
  grade = "true",
  droplets,
  reflection,
  className,
  style,
}: Props) {
  const silhouette = maskOf(photo.mask ?? photo.front);
  const campaign = grade === "blue";
  return (
    <div className={clsx("relative isolate", className)} style={{ aspectRatio: `${photo.width} / ${photo.height}`, ...style }}>
      <Image
        src={photo.front}
        alt={alt}
        fill
        sizes={sizes}
        quality={quality}
        priority={priority}
        fetchPriority={fetchPriority}
        className={clsx("object-contain", campaign && "grade-duotone")}
      />
      {/* Luz de contorno: en color real es suave (soft-light conserva el carey y el acetato);
          en campaña es un reflejo espejo más marcado sobre las micas. */}
      <div
        className={clsx("absolute inset-0", campaign ? "mix-blend-screen" : "mix-blend-soft-light")}
        style={{
          ...silhouette,
          backgroundImage: campaign
            ? "linear-gradient(170deg, rgba(200,216,255,0.55) 0%, rgba(134,168,255,0.18) 22%, transparent 44%), linear-gradient(104deg, transparent 34%, rgba(160,190,255,0.28) 46%, transparent 58%)"
            : "linear-gradient(170deg, rgba(200,216,255,0.32) 0%, rgba(134,168,255,0.1) 24%, transparent 46%, transparent 80%, rgba(27,71,201,0.22) 100%)",
        }}
      />
      {droplets && <Droplets photo={photo} />}
      {reflection && (
        <div
          className="pointer-events-none absolute inset-x-0 top-[96%] h-full opacity-25 [transform:scaleY(-1)]"
          style={{ WebkitMaskImage: "linear-gradient(to top, rgba(0,0,0,0.5), transparent 45%)", maskImage: "linear-gradient(to top, rgba(0,0,0,0.5), transparent 45%)" }}
          aria-hidden
        >
          <Image src={photo.front} alt="" fill sizes={sizes} quality={75} className={clsx("object-contain", campaign && "grade-duotone")} />
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
  // Pocas gotas, de tamaños y formas variadas (algunas escurriendo): agua, no confeti
  const drops = Array.from({ length: 26 }, () => {
    const big = rand() < 0.2;
    const run = rand() < 0.2;
    return { x: rand() * w, y: rand() * h, r: (big ? 0.018 + rand() * 0.016 : 0.005 + rand() * 0.01) * w, sq: run ? 1.5 + rand() * 0.6 : 0.55 + rand() * 0.45 };
  });
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="absolute inset-0 h-full w-full" style={maskOf(photo.mask ?? photo.front)} aria-hidden>
      <defs>
        <radialGradient id={id} cx="45%" cy="40%" r="60%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.05)" />
          <stop offset="70%" stopColor="rgba(150,190,255,0.12)" />
          <stop offset="88%" stopColor="rgba(0,8,30,0.18)" />
          <stop offset="100%" stopColor="rgba(190,215,255,0.5)" />
        </radialGradient>
      </defs>
      {drops.map((d, i) => (
        <g key={i} transform={`translate(${d.x} ${d.y}) scale(1 ${d.sq})`}>
          <circle r={d.r} fill={`url(#${id})`} />
          <ellipse cx={-d.r * 0.35} cy={-d.r * 0.4} rx={d.r * 0.28} ry={d.r * 0.18} fill="rgba(255,255,255,0.5)" />
        </g>
      ))}
    </svg>
  );
}
