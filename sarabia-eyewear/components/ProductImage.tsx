import Image from "next/image";
import type { Colorway, Product } from "@/lib/products";
import { FrameIllustration } from "./FrameIllustration";

type Props = {
  product: Product;
  color: Colorway;
  view?: "front" | "angle";
  sizes?: string;
  priority?: boolean;
  /** Calidad del WebP servido (90 por defecto: los recortes ya vienen afinados). */
  quality?: number;
  className?: string;
};

/** Foto real del armazón. Mientras un color no tenga foto, muestra la ilustración de respaldo. */
export function ProductImage({ product, color, view = "front", sizes = "(min-width: 1024px) 25vw, 90vw", priority, quality = 90, className }: Props) {
  const photo = color.photo;
  const alt = `${product.name} en ${color.name}${view === "angle" ? ", vista en ángulo" : ""}`;
  if (!photo) {
    return <FrameIllustration shape={product.shape} material={product.material} color={color} view={view} title={alt} className={className} />;
  }
  return (
    <Image
      src={view === "angle" && photo.angle ? photo.angle : photo.front}
      alt={alt}
      width={photo.width}
      height={photo.height}
      sizes={sizes}
      quality={quality}
      priority={priority}
      className={className}
    />
  );
}
