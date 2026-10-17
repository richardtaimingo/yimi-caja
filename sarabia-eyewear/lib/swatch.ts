import type { CSSProperties } from "react";
import type { Colorway } from "./products";

export function swatchStyle(c: Colorway): CSSProperties {
  if (c.lens) return { background: `linear-gradient(135deg, ${c.frame} 50%, ${c.lens} 50%)` };
  if (c.metal) {
    const top = c.pattern === "tortoise" ? `radial-gradient(circle at 30% 25%, #d29a52 0 14%, transparent 16%), ${c.frame}` : c.frame;
    return { background: `linear-gradient(180deg, transparent 55%, ${c.metal} 55%), ${top}` };
  }
  if (c.pattern === "tortoise")
    return { background: `radial-gradient(circle at 30% 30%, #d29a52 0 18%, transparent 20%), radial-gradient(circle at 70% 65%, #1d1008 0 22%, transparent 24%), ${c.frame}` };
  if (c.pattern === "crystal") return { background: `linear-gradient(135deg, ${c.frame}, ${c.frame}88)` };
  return { background: c.frame };
}
