import { useId, type SVGProps } from "react";
import type { Colorway, FrameShape, Material } from "@/lib/products";

/**
 * Ilustración vectorial de un armazón (vista frontal o en ángulo 3/4). Se re-colorea
 * en vivo con los swatches, así el catálogo funciona sin depender de fotografías.
 * Para usar fotos reales basta con reemplazar este componente por <Image />.
 */

// Mica izquierda (desde el punto de vista del observador). La derecha se refleja.
const lensPaths: Record<FrameShape, string> = {
  round: "M62 14 a40 40 0 1 1 -0.1 0 Z",
  square: "M16 20 H108 Q112 20 111 26 L105 74 Q103 86 90 86 H34 Q22 86 20 74 L13 26 Q12 20 16 20 Z",
  cateye: "M8 24 Q30 12 108 24 Q114 26 112 40 Q108 72 86 82 Q58 92 32 80 Q12 68 10 44 Q8 32 8 24 Z",
  aviator: "M14 24 Q60 12 108 22 Q116 26 112 48 Q106 78 80 88 Q52 96 30 80 Q12 64 12 40 Q12 28 14 24 Z",
};

const bridges: Record<FrameShape, string> = {
  round: "M101 46 Q120 34 139 46",
  square: "M111 36 Q120 30 129 36",
  cateye: "M112 36 Q120 30 128 36",
  aviator: "M112 40 Q120 34 128 40",
};

const strokeByMaterial: Record<Material, number> = { acetato: 7, titanio: 2.6, mixto: 2.6 };

type Props = {
  shape: FrameShape;
  material: Material;
  color: Colorway;
  view?: "front" | "angle";
  /** "tryon": micas más translúcidas para dibujarse sobre un rostro en el probador virtual. */
  variant?: "default" | "tryon";
  className?: string;
  title?: string;
} & Omit<SVGProps<SVGSVGElement>, "color" | "viewBox">;

export function FrameIllustration({ shape, material, color, view = "front", variant = "default", className, title, ...rest }: Props) {
  const uid = useId().replace(/:/g, "");
  const isSun = Boolean(color.lens);
  const isTryOn = variant === "tryon";
  const patternFill = color.pattern === "tortoise" ? `url(#tort-${uid})` : color.frame;
  // En mixtos el aro es metálico y la ceja de acetato.
  const rimColor = material === "mixto" ? color.metal ?? "#B8975A" : patternFill;
  const stroke = strokeByMaterial[material];
  const lensFill = isSun ? `url(#tint-${uid})` : isTryOn ? "rgba(214,226,232,0.1)" : "rgba(214,226,232,0.28)";
  const lens = lensPaths[shape];
  const isAngle = view === "angle";

  const frame = (
    <g strokeLinejoin="round" strokeLinecap="round">
      <path d="M10 30 L2 34" stroke={patternFill} strokeWidth={material === "titanio" ? stroke : 6} fill="none" />
      {!isAngle && <path d="M230 30 L238 34" stroke={patternFill} strokeWidth={material === "titanio" ? stroke : 6} fill="none" />}
      <path d={bridges[shape]} stroke={rimColor} strokeWidth={stroke} fill="none" />
      {shape === "aviator" && <path d="M106 23 Q120 19 134 23" stroke={rimColor} strokeWidth={stroke} fill="none" />}

      {[false, true].map((mirrored) => (
        <g key={String(mirrored)} transform={mirrored ? "translate(240 0) scale(-1 1)" : undefined}>
          <path d={lens} fill={lensFill} />
          <path d={lens} fill={`url(#shine-${uid})`} opacity={isTryOn ? 0.3 : isSun ? 0.5 : 0.9} />
          <path d={lens} fill="none" stroke={rimColor} strokeWidth={stroke} opacity={color.pattern === "crystal" ? 0.78 : 1} />
          {material === "mixto" && (
            // Ceja de acetato recortada a la mitad superior de la mica
            <path d={lens} fill="none" stroke={patternFill} strokeWidth={9} clipPath={`url(#brow-${uid})`} />
          )}
          {material !== "acetato" && (
            <circle cx={shape === "round" ? 100 : 108} cy="60" r="3.2" fill="rgba(240,240,236,0.9)" stroke={rimColor} strokeWidth="1" />
          )}
          {material !== "titanio" && <circle cx="16" cy="30" r="1.6" fill="#E9E6DF" opacity="0.9" />}
        </g>
      ))}
    </g>
  );

  return (
    <svg
      viewBox={isAngle ? "0 0 290 112" : "0 0 240 104"}
      className={className}
      role="img"
      aria-label={title ?? "Ilustración de armazón"}
      xmlns="http://www.w3.org/2000/svg"
      {...rest}
    >
      <defs>
        <pattern id={`tort-${uid}`} width="28" height="28" patternUnits="userSpaceOnUse">
          <rect width="28" height="28" fill={color.frame} />
          <ellipse cx="6" cy="7" rx="5" ry="3.5" fill="#1d1008" opacity="0.65" />
          <ellipse cx="20" cy="18" rx="6" ry="4" fill="#d29a52" opacity="0.55" />
          <ellipse cx="22" cy="4" rx="3" ry="2" fill="#120a05" opacity="0.6" />
          <ellipse cx="8" cy="22" rx="3.5" ry="2.5" fill="#e0b070" opacity="0.4" />
        </pattern>
        <linearGradient id={`tint-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color.lens} stopOpacity={isTryOn ? 0.86 : 0.95} />
          <stop offset="100%" stopColor={color.lens} stopOpacity={isTryOn ? 0.55 : 0.62} />
        </linearGradient>
        <linearGradient id={`shine-${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.55" />
          <stop offset="60%" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <clipPath id={`brow-${uid}`}>
          <rect x="0" y="0" width="240" height="44" />
        </clipPath>
      </defs>

      {isAngle ? (
        <>
          {/* Varilla que se aleja en perspectiva */}
          <path
            d="M204 33 L276 22 Q286 21 287 30 L288 44"
            stroke={material === "titanio" ? rimColor : patternFill}
            strokeWidth={material === "titanio" ? 2.6 : 5}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <g transform="matrix(0.8 -0.07 0 1 14 16)">{frame}</g>
        </>
      ) : (
        frame
      )}
    </svg>
  );
}
